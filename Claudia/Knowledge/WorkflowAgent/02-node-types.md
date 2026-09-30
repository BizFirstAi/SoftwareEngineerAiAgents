# Workflow Node Types Reference

**18 documented node types** (of 107 total). Load specific node docs on demand for configuration details.

## Quick Index by Category

| Category | Node Type | Purpose |
|----------|-----------|---------|
| **Triggers** | `manual-trigger` | API/UI invocation |
| | `webhook-trigger` | HTTP POST endpoint |
| | `schedule-trigger` | Cron schedule |
| **Control Flow** | `if-condition` | Binary branch (true/false) |
| | `switch` | Multi-way branch |
| | `loop` | Iterate over collection |
| | `delay` | Pause/wait |
| | `parallel-fork` | Start concurrent branches |
| | `parallel-join` | Sync concurrent branches |
| | `sub-workflow` | Invoke another workflow |
| **AI & Agents** | `ai-agent` | Call Octopus agent (one-shot or chat) |
| | `ai-function` | Call specific tool/function |
| | `flow-ai-agent` | Self-contained LLM agent |
| **Integrations** | `http-request` | REST/HTTP API |
| | `email-smtp` | SMTP email |
| | `email-gmail` | Gmail OAuth2 |
| | `slack` | Slack bot |
| | `odoo` | Odoo ERP |
| **Data** | `code-execute` | Sandboxed script |

## Detailed Node Descriptions

### Triggers

**manual-trigger**
- Starts workflow via API/UI button click
- Passes input data through unchanged
- Used for on-demand workflows
- No credentials needed

**webhook-trigger**
- Starts workflow when external HTTP POST hits the webhook URL
- Auto-generates unique webhook endpoint per workflow
- Payload becomes workflow input data
- No credentials needed

**schedule-trigger**
- Starts workflow on cron schedule
- Validates cron syntax (standard 5-field format)
- Fires at scheduled times (requires external scheduler adapter)
- No credentials needed

### Control Flow

**if-condition**
- Two-way branch: true port / false port
- Evaluates expression against current data
- Routes execution based on result
- No credentials needed

**switch**
- Multi-way branch with dynamic ports per case
- Each case evaluates a condition
- Routes to matching case or default
- No credentials needed

**loop**
- Iterates over collection (array/list)
- Executes node sequence per item
- Produces aggregated output after all iterations
- Alternative to inline iteration in code-execute
- No credentials needed

**delay**
- Pauses execution for specified duration or until timestamp
- Common use: throttling, scheduling staggered operations
- No credentials needed

**parallel-fork / parallel-join**
- **Fork:** Fans single execution into N concurrent branches
- **Join:** Waits for all branches, syncs before proceeding
- Enables concurrent API calls, batch operations
- No credentials needed

**sub-workflow**
- Synchronously invokes another workflow by ID/version
- Inherits parent workflow variables automatically
- Returns sub-workflow's output as node output
- No credentials needed

### AI & Agents

**ai-agent**
- Calls existing Octopus Agent (e.g., AppDeveloper, FormDeveloper)
- Modes: one-shot `send` or multi-turn `chat` (HIL)
- Agent uses its own LLM credential
- No additional credentials needed

**ai-function**
- Calls single named tool/function on a tool server
- Direct function invocation (no agent conversation)
- Credentials depend on tool server
- Faster than ai-agent for simple operations

**flow-ai-agent**
- Self-contained LLM agent node (no Octopus AgentID required)
- 6 strategies: tools/reAct/conversational/planExecute/sql/stream
- Can access external tools, databases, APIs
- Requires LLM credential (OpenAI, Anthropic, etc.)
- Ideal for complex logic within workflow

### Integrations

**http-request**
- Makes outbound HTTP call (GET, POST, PUT, DELETE, PATCH, etc.)
- Optional bearer token or credential-based auth
- Handles JSON, form data, XML payloads
- Returns response body/headers/status as output

**email-smtp**
- Sends email via configured SMTP server
- Requires SMTP credential (server, port, username, password)
- Supports plain text and HTML body
- Attachments supported

**email-gmail**
- Multi-resource Gmail integration via OAuth2
- Operations: send message, create draft, add label, read thread, etc.
- Requires Gmail credential (OAuth2 token)
- Handles attachments and complex threads

**slack**
- Multi-resource Slack integration via bot token
- Operations: post message, create channel, add reaction, etc.
- Requires Slack bot credential (OAuth token)
- Supports formatted messages, threads, files

**odoo** (documented in integration-patterns.md)
- ERP system integration
- Operations: create/read/update records
- Requires Odoo credential (URL, database, username, password)

### Data Operations

**code-execute**
- Runs user-authored JavaScript in sandboxed environment
- Access to current InputData, workflow variables
- Can transform, filter, map data
- Returns code result as node output
- No credentials needed

## Node Type Matrix

| Node | Sync/Async | Creds Required | Cancellable | Supports Retry |
|------|-----------|-----------------|-------------|-----------------|
| manual-trigger | Sync | No | - | - |
| webhook-trigger | Sync | No | - | - |
| schedule-trigger | Sync | No | - | - |
| if-condition | Sync | No | Yes | Yes |
| switch | Sync | No | Yes | Yes |
| loop | Async | No | Yes | Yes |
| delay | Async | No | Yes | No |
| parallel-fork | Sync | No | Yes | Yes |
| parallel-join | Sync | No | Yes | Yes |
| sub-workflow | Async | No | Yes | Yes |
| code-execute | Sync | No | Yes | Yes |
| ai-agent | Async | No (agent's own) | Yes | Yes |
| ai-function | Async | Yes | Yes | Yes |
| flow-ai-agent | Async | Yes (LLM) | Yes | Yes |
| http-request | Async | Optional | Yes | Yes |
| email-smtp | Async | Yes | Yes | Yes |
| email-gmail | Async | Yes | Yes | Yes |
| slack | Async | Yes | Yes | Yes |

## Not Yet Documented (89 remaining)

**Tier A Priority:** validation, variable-assignment, data-mapping, json-transform, collection-operation, try/catch/finally, break, continue, stop-workflow, form-trigger, approval, event-wait

**Tier B Priority:** Google Workspace, databases (SQL Server, MySQL, Elasticsearch), productivity (Sheets, Jira, Notion)

**Tier C Priority:** Blockchain, cloud services, specialized integrations

Use `get_node_type_schema` as fallback for undocumented types, treating schema as unverified.

## Configuration Data Templates

Each node operation has a data template (JSON schema) defining:
- **Input schema** — What data the node expects
- **Output schema** — What data the node produces
- **Field validation** — Required/optional, types, constraints
- **Example JSON** — Real sample input/output

Request specific node docs to see complete templates and examples.

## See Also

- [Workflow Architecture](01-workflow-architecture.md) — Data flow, variables, execution model
- [Execution Flow & Error Handling](03-execution-flow.md) — How nodes execute, error recovery
- [Integration Patterns](04-integration-patterns.md) — External system connectors
- [Testing Guide](05-testing-guide.md) — Validate workflow execution
