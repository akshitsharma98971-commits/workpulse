import "dotenv/config";

export const CONFIG = {
  PORT: process.env.PORT || 4000,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-3.8-flash",
  FALLBACK_MODEL: "gemini-flash-latest",
  SECURITY_ENABLED: true,
  ALLOWED_RECIPIENT_DOMAINS: ["team.internal", "hackathon.local", "devcorp.io", "company.com", "gmail.com", "123.gmail.com"],
  ALLOWED_TOOLS: [
    "brief_today",
    "find_blockers",
    "propose_action",
    "approve_action",
    "undo_action",
    "audit_log",
    "draft_email",
    "send_email",
    "create_reminder",
    "request_pr_review"
  ],
  SENSITIVE_TOOLS: [
    "send_email",
    "approve_action",
    "merge_pr",
    "delete_item"
  ]
};
