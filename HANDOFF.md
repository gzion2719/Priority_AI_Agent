# Project Handoff — Priority AI Agent

## Who you are

You are a **senior Priority ERP developer and solutions architect**. Read `CLAUDE.md` in full before doing anything — it defines your role, coding standards, tech stack defaults, and Priority API patterns. It is the law for this project.

---

## What this project is

A **conversational AI agent** that lets KRAMER's staff query their Priority ERP data in plain language — Hebrew or English. The user types a question, Claude translates it into Priority OData API calls, fetches the live data, and replies in natural language.

**Current scope:** Read-only. Four Priority forms.

---

## Current state (as of 2026-04-16)

### What is fully built

| Layer | Status | Location |
|---|---|---|
| Express backend + agent loop | Complete | `kramer-agent/backend/` |
| Claude tool_use agent (multi-query) | Complete | `backend/src/ai/agent.ts` |
| Priority REST client (Basic auth) | Complete | `backend/src/priority/client.ts` |
| Tool definitions + OData executor | Complete | `backend/src/ai/tools.ts` |
| Bilingual system prompt (HE/EN) | Complete | `backend/src/ai/prompts.ts` |
| React chat UI | Complete | `kramer-agent/frontend/` |
| Bilingual chat (auto RTL detection) | Complete | `frontend/src/components/ChatWindow.tsx` |
| Docs / Priority forms reference | Complete | `kramer-agent/docs/priority-forms.md` |

### What is NOT done yet

- `npm install` has not been run — no `node_modules` exist yet
- `.env` file has not been created/filled in for the KRAMER environment
- The app has never been test-run against a real Priority server
- No authentication/login on the UI (open access)
- No persistence — conversation history is in-memory, lost on server restart
- Not yet embedded in Priority (Phase 2)

---

## Repository

**GitHub:** `https://github.com/gzion2719/Priority_AI_Agent`
**Branch:** `master`
**Commit convention:** `feat:` / `fix:` / `priority:` / `ai:` prefixes (see CLAUDE.md)

Clone:
```bash
git clone https://github.com/gzion2719/Priority_AI_Agent.git
cd Priority_AI_Agent
```

---

## Project structure

```
Priority_AI_Agent/
├── CLAUDE.md                        ← Read this first. Role + all coding rules.
├── HANDOFF.md                       ← This file
├── .gitignore
└── kramer-agent/
    ├── .env.example                 ← Copy to .env and fill in
    ├── package.json                 ← Root scripts (install:all, dev:backend, dev:frontend)
    ├── backend/
    │   ├── package.json
    │   ├── tsconfig.json
    │   └── src/
    │       ├── server.ts            ← Express server, session map, /api/chat endpoint
    │       ├── priority/
    │       │   ├── client.ts        ← Authenticated fetch wrapper (Basic auth)
    │       │   └── types.ts         ← TypeScript interfaces for Priority entities
    │       └── ai/
    │           ├── agent.ts         ← Claude tool_use loop (max 10 iterations)
    │           ├── tools.ts         ← Tool definitions + OData query executor
    │           └── prompts.ts       ← System prompt builder (bilingual, today's date injected)
    ├── frontend/
    │   ├── package.json
    │   ├── tsconfig.json
    │   ├── vite.config.ts           ← Proxies /api → localhost:3001
    │   ├── index.html
    │   └── src/
    │       ├── main.tsx
    │       ├── App.tsx              ← Session ID, message state, send/clear handlers
    │       ├── api.ts               ← fetch wrappers for /api/chat
    │       ├── index.css
    │       └── components/
    │           ├── ChatWindow.tsx   ← Full chat UI, RTL detection, suggestion chips
    │           └── ChatWindow.css
    └── docs/
        └── priority-forms.md        ← Field reference for all 4 forms + document types
```

---

## Priority forms in scope

| Agent form name | Priority endpoint | Key date field | Key number field |
|---|---|---|---|
| ORDERS | `ORDERS` | `CURDATE` | `ORDNAME` |
| PORDERS | `PORDERS` | `CURDATE` | `ORDNAME` |
| DOCUMENTS_Q | `DOCUMENTS_Q` | `STARTDATE` | `DOCNO` |
| AINVOICES | `AINVOICES` | `IVDATE` | `IVNUM` |

### DOCUMENTS_Q — type codes in scope (TYPE field, case-sensitive)

| Code | English | Hebrew |
|---|---|---|
| D | Customer Shipment | תעודת משלוח ללקוח |
| Q | Service Call | קריאת שירות |
| N | Customer Return | החזרה מלקוח |
| W | Return to Vendor | החזרה לספק |
| Z | Service Contract | חוזה שירות |
| m | RMA Document | מסמך RMA |
| F | Subcontractor Shipment | משלוח קבלן משנה |
| P | Receipt of Goods | קבלת סחורה |

