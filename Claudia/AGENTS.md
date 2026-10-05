# Claudia Agents Index

Entry point for AI agents (for example Claude in Chrome) that need to load the
agent definitions, knowledge and procedures in this folder.

## How to use this index

- **Fetch only the raw links below.** GitHub's `robots.txt` blocks AI agents from
  `github.com/.../tree/...` and `github.com/.../raw/...` URLs, so folder links on
  github.com cannot be read. `raw.githubusercontent.com` links work.
- Relative links inside a file resolve against that file's raw URL. A link that points
  to a folder will not load; find the files in that folder in this index instead.
- Start with **General procedures**, then open the agent for your task and the
  knowledge and procedures listed under it.

Raw base URL: `https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/`

## Start here

| File | Title |
|---|---|
| [`MCP_SERVER_CONFIG.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/MCP_SERVER_CONFIG.md) | MCP Server Configuration |
| [`API_KEY_SCOPES.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/API_KEY_SCOPES.md) | Default API Key Scopes |
| [`Recommendations_ForPublicUX.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Recommendations_ForPublicUX.md) | Recommendations for Public User Experience |

## Agents

| File | Title |
|---|---|
| [`Agents/Builders/APIKeyAgent/AGENT.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Agents/Builders/APIKeyAgent/AGENT.md) | APIKeyAgent |
| [`Agents/Builders/AppAgent/AGENT.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Agents/Builders/AppAgent/AGENT.md) | AppAgent — Web App & Site Builder |
| [`Agents/Builders/CredentialAgent/README.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Agents/Builders/CredentialAgent/README.md) | Credential Developer |
| [`Agents/Builders/FormAgent/AGENT.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Agents/Builders/FormAgent/AGENT.md) | FormAgent — Form Developer |
| [`Agents/Builders/ServerAgent/README.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Agents/Builders/ServerAgent/README.md) | Server Developer |
| [`Agents/Builders/WorkflowAgent/AGENT.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Agents/Builders/WorkflowAgent/AGENT.md) | WorkflowAgent — Workflow Developer |
| [`Agents/Designers/README.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Agents/Designers/README.md) | Designers |
| [`Agents/Testers/AppTester/AGENT.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Agents/Testers/AppTester/AGENT.md) | App Tester |
| [`Agents/Testers/FormTester/AGENT.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Agents/Testers/FormTester/AGENT.md) | Form Tester |
| [`Agents/Testers/WorkflowTester/AGENT.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Agents/Testers/WorkflowTester/AGENT.md) | Workflow Tester |

## Procedures: General

| File | Title |
|---|---|
| [`Procedure/General/APIKeyGuidedExamples.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/General/APIKeyGuidedExamples.md) | APIKey Guided Experience Examples |
| [`Procedure/General/DiscoveryFlow.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/General/DiscoveryFlow.md) | Platform Discovery Flow — Guided Learning Path |
| [`Procedure/General/GuidedExperienceExamples.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/General/GuidedExperienceExamples.md) | Guided Experience Examples |
| [`Procedure/General/InitialGuidelines.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/General/InitialGuidelines.md) | Agent Onboarding & Operating Guidelines |
| [`Procedure/General/MultiAgentOrchestration.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/General/MultiAgentOrchestration.md) | Multi-Agent Orchestration Patterns |
| [`Procedure/General/PlatformCapabilities.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/General/PlatformCapabilities.md) | Platform Capabilities — Complete Feature Reference |
| [`Procedure/General/PlatformFeaturesMenu.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/General/PlatformFeaturesMenu.md) | Platform Features Menu — Explore What's Possible |
| [`Procedure/General/QuestionnaireExamples.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/General/QuestionnaireExamples.md) | Questionnaire Examples — Guided Agent Interactions |
| [`Procedure/General/Rouge_Notes.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/General/Rouge_Notes.md) | Rouge Notes Agent Memory System |
| [`Procedure/General/ThemeSelection.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/General/ThemeSelection.md) | Theme Selection Guide |
| [`Procedure/General/ThemeSelectionAgent.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/General/ThemeSelectionAgent.md) | ThemeSelectionAgent — Theme Management Specification |
| [`Procedure/General/theme-walkthrough.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/General/theme-walkthrough.md) | Theme Selection Step-by-Step Walkthrough |
| [`Procedure/General/use-page-mcp-bridge.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/General/use-page-mcp-bridge.md) | Use the page's MCP bridge (Claude in Chrome) |

