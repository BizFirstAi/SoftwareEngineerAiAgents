# Workflow Creation Questionnaire

**Purpose:** Interactive guided workflow design via WorkflowDeveloper agent. Answer these questions to build a complete workflow specification.

---

## 1. Workflow Purpose & Scope

### Questions:
- **Name:** What is the workflow called? (e.g., "Order Processing", "Leave Request Approval")
- **Description:** 2-3 sentence summary of what it does
- **Business Purpose:** What business problem does this solve?
- **Workflow Type:** Choose one:
  - [ ] Data Pipeline (ETL, transformation, aggregation)
  - [ ] Approval Process (request → review → approval)
  - [ ] Notification Flow (trigger → notify → track)
  - [ ] Integration Sync (sync data between systems)
  - [ ] Agent Task (AI-driven decision/classification)
  - [ ] Custom Multi-step Process

### Performance Requirements:
- **Frequency:** One-time / Hourly / Daily / Weekly / On-demand / Custom: ___
- **Volume:** Expected triggers per month: ___
- **Criticality:** Is this a critical path? (SLA required?)
  - [ ] Yes, SLA: ___ (e.g., 4 hours)
  - [ ] No, best-effort

### Recommendation:
For high-volume (>10k/month) workflows, plan for parallel execution and error retry policies.

---

## 2. Trigger & Initiation

### How does the workflow start?
- [ ] **Scheduled** — Recurring timer
  - Frequency: Daily / Hourly / Weekly / Custom cron: ___
  - Time: ___
- [ ] **Manual** — User initiates
  - Via form / API / Button
- [ ] **Event-based** — System event triggers
  - Event source: ___
  - Event type: ___
- [ ] **Webhook** — External system notifies
  - Source system: ___
  - Webhook endpoint: ___
- [ ] **API Call** — Direct API invocation
- [ ] **Form Submission** — User submits form data
- [ ] **Database Event** — Record insert/update/delete

### Input Requirements:
- **Input Parameters:** List the data needed to start the workflow:
  - Parameter 1: ___ (type: string/number/date/object)
  - Parameter 2: ___
- **Validation Rules:** Any constraints?
  - Email must be valid? [ ]
  - Amount > 0? [ ]
  - Required fields: ___

### Example:
*Approval workflow triggered by form submission (Leave Request form) with: Employee ID, Dates, Reason.*

---

## 3. Core Process Steps

### Workflow Steps:
Map out the main steps (sequential or parallel):

| # | Step Name | Description | Type | Parallel? |
|---|-----------|-------------|------|-----------|
| 1 | | | Query/Transform/Branch/API/Notify/Agent/Wait/Loop | Y/N |
| 2 | | | | |
| 3 | | | | |

### Action Types Explained:
- **Query Data** — Fetch from database/API
- **Transform** — Process/calculate/format data
- **Condition/Branch** — If-then decision
- **Call API** — Invoke external service
- **Send Notification** — Email/Slack/SMS
- **Execute Agent** — Run AI agent
- **Wait** — Pause for event/time
- **Loop** — Repeat until condition
- **Error Handling** — Catch and recover

### Branching Logic:
Describe conditional paths:
- If [condition], then [action]
- Example: If amount > $10k, then escalate; else auto-approve

### Example:
*Order Processing: 1) Validate order → 2) Check inventory → 3) If stock available → Reserve items → Confirm order (parallel); If out of stock → Notify customer → End.*

---

## 4. Data Flow & Integration

### Data Sources:
Which systems provide input data?
- [ ] Database (which? ___)
- [ ] REST API (endpoint? ___)
- [ ] File upload (format? CSV/JSON)
- [ ] External system (which? ___)
- [ ] User input (form fields)

### Data Transformations:
What calculations/mappings are needed?
- Aggregate orders by customer? [ ]
- Calculate total amount? [ ]
- Convert currencies? [ ]
- Parse dates? [ ]
- Custom transformations: ___

### External Integrations:
Which external systems does this workflow connect to?
- [ ] Salesforce (sync opportunities, accounts)
- [ ] Slack (send notifications)
- [ ] Email (send reports)
- [ ] Elasticsearch (log/search)
- [ ] Odoo (inventory, accounting)
- [ ] Custom API (which? ___)

### Data Mapping:
Map internal fields to external system fields:
- Internal field → External field
- Example: order_id → Salesforce.OpportunityID

### Credentials Required:
- API keys needed? [ ] For: ___
- Database credentials? [ ] Database: ___
- OAuth tokens? [ ] Service: ___

---

## 5. Decision Points & Routing

### Approval Workflows?
- [ ] Yes, approval required
  - Who approves? (user role/email): ___
  - Approval timeout: ___ (hours)
  - Escalation path: ___
- [ ] No, automatic

### Conditional Branches:
Create decision paths:
- If [condition A] → [step B]
- Else if [condition C] → [step D]
- Else → [step E]

**Example:**
```
If priority = High:
  → Escalate to supervisor (Email)
Else if priority = Medium:
  → Send to queue (Notification)
Else:
  → Auto-process (Silent)
```

### Error Handling:
How should workflow handle failures?
- **Retry on failure?** [ ] Yes, max attempts: ___
- **Fallback action?** [ ] Yes: ___
- **Notify on error?** [ ] Yes, notify: ___
- **Stop on error?** [ ] Yes / [ ] No (continue)

