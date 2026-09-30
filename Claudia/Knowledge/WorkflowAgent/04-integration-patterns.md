# Integration Patterns & External Systems

## Integration Node Families

### HTTP & REST APIs
**Node:** `http-request`

Patterns:
- **Query data:** GET request to retrieve records/data
- **Create records:** POST with JSON body
- **Update records:** PUT/PATCH with new data
- **Delete records:** DELETE request
- **Batch operations:** Multiple HTTP calls in loop or parallel

Example: Fetch customer data from external CRM, transform, write to BizFirst

### Email Integrations

**Nodes:** `email-smtp`, `email-gmail`

Patterns:
- **Notifications:** Send alerts, confirmations
- **User communication:** Personalized messages
- **Attachments:** Documents, reports, files
- **Templating:** Dynamic content, data merge

Example: When form submitted, send confirmation email with attachment

### Chat & Messaging

**Node:** `slack`

Patterns:
- **Alerts:** Notify team of important events
- **Approvals:** Request human decision via Slack
- **Status updates:** Share workflow progress
- **Threaded discussions:** Keep context organized

Example: Workflow stuck waiting approval → Post to Slack channel → User approves → Resume

### Database Integrations

**Nodes:** `sql-server`, `mysql`, `elasticsearch` (partially documented)

Patterns:
- **Query:** SELECT data with WHERE conditions
- **Insert:** Create new records
- **Update:** Modify existing data
- **Upsert:** Create or update (insert if not exists)
- **Delete:** Remove records (usually soft-delete)
- **Search:** Full-text or complex queries (Elasticsearch)

Example: HTTP webhook receives customer update → Query BizFirst DB → Update if exists, insert if new

### ERP Integrations

**Node:** `odoo`

Patterns:
- **Sync records:** Bidirectional sync between Odoo and BizFirst
- **Create orders:** From BizFirst to Odoo
- **Update inventory:** Sync stock levels
- **Read sales data:** Pull historical data from Odoo

Example: Order placed in BizFirst → Create order in Odoo → Wait for shipment → Update status in BizFirst

### External AI/LLM

**Nodes:** `flow-ai-agent`, `ai-agent`, `ai-function`

Patterns:
- **Data enrichment:** Use LLM to augment incomplete data
- **Content generation:** Emails, summaries, responses
- **Classification:** Categorize data using AI
- **Complex logic:** Workflow decisions made by AI
- **Tool orchestration:** AI agent uses multiple tools

Example: Customer feedback → Flow AI Agent analyzes → Classifies sentiment → Routes to appropriate team

## Real-World Integration Scenarios

### Customer Data Pipeline
```
Webhook (customer update) 
  → HTTP request (fetch from external CRM)
  → Code execute (transform data)
  → SQL Server (write to BizFirst DB)
  → Email (notify team)
  → Slack (log to audit channel)
```

### Order Processing with AI
```
Manual trigger (order form submit)
  → Flow AI Agent (validate, enrich, categorize)
  → If condition (is valid?)
    → True: Odoo (create order)
    → False: Email (send error to customer)
  → Loop (send confirmation to each recipient)
  → Slack (notify warehouse)
```

### Elasticsearch Indexing
```
Schedule trigger (daily)
  → SQL Server (query new records)
  → Loop (iterate records)
    → Code execute (transform to index doc)
    → Elasticsearch (index document)
  → Slack (report success/failure)
```

### Multi-Step Approval Workflow
```
Webhook (approval request)
  → Slack (post approval button)
  → Delay (wait for response, max 48 hours)
  → If condition (approved?)
    → True: HTTP request (call downstream service)
    → False: Email (notify requester of denial)
  → If condition (HTTP success?)
    → True: Update DB
    → False: Retry (with backoff)
```

