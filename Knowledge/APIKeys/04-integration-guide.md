# Integration Guide — Using API Keys in Sessions

## How APIKeyAgent Uses API Keys

The **APIKeyAgent** manages API key generation and usage within a user session. Here's how:

## Interaction Flow

### Scenario 1: User Has an API Key

```
User: "I want to create a workflow"

APIKeyAgent: "Great! To create a workflow, I need API access.
              Do you have an API key?"

User: "Yes, I have one"

APIKeyAgent: "Perfect! Please provide your API key.
              (It won't be logged or stored after this session)
              Paste it here:"

User: [Pastes key: ]

APIKeyAgent: "✓ Key validated successfully!
              Scopes: execute:workflows, read:apps, write:data
              Expiration: 2024-12-31
              Ready to build your workflow!"

[Agent proceeds with workflow creation using key]
```

### Scenario 2: User Doesn't Have an API Key

```
User: "I want to execute a workflow"

APIKeyAgent: "I need API access to execute workflows.
              Do you have an API key?"

User: "No, I don't have one"

APIKeyAgent: "No problem! I'll guide you to create one.

              Step 1: Open this URL in a new tab:
              https://dev.grippingly.com/passportadmindashboard/api-keys

              Step 2: Click 'Create API Key'

              Step 3: Fill in the form:
                • Name: 'AI Session - [Today's Date]'
                • Description: 'For AI agent session'
                • Scopes: Check ☑ execute:workflows
                          Check ☑ read:apps
                          Check ☑ write:data
                • Expiration: 24 hours
                • Click 'Create'

              Step 4: A modal will show your key.
              Copy it and paste it here."

[User follows steps and copies key]

User: [Pastes key: ]

APIKeyAgent: "✓ Key received and validated!
              Your session is now authenticated.
              Ready to execute workflows!"

[Session continues with authenticated access]
```

---

## API Key Storage & Security in Session

### Session Memory (Session Keys)

For the duration of your conversation:

**Storage:**
```
┌─────────────────────────────────────────┐
│ Agent Session Memory                    │
├─────────────────────────────────────────┤
│ api_key:            │
│ key_expires: 2024-12-31 14:32:45       │
│ key_scopes: [execute, read, write]     │
│ authenticated: true                     │
│ session_start: 2024-12-30 14:32:45     │
│ session_expires: 2024-12-31 14:32:45   │
└─────────────────────────────────────────┘
```

**Lifecycle:**
- Key added to memory when user provides it
- Key used in all API calls during session
- Key **NOT** logged anywhere
- Key **NOT** saved to files
- Key **NOT** sent to external services
- Key discarded when session ends
- Memory cleared for next user

### For Integration Keys

If you're building a persistent integration:

**Storage Options:**
1. **Environment Variables:**
   ```bash
   export BIZFIRST_API_KEY="..."
   ```

2. **Configuration File (`.env`):**
   ```
   BIZFIRST_API_KEY=...
   BIZFIRST_TENANT_ID=tenant_123
   ```
   
   **Add to `.gitignore`:**
   ```
   .env
   .env.local
   *.key
   ```

3. **Vault (Recommended for Production):**
   ```bash
   vault write secret/bizfirst api_key="..."
   vault read secret/bizfirst
   ```

---

## Using API Keys in API Calls

### Header Format

Every API request needs the key in the Authorization header:

```
Authorization: Bearer 
```

### Example Requests

**Execute a Workflow:**
```bash
curl -X POST https://api.bizfirst.com/v1/workflows/execute \
  -H "Authorization: Bearer " \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "workflow_123",
    "inputs": {
      "name": "John",
      "email": "john@example.com"
    }
  }'
```

**Read an App:**
```bash
curl https://api.bizfirst.com/v1/apps/app_456 \
  -H "Authorization: Bearer "
```

**Create Form Data:**
```bash
curl -X POST https://api.bizfirst.com/v1/forms/form_789/data \
  -H "Authorization: Bearer " \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane",
    "email": "jane@example.com",
    "phone": "+1-555-1234"
  }'
```

### Python Example

```python
import requests
import os

# Get key from environment or user input
api_key = os.getenv('BIZFIRST_API_KEY')
if not api_key:
    api_key = input("Enter your API key: ")

# Set headers
headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

# Execute workflow
response = requests.post(
    "https://api.bizfirst.com/v1/workflows/execute",
    headers=headers,
    json={
        "workflowId": "workflow_123",
        "inputs": {"name": "Alice"}
    }
)

if response.status_code == 200:
    print("✓ Workflow executed successfully")
    print(response.json())
else:
    print(f"✗ Error: {response.status_code}")
    print(response.json())
```

### JavaScript Example

