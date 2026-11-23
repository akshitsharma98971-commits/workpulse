export class DataStore {
  constructor() {
    this.resetToInitialState();
  }

  resetToInitialState() {
    this.connectedApps = {
      gmail: {
        id: "gmail",
        name: "Gmail",
        icon: "Mail",
        status: "CONNECTED",
        account: "lead.dev@company.com",
        lastSync: new Date().toISOString(),
        itemCount: 3,
        config: {
          email: "lead.dev@company.com",
          syncInterval: "5m"
        }
      },
      calendar: {
        id: "calendar",
        name: "Google Calendar",
        icon: "Calendar",
        status: "CONNECTED",
        account: "lead.dev@company.com",
        lastSync: new Date().toISOString(),
        itemCount: 3,
        config: {
          calendarId: "primary",
          timezone: "UTC"
        }
      },
      github: {
        id: "github",
        name: "GitHub",
        icon: "GitPullRequest",
        status: "CONNECTED",
        account: "org-hackathon-team",
        repo: "org-hackathon-team/workpulse-core",
        lastSync: new Date().toISOString(),
        itemCount: 4,
        config: {
          repo: "org-hackathon-team/workpulse-core",
          tokenProvided: false
        }
      }
    };

    // Raw application items
    this.messages = [
      {
        id: "msg-101",
        source: "gmail",
        from: "Alex Chen (Backend Lead) <alex.chen@team.internal>",
        to: "Team Lead <lead.dev@company.com>",
        subject: "Backend API Delivery Status",
        snippet: "The backend v1 endpoints were scheduled for delivery yesterday. Finishing up edge case validation.",
        body: "Hi Team,\n\nThe backend v1 endpoints were scheduled for delivery yesterday. We ran into a schema mismatch with the auth layer and are currently finishing up edge case validation. Expecting PR #402 to be ready for testing soon.\n\nBest,\nAlex",
        date: "Yesterday, 4:15 PM",
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        isSafe: true
      },
      {
        id: "msg-102",
        source: "gmail",
        from: "Maria Garcia (Frontend) <maria.g@team.internal>",
        to: "Team Lead <lead.dev@company.com>",
        subject: "Blocked on Backend API contract",
        snippet: "Hey team, frontend client integration is stalled. We can't connect mock data until the Auth & CRUD endpoints land.",
        body: "Hey team,\n\nFrontend client integration is stalled. We can't connect mock data until the Auth & CRUD endpoints land. Our milestone deadline is tomorrow.\n\nRegards,\nMaria",
        date: "Today, 9:20 AM",
        timestamp: new Date(Date.now() - 14400000).toISOString(),
        isSafe: true
      },
      {
        id: "msg-103",
        source: "gmail",
        from: "Newton <newton@123.gmail.com>",
        to: "Team Lead <lead.dev@company.com>",
        subject: "Final API Schema & Architecture Sign-off",
        snippet: "Hey, I have reviewed the final schema definitions and security requirements. Everything looks solid for the v2 rollout. Let me know once the PR merges.",
        body: "Hey Team Lead,\n\nI have reviewed the final schema definitions and security requirements. Everything looks solid for the v2 rollout. Let me know once the PR merges so we can initiate the external client tests.\n\nCheers,\nNewton",
        date: "Today, 11:45 AM",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        isSafe: true
      }
    ];

    this.calendarEvents = [
      {
        id: "cal-201",
        title: "Frontend Integration Deadline",
        time: "Tomorrow, 5:00 PM",
        date: "Tomorrow, 5:00 PM",
        risk: "HIGH",
        attendees: ["Frontend Team", "Backend Lead", "PM"],
        description: "Milestone for frontend-backend end-to-end integration check."
      },
      {
        id: "cal-202",
        title: "Sprint Review & Hackathon Demo",
        time: "Friday, 2:00 PM",
        date: "Friday, 2:00 PM",
        risk: "MEDIUM",
        attendees: ["Full Team", "Judges"],
        description: "Sprint demonstration and product showcase."
      },
      {
        id: "cal-203",
        title: "Daily Standup",
        time: "Today, 10:00 AM",
        date: "Today, 10:00 AM",
        risk: "LOW",
        attendees: ["Full Team"],
        description: "Daily synchronization and blocker review."
      }
    ];

    this.githubItems = [
      {
        id: "gh-301",
        type: "PULL_REQUEST",
        number: 402,
        title: "feat(api): v1 Backend API REST endpoints & DB schema",
        author: "alex-chen",
        status: "OPEN",
        state: "open",
        reviews: "Awaiting review (4 days)",
        branch: "feature/api-v1",
        createdAt: "4 days ago"
      },
      {
        id: "gh-302",
        type: "PULL_REQUEST",
        number: 398,
        title: "feat(auth): JWT session refresh tokens",
        author: "sarah-kim",
        status: "OPEN",
        state: "open",
        reviews: "Pending review by @lead-architect",
        branch: "feature/jwt-auth",
        createdAt: "3 days ago"
      },
      {
        id: "gh-304",
        type: "PULL_REQUEST",
        number: 395,
        title: "feat(core): dynamic worker pools & Redis cache invalidation",
        author: "alex-chen",
        mergedBy: "lead-architect",
        status: "MERGED",
        state: "merged",
        mergedAt: "Today, 8:15 AM (2 hours ago)",
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        branch: "feature/worker-pools",
        mergedInto: "main"
      },
      {
        id: "gh-303",
        type: "ISSUE",
        number: 415,
        title: "E2E Integration blocked on API contracts",
        assignee: "maria-garcia",
        status: "OPEN",
        state: "open",
        labels: ["blocker", "frontend"]
      }
    ];

    // Seeded Blockers
    this.blockers = [
      {
        id: "blocker-001",
        code: "#001",
        title: "Frontend integration delayed",
        priority: "High priority",
        category: "Deadline dependency",
        detectedFrom: ["Gmail", "GitHub", "Google Calendar"],
        description: "Frontend integration is delayed because backend API delivery is unfinished while integration deadline approaches tomorrow.",
        evidence: [
          { source: "Gmail", text: "Backend developer committed to delivering the API yesterday." },
          { source: "GitHub", text: "API pull request #402 remains open with 0 approvals for 4 days." },
          { source: "Google Calendar", text: "Frontend integration milestone deadline is scheduled for tomorrow at 5:00 PM." }
        ],
        dependency: "Backend API → Frontend integration → Final testing",
        suggestedAction: "Draft an email asking for an updated API delivery estimate.",
        actionType: "DRAFT_EMAIL",
        actionPayload: {
          to: "alex.chen@team.internal",
          recipientName: "Alex Chen (Backend Lead)",
          subject: "Urgent Update: Backend API Delivery Timeline for Frontend Integration",
          body: "Hi Alex,\n\nCould you share an updated delivery estimate on the API PR #402? Frontend integration is scheduled for tomorrow at 5:00 PM and Maria's team is currently blocked on the endpoint schemas.\n\nThanks,\nTeam Lead"
        },
        status: "NEEDS_ATTENTION",
        resolved: false
      },
      {
        id: "blocker-002",
        code: "#002",
        title: "GitHub PR awaiting code review",
        priority: "Medium priority",
        category: "Pending code review",
        detectedFrom: ["GitHub"],
        description: "Pull Request #398 (JWT session refresh tokens) has been awaiting code review from @lead-architect for 3 days.",
        evidence: [
          { source: "GitHub", text: "PR #398 opened 3 days ago with 2 pending review requests." }
        ],
        dependency: "Code Review (@lead-architect) → PR Merge → Security Sign-off",
        suggestedAction: "Ping the reviewer in Slack/GitHub asking for expedited code review.",
        actionType: "PING_REVIEWER",
        actionPayload: {
          to: "lead.architect@team.internal",
          recipientName: "Lead Architect",
          subject: "Reminder: Code review needed on PR #398 (Auth tokens)",
          body: "Hi team lead, PR #398 has been waiting for review. Please take a look so auth integration can proceed."
        },
        status: "NEEDS_ATTENTION",
        resolved: false
      }
    ];

    // Action Proposals
    this.proposals = [
      {
        id: "prop-001",
        code: "001",
        blockerId: "blocker-001",
        title: "Draft follow-up email to Backend Lead",
        type: "DRAFT_EMAIL",
        recipient: "alex.chen@team.internal",
        recipientName: "Alex Chen (Backend Lead)",
        subject: "Urgent Update: Backend API Delivery Timeline for Frontend Integration",
        content: "Hi Alex,\n\nCould you share an update on the API delivery timeline? Frontend integration is currently dependent on it, and we need to plan the remaining work before tomorrow's 5:00 PM deadline.\n\nBest regards,\nTeam Lead",
        status: "AWAITING_APPROVAL",
        createdAt: new Date().toISOString(),
        executedAt: null,
        executionResult: null,
        reversible: true,
        actionId: null
      }
    ];

    // Audit Log
    this.auditLog = [
      {
        id: "audit-001",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        type: "SYSTEM_INITIALIZED",
        severity: "INFO",
        action: "CONNECTORS_SYNCED",
        details: "Connected Gmail, Google Calendar, and GitHub workspaces successfully.",
        metadata: { apps: ["gmail", "calendar", "github"] }
      },
      {
        id: "audit-002",
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        type: "ANALYSIS_COMPLETE",
        severity: "INFO",
        action: "FIND_BLOCKERS",
        details: "Analyzed workspace items. Detected 2 critical blockers.",
        metadata: { blockerCount: 2 }
      }
    ];

    // Undo stack
    this.executedActions = [];
  }

  // --- Dynamic Item Management ---
  addEmail({ from, to, subject, snippet, body }) {
    const newEmail = {
      id: `msg-${Date.now()}`,
      source: "gmail",
      from: from || "External <unknown@email.com>",
      to: to || "Team Lead <lead.dev@company.com>",
      subject: subject || "(No subject)",
      snippet: snippet || (body ? body.slice(0, 100) : "New email message"),
      body: body || snippet || "",
      date: "Just now",
      timestamp: new Date().toISOString(),
      isSafe: true
    };
    this.messages.unshift(newEmail);
    if (this.connectedApps.gmail) {
      this.connectedApps.gmail.itemCount = this.messages.length;
      this.connectedApps.gmail.lastSync = new Date().toISOString();
    }
    this.logEvent({
      type: "CONNECTOR_DATA_RECEIVED",
      severity: "INFO",
      action: "GMAIL_EMAIL_ADDED",
      details: `Received new email from ${newEmail.from}: "${newEmail.subject}"`,
      metadata: { id: newEmail.id, from: newEmail.from, subject: newEmail.subject }
    });
    return newEmail;
  }

  addCalendarEvent({ title, time, risk = "LOW", attendees = [] }) {
    const newEvent = {
      id: `cal-${Date.now()}`,
      title,
      time: time || "Scheduled Event",
      date: time || "Scheduled Event",
      risk,
      attendees: Array.isArray(attendees) ? attendees : [attendees]
    };
    this.calendarEvents.unshift(newEvent);
    if (this.connectedApps.calendar) {
      this.connectedApps.calendar.itemCount = this.calendarEvents.length;
      this.connectedApps.calendar.lastSync = new Date().toISOString();
    }
    this.logEvent({
      type: "CONNECTOR_DATA_RECEIVED",
      severity: "INFO",
      action: "CALENDAR_EVENT_ADDED",
      details: `Added calendar event "${newEvent.title}" at ${newEvent.time}`,
      metadata: newEvent
    });
    return newEvent;
  }

  addGitHubPR({ number, title, author, branch, status = "OPEN", mergedBy = null }) {
    const newPR = {
      id: `gh-${Date.now()}`,
      type: "PULL_REQUEST",
      number: number || Math.floor(Math.random() * 900 + 100),
      title,
      author: author || "contributor",
      status: status.toUpperCase(),
      state: status.toLowerCase(),
      branch: branch || "feature/update",
      reviews: status.toUpperCase() === "OPEN" ? "Review requested" : "Approved",
      createdAt: "Just now",
      mergedBy: status.toUpperCase() === "MERGED" ? (mergedBy || "lead-architect") : null,
      mergedAt: status.toUpperCase() === "MERGED" ? "Just now" : null,
      timestamp: new Date().toISOString()
    };
    this.githubItems.unshift(newPR);
    if (this.connectedApps.github) {
      this.connectedApps.github.itemCount = this.githubItems.length;
      this.connectedApps.github.lastSync = new Date().toISOString();
    }
    this.logEvent({
      type: "CONNECTOR_DATA_RECEIVED",
      severity: "INFO",
      action: status.toUpperCase() === "MERGED" ? "GITHUB_PR_MERGED" : "GITHUB_PR_OPENED",
      details: `PR #${newPR.number} (${newPR.title}) is ${newPR.status}`,
      metadata: newPR
    });
    return newPR;
  }

  updateAppConfig(appId, newConfig) {
    if (this.connectedApps[appId]) {
      this.connectedApps[appId].config = { ...this.connectedApps[appId].config, ...newConfig };
      if (newConfig.account || newConfig.email) {
        this.connectedApps[appId].account = newConfig.account || newConfig.email;
      }
      if (newConfig.repo) {
        this.connectedApps[appId].repo = newConfig.repo;
      }
      this.connectedApps[appId].status = "CONNECTED";
      this.connectedApps[appId].lastSync = new Date().toISOString();
      return this.connectedApps[appId];
    }
    return null;
  }

  // --- Blockers ---
  getBlockers() {
    return this.blockers;
  }

  getBlocker(id) {
    return this.blockers.find(b => b.id === id || b.code === id || b.code === `#${id}`);
  }

  resolveBlocker(id) {
    const blocker = this.getBlocker(id);
    if (blocker) {
      blocker.status = "RESOLVED";
      blocker.resolved = true;
    }
    return blocker;
  }

  // --- Proposals ---
  getProposals() {
    return this.proposals;
  }

  getProposal(id) {
    return this.proposals.find(p => p.id === id || p.code === id || p.id === `prop-${id}`);
  }

  createProposal(blockerId, actionType, customPayload = {}) {
    const blocker = this.getBlocker(blockerId);
    const id = `prop-${Date.now().toString().slice(-4)}`;
    const code = `${(this.proposals.length + 1).toString().padStart(3, "0")}`;

    const newProposal = {
      id,
      code,
      blockerId: blocker ? blocker.id : blockerId,
      title: customPayload.title || `Action for ${blocker ? blocker.title : "Workspace issue"}`,
      type: actionType || "DRAFT_EMAIL",
      recipient: customPayload.to || blocker?.actionPayload?.to || "alex.chen@team.internal",
      recipientName: customPayload.recipientName || blocker?.actionPayload?.recipientName || "Alex Chen",
      subject: customPayload.subject || blocker?.actionPayload?.subject || "Action Required: Project Update",
      content: customPayload.body || blocker?.actionPayload?.body || "Please update your status.",
      status: "AWAITING_APPROVAL",
      createdAt: new Date().toISOString(),
      executedAt: null,
      executionResult: null,
      reversible: true,
      actionId: null
    };

    this.proposals.unshift(newProposal);
    return newProposal;
  }

  // --- Audit Log ---
  logEvent({ type, severity = "INFO", action, details, metadata = {} }) {
    const entry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      type,
      severity,
      action,
      details,
      metadata
    };
    this.auditLog.unshift(entry);
    return entry;
  }

  getAuditLog(filters = {}) {
    let result = [...this.auditLog];
    if (filters.severity) {
      result = result.filter(item => item.severity === filters.severity);
    }
    if (filters.type) {
      result = result.filter(item => item.type === filters.type);
    }
    return result;
  }
}

export const db = new DataStore();
