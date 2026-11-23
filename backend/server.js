import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { CONFIG } from "./config.js";
import { db } from "./data/store.js";
import { connectors } from "./services/connectors.js";
import { securityGuard, orchestrator } from "./services/orchestrator.js";
import { mcpServer } from "./mcp/server.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend build if present
const staticDistPath = path.join(__dirname, "../frontend/dist");
app.use(express.static(staticDistPath));

// ----------------------------------------------------
// 1. Standard MCP JSON-RPC 2.0 Endpoint
// ----------------------------------------------------
app.post("/mcp", async (req, res) => {
  const { jsonrpc, id, method, params } = req.body;
  if (jsonrpc !== "2.0") {
    return res.status(400).json({ jsonrpc: "2.0", id: id || null, error: { code: -32600, message: "Invalid JSON-RPC version. Must be 2.0" } });
  }

  try {
    if (method === "tools/list") {
      const toolList = mcpServer.listTools();
      return res.json({ jsonrpc: "2.0", id, result: toolList });
    }

    if (method === "tools/call") {
      const { name, arguments: toolArgs } = params || {};
      if (!name) {
        return res.status(400).json({ jsonrpc: "2.0", id, error: { code: -32602, message: "Missing tool name" } });
      }

      const execution = await mcpServer.callTool(name, toolArgs || {});
      if (execution.isError) {
        return res.json({
          jsonrpc: "2.0",
          id,
          error: {
            code: execution.securityViolation ? -32001 : -32603,
            message: execution.error,
            data: execution
          }
        });
      }

      return res.json({ jsonrpc: "2.0", id, result: execution });
    }

    return res.status(404).json({ jsonrpc: "2.0", id, error: { code: -32601, message: `Method not found: ${method}` } });
  } catch (err) {
    return res.status(500).json({ jsonrpc: "2.0", id, error: { code: -32603, message: err.message } });
  }
});

// ----------------------------------------------------
// 2. REST API Endpoints for WORKPULSE Frontend
// ----------------------------------------------------

// Status & Settings
app.get("/api/status", (req, res) => {
  res.json({
    appName: "WORKPULSE",
    status: "ONLINE",
    version: "1.0.0-mvp",
    model: CONFIG.GEMINI_MODEL,
    hasApiKey: !!CONFIG.GEMINI_API_KEY,
    keyPreview: CONFIG.GEMINI_API_KEY ? `${CONFIG.GEMINI_API_KEY.slice(0, 8)}...${CONFIG.GEMINI_API_KEY.slice(-6)}` : "None",
    securityActive: true,
    connectedApps: db.connectedApps,
    stats: {
      blockers: db.getBlockers().filter(b => !b.resolved).length,
      proposals: db.getProposals().length,
      securityAlerts: securityGuard.getAlerts().length,
      auditEntries: db.getAuditLog().length,
      emailCount: db.messages.length,
      calendarCount: db.calendarEvents.length,
      githubCount: db.githubItems.length
    }
  });
});

// Toggle App Connection
app.post("/api/connectors/toggle", (req, res) => {
  const { appId } = req.body;
  const updated = connectors.toggleConnection(appId);
  if (!updated) {
    return res.status(400).json({ error: "Invalid app ID" });
  }
  res.json({ success: true, app: updated });
});

// Configure App Account (e.g. GitHub repo, email address)
app.post("/api/connectors/configure", (req, res) => {
  const { appId, config } = req.body;
  if (!appId || !config) {
    return res.status(400).json({ error: "appId and config are required" });
  }
  const updated = db.updateAppConfig(appId, config);
  if (!updated) {
    return res.status(404).json({ error: "App not found" });
  }
  res.json({ success: true, app: updated });
});

// Connect New GitHub User via Token (PAT)
app.post("/api/connectors/github/connect-token", async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "GitHub token required" });
  const result = await connectors.connectGitHubViaToken(token);
  res.json(result);
});

