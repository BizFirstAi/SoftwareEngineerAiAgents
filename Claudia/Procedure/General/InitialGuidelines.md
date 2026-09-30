# Agent Onboarding & Operating Guidelines

**Quick Start:** Begin by reading `index.md` at the repo root. Use parallel agents to understand the codebase. Reference the knowledge bases for each agent type.

---

## Step 0 — Preflight Tool Checks (Required for All Agents)

Before any agent begins work, it must verify that its required MCP server tools are available in this session:

1. **Check tool availability:**
   - Look for tools whose names start with the agent's MCP server name (listed in the agent's AGENT.md file)
   - Or call the server's list/health tool if available
   
2. **If tools ARE available:**
   - Continue with the agent's procedure

3. **If tools are NOT available:**
   - STOP immediately
   - Do not build a substitute deliverable (artifact, HTML page, standalone file, browser-UI build)
   - Tell the user in plain words: "The required [MCP Server Name] is not available in this session"
   - Ask: "(a) connect the MCP server and retry, or (b) explicitly approve a named fallback"
   
4. **Fallback approval:**
   - Only proceed with a fallback if the user explicitly approves in chat
   - Label the result clearly as a draft, not built through the required studio
   - Approval for one fallback does not carry over to later tasks
   
5. **Report findings:**
   - Say which tools you checked and what you found
   - Never assume tools exist without verification

**This is mandatory for all builder agents (AppAgent, FormAgent, WorkflowAgent, APIKeyAgent, CredentialAgent, ServerAgent).**

---

## Part 1: Repository Structure & Learning Path

### Two-Repo System
- **SoftwareEngineerAiAgents** (this repo) — Agent specs, knowledge bases, procedures, MCP server designs
- **BizFirstPayrollV3** — Core backend (.NET 9.0, 70+ microservices, SQL Server)

### Repo Organization
```
SoftwareEngineerAiAgents/
├── index.md                          # Start here — navigation hub
├── Agents/                           # Agent specifications
│   ├── Builders/ (AppDeveloper, FormDeveloper, WorkflowDeveloper)
│   └── Testers/ (AppTester, FormTester, WorkflowTester)
├── Knowledge/                        # Deep reference docs for each agent
│   ├── AppAgent/                     # App Studio knowledge
│   ├── WorkflowAgent/                # Workflow Studio knowledge
│   ├── Credentials/                  # Credential management
│   ├── Servers/                      # Infrastructure & server management
│   └── Notes/                        # Rouge agent memory system
└── Procedure/                        # Step-by-step guides
    ├── AppAgent/
    ├── WorkflowAgent/
    ├── Credentials/
    ├── Servers/
    └── General/ (Rouge_Notes, InitialGuidelines)
```

### How to Learn the Repo
1. Start with `index.md` for overview
2. Use parallel agents to explore structure, architecture, tech stack, database model
3. Review `Knowledge/[AgentName]/00-overview.md` for each agent type
4. Reference `Procedure/[AgentName]/` when executing tasks
5. Use Rouge_Notes (Semantic/Episodic/Procedural memory) to persist learnings

### Knowledge vs. Procedure
- **Knowledge** — Reference material, concepts, architecture, deep dives, API specs
- **Procedure** — Step-by-step guides, workflows, checklists, best practices
- Both cross-linked; reference knowledge while following procedures

### Agent Types & Their Roles
- **Builders** — Create features (AppDeveloper, FormDeveloper, WorkflowDeveloper)
- **Testers** — Validate end-to-end functionality (AppTester, FormTester, WorkflowTester)
- **System Agents** — Infrastructure & credentials (ServerAgent, CredentialAgent)
- **Memory Agent** — Persistent user/session memory (RougeAgent)

---

## Part 2: Core Operating Principles

### 1. Always Use MCP Tools (Never UI Manipulation)
- All creation/modification goes through MCP servers, never through web UI
- MCP servers are the source of truth for platform state
- Browser is read-only for display and validation only
- Studio endpoints (AppStudio, FlowStudio, etc.) are at `/[StudioName}` on the server root
  - Example: `http://localhost:5000/AppStudio` or `https://qa.example.com/FlowStudio`

### 2. Browser is Display-Only
- Use browser to show user progress after MCP operations complete
- Navigate to relevant pages and refresh to display what you've created
- Capture screenshots or GIFs to demonstrate changes to the user
- Browser must never be the primary creation tool

### 3. MCP Server Endpoints are Authoritative
- Trust MCP APIs for state management
- All relative paths in documentation are relative to the server root
- Use provided MCP servers to read/write platform objects
- Do not bypass MCP to directly query databases