---

## 6. Notifications & Outputs

### Stakeholders:
Who needs to know about workflow progress?
- [ ] Process owner (email: ___)
- [ ] End user (email/SMS)
- [ ] Admin team
- [ ] External system
- [ ] Custom: ___

### Notification Channels:
- [ ] Email (subject template: ___)
- [ ] Slack (channel: ___)
- [ ] SMS (message template: ___)
- [ ] In-app notification
- [ ] Webhook to external system

### Result Outputs:
What happens when workflow completes?
- [ ] Store result in database (table: ___)
- [ ] Generate report (format: PDF/CSV/JSON)
- [ ] Send file (email/download link)
- [ ] Update external system (which? ___)
- [ ] Trigger next workflow (which? ___)

### Archive/Retention:
- Keep workflow history? [ ] Yes, duration: ___ (months)
- Audit trail needed? [ ] Yes

---

## 7. Monitoring & Compliance

### Performance:
- **SLA requirement?** [ ] Yes, response time: ___ ms
- **Success rate target?** ___ %
- **Max duration?** ___ minutes

### Logging & Audit:
- [ ] Full execution log required
- [ ] Data access log required
- [ ] Sensitive data redacted in logs? [ ] Yes

### Compliance:
- [ ] GDPR compliance (data handling, retention)
- [ ] HIPAA compliance (healthcare data)
- [ ] SOC 2 compliance (audit trail)
- [ ] PCI DSS (payment data)
- [ ] Other: ___

### Recovery Policies:
- **Automatic retry?** [ ] Yes, every ___ seconds, max ___ attempts
- **Manual intervention needed?** [ ] Yes, when: ___
- **Fallback service?** [ ] Yes: ___
- **Timeout behavior?** Retry / Notify / Abort: ___

---

## 8. Agent Involvement (if applicable)

### Does this workflow use an AI Agent?
- [ ] No, skip this section
- [ ] Yes, answer below:

### Agent Purpose:
- [ ] Classification (categorize data)
- [ ] Extraction (pull structured data)
- [ ] Summarization (condense content)
- [ ] Decision-making (recommend action)
- [ ] Custom: ___

### Agent Configuration:
- **Which agent?** (Agent name: ___)
- **Input:** What data goes to the agent? (field list: ___)
- **Output:** What does the agent return? (format: ___)
- **Confidence threshold?** ___ %
- **Fallback:** What if agent confidence is low? ___

### Agent Node Details:
- **Prompt/Instructions:** (How should agent handle this?)
- **Context/RAG:** Should agent reference external knowledge? [ ] Yes, knowledge base: ___
- **Error handling:** What if agent fails? Retry / Escalate / Manual review

---

## 9. Review & Confirmation

### Summary:
Before building, confirm:
- [ ] Workflow name and purpose clear
- [ ] Triggers and inputs defined
- [ ] All steps and decision points mapped
- [ ] Data sources and integrations identified
- [ ] Notifications and approvals configured
- [ ] Error handling and recovery planned
- [ ] Compliance and monitoring requirements set
- [ ] Agent involvement (if any) specified

### Visual Flowchart:
*System generates flowchart from answers above. Review for:*
- Correct sequence of steps?
- All branches covered?
- Error paths included?
- Performance acceptable?

### Risk Assessment:
- **Critical points:** Which steps are most likely to fail? ___
- **Failure impact:** What happens if workflow fails? ___
- **Mitigation:** How to reduce risk? ___

### Common Workflow Templates:
*If your workflow matches a pattern, use template:*
- [ ] **Approval Template** (Request → Review → Approve/Reject → Notify)
- [ ] **Alert Template** (Monitor → Trigger → Notify → Log)
- [ ] **Sync Template** (Source → Extract → Transform → Load → Verify)
- [ ] **Extract Template** (Document → Parse → Extract Fields → Store)
- [ ] **Route Template** (Input → Classify → Route → Process → Archive)

### Integration Pattern Library:
*Common integrations:*
- **Order Processing:** Salesforce → Inventory → Fulfillment → Customer Notification
- **Leave Request:** HR Form → Manager Approval → Calendar Update → Notification
- **Data Sync:** Source DB → Transform → Elasticsearch → Analytics
- **Invoice Processing:** Invoice Upload → OCR → Validate → Book → Notify

### Build Confirmation:
- [ ] **Ready to build** — Proceed with workflow creation
- [ ] **Need more time** — Save and return later
- [ ] **Discuss with team** — Export to share

### Next Steps:
1. **Build Phase:** WorkflowDeveloper creates nodes
2. **Configuration:** Set node properties, mappings, logic
3. **Test Phase:** WorkflowTester validates execution
4. **Deploy:** Publish to production
5. **Monitor:** Track execution and performance

---

## Tips & Best Practices

- **Start simple:** Build basic workflow first, add complexity later
- **Test early:** Test with sample data before production
- **Monitor closely:** Set up alerts for failures
- **Document decisions:** Use Rouge_Notes to record why you chose certain approaches
- **Get feedback:** Review with stakeholders after testing
- **Iterate:** Update based on real-world performance

---

**Questionnaire Version:** 1.0 | **Last Updated:** 2026-09-29
