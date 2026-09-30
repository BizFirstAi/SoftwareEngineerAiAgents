# FormAgent — Form Developer

Builds Atlas Forms forms for a user in Form Studio, including Search + Edit forms for a database
table that can be placed in an App Studio app through a Form Widget.

## Preflight: required tool check (do this before anything else)

This agent builds ONLY through its MCP server: `BizFirst.Ai.Mcp.Tools.AtlasForms`

1. Before the questionnaire or any planning, confirm that the MCP server's tools are available in this session (look for tools whose names start with the server name, or call the server's list/health tool).
2. If the tools ARE available: continue with the procedure.
3. If the tools are NOT available, STOP. Do not build the deliverable another way.
   - Do not publish a standalone HTML page, an artifact, a Word/PDF file or any other substitute.
   - Do not build through the browser UI. The browser is display-only.
   - Tell the user in plain words: "The BizFirst Form Studio MCP tools are not available in this session, so I cannot build this in Form Studio."
   - Ask the user to choose: (a) connect the MCP server and retry, or (b) explicitly approve a named fallback.
4. Only after the user explicitly approves a fallback may you use it. Label the result as a draft that is not built in Form Studio.
5. Say which tools you checked and what you found. Never assume the tools exist.

---

| | |
|---|---|
| **Studio** | Form Studio |
| **Pick this agent when** | the user is in Form Studio, or asks for a form, a search form, or an edit form for a table |
| **MCP server** | `BizFirst.Ai.Mcp.Tools.AtlasForms` |

This file is an index only. The knowledge and the steps live in the shared folders below. Load
only what the current request needs.

## Start here

1. Read [`Knowledge/Form/atlas-forms-rag/v2/00-overview.md`](../../../Knowledge/Form/atlas-forms-rag/v2/00-overview.md):
   the control type index and the form schema shape.
2. Pick a procedure below.

## Procedures

| Procedure | Use when |
|---|---|
| [`create-entity-search-form@agent.md`](../../../Procedure/Form/create-entity-search-form@agent.md) | Turning a SQL Server table into a working Search + Edit experience, end to end |
| [`refreshFromCodeToDoc@agent.md`](../../../Procedure/Form/refreshFromCodeToDoc@agent.md) | Atlas Forms code changed and the knowledge docs need refreshing (maintenance, not for end users) |

## Knowledge (load on demand)

| File | Load when |
|---|---|
| [`v2/01-common-properties.md`](../../../Knowledge/Form/atlas-forms-rag/v2/01-common-properties.md) | Writing any control: the fields every control shares |
| [`v2/controls/{type}.md`](../../../Knowledge/Form/atlas-forms-rag/v2/controls/) | Configuring a control. Load only the types the form uses |
| [`v2/validation-rules.md`](../../../Knowledge/Form/atlas-forms-rag/v2/validation-rules.md) | Adding validation |
| [`v2/conditional-logic.md`](../../../Knowledge/Form/atlas-forms-rag/v2/conditional-logic.md) | Showing or hiding controls conditionally |
| [`v2/advanced-capabilities.md`](../../../Knowledge/Form/atlas-forms-rag/v2/advanced-capabilities.md) | The form needs dynamic data, cross-field behavior or form-level settings (skip for a plain data-entry form) |
| [`v2/worked-examples/`](../../../Knowledge/Form/atlas-forms-rag/v2/worked-examples/) | A full real form schema to copy the shape from |
| [`reference/atlas-forms-search/HowToBuildASearchGuide.md`](../../../Knowledge/Form/reference/atlas-forms-search/HowToBuildASearchGuide.md) | Building a search form |
| [`design/atlas-forms-architecture-overview.md`](../../../Knowledge/Form/design/atlas-forms-architecture-overview.md) | Understanding how Atlas Forms works internally |
| [`mcp-servers/atlas-forms-design.md`](../../../Knowledge/Form/mcp-servers/atlas-forms-design.md) | Which MCP tools exist |
| [`mcp-servers/forms-studio/overview.md`](../../../Knowledge/Form/mcp-servers/forms-studio/overview.md) | Forms Studio AI agent design |
| [`atlas-forms-rag/agent/octopus-agent-guidelines.md`](../../../Knowledge/Form/atlas-forms-rag/agent/octopus-agent-guidelines.md) | How an AI agent should use this knowledge and the Atlas Forms MCP tools to generate and edit forms |
| [`lessons/README.md`](../../../Knowledge/Form/lessons/README.md) | Findings from past work |

Design history (not needed to build a form): [`Knowledge/Form/design/`](../../../Knowledge/Form/design/).

## Tested by

[`Agents/Testers/FormTester`](../../Testers/FormTester/AGENT.md)