// Connect New GitHub User via Username (Public Repos)
app.post("/api/connectors/github/connect-username", async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "GitHub username required" });
  const result = await connectors.connectGitHubViaUsername(username);
  res.json(result);
});

// Real GitHub Repositories List
app.get("/api/connectors/github/repos", (req, res) => {
  res.json({
    account: db.connectedApps.github.account,
    repos: db.userRepos || []
  });
});

// Select Repository to sync
app.post("/api/connectors/github/select-repo", (req, res) => {
  const { repoFullName } = req.body;
  if (!repoFullName) return res.status(400).json({ error: "repoFullName required" });
  connectors.fetchRealRepoPRs(repoFullName);
  res.json({ success: true, prCount: db.githubItems.length, items: db.githubItems });
});

// Real Gmail IMAP Sync
app.post("/api/connectors/gmail/sync-imap", async (req, res) => {
  const { email, appPassword } = req.body;
  if (!email || !appPassword) {
    return res.status(400).json({ error: "Email and Google App Password required." });
  }
  const result = await connectors.connectGmailViaImap({ email, appPassword });
  res.json(result);
});

// Real Gmail Token Sync
app.post("/api/connectors/gmail/sync-token", async (req, res) => {
  const { token, email } = req.body;
  if (!token) return res.status(400).json({ error: "Access token required." });
  const result = await connectors.connectGmailViaToken(token, email || "me");
  res.json(result);
});

// Real Google Calendar iCal (.ics) Sync
app.post("/api/connectors/calendar/sync-ics", async (req, res) => {
  const { icsUrl } = req.body;
  if (!icsUrl) return res.status(400).json({ error: "iCal (.ics) URL required." });
  const result = await connectors.syncGoogleCalendarIcs(icsUrl);
  res.json(result);
});

// Real Google Calendar Token Sync
app.post("/api/connectors/calendar/sync-token", async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: "Access token required." });
  const result = await connectors.syncGoogleCalendarToken(token);
  res.json(result);
});

// Add custom dynamic item (Email, Calendar event, or GitHub PR)
app.post("/api/connectors/add-item", (req, res) => {
  const { type, payload } = req.body;
  if (!type || !payload) {
    return res.status(400).json({ error: "type and payload are required" });
  }

  let createdItem = null;
  if (type === "email") {
    createdItem = db.addEmail(payload);
  } else if (type === "calendar") {
    createdItem = db.addCalendarEvent(payload);
  } else if (type === "github") {
    createdItem = db.addGitHubPR(payload);
  } else {
    return res.status(400).json({ error: "Unsupported item type" });
  }

  res.json({ success: true, item: createdItem, apps: db.connectedApps });
});

// Sync Live GitHub Repo
app.post("/api/connectors/github/sync", async (req, res) => {
  const { repo, token } = req.body;
  const repoToSync = repo || db.connectedApps.github.repo || "facebook/react";
  const result = await connectors.syncLiveGitHubRepo(repoToSync, token);
  res.json(result);
});

// Retrieve all connected items
app.get("/api/connectors/items", (req, res) => {
  res.json({
    emails: db.messages,
    calendar: db.calendarEvents,
    github: db.githubItems
  });
});

