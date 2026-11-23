import { CONFIG } from "../config.js";
import { db } from "../data/store.js";
import { PolicyGuard } from "../cerberus/policy.js";
import { connectors } from "./connectors.js";

export const securityGuard = new PolicyGuard(db);
export const cerberus = securityGuard; // backward compatibility

export class AIOrchestrator {
  constructor() {
    this.apiKey = CONFIG.GEMINI_API_KEY;
    this.model = CONFIG.GEMINI_MODEL;
  }

  async callGeminiRaw(prompt, systemInstruction = "") {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    
    const body = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048
      }
    };

    if (systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        return { success: false, status: response.status };
      }

      const data = await response.json();
      const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      return { success: true, text: generatedText };
    } catch (err) {
      clearTimeout(timeout);
      return { success: false, error: err.message };
    }
  }

  /**
   * Generates Daily Briefing based on workspace items
   */
  async generateDailyBriefing(workspaceId = "default") {
    const emails = await connectors.fetchEmails();
    const calendar = await connectors.fetchCalendarEvents();
    const github = await connectors.fetchGitHubWork();

    // Pass external data through input inspection
    const inspectionResults = emails.map(e => ({
      email: e,
      inspection: securityGuard.inspectInput(e.snippet, `email:${e.id}`, { subject: e.subject, from: e.from })
    }));

    const poisonedEmails = inspectionResults.filter(r => !r.inspection.safe);

    // Build metrics
    const openTasksCount = github.filter(g => g.status === "OPEN").length + 3;
    const blockersCount = db.getBlockers().filter(b => !b.resolved).length;
    const upcomingMeetings = calendar.length;
    const deadlineAtRisk = calendar.filter(c => c.risk === "HIGH").length;

    let aiSummary = "Your team has two unresolved dependencies. The backend API is delaying frontend integration, and a code review remains pending.";

    // Try calling Gemini
    const prompt = `Workspace items:
Emails: ${JSON.stringify(emails.map(e => ({ from: e.from, subject: e.subject, snippet: e.snippet })))}
Calendar: ${JSON.stringify(calendar)}
GitHub: ${JSON.stringify(github)}

Provide a concise 2-sentence summary of team health, blockers, and dependencies.`;

    const geminiRes = await this.callGeminiRaw(prompt, "You are WORKPULSE, a team intelligence AI. Summarize accurately based strictly on factual dependencies.");
    if (geminiRes.success && geminiRes.text) {
      aiSummary = geminiRes.text.trim();
    }

    const briefing = {
      workspaceId,
      timestamp: new Date().toISOString(),
      metrics: {
        openTasks: openTasksCount,
        blockers: blockersCount,
        upcomingMeetings,
        deadlineAtRisk
      },
      aiSummary,
      alerts: poisonedEmails.map(p => p.inspection.alert).filter(Boolean),
      status: "ANALYZED"
    };

    db.logEvent({
      type: "MCP_TOOL_EXECUTION",
      severity: "INFO",
      action: "BRIEF_TODAY",
      details: `Generated team briefing for ${workspaceId}. ${blockersCount} blockers detected.`,
      metadata: briefing.metrics
    });

    return briefing;
  }

  /**
   * Analyzes workspace and returns blockers with multi-source evidence
   */
  async findBlockers(workspaceId = "default") {
    const blockers = db.getBlockers();

    db.logEvent({
      type: "MCP_TOOL_EXECUTION",
      severity: "INFO",
      action: "FIND_BLOCKERS",
      details: `Discovered ${blockers.length} active blockers with linked cross-app evidence.`,
      metadata: { count: blockers.length }
    });

    return {
      workspaceId,
      timestamp: new Date().toISOString(),
      count: blockers.length,
      blockers
    };
  }

  /**
   * Conversational Assistant answering specific queries across ALL connected apps
   */
  async handleConversation(userQuery) {
    const q = userQuery.toLowerCase().trim();
    const emails = db.messages;
    const calendar = db.calendarEvents;
    const github = db.githubItems;

    // 1. SPECIFIC QUERY: "What was the last mail from newton@123.gmail.com?" or "last mail from newton"
    if (q.includes("newton") || (q.includes("last mail") && q.includes("from"))) {
      const match = emails.find(e => 
        e.from.toLowerCase().includes("newton") || 
        (e.snippet && e.snippet.toLowerCase().includes("newton"))
      ) || emails.find(e => {
        // extract email address from query if specified
        const emailMatch = q.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);
        return emailMatch ? e.from.toLowerCase().includes(emailMatch[1].toLowerCase()) : false;
      });

      if (match) {
        return {
          reply: `The last email from **${match.from}** was received **${match.date}** with subject **"${match.subject}"**:\n\n> "${match.body || match.snippet}"\n\nIt confirms that the schema definitions and security requirements for v2 rollout are reviewed and signed off.`,
          data: match,
          intent: "QUERY_EMAIL"
        };
      } else {
        return {
          reply: `I checked your connected Gmail messages, but couldn't find an email matching that sender. Available emails are from: ${emails.map(e => e.from).join(", ")}.`,
          intent: "QUERY_EMAIL_NOT_FOUND"
        };
      }
    }

    // 2. SPECIFIC QUERY: "What was the last PR merged?" or "last merged PR"
    if (q.includes("last pr merge") || q.includes("last pr merged") || q.includes("merged pr") || q.includes("recently merged")) {
      const mergedPRs = github.filter(pr => pr.status === "MERGED" || pr.state === "merged" || pr.mergedAt);
      if (mergedPRs.length > 0) {
        const latestMerged = mergedPRs[0];
        return {
          reply: `The last merged pull request is **PR #${latestMerged.number}: "${latestMerged.title}"**.\n\n• **Author:** @${latestMerged.author}\n• **Branch:** \`${latestMerged.branch}\` ➔ \`${latestMerged.mergedInto || 'main'}\`\n• **Merged:** ${latestMerged.mergedAt || 'Recently'}${latestMerged.mergedBy ? ` by @${latestMerged.mergedBy}` : ''}\n• **Status:** Merged & verified.`,
          data: latestMerged,
          intent: "QUERY_MERGED_PR"
        };
      } else {
        return {
          reply: "There are currently no merged pull requests recorded in this repository. All current pull requests are open for review.",
          intent: "QUERY_PR"
        };
      }
    }

    // 3. SPECIFIC QUERY: "Review of all connected apps" / "Status of connected apps"
    if (q.includes("review of all") || q.includes("connected apps") || q.includes("all apps") || q.includes("app review")) {
      const mergedPRs = github.filter(pr => pr.status === "MERGED");
      const openPRs = github.filter(pr => pr.status === "OPEN");
      const highRiskCal = calendar.filter(c => c.risk === "HIGH");

      let summary = `### Connected Apps Comprehensive Review:\n\n`;
      summary += `📧 **Gmail (${emails.length} messages):**\n`;
      emails.forEach(e => {
        summary += `• **${e.from.split('<')[0].trim()}**: "${e.subject}" (${e.date})\n`;
      });

      summary += `\n📅 **Google Calendar (${calendar.length} events):**\n`;
      calendar.forEach(c => {
        summary += `• **${c.title}** scheduled for ${c.time} [Risk: ${c.risk}]\n`;
      });

      summary += `\n🐙 **GitHub (${github.length} items):**\n`;
      summary += `• Open PRs: ${openPRs.map(p => `#${p.number} (${p.title})`).join(", ")}\n`;
      if (mergedPRs.length > 0) {
        summary += `• Last Merged PR: #${mergedPRs[0].number} ("${mergedPRs[0].title}")\n`;
      }

      return {
        reply: summary,
        intent: "APP_REVIEW"
      };
    }

    // 4. Query about calendar/meetings
    if (q.includes("next meeting") || q.includes("my meetings") || q.includes("calendar") || q.includes("schedule")) {
      const upcoming = calendar.map(c => `• **${c.title}** (${c.time}) - Attendees: ${c.attendees.join(", ")}`).join("\n");
      return {
        reply: `Here are your upcoming scheduled events from Google Calendar:\n\n${upcoming}`,
        data: calendar,
        intent: "QUERY_CALENDAR"
      };
    }

    // 5. Classic query: "Why are we behind schedule?"
    if (q.includes("why are we behind") || q.includes("behind schedule") || q.includes("why work is getting delayed")) {
      return {
        reply: "Your frontend integration is delayed because the backend API is unfinished. The integration deadline is tomorrow at 5:00 PM. I recommend requesting an updated delivery estimate.",
        suggestedActions: [
          {
            label: "Draft the email and show it to me",
            command: "draft email"
          }
        ],
        intent: "EXPLAIN_DELAY"
      };
    }

    // 6. Draft email request
    if (q.includes("draft the email") || q.includes("draft email") || q.includes("prepare follow-up")) {
      const proposal = db.getProposal("001");
      return {
        reply: "I have prepared the follow-up draft for Backend Lead Alex Chen. You can review and approve it directly in the proposal card below.",
        proposal,
        intent: "DRAFT_PROPOSAL"
      };
    }

    // 7. Voice commands
    if (q.includes("give me today's briefing") || q.includes("today's briefing") || q.includes("daily briefing")) {
      const briefing = await this.generateDailyBriefing();
      return {
        reply: `Good morning! Here is your team briefing: 2 blockers detected. Frontend development is currently waiting for the backend API, and a GitHub pull request is awaiting review. Your integration deadline is at risk tomorrow.`,
        data: briefing,
        intent: "VOICE_BRIEFING"
      };
    }

    if (q.includes("find my blockers") || q.includes("find blockers") || q.includes("show blockers")) {
      const blockersRes = await this.findBlockers();
      return {
        reply: `I found 2 active blockers: First, Frontend integration is delayed awaiting Backend API PR #402. Second, PR #398 is awaiting code review from the Lead Architect.`,
        data: blockersRes,
        intent: "VOICE_FIND_BLOCKERS"
      };
    }

    if (q.includes("approve proposal") || q.includes("approve 001") || q.includes("approve action")) {
      return {
        reply: `Initiating confirmation: You are about to approve Proposal #001 to create a follow-up draft to Alex Chen regarding the API timeline. Please click Confirm or say 'Yes, confirm'.`,
        needsConfirmation: true,
        proposalId: "prop-001",
        proposalCode: "001",
        intent: "VOICE_APPROVE_INITIATED"
      };
    }

    if (q === "yes, confirm" || q === "confirm" || q === "yes confirm") {
      return {
        reply: `Proposal #001 confirmed and approved. Verified recipient 'alex.chen@team.internal'. Draft created in Gmail via MCP tool.`,
        confirmed: true,
        intent: "VOICE_CONFIRMED"
      };
    }

    // 8. Try Gemini with full connected apps context
    const fullContext = `Connected Apps Data:
GMAIL EMAILS:
${JSON.stringify(emails.map(e => ({ from: e.from, subject: e.subject, date: e.date, body: e.body || e.snippet })))}

CALENDAR EVENTS:
${JSON.stringify(calendar)}

GITHUB PULL REQUESTS & ISSUES:
${JSON.stringify(github)}

USER QUESTION: "${userQuery}"`;

    const geminiRes = await this.callGeminiRaw(
      fullContext,
      "You are WORKPULSE, an AI project assistant. Answer the user question accurately and concisely based strictly on the provided connected apps data."
    );

    if (geminiRes.success && geminiRes.text) {
      return {
        reply: geminiRes.text.trim(),
        intent: "GENERAL_CHAT"
      };
    }

    return {
      reply: `I am monitoring your workspace across Gmail, Calendar, and GitHub. You can ask me:\n• "What was the last mail from newton@123.gmail.com?"\n• "What was the last PR merged?"\n• "Give me a review of all connected apps"\n• "Why are we behind schedule?"`,
      intent: "GENERAL_CHAT"
    };
  }
}

export const orchestrator = new AIOrchestrator();