## Procedures: APIKeyAgent

| File | Title |
|---|---|
| [`Procedure/APIKeyAgent/01-create-api-key.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/APIKeyAgent/01-create-api-key.md) | Creating an API Key — Step-by-Step |
| [`Procedure/APIKeyAgent/02-validate-api-key.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/APIKeyAgent/02-validate-api-key.md) | Validating an API Key — Step-by-Step |
| [`Procedure/APIKeyAgent/APIKeyQuestionnaire.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/APIKeyAgent/APIKeyQuestionnaire.md) | API Key Questionnaire |
| [`Procedure/APIKeyAgent/check-existing-apikey.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/APIKeyAgent/check-existing-apikey.md) | Check Existing API Key |
| [`Procedure/APIKeyAgent/create-apikey-guided.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/APIKeyAgent/create-apikey-guided.md) | Create API Key - Guided Walkthrough |
| [`Procedure/APIKeyAgent/README.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/APIKeyAgent/README.md) | APIKeyAgent Procedures |
| [`Procedure/APIKeyAgent/retrieve-apikey.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/APIKeyAgent/retrieve-apikey.md) | Retrieve API Key |
| [`Procedure/APIKeyAgent/revoke-apikey.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/APIKeyAgent/revoke-apikey.md) | Revoke API Key |
| [`Procedure/APIKeyAgent/troubleshoot.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/APIKeyAgent/troubleshoot.md) | Troubleshoot API Key Issues |
| [`Procedure/APIKeyAgent/use-apikey-in-session.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/APIKeyAgent/use-apikey-in-session.md) | Use API Key in Session |

## Procedures: AppAgent

| File | Title |
|---|---|
| [`Procedure/AppAgent/01-create-empty-app.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/AppAgent/01-create-empty-app.md) | Procedure: Create a Web Site, Web Application or Content Site (Guided) |
| [`Procedure/AppAgent/02-create-from-template.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/AppAgent/02-create-from-template.md) | Procedure: Create App from Template |
| [`Procedure/AppAgent/03-add-pages.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/AppAgent/03-add-pages.md) | Procedure: Add Pages to an Existing App |
| [`Procedure/AppAgent/04-add-widgets.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/AppAgent/04-add-widgets.md) | Procedure: Add and Configure Widgets |
| [`Procedure/AppAgent/05-style-and-theme.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/AppAgent/05-style-and-theme.md) | Procedure: Style and Theme an App |
| [`Procedure/AppAgent/06-validate-app.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/AppAgent/06-validate-app.md) | Procedure: Validate and Test App Before Publishing |
| [`Procedure/AppAgent/AppQuestionnaire.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/AppAgent/AppQuestionnaire.md) | App Creation Questionnaire |
| [`Procedure/AppAgent/README.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/AppAgent/README.md) | AppAgent Procedures — Step-by-Step Guides |

## Procedures: Credentials

