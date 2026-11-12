# Claude Implementation Task – Node Certification Agent

## Objective

Implement an automated Node Certification Agent for Flow Studio.

The agent must automatically discover all nodes belonging to a user-provided node type, collect required configurations, create individual test workflows, execute them, validate their functionality, inspect execution logs, capture screenshots, and generate a certification report.

The target is to complete a certification run within 20 minutes.

**The agent must test actual node functionality, not merely check whether workflows execute successfully.**

---

## PART 1 – Repository and Architecture Investigation (MANDATORY)

Before implementing anything, inspect the actual source code and understand the existing architecture.

Do not start by creating new APIs, services, database tables, or UI components.

### 1. Inspect the project

Identify:

- Flow Studio frontend repository and application structure.
- Flow Studio backend APIs.
- Existing Node Certification APIs and their current implementation.
- Existing workflow creation and update APIs.
- Existing node registry and node metadata.
- Database connection and node-related tables.
- Manual Trigger node implementation.
- Node configuration schemas.
- Workflow execution APIs.
- Execution status and node-level execution records.
- Observe panel and execution log retrieval mechanisms.
- Screenshot/browser automation capabilities.
- Existing Octopus agent architecture and MCP integrations.
- Existing authentication and credential management.

### 2. Read Resource.md

Locate and read the project's Resource.md.

Use the instructions, paths, database connection details, and API information documented there.

Do not assume that database tables, API endpoints, request properties, or response structures exist.

### 3. Inspect existing implementation

Before writing code:

1. Identify which capabilities already exist.
2. Identify which capabilities need implementation.
3. Identify reusable APIs and services.
4. Identify missing integrations.
5. Identify limitations that could affect the 20-minute requirement.

Produce a short architecture assessment before implementation.

### Important restrictions

- Do not create a standalone application.
- Do not create duplicate Flow Studio APIs.
- Do not rewrite existing workflow execution functionality.
- Do not duplicate Observe panel functionality.
- Do not introduce mock node data.
- Do not use hardcoded node inventories.
- Do not invent API endpoints.
- Do not replace existing authentication or credential mechanisms.
- Reuse existing Node Certification APIs where applicable.
- Preserve existing Flow Studio UI and workflows.
- Do not redesign unrelated features.

Implement only the missing functionality required for this task.

---

## PART 2 – Agent Architecture

Implement the Node Certification Agent using the existing Octopus/agent infrastructure where appropriate.

Separate the responsibilities into the following logical components:

1. Certification Orchestrator
2. Resource Reader
3. Node Discovery Agent
4. Configuration Manager
5. Workflow Generator
6. Execution Manager
7. Node Validation Engine
8. Execution Log Collector
9. Screenshot Collector
10. Certification Report Generator

These are logical responsibilities, not mandatory new projects or agents.

Use the existing architecture and introduce separate agents only where they provide actual value.

### Certification Orchestrator

The Orchestrator controls the complete certification lifecycle.

Responsibilities:

- Accept node type from the user.
- Initialize the certification run.
- Read Resource.md.
- Discover nodes.
- Coordinate configuration collection.
- Generate test workflows.
- Execute workflows.
- Validate results.
- Collect evidence.
- Generate the report.
- Enforce the 20-minute active execution deadline.
- Maintain certification state.

The orchestrator must preserve the run context across configuration requests and interruptions.

---

## PART 3 – Input and Initialization

The user provides a node type.

Example:

{
  "nodeType": "Communication"
}

The agent must:

1. Validate the input.
2. Read Resource.md.
3. Initialize the certification run ID.
4. Create missing directories.
5. Start the certification timer.
6. Initialize node execution tracking.

Generate a unique run ID.

Example:

NC-COMM-20261107-001

Create the following directory structure if missing:

NodeCertification/
    Resource.md
    nodetype-test/
        nodetype-list/
    nodetype-config/
    nodetype-status/
    nodetype-screenshot/

Do not delete existing files or overwrite existing configuration repositories.

---

## PART 4 – Node Discovery

Retrieve every node belonging to the requested node type from the actual database or existing node registry API.

Inspect the actual schema before querying.

Requirements:

- Retrieve all matching nodes.
- Preserve the real node identifiers.
- Retrieve node names and descriptions.
- Retrieve configuration schema and metadata where available.
- Identify the node's supported inputs and outputs.
- Identify available validation requirements.
- Avoid duplicate nodes.
- Confirm the node type.

Create:

nodetype-test/nodetype-list/{nodetype}.md

The file must contain:

- Node type.
- Retrieval timestamp.
- Total node count.
- Node name.
- Node ID.
- Description.
- Configuration requirements.
- Test status.

