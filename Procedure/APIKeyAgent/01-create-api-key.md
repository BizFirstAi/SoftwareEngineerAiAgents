# Creating an API Key — Step-by-Step

Guide to creating a new API key via Passport Admin Dashboard.

## Prerequisites

- Access to Passport Admin Dashboard
- Passport credentials (username/password)
- Completion of APIKeyQuestionnaire.md (know your needs)

## Step 1: Navigate to Passport Admin Dashboard

```
URL: https://dev.grippingly.com/passportadmindashboard/api-keys
```

Or:
1. Open Passport Admin Dashboard
2. Click "Settings" or "Configuration"
3. Click "API Keys"

## Step 2: Login (if needed)

If not logged in:
1. Enter your Passport username
2. Enter your password
3. Click "Login"

## Step 3: Click "Generate New Key"

In the API Keys section, find the button labeled:
- "Generate New Key"
- "Create API Key"
- "+" icon
- "New Key" button

Click it.

## Step 4: Enter Key Details

A form appears. Fill in:

### Key Name (required)
Suggested naming pattern: `{environment}-{purpose}-{expiration}`

Examples:
- `dev-testing-30d`
- `prod-data-sync-90d`
- `staging-webhook-6m`
- `my-app-read-only`

Keep it descriptive but short.

### Scopes (required)
Select the permissions this key needs:

- ☐ `read` — Fetch data, query, get status
- ☐ `write` — Create, update, modify data
- ☐ `delete` — Delete data (use carefully)
- ☐ `admin` — Full control

**Recommendation:** Start with read-only if possible.

### Expiration (required)
Choose when this key should expire:

- Never (development only)
- 30 days
- 90 days (⭐ recommended for production)
- 6 months (⭐ recommended for staging)
- 1 year
- Custom date [picker]

### IP Whitelist (optional)
Restrict API calls to specific IP addresses.

Example: `203.0.113.45` or `203.0.113.0/24`

Leave blank for no restriction.

### Rate Limit (optional)
Limit number of requests per minute.

Default: 1000 req/min

Adjust if needed.

## Step 5: Review

Check all settings:
```
✓ Name: prod-data-sync-90d
✓ Scopes: read, write
✓ Expires: 2026-12-28 (90 days)
✓ IP Whitelist: None
✓ Rate Limit: 1000 req/min
```

If correct, proceed. If not, click "Edit" or "Back".

## Step 6: Click "Create Key"

Button label might be:
- "Create"
- "Generate"
- "Create API Key"
- "Confirm"

Click it.

## Step 7: Copy Your Key Immediately

**CRITICAL:** Your API key is shown only once!

Screen shows:
```
✅ API Key Created Successfully

Key ID: key_abc123def456
API Key: sk_prod_xyz789uvw012...

⚠️ This is your only chance to see the full key.
Copy it now and store securely.

[Copy to Clipboard]
```

Actions:
1. Click "Copy to Clipboard" button, OR
2. Manually select and copy the key
3. Paste it immediately in password manager or secure location

Do NOT close this screen until you've copied the key!

## Step 8: Confirm and Store

After copying:
1. Click "Done" or "Confirm"
2. Key is created and ready to use
3. You should see it listed on the API Keys page

### Store the Key Securely

**Best options (in order):**
1. Password Manager (1Password, LastPass, Bitwarden)
2. Environment variable (.env file in project, NOT committed)
3. Secrets vault (production)
4. Encrypted notes application

**Never:**
- Write on paper and leave lying around
- Store in shared drive unencrypted
- Hardcode in source code
- Commit to version control
- Email to anyone

## Step 9: Test Your Key

Test that the key works:

```bash
# Test with curl
curl -H "X-API-Key: sk_prod_xyz789..." \
  https://api.example.com/test

# Expected response: 200 OK
```

If it fails, check:
- Key is correct (no typos)
- Not expired
- Correct scopes
- IP whitelist not blocking you

## Step 10: Document & Set Reminders

Document where you're using the key:

```
Key: prod-data-sync-90d
ID: key_abc123def456
Expires: 2026-12-28
Purpose: Sync customer data to Salesforce
Used by: data-sync service on prod-server-5
Rotation reminder: Set for 2026-12-14 (2 weeks before)
Created: 2026-09-29
```

**Set calendar reminder** to rotate before expiration:
- Production (90d): Reminder at 75 days (~Dec 14)
- Staging (6m): Reminder at 5 months (~Feb 29)
- Development: No reminder needed (not critical)

---

## Troubleshooting

### "Key already exists with this name"
→ Use a different name (add timestamp or version number)

### "Invalid scope"
→ Check scopes are valid (read, write, delete, admin)

### "Date in the past"
→ Expiration date must be in the future

### "Key creation failed"
→ Reload page and try again, or contact support

### "I forgot to copy the key"
→ You must create a new key. The old one cannot be recovered.

---

## Success Checklist

- ☑ Logged in to Passport Admin
- ☑ Entered descriptive key name
- ☑ Selected appropriate scopes
- ☑ Set expiration date
- ☑ Reviewed all settings
- ☑ Created key
- ☑ Copied key immediately
- ☑ Stored securely (password manager)
- ☑ Tested key works
- ☑ Set renewal reminder
- ☑ Documented usage

**All done!** Your API key is ready to use.

---

**Time:** 5-10 minutes
**Difficulty:** Easy
**Security:** Follow all steps to keep key secure