| File | Title |
|---|---|
| [`Procedure/Credentials/create-credential.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/Credentials/create-credential.md) | Procedure: Create Credential |
| [`Procedure/Credentials/CredentialQuestionnaire.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/Credentials/CredentialQuestionnaire.md) | Credential Setup Questionnaire |
| [`Procedure/Credentials/rotate-credential.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/Credentials/rotate-credential.md) | Procedure: Rotate Credential |
| [`Procedure/Credentials/troubleshoot.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/Credentials/troubleshoot.md) | Procedure: Troubleshoot Credentials |
| [`Procedure/Credentials/validate-credential.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/Credentials/validate-credential.md) | Procedure: Validate Credential |

## Procedures: Form

| File | Title |
|---|---|
| [`Procedure/Form/create-entity-search-form@agent.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/Form/create-entity-search-form@agent.md) | Create Entity Search + Edit Form (Table → App Studio, end to end) |
| [`Procedure/Form/refreshFromCodeToDoc@agent.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/Form/refreshFromCodeToDoc@agent.md) | Refresh: Atlas Forms RAG Spec (v2) From Code |
| [`Procedure/Form/testControlViaMcp@agent.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/Form/testControlViaMcp@agent.md) | Runbook: Test an Atlas Forms Control Type via MCP + Form Studio |

## Procedures: Servers

| File | Title |
|---|---|
| [`Procedure/Servers/configure-server.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/Servers/configure-server.md) | Configure Server |
| [`Procedure/Servers/deploy-application.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/Servers/deploy-application.md) | Deploy Application |
| [`Procedure/Servers/monitor-server.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/Servers/monitor-server.md) | Monitor Server |
| [`Procedure/Servers/provision-server.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/Servers/provision-server.md) | Provision Server |
| [`Procedure/Servers/ServerQuestionnaire.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/Servers/ServerQuestionnaire.md) | Server Setup Questionnaire |
| [`Procedure/Servers/troubleshoot.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/Servers/troubleshoot.md) | Troubleshoot Server |

## Procedures: Workflow

| File | Title |
|---|---|
| [`Procedure/Workflow/add-new-node-type.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/Workflow/add-new-node-type.md) | Add a New Node Type to `workflow-nodes-rag` |
| [`Procedure/Workflow/build-and-verify-workflow-via-mcp.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/Workflow/build-and-verify-workflow-via-mcp.md) | Runbook — build and verify a real workflow via the Workflow MCP tools |
| [`Procedure/Workflow/node-forms/audit-all-datatemplates.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/Workflow/node-forms/audit-all-datatemplates.md) | Audit All Data Templates (all node types) |
| [`Procedure/Workflow/node-forms/debug-runbook.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/Workflow/node-forms/debug-runbook.md) | Debug Runbook - node shows no form / the wrong form |
| [`Procedure/Workflow/node-forms/fix-playbook.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/Workflow/node-forms/fix-playbook.md) | Fix Playbook - generate per-operation data templates for a node type |
| [`Procedure/Workflow/node-forms/node-forms-fixer.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/Workflow/node-forms/node-forms-fixer.md) | Agent — Node Forms Debugger / Fixer |

## Procedures: WorkflowAgent

| File | Title |
|---|---|
| [`Procedure/WorkflowAgent/01-create-basic-workflow.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/WorkflowAgent/01-create-basic-workflow.md) | Create a Basic Workflow |
| [`Procedure/WorkflowAgent/02-add-execution-nodes.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/WorkflowAgent/02-add-execution-nodes.md) | Add and Configure Execution Nodes |
| [`Procedure/WorkflowAgent/03-configure-transitions.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/WorkflowAgent/03-configure-transitions.md) | Configure Transitions (Routing & Branching) |
| [`Procedure/WorkflowAgent/04-integrate-external-system.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/WorkflowAgent/04-integrate-external-system.md) | Integrate External Systems |
| [`Procedure/WorkflowAgent/05-test-workflow.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/WorkflowAgent/05-test-workflow.md) | Test Workflow |
| [`Procedure/WorkflowAgent/06-deploy-workflow.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/WorkflowAgent/06-deploy-workflow.md) | Deploy Workflow to Production |
| [`Procedure/WorkflowAgent/README.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/WorkflowAgent/README.md) | WorkflowAgent Procedures |
| [`Procedure/WorkflowAgent/WorkflowQuestionnaire.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Procedure/WorkflowAgent/WorkflowQuestionnaire.md) | Workflow Creation Questionnaire |

