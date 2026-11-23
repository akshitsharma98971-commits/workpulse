import { db } from "../data/store.js";
import { securityGuard, orchestrator } from "../services/orchestrator.js";
import { connectors } from "../services/connectors.js";

/**
 * WORKPULSE MCP Server
 * Exposes the 6 specified Model Context Protocol tools.
 * All tool executions route through the Security Policy Middleware.
 */
export class WorkpulseMcpServer {
  constructor() {
    this.toolsDefinition = [
      {
        name: "brief_today",
        description: "Generate a daily summary of team health, blockers, and upcoming deadlines.",
        inputSchema: {
          type: "object",
          properties: {
            workspace_id: { type: "string", description: "Target workspace identifier" }
          },
          required: ["workspace_id"]
        }
      },
      {
        name: "find_blockers",
        description: "Detect active blockers across Gmail, Calendar, and GitHub with linked evidence.",
        inputSchema: {
          type: "object",
          properties: {
            workspace_id: { type: "string", description: "Target workspace identifier" }
          },
          required: ["workspace_id"]
        }
      },
      {
        name: "propose_action",
        description: "Generate a concrete, human-reviewable action proposal for an identified blocker.",
        inputSchema: {
          type: "object",
          properties: {
            blocker_id: { type: "string", description: "ID or code of the blocker (e.g. blocker-001 or 001)" },
            action_type: { type: "string", description: "Action type (e.g. DRAFT_EMAIL, PING_REVIEWER)" }
          },
          required: ["blocker_id"]
        }
      },
      {
        name: "approve_action",
        description: "Execute a proposed action after human review and authorization.",
        inputSchema: {
          type: "object",
          properties: {
            proposal_id: { type: "string", description: "ID of the proposal to execute" },
            approval: { type: "boolean", description: "Approval flag (must be true)" },
            custom_modifications: { type: "object", description: "Optional edits made by user" }
          },
          required: ["proposal_id", "approval"]
        }
      },
      {
        name: "undo_action",
        description: "Revert or rollback an executed action where supported.",
        inputSchema: {
          type: "object",
          properties: {
            action_id: { type: "string", description: "ID of the executed action to undo" }
          },
          required: ["action_id"]
        }
      },
      {
        name: "audit_log",
        description: "Retrieve chronological action history, security events, and execution trace.",
        inputSchema: {
          type: "object",
          properties: {
            workspace_id: { type: "string", description: "Workspace ID" },
            filters: { type: "object", description: "Optional filters (severity, type)" }
          }
        }
      }
    ];
  }

  // List all tools (MCP protocol method: tools/list)
  listTools() {
    return {
      tools: this.toolsDefinition
    };
  }

