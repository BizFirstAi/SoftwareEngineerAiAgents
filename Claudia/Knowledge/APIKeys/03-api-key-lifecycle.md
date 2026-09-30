# API Key Lifecycle

## The Complete Journey of an API Key

```
CREATE → CONFIGURE → DEPLOY → USE → MONITOR → ROTATE → RETIRE
```

---

## Phase 1: Creation

**When:** You need API access (new session, integration, service)

**Process:**
1. Navigate to Passport Admin Dashboard
2. Click "Create API Key"
3. Fill in Name, Description, Scopes, Expiration
4. Click "Create"
5. Copy the key immediately (only shown once)
6. Store securely

**What You Get:**
- Unique key string (format: `...` or `sk_test_...`)
- Creation timestamp
- Expiration date (if set)
- Associated scopes/permissions

**Key Decision:** What type of key?
- **Session:** Expires in 24 hours, for this conversation
- **Integration:** Expires in 90 days, for external systems
- **Service:** Expires in 1 year, for backend services
- **Agent:** Auto-expires, for workflows

---

## Phase 2: Secure Storage

**Critical Step:** Your key is your password. Store it securely.

### For Session Keys (This Agent's Use)

**Storage Location:**
- In memory during session only
- Not in logs or debug output
- Not saved to files
- Encrypted in transit (HTTPS)

**Handling:**
```
User provides key → Agent stores in memory → Uses in API calls → Session ends → Key discarded
OR
Agent generates key → Stores in secure location → Uses for session → Tells user
```

**Never:**
- Print to console
- Log to file
- Commit to Git
- Email unencrypted
- Share with others

### For Integration Keys

**Storage Location:**
- Environment variable: `INTEGRATION_API_KEY=sk_...`
- Configuration management system
- Vault (HashiCorp, AWS Secrets Manager, Azure Key Vault)
- `.env` file (local development only, `.gitignore`d)

**Example `.env` file:**
```
BIZFIRST_API_KEY=
BIZFIRST_API_URL=https://api.bizfirst.com
ZAPIER_WEBHOOK_ID=webhook_123
```

**Example application code:**
```python
import os
api_key = os.getenv('BIZFIRST_API_KEY')
# Use api_key in requests
```

### For Service Keys

**Storage Location:**
- HashiCorp Vault (preferred)
- AWS Secrets Manager
- Azure Key Vault
- Encrypted configuration management
- Never in source code

**Vault example:**
```
vault write secret/bizfirst-service key_value="..."
vault read secret/bizfirst-service
```

---

## Phase 3: Using Your Key

### In API Requests

**Header-based authentication:**
```
Authorization: Bearer 
```

**In HTTP request:**
```bash
curl -H "Authorization: Bearer " \
  https://api.bizfirst.com/workflows/execute
```

**In Python:**
```python
import requests

headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}
response = requests.post(
    "https://api.bizfirst.com/workflows/execute",
    headers=headers,
    json={"workflowId": "workflow_123"}
)
```

**In JavaScript:**
```javascript
const apiKey = process.env.BIZFIRST_API_KEY;

fetch('https://api.bizfirst.com/workflows/execute', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ workflowId: 'workflow_123' })
});
```

### In Agent Sessions

The APIKeyAgent handles this:

1. **Ask user:** "Do you have an API key?"
2. **If yes:** User provides it (copy-paste)
3. **If no:** Guide them to create one via dashboard
4. **Once provided:** Store temporarily in session memory
5. **Use in API calls:** Include in request headers
6. **On session end:** Discard key from memory
7. **Tell user:** "Session ended, key is no longer valid"

---

## Phase 4: Monitoring & Auditing

### Check Usage

**In Dashboard:**
1. Go to API Keys page
2. Click on the key name
3. View "Last Used" timestamp
4. See "Usage Statistics" (requests per day)

**What to look for:**
- ✓ Normal patterns (expected times and frequency)
- ❌ Unexpected usage (3 AM when normally sleeping)
- ❌ Excessive requests (sudden spike)
- ❌ Unusual IP addresses (request from unknown location)

### Access Logs

**In Audit section:**
1. Navigate to "Logs" or "Audit Trail"
2. Filter by API Key
3. See every request made with the key
4. Details include: timestamp, operation, resource, status

**Example log entry:**
```
2024-01-15 14:32:45  Bearer   execute:workflows  workflow_123  Success  200 OK
2024-01-15 14:33:10  Bearer   read:apps         app_456      Success  200 OK
2024-01-15 14:33:45  Bearer   write:data        table_789    Success  201 Created
```

### Alert Triggers

Set up alerts for:
- **High request rate:** >1000 req/min
- **Unusual timing:** Requests at 3 AM
- **Permission errors:** Denied access attempts (indicates key misuse)
- **Geographic anomaly:** Request from unexpected country
- **Expiration warning:** 7 days before expiry

---

## Phase 5: Rotation (Renewal)

**Why rotate?** Regular key changes reduce risk if a key is compromised.

### Rotation Schedule

| Key Type | Rotation | Why |
|----------|----------|-----|
| Session | Per session | Unique per conversation |
| Integration | Monthly | Industry standard |
| Service | Annually | Less frequent (more secure storage) |
| Agent | Auto | Expires with workflow |