If no nodes are found, stop and report the actual result.

Never fabricate a node.

---

## PART 5 – Configuration Manager

Before generating a workflow, inspect the configuration requirements of the target node.

Configuration sources:

1. Actual node definition.
2. Node configuration schema.
3. Existing node implementation.
4. Existing configuration repository.
5. Existing credential management system.

Read:

nodetype-config/{nodetype}.md

### Configuration logic

For every node:

1. Identify mandatory properties.
2. Identify optional properties.
3. Identify properties already configured.
4. Validate previously saved configurations.
5. Reuse valid configurations.
6. Identify missing mandatory configurations.
7. Ask the user for missing values.
8. Save newly supplied values using meaningful keys.
9. Validate the final configuration.

Never use placeholders for mandatory configurations.

Never silently use dummy values.

Never mark a node as ready when required configuration is missing.

### Configuration persistence

Save every user-provided configuration value using meaningful names.

Example:

SEND_EMAIL_SMTP_HOST
SEND_EMAIL_SMTP_PORT
SEND_EMAIL_SENDER
SEND_EMAIL_CREDENTIAL_REF
SEND_EMAIL_TEST_RECIPIENT

For secrets, store secure credential references instead of plaintext passwords, API keys, and tokens.

Use existing Flow Studio credential storage.

### Configuration reuse

If another certification run requires the same configuration:

- Read the existing configuration.
- Validate that it is still applicable.
- Reuse it where valid.
- Ask only for missing or invalid values.

Do not ask the user for the same configuration repeatedly when a valid saved configuration already exists.

### User interaction

Ask the user for missing configurations in a consolidated request whenever practical.

If the user does not provide a mandatory value, mark the affected node BLOCKED.

Resume the same certification run after the user provides the missing configuration.

---

## PART 6 – Workflow Generator

For each discovered node, generate an individual test workflow.

Standard structure:

Manual Trigger → Target Node

Example:

Manual Trigger → Send Email

Manual Trigger → HTTP Request

Manual Trigger → Database Query

Requirements:

1. Use existing Flow Studio workflow creation APIs.
2. Use the actual Manual Trigger implementation.
3. Use the actual target node definition.
4. Use the correct node configuration schema.
5. Add the required connections.
6. Populate meaningful test inputs.
7. Apply the collected configurations.
8. Save the workflow.
9. Retrieve the actual workflow ID.
10. Verify the saved workflow.

### Workflow isolation

One target node must be tested in one isolated workflow.

Do not combine multiple target nodes into one test workflow.

If a target node needs upstream input preparation, use the smallest supported setup and record the additional supporting nodes.

The final result must validate the target node, not just the supporting nodes.

### Naming convention

NC_{NodeType}_{NodeName}_{RunId}

Example:

NC_Communication_SendEmail_NC-COMM-20261107-001

Record:

- Node ID.
- Node name.
- Workflow ID.
- Run ID.
- Creation timestamp.
- Configuration reference.

---

## PART 7 – Workflow Execution

Execute workflows through the existing Flow Studio execution infrastructure.

Do not implement another workflow execution engine.

For each workflow:

1. Retrieve the workflow ID.
2. Verify that it is saved.
3. Trigger execution.
4. Retrieve the execution ID.
5. Monitor execution status.
6. Wait for completion.
7. Retrieve target node execution records.
8. Retrieve node input and output.
9. Retrieve execution logs.
10. Store the execution evidence.

Capture actual execution data.

Do not assume that a successful API request means successful node execution.

### Execution timeout

Use a configurable per-node timeout, initially 60–90 seconds where appropriate.

Allow one retry for eligible transient errors.

Do not endlessly retry.

Do not retry permanent authentication, validation, or configuration failures without a relevant correction.

Support bounded parallel execution for independent workflows.

Do not execute workflows concurrently if they can cause conflicting external side effects.

---

## PART 8 – Node Validation Engine

Implement deterministic, node-specific validation.

A node is PASSED only when:

- Its workflow execution completed successfully.
- The target node actually executed.
- No relevant node-level execution error occurred.
- The expected functionality was verified.
- The expected output or external acknowledgment was obtained where applicable.

Do not depend exclusively on workflow-level status.

### Validation examples

HTTP Request:

- Verify request method.
- Verify endpoint.
- Verify actual response.
- Validate expected HTTP status.
- Validate response data.

Send Email:

- Verify configured sender and recipient.
- Verify email operation executed.
- Verify provider acknowledgment.
- Record message ID where available.
- Distinguish provider acceptance from actual email delivery.

Database:

- Verify connection.
- Verify query execution.
- Validate returned data.
- Validate expected result.

AI Agent:

