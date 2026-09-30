# Claudia AI Agent Repository — Complete Index

Welcome to Claudia, a comprehensive AI agent system for building BizFirst applications. This index lists all files and guides navigation for humans, AI tools, and crawlers.

## Key Rules

### Hard rule: MCP-only building with guided API key setup

Every agent MUST run its Preflight check before starting. If the required MCP tools/services are missing, the agent NEVER falls back to standalone pages, artifacts, or browser-UI builds. Instead:

1. **The agent stops and offers MCP connection options** — Never produce a substitute deliverable without explicit user approval
2. **If MCP tools unavailable:** Agent offers 3 API key setup choices:
   - **A)** User provides existing API key
   - **B)** Claude guides user to create key in Passport Admin Dashboard
   - **C)** Claude auto-creates key using APIKeyAgent (Recommended)
3. **Only after the user chooses and confirms** does the agent proceed with building in Studio
4. **Approval carries no fallback carryover** — Approval for one connection attempt does not carry to later tasks

Approval is per-task, per-session. MCP connection is the only legitimate path forward.

---

## Quick Start

- **New to Claudia?** Start with [Claudia/AGENTS.md](Claudia/AGENTS.md)
- **Want to build?** Browse the **Agents/** section below
- **Need reference?** Check **Knowledge/** 
- **Step-by-step?** See **Procedure/**
- **Full content?** Read [claudia-all.md](claudia-all.md) (2.1 MB combined file)

## Repository Structure

```
Claudia/
├── Agents/          (10+ agent specifications)
├── Knowledge/       (50+ reference documents)
├── Procedure/       (40+ step-by-step guides)
└── Strategic docs   (reviews, recommendations, plans)
```

---

## Agents (10+ Specifications)

Build web apps, forms, workflows, credentials, servers, and manage API keys and memory.

### Builders
- [Agents/Builders/AppAgent/AGENT.md](Claudia/Agents/Builders/AppAgent/AGENT.md) - Build web apps, sites, pages, widgets
- [Agents/Builders/WorkflowAgent/AGENT.md](Claudia/Agents/Builders/WorkflowAgent/AGENT.md) - Create automation workflows
- [Agents/Builders/FormAgent/AGENT.md](Claudia/Agents/Builders/FormAgent/AGENT.md) - Build forms and search+edit interfaces
- [Agents/Builders/APIKeyAgent/AGENT.md](Claudia/Agents/Builders/APIKeyAgent/AGENT.md) - Generate and manage API keys
- [Agents/Builders/CredentialAgent/README.md](Claudia/Agents/Builders/CredentialAgent/) - Manage credentials securely
- [Agents/Builders/ServerAgent/README.md](Claudia/Agents/Builders/ServerAgent/) - Provision and manage servers

### Testers
- [Agents/Testers/AppTester/AGENT.md](Claudia/Agents/Testers/AppTester/AGENT.md) - Test app studio features
- [Agents/Testers/FormTester/AGENT.md](Claudia/Agents/Testers/FormTester/AGENT.md) - Test form controls
- [Agents/Testers/WorkflowTester/AGENT.md](Claudia/Agents/Testers/WorkflowTester/AGENT.md) - Test workflow nodes

---

## Knowledge Domains (50+ Reference Documents)

Complete reference material for all topics.

### API Keys & Sessions
- [Knowledge/APIKeys/00-overview.md](Claudia/Knowledge/APIKeys/00-overview.md) - What API keys are, security model
- [Knowledge/APIKeys/01-apikey-types.md](Claudia/Knowledge/APIKeys/01-apikey-types.md) - Session, Integration, Service, Personal keys
- [Knowledge/APIKeys/02-passport-admin-dashboard.md](Claudia/Knowledge/APIKeys/02-passport-admin-dashboard.md) - Dashboard UI and workflows
- [Knowledge/APIKeys/03-api-key-lifecycle.md](Claudia/Knowledge/APIKeys/03-api-key-lifecycle.md) - Full lifecycle documentation
- [Knowledge/APIKeys/04-integration-guide.md](Claudia/Knowledge/APIKeys/04-integration-guide.md) - Integration patterns with code
- [Knowledge/APIKeys/passport-dashboard-walkthrough.md](Claudia/Knowledge/APIKeys/passport-dashboard-walkthrough.md) - Step-by-step visual guide

### App Studio
- [Knowledge/AppAgent/00-overview.md](Claudia/Knowledge/AppAgent/00-overview.md) - App Studio overview
- [Knowledge/AppAgent/01-app-model.md](Claudia/Knowledge/AppAgent/01-app-model.md) - App data model and hierarchy
- [Knowledge/AppAgent/02-widget-types.md](Claudia/Knowledge/AppAgent/02-widget-types.md) - All 17+ widget types documentation

### Credentials Management
- [Knowledge/Credentials/](Claudia/Knowledge/Credentials/) - Credential types, security, API reference

### Agent Memory System (Rouge)
- [Knowledge/Notes/00-overview.md](Claudia/Knowledge/Notes/00-overview.md) - Rouge memory system
- [Knowledge/Notes/01-memory-types.md](Claudia/Knowledge/Notes/01-memory-types.md) - Semantic, Episodic, Procedural types

### Servers & Infrastructure
- [Knowledge/Servers/](Claudia/Knowledge/Servers/) - Server types, architecture, deployment, API

### Workflow Studio
- [Knowledge/WorkflowAgent/](Claudia/Knowledge/WorkflowAgent/) - Workflow architecture, nodes, execution, testing

### Form Studio
- [Knowledge/Form/](Claudia/Knowledge/Form/) - Form controls, validation, integration patterns

---

## Procedures (40+ Step-by-Step Guides)

Complete walkthroughs for building and managing.

### App Development
- [Procedure/AppAgent/](Claudia/Procedure/AppAgent/) - Create apps, add pages, widgets, styling
  - 01-create-empty-app.md
  - 02-create-from-template.md
  - 03-add-pages.md
  - 04-add-widgets.md
  - 05-style-and-theme.md
  - 06-validate-app.md

### Form Development
- [Procedure/Form/](Claudia/Procedure/Form/) - Create forms, configure controls, validate, test
  - create-entity-search-form@agent.md
  - refreshFromCodeToDoc@agent.md
  - testControlViaMcp@agent.md

### Workflow Development
- [Procedure/WorkflowAgent/](Claudia/Procedure/WorkflowAgent/) - Create workflows, add nodes, integrate, test, deploy
  - 01-create-basic-workflow.md
  - 02-add-execution-nodes.md
  - 03-configure-transitions.md
  - 04-integrate-external-system.md
  - 05-test-workflow.md
  - 06-deploy-workflow.md

### API Key Management
- [Procedure/APIKeyAgent/](Claudia/Procedure/APIKeyAgent/) - Setup, validate, retrieve, revoke keys
  - APIKeyQuestionnaire.md
  - check-existing-apikey.md
  - create-apikey-guided.md
  - retrieve-apikey.md
  - use-apikey-in-session.md

### Credentials Management
- [Procedure/Credentials/](Claudia/Procedure/Credentials/) - Create, validate, rotate, troubleshoot
  - CredentialQuestionnaire.md
  - create-credential.md
  - validate-credential.md
  - rotate-credential.md
  - troubleshoot.md

### Server Management
- [Procedure/Servers/](Claudia/Procedure/Servers/) - Provision, configure, deploy, monitor
  - provision-server.md
  - configure-server.md
  - deploy-application.md
  - monitor-server.md
  - troubleshoot.md

### General & Reference
- [Procedure/General/InitialGuidelines.md](Claudia/Procedure/General/InitialGuidelines.md) - Agent onboarding manual
- [Procedure/General/MultiAgentOrchestration.md](Claudia/Procedure/General/MultiAgentOrchestration.md) - Complex multi-agent scenarios
- [Procedure/General/GuidedExperienceExamples.md](Claudia/Procedure/General/GuidedExperienceExamples.md) - Real-world examples

---

## Strategic Documents

Plans, analysis, and recommendations.

- [Claudia/AGENTS.md](Claudia/AGENTS.md) - Agent index and quick specs
- [Claudia/COMPREHENSIVE_REVIEW_REPORT.md](Claudia/COMPREHENSIVE_REVIEW_REPORT.md) - Full repo analysis and assessment
- [Claudia/Recommendations_ForPublicUX.md](Claudia/Recommendations_ForPublicUX.md) - Public UX optimization guide
- [Claudia/Implementation_Plan.md](Claudia/Implementation_Plan.md) - 4-phase execution roadmap

---

## For AI Tools & Crawlers

### Access Methods

1. **Complete Reference** → Fetch [claudia-all.md](claudia-all.md) (2.1 MB, ~300+ pages)
2. **This Index** → [index.md](index.md) (you are here)
3. **Sitemap** → [sitemap.txt](sitemap.txt) (crawler navigation)
4. **Specific Files** → Use links above to fetch individual .md files as needed

### Navigation Guidance

- All content is plain markdown (.md files)
- No JavaScript or special rendering needed
- All files served as text/markdown or text/plain
- Follow links or construct paths: `Claudia/[Agents|Knowledge|Procedure]/...`
- Use [robots.txt](robots.txt) (allows all crawlers)

### How to Use This Repository

1. Read this index to locate files
2. Click links to fetch individual files as needed
3. OR fetch [claudia-all.md](claudia-all.md) for complete reference
4. All files self-contained, no external dependencies
5. Cache locally for offline use

---

## Hosting & Deployment

This repository is optimized for public hosting. To serve online:

- See [SITE_SETUP.md](SITE_SETUP.md) for hosting options (GitHub Pages, Cloudflare, Vercel, self-hosted)
- Files are plain markdown — no special server needed
- Use [robots.txt](robots.txt) to allow crawlers
- Use [sitemap.txt](sitemap.txt) for crawler discovery

Once hosted, AI tools can read this index and fetch files without GitHub API rate limits.

---

## Repository Info

- **GitHub:** https://github.com/BizFirstAi/SoftwareEngineerAiAgents
- **License:** MIT
- **Format:** Markdown (.md) files + plain text
- **Total Content:** 379 files, ~100+ pages
- **Last Updated:** 2026-09-29

---

## Quick Links

- [README.md](README.md) - Repository overview
- [LICENSE](LICENSE) - MIT License
- [robots.txt](robots.txt) - Crawler rules
- [sitemap.txt](sitemap.txt) - Sitemap for discovery
- [claudia-all.md](claudia-all.md) - Combined reference file
- [SITE_SETUP.md](SITE_SETUP.md) - Hosting setup guide