### Manual Rotation Process

**For Integration Keys:**

1. **Create new key**
   - Go to API Keys page
   - Click "Create API Key"
   - Name: `[OldName]-v2` (version indicator)
   - Use same scopes as old key
   - Set same expiration as planned
   - Click "Create"
   - Copy new key

2. **Update everywhere the old key is used**
   - Update environment variable
   - Update vault
   - Update integration partner config
   - Update CI/CD secrets
   - Notify any third parties

3. **Test with new key**
   - Verify all integrations work
   - Check logs for errors
   - Monitor for issues (24 hours)

4. **Revoke old key**
   - Go to API Keys page
   - Find old key
   - Click "..." menu
   - Select "Revoke"
   - Confirm revocation

5. **Document rotation**
   - Record new key ID
   - Note in rotation log
   - Set reminder for next rotation (30 days)

### Automated Rotation (Best Practice)

For service keys, set up automated rotation:

```
Day 1: Create new key
Day 1: Deploy new key to all services
Day 2: Monitor (ensure all services using new key)
Day 7: Revoke old key
```

---

## Phase 6: Troubleshooting

### Key Returns 401 Unauthorized

**Causes:**
- Key has expired
- Key has been revoked
- Key is malformed (missing characters)
- Scopes insufficient for operation

**Solutions:**
1. Check expiration date in dashboard
2. Verify key hasn't been revoked
3. Copy key again (ensure exact match)
4. Check scopes (e.g., `execute:workflows` needed for workflow execution)
5. If expired or revoked: Create new key

### Key Returns 403 Forbidden

**Cause:** Key exists but doesn't have permission for operation

**Example:**
```
Request: execute:workflows (key only has read:workflows)
Response: 403 Forbidden - Insufficient permissions
```

**Solution:**
1. Edit the key in dashboard
2. Add required scope
3. Wait ~30 seconds for propagation
4. Retry request

### Rate Limiting (429 Too Many Requests)

**Cause:** Exceeded requests per minute limit

**Solutions:**
1. Slow down request frequency
2. Edit key to increase rate limit
3. Use caching to avoid repeated calls
4. Batch operations together

### Suspicious Activity Detected

**Signs:**
- Unexpected requests in audit log
- Requests from unknown IP
- Requests at unusual times
- Failed permission errors

**Actions:**
1. Revoke key immediately
2. Check access logs for scope of breach
3. Create new key
4. Change passwords if concerned
5. Enable IP whitelisting on new key

---

## Phase 7: Decommissioning

### When to Retire a Key

- Service is being shut down
- Key has been compromised
- Integration is discontinued
- Employee leaves the company
- Key exceeds rotation schedule

### Retirement Process

**Option 1: Revoke (Immediate)**
```
In Dashboard:
  API Keys → [Select Key] → Revoke
  Status: Revoked
  Effect: Immediate (stops working now)
```

**Option 2: Expire (Planned)**
```
In Dashboard:
  API Keys → [Select Key] → Edit
  Expiration: Tomorrow
  Effect: Stops working at expiration time
```

**Option 3: Delete (Cleanup)**
```
In Dashboard:
  API Keys → [Select Key] → Delete
  Effect: Removed from list permanently
  Note: Can revoke first, delete later
```

### Post-Retirement

1. **Update systems** — Remove key references
2. **Notify users** — If key was shared
3. **Audit logs** — Archive for compliance
4. **Monitor** — Ensure nothing broke
5. **Document** — Record why key was retired

---

## Lifecycle Summary Table

| Phase | Duration | Action | Owner |
|-------|----------|--------|-------|
| Create | 5 min | Generate key, copy, store | User/Agent |
| Store | Ongoing | Secure storage, encrypt | User/DevOps |
| Deploy | 30 min | Add to configs, test | DevOps/Developer |
| Use | Weeks/Months | API calls, integration | Application |
| Monitor | Daily | Check usage, alerts | DevOps |
| Rotate | Monthly | Create new, update all, revoke old | DevOps |
| Retire | On demand | Revoke/expire, cleanup | Admin |

---

## Best Practices Checklist

✓ **Creation**
- [ ] Used descriptive name
- [ ] Documented purpose
- [ ] Selected minimal scopes needed
- [ ] Set appropriate expiration

✓ **Storage**
- [ ] Stored in environment variable or vault
- [ ] Not hardcoded in source
- [ ] Not committed to Git
- [ ] Not shared via chat/email

✓ **Usage**
- [ ] Used in Authorization header
- [ ] Not logged or printed
- [ ] HTTPS only (never HTTP)
- [ ] TLS certificate validation enabled

✓ **Monitoring**
- [ ] Checked usage periodically
- [ ] Reviewed access logs
- [ ] Set up alerts
- [ ] Verified expected patterns

✓ **Rotation**
- [ ] Rotated monthly (integration) or annually (service)
- [ ] Created new key before revoking old
- [ ] Updated all systems using key
- [ ] Tested with new key
- [ ] Documented rotation

✓ **Retirement**
- [ ] Revoked compromised keys immediately
- [ ] Removed from all systems
- [ ] Archived audit logs
- [ ] Notified affected parties