## Knowledge: APIKeys

| File | Title |
|---|---|
| [`Knowledge/APIKeys/00-overview.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/APIKeys/00-overview.md) | API Keys — Overview |
| [`Knowledge/APIKeys/01-apikey-types.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/APIKeys/01-apikey-types.md) | API Key Types |
| [`Knowledge/APIKeys/02-passport-admin-dashboard.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/APIKeys/02-passport-admin-dashboard.md) | Passport Admin Dashboard — API Keys Interface |
| [`Knowledge/APIKeys/03-api-key-lifecycle.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/APIKeys/03-api-key-lifecycle.md) | API Key Lifecycle |
| [`Knowledge/APIKeys/04-integration-guide.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/APIKeys/04-integration-guide.md) | Integration Guide — Using API Keys in Sessions |
| [`Knowledge/APIKeys/passport-dashboard-walkthrough.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/APIKeys/passport-dashboard-walkthrough.md) | Passport Dashboard Walkthrough — Step-by-Step |
| [`Knowledge/APIKeys/README.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/APIKeys/README.md) | APIKeys Knowledge Base |

## Knowledge: AppAgent

| File | Title |
|---|---|
| [`Knowledge/AppAgent/00-overview.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/AppAgent/00-overview.md) | AppAgent — Overview & Role |
| [`Knowledge/AppAgent/01-app-model.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/AppAgent/01-app-model.md) | App Studio — Core Data Model & API |
| [`Knowledge/AppAgent/02-widget-types.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/AppAgent/02-widget-types.md) | Widget Types Reference Index |
| [`Knowledge/AppAgent/03-app-creation-flow.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/AppAgent/03-app-creation-flow.md) | App Creation Flow — Project Unification & Template Wizard |
| [`Knowledge/AppAgent/04-design-patterns.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/AppAgent/04-design-patterns.md) | App Studio — Design Patterns, Theming & Style System |
| [`Knowledge/AppAgent/05-integration-guide.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/AppAgent/05-integration-guide.md) | AppAgent — MCP Integration Guide |
| [`Knowledge/AppAgent/06-mcp-server-reference.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/AppAgent/06-mcp-server-reference.md) | AppStudio MCP Server Reference |
| [`Knowledge/AppAgent/README.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/AppAgent/README.md) | AppAgent Knowledge Base |

## Knowledge: Credentials

| File | Title |
|---|---|
| [`Knowledge/Credentials/00-overview.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Credentials/00-overview.md) | Credentials Knowledge — Overview |
| [`Knowledge/Credentials/01-credential-types.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Credentials/01-credential-types.md) | Credential Types |
| [`Knowledge/Credentials/02-security-architecture.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Credentials/02-security-architecture.md) | Security Architecture |
| [`Knowledge/Credentials/03-api-reference.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Credentials/03-api-reference.md) | Credentials API Reference |
| [`Knowledge/Credentials/04-integration-guide.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Credentials/04-integration-guide.md) | Agent Integration Guide |
| [`Knowledge/Credentials/README.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Credentials/README.md) | Credentials Knowledge Index |

## Knowledge: Form

| File | Title |
|---|---|
| [`Knowledge/Form/atlas-forms-rag/agent/octopus-agent-guidelines.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/agent/octopus-agent-guidelines.md) | Octopus Agent Guidelines — Atlas Forms |
| [`Knowledge/Form/atlas-forms-rag/agent/ragUploadDesign.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/agent/ragUploadDesign.md) | RAG Upload Design — Getting the Atlas Forms v2 Spec Into the Real Knowledge Base |
| [`Knowledge/Form/atlas-forms-rag/v2/00-overview.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/00-overview.md) | Atlas Forms — Schema Overview |
| [`Knowledge/Form/atlas-forms-rag/v2/01-common-properties.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/01-common-properties.md) | FormControl — Common Properties |
| [`Knowledge/Form/atlas-forms-rag/v2/advanced-capabilities.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/advanced-capabilities.md) | Advanced Capabilities |
| [`Knowledge/Form/atlas-forms-rag/v2/conditional-logic.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/conditional-logic.md) | Conditional Logic (Visibility) |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/actor-list.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/actor-list.md) | `actor-list` |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/article.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/article.md) | `article` |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/audio.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/audio.md) | audio.md |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/barcode-generator.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/barcode-generator.md) | `barcode-generator` |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/button.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/button.md) | `button` |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/captcha-widget.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/captcha-widget.md) | `captcha-widget` |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/cascading-select.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/cascading-select.md) | `cascading-select` |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/charts.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/charts.md) | Chart controls (13 types, display-only) |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/checkbox.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/checkbox.md) | `checkbox` |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/code-editor.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/code-editor.md) | `code-editor` |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/color-picker.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/color-picker.md) | `color-picker` |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/css.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/css.md) | css.md |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/custom.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/custom.md) | custom.md |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/data-table.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/data-table.md) | `data-table` / `table` |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/date.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/date.md) | date.md |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/date-range-picker.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/date-range-picker.md) | date-range-picker.md |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/datetime.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/datetime.md) | datetime.md |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/dev-tool-viewers.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/dev-tool-viewers.md) | Developer/debug viewers (display-only, minimal config) |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/display-grid.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/display-grid.md) | display-grid.md |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/editable-grid.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/editable-grid.md) | editable-grid.md |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/email.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/email.md) | email.md |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/enhanced-json-editor.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/enhanced-json-editor.md) | `enhanced-json-editor` |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/expression.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/expression.md) | `expression` |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/file-and-code-blocks.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/file-and-code-blocks.md) | File selectors & code blocks |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/file-upload.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/file-upload.md) | `file-upload` |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/form-container.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/form-container.md) | `form-container` |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/form-picker.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/form-picker.md) | `form-picker` |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/form-scope-plugins.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/form-scope-plugins.md) | Form-scope plugins (`scope: "form"`, non-visual) |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/gauges-and-kpi.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/gauges-and-kpi.md) | Gauge & KPI controls (single-value indicators) |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/grid.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/grid.md) | grid.md |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/header.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/header.md) | `header` |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/html.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/html.md) | `html` |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/iframe-viewer.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/iframe-viewer.md) | `iframe-viewer` |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/image.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/image.md) | `image` |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/json-editor.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/json-editor.md) | `json-editor` |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/key-value-pairs.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/key-value-pairs.md) | `key-value-pairs` |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/label.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/label.md) | `label` |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/layout-containers.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/layout-containers.md) | Layout containers |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/link.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/link.md) | `link` |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/location-picker.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/location-picker.md) | `location-picker` |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/media-placeholders.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/media-placeholders.md) | Media placeholders (display-only) |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/mermaid.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/mermaid.md) | `mermaid` |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/multiselect.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/multiselect.md) | `multiselect` |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/multi-select-search.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/multi-select-search.md) | `multi-select-search` |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/navigation-and-timeline.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/navigation-and-timeline.md) | Navigation & timeline (display-only) |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/number.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/number.md) | `number` |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/org-chart.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/org-chart.md) | `org-chart` |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/password.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/password.md) | `password` |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/password-strength-meter.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/password-strength-meter.md) | `password-strength-meter` |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/pdf-viewer.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/pdf-viewer.md) | `pdf-viewer` |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/qr-code-generator.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/qr-code-generator.md) | `qr-code-generator` |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/radio.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/radio.md) | `radio` |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/rich-text-editor.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/rich-text-editor.md) | `rich-text-editor` |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/select.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/select.md) | `select` |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/signature-pad.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/signature-pad.md) | `signature-pad` |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/slider-range.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/slider-range.md) | `slider-range` |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/switch.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/switch.md) | switch.md |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/table.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/table.md) | table.md |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/tag-input.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/tag-input.md) | `tag-input` |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/tel.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/tel.md) | tel.md |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/text.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/text.md) | text.md |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/textarea.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/textarea.md) | `textarea` |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/time-picker.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/time-picker.md) | time-picker.md |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/toggle.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/toggle.md) | toggle.md |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/tree-select.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/tree-select.md) | `tree-select` |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/tree-view.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/tree-view.md) | `tree-view` |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/url.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/url.md) | url.md |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/user-picker.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/user-picker.md) | `user-picker` |
| [`Knowledge/Form/atlas-forms-rag/v2/controls/video.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/controls/video.md) | video.md |
| [`Knowledge/Form/atlas-forms-rag/v2/validation-rules.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/validation-rules.md) | Validation Rules |
| [`Knowledge/Form/atlas-forms-rag/v2/worked-examples/01-simple-contact-form.json`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/worked-examples/01-simple-contact-form.json) | 01-simple-contact-form.json |
| [`Knowledge/Form/atlas-forms-rag/v2/worked-examples/02-expense-report-with-grid-and-conditional-logic.json`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/worked-examples/02-expense-report-with-grid-and-conditional-logic.json) | 02-expense-report-with-grid-and-conditional-logic.json |
| [`Knowledge/Form/atlas-forms-rag/v2/worked-examples/03-job-application-registration.json`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/atlas-forms-rag/v2/worked-examples/03-job-application-registration.json) | 03-job-application-registration.json |
| [`Knowledge/Form/design/architecture.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/design/architecture.md) | Atlas Forms Automation — End-to-End Architecture |
| [`Knowledge/Form/design/atlas-forms-architecture-overview.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/design/atlas-forms-architecture-overview.md) | atlas-forms-architecture-overview.md |
| [`Knowledge/Form/design/atlas-forms-form-actions-player-bug-fix-design.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/design/atlas-forms-form-actions-player-bug-fix-design.md) | Atlas Forms — Form Actions Player Bug: Fix Design |
| [`Knowledge/Form/design/atlas-forms-formuri-fetch-design.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/design/atlas-forms-formuri-fetch-design.md) | Atlas Forms — External `formUri` Fetch: Design (Research/Design Only) |
| [`Knowledge/Form/design/design-and-plan.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/design/design-and-plan.md) | Atlas Forms Automation Agent — Design & Plan |
| [`Knowledge/Form/design/STATUS.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/design/STATUS.md) | Atlas Forms Automation — Status |
| [`Knowledge/Form/lessons/README.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/lessons/README.md) | Lessons — Atlas Forms Automation Project |
| [`Knowledge/Form/mcp-servers/atlas-forms-design.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/mcp-servers/atlas-forms-design.md) | Atlas Forms MCP Module — Design (First Pilot) |
| [`Knowledge/Form/mcp-servers/forms-studio/overview.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/mcp-servers/forms-studio/overview.md) | Forms Studio — AI Agent Design Index (items 1-5) |
| [`Knowledge/Form/reference/ATLAS_FORMS_RAG_AUTOMATION.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/reference/ATLAS_FORMS_RAG_AUTOMATION.md) | Atlas Forms RAG Automation — Architecture & Status |
| [`Knowledge/Form/reference/atlas-forms-search/atlas-forms-documents-edit-form.schema.json`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/reference/atlas-forms-search/atlas-forms-documents-edit-form.schema.json) | atlas-forms-documents-edit-form.schema.json |
| [`Knowledge/Form/reference/atlas-forms-search/atlas-forms-documents-search-form.schema.json`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/reference/atlas-forms-search/atlas-forms-documents-search-form.schema.json) | atlas-forms-documents-search-form.schema.json |
| [`Knowledge/Form/reference/atlas-forms-search/atlas-forms-search-results-edit-form-schema.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/reference/atlas-forms-search/atlas-forms-search-results-edit-form-schema.md) | Atlas Forms — Search / Results / Edit Form: Design & Schema for Review |
| [`Knowledge/Form/reference/atlas-forms-search/HowToBuildASearchGuide.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/reference/atlas-forms-search/HowToBuildASearchGuide.md) | How to Build a Search Form in Atlas Forms |
| [`Knowledge/Form/reference/atlas-forms-search/SESSION_HANDOFF_2026-09-02.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Form/reference/atlas-forms-search/SESSION_HANDOFF_2026-09-02.md) | Session Handoff — Documents Search Form, 2026-09-02 night |