- Verify agent invocation.
- Verify model response.
- Validate expected response structure or content.
- Check execution errors.

Validation rules must reflect the actual node functionality.

Use deterministic assertions wherever possible.

AI may help interpret errors, but it must not invent a successful validation result.

### Node statuses

PASSED
FAILED
BLOCKED
TIMEOUT
SKIPPED

Keep the detailed internal statuses.

For the final requested node summary, classify PASSED as passed and all other unresolved or unsuccessful cases as failed, while clearly explaining blocked and skipped cases.

---

## PART 9 – Execution Log Inspection

Use the existing Observe panel and execution log retrieval mechanisms.

For every node, retrieve:

- Workflow execution status.
- Target node status.
- Node input.
- Node output.
- Error message.
- Exception details.
- Stack trace where available.
- Execution timestamp.
- Execution duration.

For failed nodes, retain the actual relevant log data.

The final report must contain the original error information.

The AI-generated failure explanation must be separate from the actual execution log.

Never invent execution logs.

Never report an error message that was not found in actual execution evidence.

---

## PART 10 – Screenshot Collector

Capture two genuine screenshots for every tested node.

Screenshot 1: Workflow

Must show:

- Manual Trigger.
- Target node.
- Connection.
- Workflow name.
- Workflow ID where visible.

Screenshot 2: Configuration

Must show:

- Target node configuration panel.
- Configured properties.
- Node name.
- Relevant values or masked credential references.

Save under:

nodetype-screenshot/{nodetype}/{NodeName}/

Required files:

workflow.png
configuration.png

Use the actual Flow Studio interface and available browser automation.

Do not generate synthetic screenshots.

Do not expose credentials, passwords, or tokens.

Verify that screenshot files were actually created and are readable.

If a screenshot fails, record the missing evidence rather than pretending it exists.

---

## PART 11 – Certification Report Generator

Create:

nodetype-status/{nodetype}.md

The report must contain:

### Section 1 – Certification summary

- Run ID.
- Node type.
- Start timestamp.
- Completion timestamp.
- Total duration.
- Agent status.
- Total nodes.
- Passed nodes.
- Failed nodes.
- Final certification result.

### Section 2 – Individual node results

For every node:

- Node name.
- Node ID.
- Workflow ID.
- Execution ID.
- Node status.
- Execution status.
- Validation result.
- Screenshot paths.

### Section 3 – Failed node details

For every failed node:

- Exact node name.
- Exact failure category.
- Expected behavior.
- Actual behavior.
- Original error message.
- Actual execution log.
- Relevant exception details.
- AI-generated failure analysis.
- Workflow ID.
- Execution ID.
- Screenshot references.

### Section 4 – Passed node details

For every passed node:

- Node name.
- Workflow ID.
- Execution ID.
- Validation criteria.
- Actual validation result.
- Screenshot references.

### Section 5 – Final certification verdict

Agent status must be independent of node status.

Agent status:

COMPLETED
FAILED

Node status:

PASSED
FAILED
BLOCKED
TIMEOUT
SKIPPED

Example:

Agent Status: COMPLETED

Total Nodes: 10

Passed Nodes: 8

Failed Nodes: 2

Final Node Result: 8/10 PASSED

A run may be COMPLETED even when some nodes have failed.

A run must be FAILED when the certification process itself cannot finish reliably or the overall deadline expires.

Never mark the agent as FAILED merely because an individual node failed.

Never mark the agent as COMPLETED if required reporting and certification processing remain incomplete.

---

## PART 12 – Twenty-Minute Execution Management

Implement a global active-run deadline of 20 minutes.

Suggested initial execution allocation:

- Initialization: 30 seconds.
- Node discovery: 1 minute.
- Configuration discovery: 2 minutes.
- Workflow generation: 3 minutes.
- Workflow execution: 7 minutes.
- Validation and log collection: 3 minutes.
- Screenshots and reporting: 2 minutes.

Total target: 18.5 minutes.

The remaining time is a safety buffer.

These are initial targets and must be adjusted using actual execution measurements.

### Parallel execution

Use bounded concurrency.

Initial suggested concurrency: 5.

Requirements:

- Discover all nodes before scheduling tests.
- Prepare configurations first.
- Generate independent workflows concurrently where safe.
- Execute independent workflows concurrently.
- Enforce individual timeouts.
- Reserve time for evidence and reporting.
- Stop starting new tests when the remaining deadline cannot accommodate them.
- Preserve all completed results.

### Configuration waiting

User interaction must not be treated as node execution.

When mandatory configuration is missing:

- Pause the certification run.
- Preserve the run ID and completed results.
- Ask the user for the missing configuration.
- Resume the same run after receiving the configuration.