### 4. Multi-Tenancy & Security-First
- All operations are tenant-aware (TenantID in context)
- Use credentials securely (stored in encrypted vault, never in logs)
- Validate user permissions before operations
- Follow least-privilege principle for agent access

### 5. Agents Provide Guided Experiences
- Agents ask questions, not make assumptions
- Capture comprehensive information before building
- Present options and recommendations at each step
- Allow users to decline/go back to main menu gracefully

---

## Part 3: Studio/Agent Overview

### AppAgent
- **Knowledge:** `Knowledge/AppAgent/`
- **Procedures:** `Procedure/AppAgent/`
- **Role:** Build web apps, sites, pages, widgets
- **Capabilities:** 17 widget types, theming, responsive design, multi-page apps
- **See:** AppAgent 00-overview.md for complete reference

### WorkflowAgent
- **Knowledge:** `Knowledge/WorkflowAgent/`
- **Procedures:** `Procedure/WorkflowAgent/`
- **Role:** Build workflows and workflow automation
- **Capabilities:** 18+ execution node types, integrations (Elasticsearch, Odoo, APIs), scheduling
- **See:** WorkflowAgent 00-overview.md for complete reference

### FormAgent
- **Knowledge:** TBD (follow AppAgent/WorkflowAgent structure)
- **Procedures:** TBD
- **Role:** Create forms and search+edit forms for tables
- **Capabilities:** 65+ control types, validation, entity-based workflows
- **Note:** Structure TBD; use AppAgent knowledge structure as template

### CredentialAgent
- **Knowledge:** `Knowledge/Credentials/`
- **Procedures:** `Procedure/Credentials/`
- **Role:** Manage API keys, OAuth2, database credentials, SSH keys, etc.
- **Capabilities:** Secure storage, encryption, key rotation, audit trails
- **Security:** All credentials encrypted; never log or expose in console

### ServerAgent
- **Knowledge:** `Knowledge/Servers/`
- **Procedures:** `Procedure/Servers/`
- **Role:** Provision, configure, and manage infrastructure
- **Capabilities:** Physical/VM/container/cloud servers, deployment, scaling, monitoring
- **See:** Servers 00-overview.md for deployment strategies

### RougeAgent (Memory System)
- **Knowledge:** `Knowledge/Notes/`
- **Reference:** `Procedure/General/Rouge_Notes.md`
- **Role:** Persistent agent memory (Semantic, Episodic, Procedural)
- **Use:** Store user preferences, session decisions, lessons learned
- **Memory Types:**
  - **Semantic** — Facts, definitions, domain knowledge, patterns
  - **Episodic** — Events, interactions, session history, decisions
  - **Procedural** — Workflows, steps, best practices, how-to guides

---

## Part 4: Questionnaire Pattern (Guided Experience)

### Concept
Each agent provides a **guided, interactive experience** via questionnaires. Users answer structured questions to provide complete information upfront. Questionnaires are recommendation-based and can be progressively updated based on feedback.

### Questionnaire File Structure
Each agent should have a `{AgentName}Questionnaire.md` in its Procedure folder:
- `Procedure/AppAgent/AppQuestionnaire.md`
- `Procedure/WorkflowAgent/WorkflowQuestionnaire.md`
- `Procedure/CredentialAgent/CredentialQuestionnaire.md`
- etc.

### Example: AppQuestionnaire.md
```
# App Creation Questionnaire

## Section 1: Basic Info
- **App Name:** (required, 3-50 chars)
- **Description:** (optional)
- **Use Case:** (dropdown: business, personal, template, etc.)

## Section 2: Pages
- **How many pages?** (1-20)
- **For each page:**
  - Page title
  - Purpose/what does this page do?
  - Content type (recommend: content-heavy, form, dashboard, etc.)

## Section 3: Widgets
- **For each page, what widgets needed?**
  - Content (text, rich editor)
  - Form (user input, validation)
  - Workflow (agent interaction, automation)
  - Gallery (images, video, audio, PDF)
  - Navigation (page links, menu)
  - Chat (chat assistant)
  - Custom (specify)

## Section 4: Design
- **Theme/Style:** (recommend: default, dark, light, branded)
- **Responsive?** (yes/no — recommend yes)
- **Logo/Branding:** (optional file upload)

## Section 5: Confirmation
- Summary of selections
- Recommendation (e.g., "Start with page 1, add widgets one at a time")
- Ready to build? (yes/decline to main menu)
```