## Knowledge: Notes

| File | Title |
|---|---|
| [`Knowledge/Notes/00-overview.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Notes/00-overview.md) | Rouge: Agent Memory System |
| [`Knowledge/Notes/01-memory-types.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Notes/01-memory-types.md) | Memory Types: Semantic, Episodic, Procedural |
| [`Knowledge/Notes/02-api-reference.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Notes/02-api-reference.md) | Rouge API Reference |
| [`Knowledge/Notes/03-agent-integration.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Notes/03-agent-integration.md) | Agent Integration: How to Use Rouge |
| [`Knowledge/Notes/04-implementation.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Notes/04-implementation.md) | Implementation: RougeNote Entity & Database |
| [`Knowledge/Notes/README.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Notes/README.md) | Rouge Agent Memory System — Knowledge Base |

## Knowledge: Servers

| File | Title |
|---|---|
| [`Knowledge/Servers/00-overview.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Servers/00-overview.md) | Servers — Overview |
| [`Knowledge/Servers/01-server-types.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Servers/01-server-types.md) | Server Types |
| [`Knowledge/Servers/02-infrastructure-architecture.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Servers/02-infrastructure-architecture.md) | Infrastructure Architecture |
| [`Knowledge/Servers/03-configuration-schema.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Servers/03-configuration-schema.md) | Configuration Schema |
| [`Knowledge/Servers/04-deployment-model.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Servers/04-deployment-model.md) | Deployment Model |
| [`Knowledge/Servers/05-api-reference.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Servers/05-api-reference.md) | API Reference |
| [`Knowledge/Servers/06-integration-guide.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Servers/06-integration-guide.md) | Integration Guide |
| [`Knowledge/Servers/README.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/Servers/README.md) | Servers — Knowledge Base |

