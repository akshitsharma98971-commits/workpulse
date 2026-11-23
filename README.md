# WORKPULSE
> **An MCP-powered AI team assistant that connects workplace applications, detects hidden blockers, recommends solutions, and safely executes approved actions.**

![WORKPULSE Demo](https://img.shields.io/badge/Security-Policy%20Guard%20Active-10b981?style=for-the-badge&logo=shield)
![MCP Server](https://img.shields.io/badge/MCP-Standard%20JSON--RPC%202.0-8b5cf6?style=for-the-badge)
![Model](https://img.shields.io/badge/AI-Gemini%203.8%20Flash-06b6d4?style=for-the-badge)

---

## 🌟 The 4 Building Blocks

1. **WORKPULSE — Intelligence**:
   - Understands team activity across live **Gmail**, **Google Calendar**, and **GitHub**.
   - Detects hidden dependencies, blocked PRs, and approaching deadlines before milestones fail.
2. **MCP — Connectivity**:
   - Implements the **6 official MCP tools** over standard JSON-RPC 2.0:
     - `brief_today`: Generates daily summary of team health, blockers, and upcoming deadlines.
     - `find_blockers`: Discovers active blockers with multi-source evidence.
     - `propose_action`: Formulates human-reviewable action proposals.
     - `approve_action`: Executes actions through MCP tools only upon user approval.
     - `undo_action`: Rolls back / reverts executed operations where supported.
     - `audit_log`: Provides chronological action history and security audit trace.
3. **Security Policy Middleware**:
   - Protects AI agents against prompt injection and unauthorized operations.
   - External data is isolated inside `<untrusted_data>` boundaries (taint tracking).
   - Enforces tool allowlists, recipient domain whitelists, and user confirmation gates.
4. **Voice & Approvals — Conversational Interaction**:
   - Conversational voice interaction powered by Web Speech-to-Text and SpeechSynthesis.
   - Specific workspace queries: *"What was the last mail from newton@123.gmail.com?"*, *"What was the last PR merged?"*, *"Give me today's briefing"*, *"Find my blockers"*.

---

## 🧭 Live Endpoints

- **Full-Stack Application & Dashboard**: [http://localhost:4000](http://localhost:4000)
- **Vite React Dev Server**: [http://localhost:3000](http://localhost:3000)
- **Standard MCP Protocol Endpoint**: `POST http://localhost:4000/mcp`

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation & Run

```bash
# Clone the repository
git clone https://github.com/akshitsharma98971-commits/workpulse.git
cd workpulse

# Install dependencies and build frontend
npm run build

# Start the full-stack server
npm start
```

Visit **http://localhost:4000** in your browser.

---

## 🔌 Live Connectors

- **GitHub:** Connect via GitHub Personal Access Token (PAT) or instant username mode to pull all your live repositories and pull requests.
- **Gmail:** Connect via 16-character Google App Password (TLS IMAP) or OAuth Bearer Token.
- **Google Calendar:** Connect via secret iCal (`.ics`) URL from Google Calendar settings for zero-setup live event streaming.

---

## 🛠️ MCP JSON-RPC Protocol Usage

Query the MCP server directly using any standard MCP client or `curl`:

```bash
# List all 6 tools
curl -X POST http://localhost:4000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# Detect blockers
curl -X POST http://localhost:4000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"find_blockers","arguments":{"workspace_id":"workspace-hackathon-alpha"}}}'
```