> `TYPEDES` field does **not** exist on `DOCUMENTS_Q`. Type descriptions are handled in the agent's system prompt.
> `INVOICES` returns 404 — always use `AINVOICES`.
> `DOCUMENTS` returns 404 — always use `DOCUMENTS_Q`.

---

## How the agent works

```
User message
  → Express POST /api/chat (with sessionId)
  → history loaded from in-memory Map
  → runAgent() called
      → Claude (claude-opus-4-5) with system prompt + PRIORITY_TOOLS
      → If stop_reason = 'tool_use':
          → executeTool('query_priority', { form, filter, select, orderby, top })
          → Builds OData URL, calls Priority REST API
          → Returns JSON { count, records } back to Claude
          → Loop repeats (max 10 iterations)
      → If stop_reason = 'end_turn':
          → Extract text reply, update session history
  → { reply } returned to frontend
```

Key design choices:
- **tool_use loop** (not simple translate→query) so Claude can chain multiple queries for complex questions
- **defaultFilter on DOCUMENTS_Q** automatically scopes to the 8 TYPE codes; user-supplied filters are ANDed with it
- **Session history** kept server-side in a `Map<sessionId, MessageParam[]>` — stateless frontend
- **System prompt** injects today's date so Claude can handle relative date questions ("this month")

---

## Environment variables

Create `kramer-agent/.env` (never commit it):

```env
PRIORITY_SERVICE_ROOT=https://<server>/odata/Priority/<tabula.ini>/<company>
PRIORITY_USERNAME=
PRIORITY_PASSWORD=

# Optional — only if customer uses per-app licensing
PRIORITY_APP_ID=
PRIORITY_APP_KEY=

ANTHROPIC_API_KEY=

PORT=3001
```

**Sandbox for testing** (safe, public):
```
PRIORITY_SERVICE_ROOT=https://t.eu.priority-connect.online/odata/Priority/tabbtd38.ini/usdemo
PRIORITY_USERNAME=apidemo
PRIORITY_PASSWORD=123
```

---

## How to run locally

```bash
cd kramer-agent

# 1. Install dependencies (first time only)
npm run install:all

# 2. Start backend (Terminal 1)
npm run dev:backend      # → http://localhost:3001

# 3. Start frontend (Terminal 2)
npm run dev:frontend     # → http://localhost:5173
```

Open `http://localhost:5173`. The Vite dev server proxies `/api/*` to `:3001`.

---

## Known issues / things to verify

1. **DOCUMENTS form name in KRAMER's environment** — sandbox confirmed `DOCUMENTS_Q` works and types D/Q/N/W/Z/m/F/P exist. Verify these are the same in KRAMER's actual Priority server before going live.

2. **Status values** — `ORDSTATUSDES`, `STATDES`, `CALLSTATUSCODE` values (e.g. "Open", "Closed") are language/locale dependent. Query a few live records first to confirm the exact strings used in KRAMER's system, then add examples to the system prompt.

3. **CUSTNAME for KRAMER** — when filtering by customer, the correct customer code in Priority must be confirmed (e.g. `CUSTNAME eq 'KRAMER'` — check the exact value in their system).

4. **Auth** — currently Basic auth. If KRAMER uses SSO, switch to PAT (set `password: 'PAT'`). For production, migrate to OIDC (see CLAUDE.md auth section).

5. **Rate limiting** — Priority cloud caps at 100 req/min per user. The agent loop can call the tool multiple times per user message. Add exponential backoff to `priority/client.ts` if rate limit errors (429) appear.

---

## Agreed next steps (discuss with user before starting)

1. **Test run** — connect to KRAMER sandbox/staging, verify all 4 forms return data, confirm status strings and CUSTNAME code
2. **UI polish** — user may want logo, color scheme, company name customization
3. **Priority embedding** — embed the chat UI into Priority using the Web SDK (Phase 2); needs OIDC auth migration
4. **Conversation persistence** — replace in-memory `Map` with a database (SQLite or Redis) so history survives restarts
5. **Write access** — user indicated read-only for now but may want to add create/update actions later

---

## Customer context

- **Customer:** KRAMER
- **Auth in use:** Basic (dev/testing phase)
- **Language:** Hebrew + English (bilingual)
- **Environment:** Not yet confirmed (cloud vs. on-prem, version)
- **Deployment target:** Local first → embed in Priority Web SDK

---

## Questions to ask the user at the start of the next session

1. Are you ready to connect to the actual KRAMER Priority environment? Do you have the service root URL and credentials?
2. What is KRAMER's exact customer code in Priority (for CUSTNAME filters)?
3. Any UI changes wanted before the first demo?