## Knowledge: shared

| File | Title |
|---|---|
| [`Knowledge/shared/engineers-overview.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/shared/engineers-overview.md) | Agentic Development Engineers |

## Knowledge: WorkflowAgent

| File | Title |
|---|---|
| [`Knowledge/WorkflowAgent/00-overview.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/WorkflowAgent/00-overview.md) | WorkflowAgent — Overview |
| [`Knowledge/WorkflowAgent/01-workflow-architecture.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/WorkflowAgent/01-workflow-architecture.md) | Workflow Architecture |
| [`Knowledge/WorkflowAgent/02-node-types.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/WorkflowAgent/02-node-types.md) | Workflow Node Types Reference |
| [`Knowledge/WorkflowAgent/03-execution-flow.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/WorkflowAgent/03-execution-flow.md) | Workflow Execution Flow & Error Handling |
| [`Knowledge/WorkflowAgent/04-integration-patterns.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/WorkflowAgent/04-integration-patterns.md) | Integration Patterns & External Systems |
| [`Knowledge/WorkflowAgent/05-testing-guide.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/WorkflowAgent/05-testing-guide.md) | Workflow Testing Guide |
| [`Knowledge/WorkflowAgent/06-mcp-server-reference.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/WorkflowAgent/06-mcp-server-reference.md) | Workflow MCP Server Reference |
| [`Knowledge/WorkflowAgent/README.md`](https://raw.githubusercontent.com/BizFirstAi/SoftwareEngineerAiAgents/main/Claudia/Knowledge/WorkflowAgent/README.md) | WorkflowAgent Knowledge Base |
