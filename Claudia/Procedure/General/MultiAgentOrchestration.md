# Multi-Agent Orchestration Patterns

Real-world complex scenarios showing how multiple BizFirst agents coordinate to deliver sophisticated solutions.

---

## **1. Chat Assistant Workflow — Knowledge-Driven Conversational Agent**

**Scenario:** Build a production-ready chat assistant that answers questions using a custom knowledge base, deployed as a BizFirst app.

**Agents Involved:** AppAgent, WorkflowAgent, FormDeveloper, RAG/Octopus, AppTester, WorkflowTester

**Timeline:** 3-5 days per feature iteration

---

### **Phase 1: Requirements & Planning (Day 1)**

**Who:** AppAgent + WorkflowAgent + User

**Tasks:**
1. **Gather Requirements**
   - What is the chat assistant's domain? (e.g., HR policies, product support, technical docs)
   - What tone/style? (friendly, formal, technical)
   - What languages? (English, multi-language?)
   - Expected volume? (users/day, concurrent users)
   - Integrations needed? (email, Slack, CRM)

2. **Design App Structure**
   - Landing page (hero, CTA to chat)
   - Chat panel widget (message history, user identification)
   - Document viewer (show source of information)
   - Admin dashboard (monitor conversations, feedback)

3. **Design Workflow Logic**
   ```
   User Message
     ↓
   Input Validation & Parsing
     ↓
   RAG Search (find relevant documents)
     ↓
   Agent Reasoning (generate response)
     ↓
   Quality Check (confidence > threshold?)
     ↓
   Format & Return Response
     ↓
   Log & Monitor
   ```

4. **Define Success Criteria**
   - Response accuracy (% correct answers)
   - Response time (< 2s)
   - User satisfaction (NPS > 40)
   - Escalation rate (< 5% to human)

**Output:** Architecture document, workflow flowchart, acceptance criteria

**Progress Check:** Show user the planned app layout and workflow diagram

---

### **Phase 2: Knowledge Base Setup (Day 1-2)**

**Who:** RAG/Octopus Agent

**Tasks:**
1. **Create RAG Collection**
   ```
   Collection Name: "HR_PolicyBot_KB"
   Type: DocumentStore
   Embedding Model: Default
   Chunk Size: 512 tokens
   Overlap: 100 tokens
   ```

2. **Prepare Documents**
   - Convert policies to markdown
   - Organize by category (Benefits, Time Off, Code of Conduct, etc.)
   - Add metadata (department, effective date, version)

3. **Upload & Index**
   - Upload 50-200 documents via RAG uploader
   - Run indexing (embeddings created)
   - Verify index size & chunk count

4. **Test Retrieval**
   - Query: "What's the parental leave policy?"
   - Verify top-3 results are relevant
   - Adjust chunk size if needed
   - Test edge cases (typos, synonyms, abbreviations)

**Output:** Indexed RAG collection, test results showing recall > 80%

**Progress Check:** Show user the RAG collection in browser, run live search query

---

### **Phase 3: Workflow Build (Day 2-3)**

**Who:** WorkflowAgent

**Tasks:**
1. **Create Workflow**
   ```
   Name: ChatAssistant_GenerateResponse
   Trigger: API call (input message, user context)
   Timeout: 5 seconds
   Retry: 2x with exponential backoff
   ```

2. **Build Nodes (in sequence)**

   **Node 1: Input Validator**
   - Type: ExecutionNode
   - Validates message length (10-500 chars)
   - Sanitizes input (no SQL injection, XSS)
   - Extracts user context (ID, department, role)
   - Output: validated_message, user_context

   **Node 2: RAG Search**
   - Type: WorkflowNode with RAG integration
   - Query: validated_message
   - Collection: HR_PolicyBot_KB
   - Return top 3 results with similarity score
   - Output: relevant_documents, confidence_score

   **Node 3: Agent Reasoning**
   - Type: AIAgent node
   - Agent: ChatAssistant (or create new)
   - Prompt: "Answer using documents. Cite sources. If unsure, escalate."
   - Context: relevant_documents, user_context
   - Output: response_text, confidence, sources_used

   **Node 4: Quality Gate**
   - Type: Decision node
   - If confidence > 0.8: continue to response
   - Else: escalate to human (send to queue)
   - Output: escalation_flag

   **Node 5: Format Response**
   - Type: ExecutionNode
   - Add citations
   - Add helpful links
   - Add "Was this helpful?" buttons
   - Output: formatted_response

   **Node 6: Log & Monitor**
   - Type: ExecutionNode
   - Log to database:
     - user_id, message, response, confidence, escalated
     - timestamp, response_time_ms, token_count
   - Emit metric: response_time
   - Output: log_id