### Questionnaire Best Practices
1. **Be User-Friendly** — Non-technical language; use dropdown/radio where possible
2. **Provide Recommendations** — "For a form-heavy page, we recommend Form + Submit Button widgets"
3. **Capture Everything** — Answer all questions before building to minimize rework
4. **Allow Decline** — Always provide option to return to main menu or start over
5. **Progressive Updates** — If user feedback changes requirements, update questionnaire for next iteration
6. **Wizard-Like Flow** — Step through sections, don't overwhelm with one giant list

---

## Part 5: Multi-Agent Orchestration

### Simple vs. Complex Scenarios
- **Simple:** Create a single-page app with a content widget → Single AppAgent
- **Complex:** Build a chat assistant workflow agent → Multi-agent orchestration

### Complex Example: Chat Assistant Workflow Agent
Building a chat assistant requires:
1. **Planning phase** — Outline all tasks, get user approval
2. **RAG (Retrieval-Augmented Generation) setup** — Create RAG collection, upload knowledge files
3. **Workflow creation** — Build workflow, add execution nodes, configure logic
4. **Agent configuration** — Set up AI agent node with LLM model, memory, tools
5. **Execution template** — Create workflow execution template
6. **App integration** — Add Chat Panel widget to app, link to workflow

### Multi-Agent Workflow
```
User Request: "Build a chat assistant that answers questions about my documentation"

Phase 1: Planning (1 agent)
├─ Outline tasks (RAG, workflow, app integration)
├─ Estimate effort
└─ Get user approval for plan

Phase 2: Task Execution (3+ agents in sequence)
├─ RAG Agent: Create collection, user uploads docs
├─ Workflow Agent: Build workflow with nodes
├─ App Agent: Add Chat Panel widget, link to workflow
└─ After each task: Show progress in browser, get user feedback

Phase 3: Testing (Tester agents)
├─ WorkflowTester: Validate workflow logic
└─ AppTester: Validate chat panel + integration

Phase 4: Refinement (feedback loop)
├─ User tests chat assistant
├─ Feedback captured in Rouge_Notes
└─ Update workflow/app based on feedback
```

### Progress Tracking
- After each task, navigate to relevant studio in browser and show user what was created
- Refresh pages to show live updates
- Capture screenshots/GIFs of progress
- Communicate completion before moving to next task
- Present findings/issues and ask for permission before continuing

---

## Part 6: Best Practices

### UX & User Engagement
- **Show Progress** — Always demonstrate what you've built in the browser (navigate, refresh, screenshot)
- **Ask Before Action** — Never assume; present options and ask for confirmation
- **Provide Recommendations** — "Based on your use case, we recommend X over Y because..."
- **Graceful Decline** — Always allow users to return to main menu or start over
- **User-Friendly Language** — Avoid technical jargon; use friendly, conversational tone

### Information Capture
- Use questionnaires to capture comprehensive info upfront
- Wizard-like flow (step-by-step) prevents overwhelming users
- Ask follow-ups if answers are vague; don't guess
- Document all decisions in Rouge_Notes (Episodic memory)

### Decision Documentation
- Store user preferences in Rouge_Notes (Semantic)
- Record decisions made during session (Episodic)
- Document lessons learned for future sessions (Procedural)
- Example: "User prefers light theme" → Semantic; "User chose 3 pages for app" → Episodic; "Best practice: validate all inputs before submission" → Procedural

### Testing & Validation
- Always test end-to-end before declaring a task complete
- AppTester validates UI/UX in browser
- WorkflowTester validates workflow logic
- Create test plans upfront; execute incrementally
- Report issues clearly; don't hide failures

### Multi-Agent Coordination
- Launch agents in sequence for dependent tasks (RAG → Workflow → App)
- Launch agents in parallel for independent tasks (test multiple pages simultaneously)
- Use phase() calls in workflows to organize complex orchestration
- Share progress and errors across agents via consistent naming/logging

---

## Summary

**Core Flow:**
1. Learn repo using parallel agents → start with index.md
2. Understand agent roles and knowledge bases → reference Knowledge/{AgentName}/
3. Follow questionnaire pattern to gather user requirements → interactive, recommendation-based
4. Execute tasks using MCP servers → never UI manipulation
5. Show progress in browser → display what you've created
6. Document decisions in Rouge_Notes → persistent memory
7. Test end-to-end → validate with AppTester/WorkflowTester agents
8. Refine based on feedback → interactive, iterative process

**Remember:** Users are not IT experts. Be friendly, provide recommendations, show progress, and always allow them to go back or decline.