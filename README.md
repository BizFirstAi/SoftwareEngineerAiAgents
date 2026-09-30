# SoftwareEngineerAiAgents

**All AI agent systems and documentation are in the [`Claudia/`](Claudia/) folder.**

These are software engineer AI Agents that build real BizFirst AI objects (App Studio apps, Atlas Forms forms and Flow Studio workflows) for users through the BizFirst MCP servers.

**To use an agent, start at [`Claudia/AGENTS.md`](Claudia/AGENTS.md).** It lists every agent and says which one fits which studio.

## Quick Start

- **Agents** → [`Claudia/Agents/`](Claudia/Agents/)
- **Knowledge** → [`Claudia/Knowledge/`](Claudia/Knowledge/)  
- **Procedures** → [`Claudia/Procedure/`](Claudia/Procedure/)
- **Strategy & Planning** → [`Claudia/COMPREHENSIVE_REVIEW_REPORT.md`](Claudia/COMPREHENSIVE_REVIEW_REPORT.md)

## Documentation Structure

See [`Claudia/`](Claudia/) for:
- Agent specifications and interaction flows
- Comprehensive knowledge bases for all domains
- Step-by-step procedures and questionnaires
- Public UX optimization recommendations
- Implementation plans and best practices

## Rules for adding to this repo

1. **An agent is an index, not a copy.** An `AGENT.md` holds the role, when to pick it, its MCP
   server, and links to Knowledge and Procedure files. Put facts in `Knowledge/` and steps in
   `Procedure/`, then link them.
2. **Knowledge is grounded in the real code.** Each knowledge set says which source files are its
   ground truth. Recheck against the code, not against an older doc.
3. **Keep knowledge in two tiers.** A short `00-overview.md` that is always loaded, and detail
   files loaded only when a request needs them.
4. **Never commit a secret.** No passwords, API keys, tokens or connection strings in any file.
   Ask the user for them at run time.
5. **New agent:** add a folder under `Agents/`, write its `AGENT.md`, and add a row to
   [`AGENTS.md`](AGENTS.md).

## History

This content was copied on 2026-09-25 from
`Documentation\Employees\agentic-development-engineers` (see
[`Knowledge/shared/engineers-overview.md`](Knowledge/shared/engineers-overview.md) for that
folder's original README). The Documentation copy was left in place.