3. **Configure Error Handling**
   - RAG timeout → use fallback response
   - Agent timeout → escalate with apology
   - Invalid input → return validation error
   - Rate limit → queue and retry

4. **Test Workflow**
   - Unit test each node
   - Integration test full flow
   - Load test (simulate 100 concurrent)
   - Verify response time < 2s

**Output:** Published workflow, test results, performance metrics

**Progress Check:** Show user workflow diagram in browser, run test message

---

### **Phase 4: App Integration (Day 3-4)**

**Who:** AppAgent

**Tasks:**
1. **Create App**
   ```
   App Name: HR_ChatBot
   Type: Multi-page web app
   Template: Custom
   ```

2. **Build Pages**

   **Page 1: Landing**
   - Sections:
     - Hero (title, description, image)
     - CTA button ("Start Chat")
     - Features list (quick answers, 24/7, etc.)
   - Widgets: Content, Button, Image

   **Page 2: Chat Interface**
   - Sections:
     - Header (app logo, title)
     - Chat panel (conversation history)
     - Input box (message field)
     - Sidebar (suggested questions)
   - Widgets: Chat Panel, Content, Form

   **Page 3: Admin Dashboard** (future)
   - Sections:
     - Metrics (messages/day, escalation rate, satisfaction)
     - Recent conversations
     - Low-confidence responses
   - Widgets: Chart, Table, Content

3. **Configure Chat Panel Widget**
   - Link to ChatAssistant_GenerateResponse workflow
   - Pass message as input
   - Display response in chat
   - Add feedback buttons
   - Store user ID from session

4. **Apply Styling**
   - Brand colors (company colors)
   - Responsive (mobile, tablet, desktop)
   - Dark mode option
   - Accessibility (WCAG AA)

5. **Configure Settings**
   - Multi-tenancy: Select customer/department
   - Environment: Staging vs. Production
   - Analytics: Enable tracking

**Output:** Published app, styling applied, workflow linked

**Progress Check:** Show user the app in browser, test chat interaction

---

### **Phase 5: Testing & Validation (Day 4-5)**

**Who:** AppTester + WorkflowTester + User

**Tasks:**
1. **Unit Tests**
   - RAG retrieval accuracy: >= 80%
   - Response generation: no hallucinations
   - Input validation: all edge cases covered

2. **Integration Tests**
   - Full workflow: message → response (< 2s)
   - Error handling: timeouts, invalid input
   - Multi-user: concurrent messages
   - Different roles: verify context-aware responses

3. **End-to-End Tests**
   - User scenario 1: "How much PTO do I get?"
   - User scenario 2: "What's the remote work policy?"
   - User scenario 3: (intentionally unclear) "Benefits?"
   - Edge case: "Tell me a joke" (out-of-scope)

4. **Performance Testing**
   - Load: 50, 100, 200 concurrent users
   - Measure: response time, error rate, resource usage
   - Success criteria: < 5% errors, P95 latency < 3s

5. **User Acceptance Testing (UAT)**
   - Stakeholder reviews
   - Gather feedback on responses
   - Identify missing knowledge
   - Validate escalation workflow

6. **Refinement (iterative)**
   - Add missing FAQs to RAG
   - Improve agent prompt
   - Adjust confidence thresholds
   - Retest

**Output:** Test report, UAT sign-off, final metrics

**Progress Check:** Share test results with user, confirm ready for production

---

### **Phase 6: Deployment & Monitoring**

**Who:** ServerAgent + WorkflowAgent

**Tasks:**
1. **Deploy to Production**
   - Provision server/container
   - Configure monitoring & alerting
   - Set up backup/disaster recovery

2. **Monitor**
   - Daily: response accuracy, escalation rate, satisfaction
   - Weekly: trend analysis, user feedback
   - Monthly: performance review, updates

3. **Iterate**
   - Weekly feedback loop with stakeholders
   - Update knowledge base with new policies
   - Improve agent based on escalations

---

