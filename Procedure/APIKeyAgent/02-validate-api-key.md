# Validating an API Key — Step-by-Step

Guide to verify an API key is working and active.

## When to Validate

- After creating a new key (verify it works)
- Before relying on a key for production
- If a request is failing with auth errors
- Before sharing a key with others
- Regularly (monthly) for production keys

## Method 1: Quick Test with curl

```bash
curl -H "X-API-Key: YOUR_API_KEY" \
  https://api.example.com/test

# Success: Returns 200 OK
# Failure: Returns 401 Unauthorized or 403 Forbidden
```

## Method 2: Test in Passport Admin

1. Navigate to: https://dev.grippingly.com/passportadmindashboard/api-keys
2. Find your key in the list
3. Click on the key row
4. Look for:
   - ✅ **Status: Active** (key is working)
   - ❌ **Status: Expired** (key expired, needs rotation)
   - ❌ **Status: Revoked** (key deleted, cannot be recovered)

## Method 3: Test Programmatically

### JavaScript
```javascript
const apiKey = 'sk_prod_xyz789...';

fetch('https://api.example.com/test', {
  headers: {
    'X-API-Key': apiKey
  }
})
.then(res => {
  if (res.status === 200) {
    console.log('✅ Key is valid!');
  } else if (res.status === 401) {
    console.log('❌ Key is invalid or expired');
  }
});
```

### Python
```python
import requests

api_key = 'sk_prod_xyz789...'

response = requests.get(
    'https://api.example.com/test',
    headers={'X-API-Key': api_key}
)

if response.status_code == 200:
    print('✅ Key is valid!')
else:
    print(f'❌ Error: {response.status_code}')
```

## Interpreting Results

| Response | Meaning | Action |
|----------|---------|--------|
| **200 OK** | Key is valid and working | Continue using |
| **401 Unauthorized** | Key invalid, expired, or wrong | Check key value, check expiration, rotate if expired |
| **403 Forbidden** | Key valid but lacks permission | Check scopes, may need admin approval |
| **429 Too Many Requests** | Rate limit exceeded | Wait and retry, check rate limit setting |
| **500 Server Error** | Server problem, not key issue | Retry later, contact support if persists |

## Step-by-Step Validation

### 1. Verify Key Format

API keys should look like:
```
sk_prod_xyz789...    (production)
sk_dev_abc123...     (development)
sk_stage_def456...   (staging)
```

❌ **Red flags:**
- Doesn't start with `sk_`
- Contains spaces or special characters
- Very short (less than 20 characters)

### 2. Check Expiration

In Passport Admin:
1. Find your key in the list
2. Look at "Expires" column
3. Check if date has passed

```
Today: 2026-09-29
Expires: 2026-12-28 ✅ Still valid
Expires: 2026-09-15 ❌ Expired, needs rotation
```

### 3. Verify Scopes

Check your key has required permissions:

For **read operations**, need:
- ☑ `read` scope

For **write operations**, need:
- ☑ `write` scope

For **admin operations**, need:
- ☑ `admin` scope

If scope missing, rotate with correct scopes.

### 4. Test API Call

```bash
# Replace with your actual key
API_KEY="sk_prod_xyz789..."

curl -v \
  -H "X-API-Key: $API_KEY" \
  https://api.example.com/test
```

Check response:
- **Success:** Status 200, returns data
- **Failed:** Status 401/403, error message

### 5. Check Audit Logs

In Passport Admin, view recent activity:

1. Click on your key
2. Click "Activity" or "Logs"
3. Check recent usage:
   - Timestamp of last use
   - Status (success or error)
   - What operation was attempted

If no activity for months, key might be forgotten or unused.

## Troubleshooting

### "401 Unauthorized"

**Possible causes:**
1. Key value is wrong (typo)
   → Double-check the key value
2. Key is expired
   → Check expiration date, rotate if needed
3. Using wrong format
   → Use `X-API-Key: {key}` header format
4. Key never existed
   → Create a new key

**Solution:**
```bash
# Verify key format
echo $API_KEY  # Should show sk_prod_...

# Check key in dashboard
# Navigate to https://dev.grippingly.com/passportadmindashboard/api-keys
# Verify key is in the list and status is Active
```

### "403 Forbidden"

**Cause:** Key valid but doesn't have required permission

**Solution:**
1. Check what scope you need (read/write/admin)
2. Check your key has that scope (in dashboard)
3. If scope missing:
   - Option A: Create new key with correct scopes
   - Option B: Ask admin to add scope to key

### "429 Too Many Requests"

**Cause:** Hit rate limit (too many requests too fast)

**Solution:**
1. Wait a few minutes
2. Check rate limit setting (in dashboard)
3. Increase rate limit if needed (contact admin)
4. Reduce request frequency in your code

## Validation Checklist

- ☑ Key format is correct (starts with `sk_`)
- ☑ No typos in key value
- ☑ Key status is "Active" (not Expired/Revoked)
- ☑ Key hasn't expired (check date)
- ☑ Key has required scopes
- ☑ Test API call returns 200 OK
- ☑ No rate limit errors
- ☑ Key usage shows in audit logs

**If all checks pass:** Key is valid and ready to use!

---

## Best Practices

**Regular validation:**
- After creation: Test immediately
- Monthly: Check status in dashboard
- Quarterly: Rotate before expiration
- On errors: Validate before assuming other issues

**Team keys:**
- Validate after sharing with new person
- Check audit logs for unexpected usage
- Validate before production deployment

**Production:**
- Always validate before relying on a key
- Test with actual production data
- Monitor logs for auth failures
- Rotate quarterly (every 90 days)

---

**Time:** 2-5 minutes
**Difficulty:** Easy
**Frequency:** Monthly recommended, always after creation