```javascript
const apiKey = process.env.BIZFIRST_API_KEY;

const executeWorkflow = async (workflowId, inputs) => {
    try {
        const response = await fetch(
            'https://api.bizfirst.com/v1/workflows/execute',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    workflowId: workflowId,
                    inputs: inputs
                })
            }
        );

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const result = await response.json();
        console.log('✓ Workflow executed:', result);
        return result;
    } catch (error) {
        console.error('✗ Error:', error.message);
    }
};

// Usage
executeWorkflow('workflow_123', { name: 'Bob' });
```

---

## Error Handling

### 401 Unauthorized

**Cause:** Invalid, expired, or missing API key

**Response:**
```json
{
  "error": "Unauthorized",
  "message": "Invalid API key",
  "code": 401
}
```

**Recovery:**
1. Check if key is correct (copy-paste from dashboard)
2. Check if key has expired
3. Create new key if needed
4. Verify scopes include required operation

**Code:**
```python
if response.status_code == 401:
    print("API key is invalid or expired")
    print("Create a new key in the Passport Admin Dashboard")
```

### 403 Forbidden

**Cause:** Key doesn't have permission for this operation

**Response:**
```json
{
  "error": "Forbidden",
  "message": "Insufficient permissions: requires scope 'execute:workflows'",
  "code": 403
}
```

**Recovery:**
1. Edit key in dashboard
2. Add missing scope
3. Wait 30 seconds for propagation
4. Retry request

**Code:**
```python
if response.status_code == 403:
    print("Key doesn't have permission for this operation")
    print("Edit the key to add required scopes in the dashboard")
```

### 429 Too Many Requests

**Cause:** Rate limit exceeded

**Response:**
```json
{
  "error": "Rate Limited",
  "message": "Too many requests. Limit: 1000 req/min",
  "code": 429,
  "retryAfter": 60
}
```

**Recovery:**
1. Wait before retrying
2. Increase rate limit in key settings
3. Implement request throttling in code
4. Batch operations

**Code:**
```python
import time

if response.status_code == 429:
    retry_after = int(response.headers.get('Retry-After', 60))
    print(f"Rate limited. Waiting {retry_after} seconds...")
    time.sleep(retry_after)
    # Retry request
```

### 500 Server Error

**Cause:** Server-side issue (not your key's fault)

**Response:**
```json
{
  "error": "Internal Server Error",
  "message": "Something went wrong processing your request",
  "code": 500,
  "requestId": "req_123abc"
}
```

**Recovery:**
1. Note the `requestId`
2. Wait a moment and retry
3. If persists, report with `requestId` to support

---

## Best Practices for Sessions

✓ **Do:**
- Ask user for key when needed
- Validate key works (test API call)
- Store key in session memory only
- Use HTTPS for all requests
- Handle errors gracefully
- Tell user when session ends

❌ **Don't:**
- Print key to console
- Log key in debug output
- Save key to files
- Commit key to Git
- Share key with other services
- Assume key is valid forever

---

## Session Lifecycle Example

```
[Session Starts]
  ↓
Agent: "Do you have an API key?"
User: "No"
  ↓
Agent guides to create key
User creates and returns key
  ↓
Agent: "✓ Key validated. Ready to go!"
Agent stores: {api_key: "...", expires: "24h"}
  ↓
[Session Operations]
  - User requests workflow creation
  - Agent uses key in API calls
  - Key stored in memory only
  - No logging of key
  ↓
[Session Ends]
  - Agent: "Your session is ending"
  - Agent: "The API key is no longer valid"
  - Memory cleared
  - Session ends
  ↓
[Next Session]
  - Fresh start
  - Ask for new key again
  - Or create new key in dashboard
```

---

## FAQs

**Q: Can I reuse the same key across multiple sessions?**
A: Yes, for integration keys. For session keys, it's better to create a new one per session for security. The agent will ask each time.

**Q: What happens if my key expires during the session?**
A: API calls will start returning 401 errors. You'll need to create a new key and restart the session.

**Q: Can I use the same key for multiple agents?**
A: Yes, if all agents need the same permissions. For better security, create separate keys per agent/integration.

**Q: Is my key secure if I paste it here?**
A: The agent keeps it in memory only during this session. It's encrypted in transit (HTTPS). Once the session ends, the key is discarded.

**Q: What if I accidentally share my key?**
A: Revoke it immediately in the dashboard. Create a new one. An old key can't be used once revoked.

**Q: Can I test my key before using it?**
A: Yes. The agent will validate it by making a test API call (usually a read operation).

**Q: What scopes do I need?**
A: Depends on what you want to do. Minimal example:
   - `read:apps` — View apps
   - `execute:workflows` — Run workflows
   - `write:data` — Create/update data

---

**Next:** [API Key Lifecycle](03-api-key-lifecycle.md) for rotation and retirement