## **2. Data Integration Pipeline — Real-Time Sync**

**Scenario:** Sync customer data from Salesforce to internal database in real-time.

**Agents Involved:** ServerAgent, WorkflowAgent, CredentialAgent

**Timeline:** 1-2 weeks

---

### **Phase 1: Source System Integration (Days 1-2)**

**Who:** CredentialAgent + WorkflowAgent

**Tasks:**
1. **Configure Salesforce Credentials**
   - API key from Salesforce
   - Store in CredentialAgent
   - Test authentication

2. **Design Data Extraction**
   - Which objects? (Account, Contact, Opportunity)
   - Which fields? (name, email, phone, company)
   - Filter criteria? (active only, last updated > 1 hour)
   - Incremental or full sync?

3. **Create Extraction Workflow**
   - Trigger: Scheduled (every 1 hour) or Event-driven (Salesforce webhook)
   - Query Salesforce API
   - Handle pagination
   - Log extraction metrics

---

### **Phase 2: Transformation (Day 2-3)**

**Who:** WorkflowAgent

**Tasks:**
1. **Design Transformation**
   - Map fields (Salesforce → internal schema)
   - Handle null/missing values
   - Normalize data (phone format, address, etc.)
   - Add metadata (sync_timestamp, source, version)

2. **Handle Edge Cases**
   - Duplicate detection (by email, phone)
   - Conflicting updates (last-write-wins)
   - Soft deletes (mark deleted, keep history)

---

### **Phase 3: Destination Setup (Day 3)**

**Who:** CredentialAgent + ServerAgent

**Tasks:**
1. **Configure Target Database**
   - Create schema for Customer table
   - Add audit columns (created_at, updated_at, synced_at)
   - Create indexes for common queries

2. **Set Up Credentials**
   - Database connection string
   - User with write permissions
   - Test connectivity

---

### **Phase 4: Orchestration & Monitoring (Day 4-5)**

**Who:** WorkflowAgent + ServerAgent

**Tasks:**
1. **Create Full Workflow**
   - Extract (Salesforce API)
   - Transform (field mapping)
   - Load (database insert/update)
   - Log results

2. **Configure Error Handling**
   - API errors: retry 3x with backoff
   - DB errors: alert ops team
   - Data quality issues: quarantine, review

3. **Set Up Monitoring**
   - Alert if sync fails
   - Alert if lag > 5 minutes
   - Track records synced/day
   - Monitor data quality (null rate, duplicate rate)

---

## **3. Approval Workflow — Business Process Automation**

**Scenario:** Implement an expense approval workflow (employee → manager → finance → paid).

**Agents Involved:** AppAgent, FormDeveloper, WorkflowAgent, AppTester

**Timeline:** 1-2 weeks

---

### **Phase 1: Request Design (Day 1)**

**Who:** FormDeveloper + AppAgent

**Tasks:**
1. **Create Expense Request Form**
   - Fields: amount, category, date, purpose, receipt file
   - Validation: amount > 0, date <= today, file size < 10MB
   - Attachments: receipt image/PDF

2. **Design Approval Hierarchy**
   - Employee submits
   - Manager approves (for own team members)
   - Finance verifies (budget, compliance)
   - Approver(s) can comment/reject with reason

3. **Set Escalation Rules**
   - Amount > $5000: need director approval
   - Amount > $50000: need CFO approval
   - Missing receipt: automatic rejection

---

### **Phase 2: Workflow Build (Day 2-3)**

**Who:** WorkflowAgent

**Tasks:**
1. **Create Approval Workflow**
   ```
   1. Validate request (format, required fields)
   2. Route to manager (based on org hierarchy)
   3. Manager decides: approve / reject / request info
   4. If approved → Finance review
   5. If finance approves → Mark as approved
   6. If any rejection → Notify employee
   7. If escalation needed → Route to director
   8. Log all decisions & comments
   ```

2. **Configure Notifications**
   - Email: "Request pending your approval"
   - Email: "Your expense was approved/rejected"
   - Slack: notification to manager
   - In-app: notification center

3. **Add SLA Monitoring**
   - Manager must respond within 3 days
   - Finance must respond within 2 days
   - Alert if approaching deadline

---

### **Phase 3: App Integration (Day 3-4)**

**Who:** AppAgent