The agent must never bypass mandatory configuration to meet the time limit.

If the node count, configuration wait, or execution environment makes the deadline impossible, generate an honest partial report and mark the agent status FAILED.

---

## PART 13 – Recovery and Idempotency

Implement safe recovery.

If the agent is interrupted:

1. Identify the previous run.
2. Retrieve its state.
3. Identify already-created workflows.
4. Identify completed executions.
5. Reuse valid evidence belonging to that run.
6. Continue incomplete tests.
7. Avoid duplicate workflows and external operations.
8. Generate the final report.

Do not reuse old execution results as fresh results in a new certification run.

Use existing persistence mechanisms where available. Do not introduce unnecessary database tables.

---

## PART 14 – Error Handling

Handle these conditions separately:

1. Resource.md not found.
2. Database connection failure.
3. Invalid node type.
4. No nodes found.
5. Missing configuration.
6. Invalid configuration.
7. Workflow creation failure.
8. Workflow save failure.
9. Workflow execution failure.
10. Target node execution failure.
11. Execution timeout.
12. Validation failure.
13. Observe/log retrieval failure.
14. Screenshot capture failure.
15. Report generation failure.
16. Overall deadline exceeded.

Every failure must have:

- Error category.
- Relevant node or phase.
- Exact error message where available.
- Run ID.
- Recovery or next action.

Do not convert infrastructure failures into node failures without identifying the actual cause.

---

## PART 15 – Testing and Verification

Before considering the implementation complete, test the complete certification lifecycle.

### Test 1 – Basic node certification

Select a node type containing at least one simple node.

Verify:

- Node discovery.
- Configuration.
- Workflow generation.
- Workflow execution.
- Validation.
- Screenshots.
- Report.

### Test 2 – Multiple nodes

Select a node type containing several nodes.

Verify that each node receives its own workflow and independent status.

### Test 3 – Missing configuration

Select a node that requires configuration not present in the repository.

Verify:

- Agent asks the user.
- Agent does not use placeholders.
- Configuration is saved.
- Same run resumes.
- Workflow executes with the supplied configuration.

### Test 4 – Failure scenario

Provide an intentionally invalid configuration in a controlled test environment.

Verify:

- Actual failure is captured.
- Exact log is recorded.
- Node is flagged FAILED.
- Other independent nodes continue testing.
- Report contains failure details.

### Test 5 – Successful node with incorrect output

Simulate or use a test case where workflow execution completes but the node output does not meet expectations.

Verify that the node is FAILED rather than PASSED.

### Test 6 – Timeout

Simulate a node that exceeds its execution timeout.

Verify timeout classification and preservation of other test results.

### Test 7 – Screenshot verification

Verify both screenshots exist for every tested node and correspond to the correct workflow.

### Test 8 – Deadline verification

Measure the actual duration of a representative certification run.

Verify the 20-minute deadline and partial-report behavior.

---

## PART 16 – Implementation Deliverables

Provide the following deliverables:

1. Repository architecture assessment.
2. Existing APIs and components reused.
3. List of newly implemented components.
4. Updated source code.
5. Node Certification Agent implementation.
6. Configuration management implementation.
7. Workflow generation and execution integration.
8. Deterministic validation implementation.
9. Execution log collection.
10. Screenshot collection.
11. Certification report generation.
12. Error handling and recovery.
13. Test results.
14. Implementation documentation.
15. Example certification output.

Do not report an implementation as completed unless it has actually been built and tested.

---

## FINAL INSTRUCTION TO CLAUDE

First inspect the actual repository, Resource.md, existing Node Certification APIs, database schema, Flow Studio workflow infrastructure, and Observe panel.

Then prepare a gap analysis and implementation plan.

After that, implement the complete Node Certification Agent using existing application capabilities.

Work incrementally, test each integration, and verify the complete end-to-end certification process.

Do not create mock implementations to demonstrate success.

Do not invent API contracts.

Do not replace existing Flow Studio functionality.

The final solution must allow a user to provide a node type and automatically receive:

- Complete node inventory.
- Reusable configuration repository.
- One isolated test workflow per node.
- Actual execution results.
- Actual node-level execution logs.
- Individual passed/failed statuses.
- Workflow screenshots.
- Configuration screenshots.
- Detailed certification report.
- Final agent status: COMPLETED or FAILED.


read understand and create a testing agent in "C:\BizFirstGo_FI_AI\Documentation\Employees\agentic-development-engineers\workflow-development-engineer\nodetype-test\nodetypetestagent.md"

**Primary success criterion: The agent must independently test the real functionality of every discovered node, collect verifiable evidence, and produce an accurate certification report within the 20-minute target whenever the workload and environment permit.**