// Step 2: Analyze Workspace / Daily Briefing
app.post("/api/workspace/analyze", async (req, res) => {
  try {
    const briefing = await orchestrator.generateDailyBriefing("workspace-hackathon-alpha");
    res.json(briefing);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Step 3: Get Blockers
app.get("/api/blockers", async (req, res) => {
  const result = await orchestrator.findBlockers("workspace-hackathon-alpha");
  res.json(result);
});

// Step 4: Proposals & Actions
app.get("/api/proposals", (req, res) => {
  res.json(db.getProposals());
});

app.post("/api/proposals/:id/edit", (req, res) => {
  const { id } = req.params;
  const { subject, content, recipient } = req.body;
  const proposal = db.getProposal(id);
  if (!proposal) {
    return res.status(404).json({ error: "Proposal not found" });
  }

  if (subject) proposal.subject = subject;
  if (content) proposal.content = content;
  if (recipient) proposal.recipient = recipient;

  db.logEvent({
    type: "PROPOSAL_EDITED",
    severity: "INFO",
    action: "EDIT_PROPOSAL",
    details: `User revised proposal #${proposal.code} content.`,
    metadata: { proposalId: proposal.id }
  });

  res.json({ success: true, proposal });
});

app.post("/api/proposals/:id/approve", async (req, res) => {
  const { id } = req.params;
  const { approval = true, modifications } = req.body;

  const result = await mcpServer.callTool("approve_action", {
    proposal_id: id,
    approval,
    custom_modifications: modifications
  }, { userApproved: true });

  if (result.isError) {
    return res.status(400).json({ error: result.error, violation: result.securityViolation });
  }

  res.json(result.result);
});

// Step 4 Undo: Revert Executed Action
app.post("/api/actions/undo", async (req, res) => {
  const { actionId } = req.body;
  if (!actionId) {
    return res.status(400).json({ error: "actionId is required" });
  }

  const result = await mcpServer.callTool("undo_action", { action_id: actionId });
  if (result.isError) {
    return res.status(400).json({ error: result.error });
  }

  res.json(result.result);
});

// Step 5: Prompt Injection Live Demonstration (Test A vs Test B)
app.post("/api/security/test", async (req, res) => {
  const { type = "A" } = req.body;
  const email = connectors.injectTestEmail(type);

  // Inspect through Security Guard
  const inspection = securityGuard.inspectInput(email.snippet, `email:${email.id}`, {
    from: email.from,
    subject: email.subject
  });

  let agentResponse = null;

  if (inspection.safe) {
    agentResponse = {
      action: "EXTRACTED_COMMITMENT",
      summary: "Delivery commitment detected: Wednesday. Blocker risk remains high due to Thursday client demo.",
      suggestedFollowUp: "Send confirmation to Alex Chen noting the Wednesday deadline.",
      quarantined: false
    };
  } else {
    agentResponse = {
      action: "EXECUTION_BLOCKED",
      summary: "Neutralized prompt injection attack from untrusted external source. Agent instructions preserved.",
      quarantined: true,
      alert: inspection.alert
    };
  }

  res.json({
    email,
    inspection,
    agentResponse,
    activeAlerts: securityGuard.getAlerts()
  });
});

app.get("/api/security/alerts", (req, res) => {
  res.json({
    alerts: securityGuard.getAlerts(),
    securityEnabled: true,
    policies: {
      toolAllowlist: CONFIG.ALLOWED_TOOLS,
      sensitiveTools: CONFIG.SENSITIVE_TOOLS,
      allowedDomains: CONFIG.ALLOWED_RECIPIENT_DOMAINS
    }
  });
});

app.post("/api/security/clear", (req, res) => {
  securityGuard.clearAlerts();
  res.json({ success: true });
});

// Step 6: AI Chat & Voice Command Assistant
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    const response = await orchestrator.handleConversation(message);
    res.json(response);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Audit Log
app.get("/api/audit", (req, res) => {
  const { severity, type } = req.query;
  const logs = db.getAuditLog({ severity, type });
  res.json(logs);
});

// Reset Workspace Demo
app.post("/api/demo/reset", (req, res) => {
  db.resetToInitialState();
  securityGuard.clearAlerts();
  res.json({ success: true, message: "Workspace reset to initial demo state." });
});

// Fallback for SPA
app.get("*", (req, res) => {
  res.sendFile(path.join(staticDistPath, "index.html"));
});

app.listen(CONFIG.PORT, () => {
  console.log(`WORKPULSE Backend & MCP Server running at http://localhost:${CONFIG.PORT}`);
  console.log(`MCP Endpoint: http://localhost:${CONFIG.PORT}/mcp`);
});