**Tasks:**
1. **Create Multi-Page App**
   - Page 1: Submit Expense (form)
   - Page 2: My Requests (status of submitted requests)
   - Page 3: Approvals Pending (for managers/finance - table of requests)
   - Page 4: History (all expenses, filters by status/month)

2. **Dashboard for Manager**
   - Pending approvals (count, list)
   - Team's spending (YTD, by category)
   - Rejected expenses (reasons, trends)

---

### **Phase 4: Testing & Deployment (Day 4-5)**

**Who:** AppTester + WorkflowTester

**Tasks:**
1. **Happy Path Test**
   - Employee submits $500 expense
   - Manager approves within 2 days
   - Finance approves within 1 day
   - Expense marked paid, email sent

2. **Rejection Path**
   - Employee submits without receipt
   - System auto-rejects
   - Email notification sent
   - Employee can resubmit

3. **Escalation Path**
   - Employee submits $30,000 expense
   - Routed to director (not manager)
   - Director approves
   - Proceeds to finance

4. **Monitoring**
   - Track approval times by role
   - Identify bottlenecks
   - Measure approval rate (% approved)

---

## **4. Coordination Patterns**

Three primary ways agents work together:

---

### **Pattern A: Sequential (Phase → Phase)**

```
AppAgent (Plan UI)
    ↓ (App design complete)
WorkflowAgent (Build Logic)
    ↓ (Workflow complete)
AppAgent (Link workflow to app)
    ↓ (Integration complete)
AppTester (Validate)
```

**When to use:**
- Dependencies exist (workflow must exist before linking)
- Large, distinct phases
- Clear handoff points

**Example:** Chat Assistant Workflow (App → Workflow → Integration → Testing)

**Timeline:** Longer (sequential adds time)

**Risk:** Delays cascade (if one phase delays, all downstream delayed)

---

### **Pattern B: Parallel (Work Simultaneously)**

```
AppAgent (Build UI)         WorkflowAgent (Build Logic)
     ↓                                ↓
     Create pages, forms      Create workflow nodes
     ↓                                ↓
     Ready for integration ← → Ready for linking
     ↓                                ↓
     AppTester ← → WorkflowTester
```

