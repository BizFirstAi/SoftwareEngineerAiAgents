# SoftwareEngineerAiAgents — Index

**AI-driven knowledge + agent-spec system for building BizFirst studios** (App, Form, Workflow).

## Quick Navigation

### 📋 **Core Reference**
- [AGENTS.md](AGENTS.md) — All agent specs (AppDeveloper, FormDeveloper, WorkflowDeveloper, Testers)
- [../README.md](../README.md) — Project overview and setup
- [../llms.txt](../llms.txt) — AI tool navigation guide

### 🤖 **Agents**
- **Builders**
  - [AppDeveloper](Agents/Builders/AppDeveloper/AGENT.md) — Creates apps, sites, pages, widgets
  - [FormDeveloper](Agents/Builders/FormDeveloper/AGENT.md) — Creates forms and search+edit forms
  - [WorkflowDeveloper](Agents/Builders/WorkflowDeveloper/AGENT.md) — Creates workflows and nodes
- **Testers**
  - [AppTester](Agents/Testers/AppTester/AGENT.md) — Tests app studio features and widgets
  - [FormTester](Agents/Testers/FormTester/AGENT.md) — Tests form controls and validation
  - [WorkflowTester](Agents/Testers/WorkflowTester/AGENT.md) — Tests workflow nodes and integrations

### 📚 **Knowledge Bases**
- [App Studio](Knowledge/App/00-overview.md) — App data model, widgets, architecture, design
- [Form Studio](Knowledge/Form/) — Form controls (65+ types), validation, design patterns
- [Workflow Studio](Knowledge/Workflow/) — Workflow nodes, execution patterns, integrations
- [Shared](Knowledge/Shared/) — Common patterns, architecture, standards

### 📖 **Procedures**
- [App Creation](Procedure/App/) — Step-by-step guides for building apps
- [Form Creation](Procedure/Form/) — Step-by-step guides for building forms
- [Workflow Creation](Procedure/Workflow/) — Step-by-step guides for building workflows
- [General](Procedure/General/) — Rouge Notes memory system, common utilities

## Architecture

**Two-Repo System:**
- **SoftwareEngineerAiAgents** (this repo) — Agent specs, knowledge, procedures
- **BizFirstPayrollV3** — Backend (.NET 9.0, 70+ microservices, SQL Server)

**Three Studios:**
1. **App Studio** — Web apps, sites, pages, widgets (17 widget types)
2. **Form Studio** — Forms and search+edit forms (65+ control types)
3. **Workflow Studio** — Workflows and workflow nodes (18+ documented node types)

**Agent Teams:**
- Builders create features via MCP servers (never UI)
- Testers validate end-to-end functionality
- Knowledge feeds agents source-grounded reference

## Key Rules
✓ All creation through MCP servers, never UI  
✓ Browser read-only for display/validation  
✓ Agents self-contain questions and steps  
✓ Use Rouge_Notes for persistent agent memory (Semantic/Episodic/Procedural)

## Recent Updates
- **Procedure/General/Rouge_Notes.md** — Redesigned memory system (Semantic/Episodic/Procedural types)
- **Knowledge/App/DevelopmentHistoryLog.md** — Tracks App Studio changes and decisions
- **Knowledge/Workflow/testing/** — Elasticsearch and Odoo integration test results

## See Also
- [Development History](Knowledge/App/DevelopmentHistoryLog.md)
- [Architecture Overview](Knowledge/App/architecture.md)
- [Widget Reference](Knowledge/App/widgets/)
- [Workflow Node Types](Knowledge/Workflow/nodes/)