### Human-in-the-Loop with AI
```
Trigger (document)
  → Flow AI Agent (initial analysis + summarization)
  → Slack (post summary, request human decision)
  → Delay (wait for reaction emoji)
  → Code execute (parse Slack response)
  → If condition (human approved?)
    → True: Execute business logic
    → False: Archive for review
```

## Authentication & Credentials

### Credential Types

| Type | Use Cases | Security |
|------|-----------|----------|
| **API Key** | Simple auth, third-party APIs | Key stored encrypted |
| **Basic Auth** | HTTP basic (user:pass) | Credentials encrypted |
| **Bearer Token** | OAuth2, JWT tokens | Token refresh handled |
| **OAuth2** | Gmail, Slack, many SaaS | Automatic token refresh |
| **Database** | SQL Server, MySQL | Encrypted connection string |
| **SSH Key** | Server access | Key stored securely |

### Credential Lifecycle in Workflows

1. **Define credential** in Credentials service
2. **Reference credential in node** (not embed)
3. **At execution time:** Decrypt, inject into node
4. **On expiration:** OAuth2 auto-refreshes
5. **On error:** Fail gracefully (not expose credential)

### Best Practices

- **Never hardcode** credentials in workflow
- **Always use references** to stored credentials
- **Rotate credentials** regularly (esp. API keys)
- **Minimal scope:** OAuth2 scopes should be minimal
- **Audit credentials:** Log access for compliance
- **Test credentials:** Validate before deploying

## Rate Limiting & Throttling

### Strategies

**Distributed calls:**
```
Loop (items) 
  → Parallel fork (3 concurrent HTTP calls)
  → Parallel join
  → Delay (1 second between batches)
  → Next batch
```

**Sequential with backoff:**
```
Loop (items)
  → HTTP request (with retry backoff)
  → Delay (throttle between calls)
```

**Queue-based:**
```
Webhook (receive job)
  → Sub-workflow (enqueue to processing queue)
  → Return immediately
  → External processor picks up asynchronously
```

### Common Rate Limits

| Service | Limit | Strategy |
|---------|-------|----------|
| **Slack** | 1 msg/sec per channel | Queue, batch |
| **Gmail** | 250 msg/user/min | Distribute across users |
| **HTTP REST** | Varies | Check headers, backoff |
| **BizFirst DB** | Per-tenant limits | Batch operations |

## Error Recovery Patterns

### Retry with Exponential Backoff
```
Try:
  HTTP request
Catch (timeout/5xx):
  Retry with backoff (1s, 2s, 4s, 8s, ...)
Finally:
  Log attempt count
```

### Circuit Breaker
```
If (error_count > 5 in last hour):
  Skip this service, use fallback
Else:
  Attempt normal call
```

### Graceful Degradation
```
Try:
  Primary API call
Catch (timeout/error):
  Use cached data from last success
Finally:
  Queue async retry
```

### Dead Letter Queue
```
Try:
  Process message
Catch (non-retryable error):
  Send to DLQ for manual review
  Alert team
  Continue with next item
```

## Testing Integrations

### Unit Testing (Per Node)
- Mock external service responses
- Test credential injection
- Verify data transformation
- Check error handling

### Integration Testing (Full Workflow)
- Use test credentials/endpoints
- Verify end-to-end data flow
- Test error paths
- Validate output

### Load Testing
- Parallel executions
- Large loops/batches
- Rate limit handling
- Resource contention

## Monitoring Integration Health

### Metrics
- **Response time:** Per-node latency
- **Error rate:** % failing per service
- **Success rate:** % completing end-to-end
- **Throughput:** Operations/minute

### Alerting
- **Service down:** >10% error rate
- **Credential expired:** OAuth2 refresh failure
- **Quota exceeded:** Rate limit hit
- **Timeout:** >5x baseline

## See Also

- [Node Types Reference](02-node-types.md) — HTTP, Email, Slack, Odoo nodes
- [Execution Flow](03-execution-flow.md) — Error handling, retry strategies
- [Testing Guide](05-testing-guide.md) — Integration test procedures
