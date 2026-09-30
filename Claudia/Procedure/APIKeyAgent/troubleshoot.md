# Troubleshoot API Key Issues

**Purpose:** Diagnose and resolve API key problems.

---

## Quick Diagnostics

**Step 1: Identify the error**

| Error Message | Likely Cause | Go to Section |
|---------------|--------------|---------------|
| "401 Unauthorized" | Invalid/revoked/expired key | [Key Validation Failed](#key-validation-failed) |
| "403 Forbidden" | Insufficient scopes | [Insufficient Scopes](#insufficient-scopes) |
| "429 Too Many Requests" | Rate limited | [Rate Limited](#rate-limited) |
| "Key not found" | No API key set up | [No Key Created](#no-key-created) |
| "Form validation error" | Invalid form input | [Creation Failed](#creation-failed) |
| "Key already exists" | Name is duplicate | [Duplicate Key Name](#duplicate-key-name) |

---

## No Key Created

**Problem:** User doesn't have an API key yet.

**Symptoms:**
- Seeing "No API keys found" on Passport Admin Dashboard
- Error: "API key required but not configured"
- Session can't authenticate

**Solution:**

Follow [APIKeyQuestionnaire.md](APIKeyQuestionnaire.md) to create first key:
1. Answer questionnaire questions
2. Follow browser steps in [create-apikey-guided.md](create-apikey-guided.md)
3. Copy key and store securely
4. Return key to session

**Code check:**
```csharp
var apiKey = session.GetApiKey();
if (string.IsNullOrEmpty(apiKey))
{
    // No key configured - redirect to create
    logger.LogWarning("API key not configured");
    return RedirectTo(CreateKeyPage);
}
```

---

## Creation Failed

**Problem:** API key creation failed with error.

**Symptoms:**
- Form won't submit
- Error message on Passport Admin Dashboard
- Browser shows validation error

### Sub-case: Form Validation Errors

**Common errors:**

#### "Name is required"
- **Cause:** Key Name field is empty
- **Fix:** Enter a key name (e.g., "ChatBot-Dev-2026")
- **Format:** Alphanumeric + hyphens, 1-100 chars

#### "Invalid date"
- **Cause:** Expiration date is in the past
- **Fix:** Select a future date (use date picker)
- **Example:** Today is 9/30/2026, select 12/28/2026

#### "At least one scope required"
- **Cause:** No scopes checked
- **Fix:** Check at least Read or Write
- **Recommendation:** Start with Read, add Write if needed

#### "Invalid IP format"
- **Cause:** IP restriction format is wrong
- **Fix:** Use format X.X.X.X (e.g., 192.168.1.100)
- **Multiple IPs:** Comma-separated, e.g., "192.168.1.100, 10.0.0.50"

### Sub-case: Server-side Creation Error

**Error: "Name already exists"**
- **Cause:** API key with this name already created
- **Fix:** Use different name (add date/ID)
- **Example:** Instead of "ChatBot-Dev", use "ChatBot-Dev-2026-09"

**Error: "Too many active keys"**
- **Cause:** User has reached key limit
- **Fix:** Revoke unused keys first using [revoke-apikey.md](revoke-apikey.md)
- **Limit:** Typically 10-20 keys per user

**Error: "Database error" or "500 Internal Server Error"**
- **Cause:** Server-side issue
- **Fix:** 
  1. Wait 1 minute
  2. Try again
  3. If persists, contact admin

---

## Duplicate Key Name

**Problem:** Can't create key because name already exists.

**Symptoms:**
- Error: "API key name 'ChatBot-Dev' already exists"
- Form won't submit

**Check existing keys:**
1. Go to Passport Admin Dashboard API Keys page
2. Look for key with same name
3. Decide: revoke old one or use different name?

**Solutions:**

### Option 1: Use Different Name
```
Old name: ChatBot-Dev
New name: ChatBot-Dev-Session-2026-09
```
- Go back in form
- Change name
- Submit again

### Option 2: Revoke Old Key
```
1. Find old key in list: "ChatBot-Dev"
2. Click Revoke button
3. Confirm revocation
4. Try creating new key with same name
```

See [revoke-apikey.md](revoke-apikey.md) for detailed steps.

---

## Key Validation Failed

**Problem:** API key exists but won't authenticate.

**Symptoms:**
- Error: "401 Unauthorized"
- API calls fail with "Invalid authentication"
- Response: `{"error": "Invalid or expired API key"}`

### Check Key Status

**Run validation:**
```bash
# Test API key
curl -H "Authorization: Bearer sk_dev_xxxxx" \
  https://dev.grippingly.com/api/v1/auth/validate
```

**Expected success response:**
```json
{
  "valid": true,
  "name": "ChatBot-Dev-2026-09",
  "status": "active"
}
```

**Expected error response:**
```json
{
  "valid": false,
  "reason": "revoked",
  "message": "This API key has been revoked"
}
```

### Sub-case: Key Expired

**Symptoms:**
- Error: "API key has expired"
- In dashboard: Expiration date is past

**Check expiration:**
```sql
SELECT Name, ExpiresAt, Status
FROM APIKeys
WHERE Name = 'ChatBot-Dev-2026-09';

-- Result: ExpiresAt = 2026-09-01 (today is 2026-09-30)
-- Key is expired!
```

**Fix:**
1. Create new key with longer expiration
2. Use [APIKeyQuestionnaire.md](APIKeyQuestionnaire.md)
3. Select "90 days" or "Never expire"
4. Update session with new key
5. Revoke old key

### Sub-case: Key Revoked

**Symptoms:**
- Error: "API key has been revoked"
- In dashboard: Status shows "Revoked"

**Check status:**
```csharp
var key = await database.GetApiKeyAsync("ChatBot-Dev-2026-09");
if (key.Status == "Revoked")
{
    logger.LogError("API key has been revoked");
    // Must create new key
}
```

**Fix:**
1. Create new key using [APIKeyQuestionnaire.md](APIKeyQuestionnaire.md)
2. Cannot reactivate revoked key
3. Update all systems with new key
4. Verify new key works

### Sub-case: Wrong Key Format

**Symptoms:**
- Error: "Invalid API key format"
- Key doesn't match expected pattern

**Valid format:**
```
sk_{environment}_{32-char-alphanumeric}

Examples:
✓ sk_dev_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p
✓ sk_prod_9z8y7x6w5v4u3t2s1r0q9p8o7n6m5l4k
✗ my_api_key (wrong prefix)
✗ sk_dev_short (too short)
```

**Fix:**
1. Check you're using the correct key
2. Verify key was copied completely (no truncation)
3. Check for extra spaces
4. If key is lost, create new one

---

## Insufficient Scopes

**Problem:** API key doesn't have permission for requested operation.

**Symptoms:**
- Error: "403 Forbidden"
- Error: "API key lacks 'write' scope"
- Operation fails even though key is valid

**Check key scopes:**

```csharp
var response = await client.GetAsync(
    "https://dev.grippingly.com/api/v1/auth/validate",
    new { Authorization = "Bearer " + apiKey }
);

var json = JsonConvert.DeserializeObject<dynamic>(response);
var scopes = json.scopes; // ["read", "write"]
```

**Current scopes vs. needed scopes:**

| Operation | Scope Needed | Error If Missing |
|-----------|--------------|------------------|
| Read data | read | 403 Forbidden |
| Create resource | write | 403 Forbidden |
| Delete resource | delete | 403 Forbidden |
| Manage keys | admin | 403 Forbidden |

**Fix:**

1. **Option 1: Revoke and create new key with more scopes**
   - Go to [revoke-apikey.md](revoke-apikey.md)
   - Revoke old key
   - Use [APIKeyQuestionnaire.md](APIKeyQuestionnaire.md)
   - Select needed scopes (Read + Write + Delete)
   - Use new key

2. **Option 2: Use different key with needed scopes**
   - Check if another key has needed scopes
   - Use that key instead
   - Keep old key for other operations

---

## Rate Limited

**Problem:** Too many API calls in short time.

**Symptoms:**
- Error: "429 Too Many Requests"
- Response: `{"error": "Rate limit exceeded", "retry_after": 60}`

**Rate limits:**
```
Default: 1000 requests per minute per API key
Premium: 5000 requests per minute
```

**Check usage:**
```sql
SELECT COUNT(*) as CallCount, MAX(CreatedAt) as LastCall
FROM APICallLogs
WHERE ApiKeyLastFourChars = 'xxxx'
  AND CreatedAt > DATEADD(minute, -1, GETDATE());

-- Result: 1050 calls in last minute (exceeds 1000 limit)
```

**Fix:**

### Immediate:
1. Stop making API calls for 1-2 minutes
2. Wait for rate limit to reset
3. Retry request

### Short-term:
1. Implement exponential backoff:
```csharp
public async Task<T> CallWithRetryAsync<T>(Func<Task<T>> apiCall)
{
    int attempts = 0;
    while (attempts < 5)
    {
        try
        {
            return await apiCall();
        }
        catch (HttpRequestException ex) when (ex.StatusCode == 429)
        {
            var delayMs = (int)Math.Pow(2, attempts) * 1000; // 1s, 2s, 4s, 8s, 16s
            await Task.Delay(delayMs);
            attempts++;
        }
    }
    throw new Exception("Rate limit exceeded after retries");
}
```

2. Batch API calls (combine into fewer requests)
3. Distribute calls across longer time period

### Long-term:
1. Upgrade to Premium rate limit (if available)
2. Optimize code to make fewer API calls
3. Cache frequently accessed data

---

## Key Not in Session

**Problem:** Session can't find API key when needed.

**Symptoms:**
- Error: "API key not configured"
- Error: "GetApiKey() returned null"
- Session won't authenticate

**Check session initialization:**

```csharp
var session = app.ServiceProvider.GetService<ISessionManager>();
var apiKey = session.GetApiKey();

if (apiKey == null)
{
    logger.LogError("API key not set in session");
    // Retrieve from storage
}
```

**Solutions:**

1. **Key not stored in session:**
```csharp
// Set key in session
session.SetApiKey(apiKey);
session.SetApiKeyExpiry(expiresAt);
```

2. **Key expired from session:**
```csharp
// Refresh key
await session.RefreshApiKeyAsync();
```

3. **Key not retrieved from storage:**
```csharp
// Retrieve from environment/database
var key = await RetrieveApiKeyAsync(userId);
session.SetApiKey(key);
```

---

## API Call Timeout

**Problem:** API request takes too long or hangs.

**Symptoms:**
- Error: "Request timeout after 30 seconds"
- API endpoint not responding
- Partial response received

**Causes:**
- Network connectivity issue
- API server overloaded
- Large data response

**Fix:**

1. **Check network:**
```bash
ping dev.grippingly.com
tracert dev.grippingly.com
```

2. **Check API status:**
- Visit https://status.grippingly.com
- Check if API is operational

3. **Increase timeout (temporary):**
```csharp
var client = new HttpClient();
client.Timeout = TimeSpan.FromSeconds(60); // Default is 30s
```

4. **Retry with backoff:**
```csharp
for (int i = 0; i < 3; i++)
{
    try
    {
        return await apiCall.WithTimeout(30);
    }
    catch (TimeoutException)
    {
        await Task.Delay(1000 * (i + 1));
    }
}
```

---

## Contact Support

If issue persists:

1. **Gather information:**
   - API key last 4 characters (e.g., ...7a9b)
   - Error message (exact text)
   - Timestamp when error occurred
   - What operation failed
   - Any recent changes

2. **Contact admin/support:**
   - Email: support@company.com
   - Ticket system: [link]
   - Slack: #api-support
   - Include gathered information above

3. **Don't share:**
   - ❌ Full API key
   - ❌ Bearer token
   - ❌ Session credentials
   - ✅ Only last 4 chars of key

---

## Related Procedures

- [APIKeyQuestionnaire.md](APIKeyQuestionnaire.md) — Create key
- [check-existing-apikey.md](check-existing-apikey.md) — Validate key
- [create-apikey-guided.md](create-apikey-guided.md) — Step-by-step creation
- [revoke-apikey.md](revoke-apikey.md) — Revoke/disable key
- [use-apikey-in-session.md](use-apikey-in-session.md) — Use key
