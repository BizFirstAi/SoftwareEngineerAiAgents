# Agent Index

Start here. This file lists every agent in this repository and tells an AI assistant, such as
Claude in Chrome opened from a studio's **Build using AI** page, which agent to use.

## Rules for every agent (Binoy, 2026-09-26)

1. **Every create or change goes through the agent's MCP server.** Never create, save, delete or
   publish anything by clicking or typing in a studio's UI.
2. **The browser is read-only.** Use it to read, browse, navigate, reload and show the user the
   result (scroll to it, highlight it). Nothing more.
3. **The user only pastes the short prompt from the Build using AI page.** The agent's procedures
   hold every question and step, so never ask the user to write a long prompt.
4. **The agent creates the app, form or workflow itself** through MCP, including the project.

## How to pick an agent

1. **Find the studio.** The Build using AI page names it in its heading ("Build *Flow Studio* …
   using Claude"). You can also tell from the page's own header or its URL.
2. **Find the row below** for that studio and the kind of request. If the user asks to *test*
   something, use the Tester. Otherwise use the Builder.
3. **If the studio or the request is unclear, ask the user.** Don't guess.
4. **Open that agent's `AGENT.md` and follow it.** It is a short index that points to the exact
   Knowledge and Procedure files to load. Load only those, and only when the request needs them.

## Agents

| Studio | The user wants to… | Agent | MCP server |
|---|---|---|---|
| App Studio | build a web site, web app, landing page, page or widget | [App Developer](Agents/Builders/AppDeveloper/AGENT.md) | `BizFirst.Ai.Mcp.Tools.AppStudio` |
| Form Studio | build a form, or a Search + Edit form for a table | [Form Developer](Agents/Builders/FormDeveloper/AGENT.md) | `BizFirst.Ai.Mcp.Tools.AtlasForms` |
| Flow Studio | build a workflow, or fix a node whose config dialog shows no form or the wrong form | [Workflow Developer](Agents/Builders/WorkflowDeveloper/AGENT.md) | `BizFirst.Ai.Mcp.Tools.Workflow` |
| App Studio | test an app, a widget or the App Studio MCP tools | [App Tester](Agents/Testers/AppTester/AGENT.md) | `BizFirst.Ai.Mcp.Tools.AppStudio` |
| Form Studio | test a form, a control type or the Atlas Forms MCP tools | [Form Tester](Agents/Testers/FormTester/AGENT.md) | `BizFirst.Ai.Mcp.Tools.AtlasForms` |
| Flow Studio | test a node type, a workflow or the Workflow MCP tools | [Workflow Tester](Agents/Testers/WorkflowTester/AGENT.md) | `BizFirst.Ai.Mcp.Tools.Workflow` |

## Not available yet

These folders exist, but no agent has been written for them. If a request needs one, tell the user
it isn't available yet rather than improvising.

| Agent | Status |
|---|---|
| [Server Developer](Agents/Builders/ServerDeveloper/README.md) | Placeholder. The `BizFirst.Ai.Mcp.Tools.Servers` MCP tools exist |
| [Credential Developer](Agents/Builders/CredentialDeveloper/README.md) | Placeholder. The `BizFirst.Ai.Mcp.Tools.Credentials` MCP tools exist |
| [Designers](Agents/Designers/README.md) | Placeholder. No designer agents yet |

## Where things live

| Folder | Holds | Shared by |
|---|---|---|
| `Agents/` | One short `AGENT.md` per agent: role, triggers and links | — |
| `Knowledge/{App,Form,Workflow}/` | Reference material grounded in the real code | Builders and Testers of that area |
| `Procedure/{App,Form,Workflow}/` | Step-by-step guides an agent follows | Builders and Testers of that area |

Knowledge and procedures are written once and linked from the agents. They are never copied
into an agent.