  // Execute tool (MCP protocol method: tools/call)
  async callTool(name, args = {}, context = {}) {
    // 1. Security Gate check
    const authCheck = securityGuard.authorizeToolExecution({
      toolName: name,
      params: args,
      userApproved: args.approval === true || context.userApproved === true,
      proposalId: args.proposal_id
    });

    if (!authCheck.allowed) {
      return {
        isError: true,
        error: authCheck.reason,
        securityViolation: true
      };
    }

    // 2. Dispatch to the 6 tools
    switch (name) {
      case "brief_today": {
        const workspaceId = args.workspace_id || "workspace-hackathon-alpha";
        const briefing = await orchestrator.generateDailyBriefing(workspaceId);
        return {
          content: [{ type: "text", text: JSON.stringify(briefing, null, 2) }],
          result: briefing
        };
      }

      case "find_blockers": {
        const workspaceId = args.workspace_id || "workspace-hackathon-alpha";
        const blockers = await orchestrator.findBlockers(workspaceId);
        return {
          content: [{ type: "text", text: JSON.stringify(blockers, null, 2) }],
          result: blockers
        };
      }

      case "propose_action": {
        const blockerId = args.blocker_id;
        const actionType = args.action_type || "DRAFT_EMAIL";
        const proposal = db.createProposal(blockerId, actionType, args.custom_payload);

        db.logEvent({
          type: "MCP_TOOL_EXECUTION",
          severity: "INFO",
          action: "PROPOSE_ACTION",
          details: `Generated proposal #${proposal.code} for ${blockerId}: ${proposal.title}`,
          metadata: { proposalId: proposal.id, type: actionType }
        });

        return {
          content: [{ type: "text", text: JSON.stringify(proposal, null, 2) }],
          result: proposal
        };
      }

      case "approve_action": {
        const { proposal_id, approval, custom_modifications } = args;
        if (!approval) {
          return {
            isError: true,
            error: "Approval was explicitly rejected or false."
          };
        }

        const proposal = db.getProposal(proposal_id);
        if (!proposal) {
          return { isError: true, error: `Proposal ${proposal_id} not found.` };
        }

        if (proposal.status === "EXECUTED") {
          return {
            isError: false,
            result: { message: "Action was already executed.", proposal }
          };
        }

        // Apply any user edits
        if (custom_modifications) {
          if (custom_modifications.subject) proposal.subject = custom_modifications.subject;
          if (custom_modifications.content) proposal.content = custom_modifications.content;
          if (custom_modifications.recipient) proposal.recipient = custom_modifications.recipient;
        }

        // Security check on final payload recipient
        const recipientCheck = securityGuard.authorizeToolExecution({
          toolName: "draft_email",
          params: { to: proposal.recipient },
          userApproved: true
        });

        if (!recipientCheck.allowed) {
          return { isError: true, error: recipientCheck.reason, securityViolation: true };
        }

        // Execute via Connector (creates draft or sends)
        const execResult = await connectors.createGmailDraft({
          to: proposal.recipient,
          subject: proposal.subject,
          body: proposal.content
        });

        const actionId = `act-${Date.now()}`;
        proposal.status = "EXECUTED";
        proposal.executedAt = new Date().toISOString();
        proposal.actionId = actionId;
        proposal.executionResult = execResult;

        // Save execution record for undo
        const actionRecord = {
          actionId,
          proposalId: proposal.id,
          type: proposal.type,
          draftId: execResult.draftId,
          revertType: "DELETE_DRAFT",
          timestamp: new Date().toISOString(),
          details: `Draft created for ${proposal.recipient}`
        };
        db.executedActions.push(actionRecord);

        // Mark associated blocker resolved if needed
        db.resolveBlocker(proposal.blockerId);

        db.logEvent({
          type: "ACTION_EXECUTED",
          severity: "SUCCESS",
          action: "APPROVE_ACTION",
          details: `Action executed for proposal #${proposal.code}: Created draft to ${proposal.recipient}`,
          metadata: { actionId, draftId: execResult.draftId }
        });

        return {
          content: [{ type: "text", text: `Action successfully executed. Action ID: ${actionId}` }],
          result: {
            actionId,
            status: "EXECUTED",
            proposal,
            executionResult: execResult
          }
        };
      }

      case "undo_action": {
        const { action_id } = args;
        const index = db.executedActions.findIndex(a => a.actionId === action_id);
        if (index === -1) {
          return {
            isError: true,
            error: `Action ID ${action_id} not found or is not reversible.`
          };
        }

        const actionRecord = db.executedActions[index];
        let undoResult;

        if (actionRecord.draftId) {
          undoResult = await connectors.deleteDraft(actionRecord.draftId);
        }

        // Update proposal status
        const proposal = db.getProposal(actionRecord.proposalId);
        if (proposal) {
          proposal.status = "AWAITING_APPROVAL";
          proposal.executedAt = null;
          proposal.actionId = null;
        }

        db.executedActions.splice(index, 1);

        db.logEvent({
          type: "ACTION_REVERTED",
          severity: "WARNING",
          action: "UNDO_ACTION",
          details: `Reverted action ${action_id}. Restored proposal #${proposal?.code || ""}.`,
          metadata: { actionId: action_id, undoResult }
        });

        return {
          content: [{ type: "text", text: `Action ${action_id} reversed successfully.` }],
          result: {
            success: true,
            message: `Reverted action ${action_id}. The created draft was deleted and proposal was reset.`,
            actionId: action_id
          }
        };
      }

      case "audit_log": {
        const filters = args.filters || {};
        const logs = db.getAuditLog(filters);
        return {
          content: [{ type: "text", text: JSON.stringify(logs, null, 2) }],
          result: logs
        };
      }

      default:
        return {
          isError: true,
          error: `Unknown tool: ${name}`
        };
    }
  }
}

export const mcpServer = new WorkpulseMcpServer();
