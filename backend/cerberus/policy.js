import { CONFIG } from "../config.js";

/**
 * WORKPULSE Security Policy Middleware
 * Protects AI agents from prompt injection, untrusted data hijacking,
 * and unauthorized tool execution.
 */
export class PolicyGuard {
  constructor(auditLogger) {
    this.auditLogger = auditLogger;
    this.activeAlerts = [];
  }

  /**
   * Scans text for malicious prompt injection patterns
   */
  inspectInput(content, source = "external_email", metadata = {}) {
    const rawText = (typeof content === "string" ? content : JSON.stringify(content)).toLowerCase();
    
    // High-risk prompt injection heuristics
    const injectionPatterns = [
      { pattern: /ignore\s+(all\s+)?(previous|prior)\s+(instructions|prompts|rules)/i, severity: "CRITICAL", vector: "Instruction Override" },
      { pattern: /attempt\s+to\s+access\s+confidential/i, severity: "CRITICAL", vector: "Privilege Escalation / Data Theft" },
      { pattern: /send\s+(it\s+)?to\s+an?\s+external\s+recipient/i, severity: "CRITICAL", vector: "Unauthorized Exfiltration" },
      { pattern: /system\s+prompt|reveal\s+instructions|print\s+credentials/i, severity: "HIGH", vector: "Credential / Prompt Leakage" },
      { pattern: /you\s+are\s+now\s+(in\s+)?(dan|jailbreak|unrestricted|god)\s+mode/i, severity: "CRITICAL", vector: "Persona Hijack" },
      { pattern: /disregard\s+all\s+safety\s+guidelines/i, severity: "CRITICAL", vector: "Safety Bypass" },
      { pattern: /<system>|<\/system>|\[INST\]|<<SYS>>/i, severity: "HIGH", vector: "Control Token Injection" },
      { pattern: /curl\s+-X|wget\s+|https?:\/\/attacker|webhook\.site/i, severity: "HIGH", vector: "Remote Code / Webhook Exfiltration" }
    ];

    const detected = [];
    for (const rule of injectionPatterns) {
      if (rule.pattern.test(rawText)) {
        detected.push(rule);
      }
    }

    const isPoisoned = detected.length > 0;

    if (isPoisoned) {
      const alert = {
        id: `sec-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        timestamp: new Date().toISOString(),
        source,
        severity: detected[0].severity,
        vectors: detected.map(d => d.vector),
        rawSnippet: content.slice(0, 200),
        status: "BLOCKED_AND_QUARANTINED",
        remediation: "Untrusted payload neutralized. Downstream tool execution revoked.",
        metadata
      };

      this.activeAlerts.unshift(alert);

      if (this.auditLogger) {
        this.auditLogger.logEvent({
          type: "SECURITY_ALERT",
          severity: alert.severity,
          action: "INSPECTION_FAILED",
          details: `Prompt injection intercepted from [${source}]: ${alert.vectors.join(", ")}`,
          metadata: alert
        });
      }

      return {
        safe: false,
        sanitizedContent: `[QUARANTINE: Malicious prompt injection attempt neutralized. Source: ${source}]`,
        alert,
        violations: detected.map(d => d.vector)
      };
    }

    // Safe input: wrap in untrusted data delimiters to enforce separation of data and instructions
    return {
      safe: true,
      sanitizedContent: content,
      wrappedForAgent: `<untrusted_data source="${source}">\n${content}\n</untrusted_data>`,
      alert: null
    };
  }

  /**
   * Pre-execution authorization gate before any MCP tool is invoked
   */
  authorizeToolExecution({ toolName, params, userApproved = false, proposalId = null, userToken = null }) {
    // 1. Tool allowlist check
    if (!CONFIG.ALLOWED_TOOLS.includes(toolName)) {
      const errorMsg = `Security Access Denied: Tool '${toolName}' is not in the authorized tool allowlist.`;
      this.recordSecurityEvent("UNAUTHORIZED_TOOL", "HIGH", errorMsg, { toolName, params });
      return { allowed: false, reason: errorMsg };
    }

    // 2. Sensitive operation gate (Human-in-the-loop requirement)
    if (CONFIG.SENSITIVE_TOOLS.includes(toolName)) {
      if (!userApproved) {
        const errorMsg = `Security Policy Violation: Tool '${toolName}' requires explicit human approval before execution.`;
        this.recordSecurityEvent("UNAPPROVED_EXECUTION_BLOCKED", "CRITICAL", errorMsg, { toolName, params, proposalId });
        return { allowed: false, reason: errorMsg };
      }
    }

    // 3. Recipient allowlist check for email actions
    if (toolName === "send_email" || toolName === "draft_email") {
      const recipient = params?.to || params?.recipient;
      if (recipient) {
        const domain = recipient.split("@")[1]?.toLowerCase();
        const isAllowed = CONFIG.ALLOWED_RECIPIENT_DOMAINS.some(allowed => 
          domain === allowed || domain?.endsWith(`.${allowed}`)
        );

        if (!isAllowed) {
          const errorMsg = `Security Policy Violation: Recipient '${recipient}' is not within authorized domains: [${CONFIG.ALLOWED_RECIPIENT_DOMAINS.join(", ")}]. Exfiltration prevented.`;
          this.recordSecurityEvent("RECIPIENT_DOMAIN_BLOCKED", "HIGH", errorMsg, { recipient, toolName });
          return { allowed: false, reason: errorMsg };
        }
      }
    }

    // 4. Parameter payload sanitization
    const stringified = JSON.stringify(params || {});
    if (/ignore\s+previous/i.test(stringified) || /send\s+to\s+external/i.test(stringified)) {
      const errorMsg = "Security Policy Violation: Suspicious payload detected inside tool parameters.";
      this.recordSecurityEvent("PARAM_INJECTION_BLOCKED", "CRITICAL", errorMsg, { toolName, params });
      return { allowed: false, reason: errorMsg };
    }

    return { allowed: true, reason: "Authorized by security policy." };
  }

  recordSecurityEvent(type, severity, details, metadata = {}) {
    if (this.auditLogger) {
      this.auditLogger.logEvent({
        type: "SECURITY_VIOLATION",
        severity,
        action: type,
        details,
        metadata
      });
    }
  }

  getAlerts() {
    return this.activeAlerts;
  }

  clearAlerts() {
    this.activeAlerts = [];
  }
}

// Backward-compatible alias
export const CerberusGuard = PolicyGuard;