**When to use:**
- Independent work (UI and logic don't block each other)
- Time-sensitive projects
- Teams available (not bottleneck on single agent)

**Example:** Data Integration Pipeline (Extract workflow, Transform, Load can happen in parallel)

**Timeline:** Shorter (parallelism saves time)

**Risk:** Coordination overhead, sync challenges

---

### **Pattern C: Feedback Loop (Iterative Refinement)**

```
Build v1 (AppAgent)
    ↓
Test v1 (AppTester)
    ↓
User Feedback
    ↓
Refine v2 (AppAgent)
    ↓
Re-test v2 (AppTester)
    ↓
(Repeat until approved)
```

**When to use:**
- User-facing features (need UX validation)
- Uncertain requirements
- Iterative design process

**Example:** Chat Assistant (initial build → UAT → refine based on feedback → redeploy)

**Timeline:** Variable (depends on feedback cycles)

**Benefit:** Converges on "right solution"

---

## **5. Decision Tree: Which Pattern to Use?**

```
Are there clear dependencies between tasks?
├─ YES → Use Sequential
│        (Phase A must complete before Phase B starts)
│
└─ NO → Can work be done in parallel?
        ├─ YES → Use Parallel
        │        (AppAgent and WorkflowAgent work simultaneously)
        │
        └─ NO → Is user feedback critical?
                ├─ YES → Use Feedback Loop
                │        (Build → Test → Feedback → Refine)
                │
                └─ NO → Use Sequential (safest fallback)
```

**Example Decision:**
- Chat Assistant: Dependencies exist (RAG → Workflow → App) → Sequential, but can parallelize Phase 4 and 5 testing
- Data Pipeline: Extraction and transformation are independent → Parallel
- Expense Approval: Forms and workflow independent, but need integration → Parallel with sync point

---

## **6. Communication Protocol: How Agents Coordinate**

### **Decision Documentation**
1. Every decision logged in Rouge_Notes:
   - NoteType: Procedural (how we'll build it)
   - Content: "Decision: Use RAG with chunk_size=512 for HR bot KB"
   - Status: Active
   - Owner: Agent name

2. Examples:
   - "Chat workflow will escalate if confidence < 0.8"
   - "Database sync should retry on failure with exponential backoff"
   - "Approval routing uses org chart from Salesforce"

### **Progress Updates**
After each phase:
1. Screenshot/artifact showing work completed
2. Status: On-track, at-risk, or blocked
3. Next phase: When starting, what's needed
4. Blockers: Any waiting on external input

### **Handoff Points**
Clear handoffs with:
1. **Deliverable:** What's being passed (e.g., app design, workflow spec)
2. **Interface:** How it connects (e.g., chat panel calls this workflow endpoint)
3. **Test Criteria:** How to verify it works (e.g., response time < 2s)
4. **Support:** Who answers questions from next agent

Example Handoff:
```
FROM: AppAgent → TO: WorkflowAgent
DELIVERABLE: App design with Chat panel widget
INTERFACE: Widget calls POST /api/workflows/ChatAssistant_GenerateResponse
INPUT: { message: string, user_id: int }
OUTPUT: { response: string, sources: string[], confidence: float }
TEST: Send 10 test messages, verify response time < 2s
SUPPORT: AppAgent available for questions about Chat panel widget spec
```

### **Risk Mitigation**
1. **Regular Sync:** Daily standup (if multi-day project)
2. **Clear Dates:** "RAG collection ready by EOD Friday"
3. **Buffer Time:** 1-2 days padding for unknowns
4. **Escalation:** If blocked > 2 hours, escalate to user

---

## **7. Real-World Scenario: Chat Assistant Timeline**

| Day | Phase | Agent | Deliverable | Status Check |
|-----|-------|-------|-------------|--------------|
| 1AM | Planning | App + Workflow | App design, workflow flowchart | User approves |
| 1PM | KB Setup | RAG | RAG collection with 50 docs | Search test passes |
| 2AM | Workflow | Workflow | ChatAssistant workflow published | Unit tests pass |
| 2PM | App Integration | App | App with linked workflow | Chat test successful |
| 3AM | Testing (unit) | Workflow Tester | Test report (coverage > 80%) | All pass |
| 3PM | Testing (integration) | App Tester | E2E test scenarios | UAT scheduled |
| 4AM | UAT | User + App Tester | Feedback on responses | Issues logged |
| 4PM | Refinement | Workflow | Updated prompts, added FAQs | Retest runs |
| 5AM | Deployment | Server | Production deployment | Monitoring on |

---

## **8. Multi-Team Coordination Example**

**Scenario:** Large organization, multiple agents working in parallel

```
Team App:
  - AppAgent on landing page
  - AppAgent on dashboard
  (parallel on separate pages)

Team Workflow:
  - WorkflowAgent on RAG nodes
  - WorkflowAgent on approval logic
  (parallel on separate workflows)

Team Testing:
  - AppTester on UI/UX
  - WorkflowTester on logic/integration
  (parallel on different aspects)

Sync Points:
  - End of Day 2: RAG collection ready for workflow team
  - End of Day 3: Workflow ready for app integration team
  - End of Day 4: Full system ready for testing team
  - End of Day 5: UAT feedback for refinement
```

---

## **Best Practices**

1. **Start with Planning:** Misalignment early = rework late
2. **Define Interfaces:** Clear input/output contracts prevent integration surprises
3. **Document Decisions:** Rouge_Notes is your history and justification
4. **Show Progress:** Screenshots, demos, tangible evidence users can see
5. **Build in Buffer:** Complex projects always take longer than estimated
6. **Test Early:** Don't wait until the end
7. **Iterate Based on Feedback:** Feedback loop = better solution
8. **Communicate Blockers:** Don't hide, escalate early
9. **Celebrate Milestones:** Acknowledge progress to keep team motivated
10. **Retrospect:** After each project, improve your process

---

## **Common Pitfalls to Avoid**

| Pitfall | Example | Fix |
|---------|---------|-----|
| Unclear interfaces | "App calls workflow" but which endpoint? | Define REST contract upfront |
| Scope creep | "While we're at it, add mobile..." | Lock scope before building |
| No progress visibility | User doesn't know status | Share daily updates + screenshots |
| Tight coupling | Workflow hardcoded to specific app | Use generic APIs, config over code |
| Insufficient testing | "Tests will be quick" | Allocate 20-30% time for testing |
| Poor communication | Agent gets stuck, doesn't escalate | Clear escalation path |

