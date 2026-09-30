# Check Existing API Key

**Purpose:** Procedure to verify if user has an existing valid API key before creating a new one.

## Overview

Before creating a new API key, check if user already has one stored somewhere. This saves time and prevents key proliferation.

---

## Step 1: Ask User

**Agent:** "Do you have an API key already? Where would it be stored?"

**User's options:**
- Password manager (1Password, LastPass, Bitwarden, KeePass)
- Environment file (.env, .env.local)
- Secure note (OneNote, Apple Notes)
- Email (saved from previous generation)
- Code repository (git secrets warning!)
- Other location

---

## Step 2: Retrieve Key

**If user has key:**

**Agent:** "Please provide your existing API key. I'll validate it and use it for this session."

Input: Text field (masked, shows only last 4 characters)

Example input:
```
sk_dev_****7a9b
```

---

## Step 3: Validate Key Format

Check key matches expected format:

```
sk_[env]_[32-char-alphanumeric]
```

Examples:
- ✅ `sk_dev_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p`
- ✅ `sk_prod_9z8y7x6w5v4u3t2s1r0q9p8o7n6m5l4k`
- ❌ `my_api_key_12345` (wrong format)
- ❌ `sk_dev_short` (too short)

**If invalid format:**
- Error: "This doesn't look like a valid API key format. API keys start with 'sk_'"
- Suggest: "Let me help you create a new one instead" → Create new key

---

## Step 4: Validate Key via API

**Agent:** "Testing your key... please wait."

Make test API call with key to verify:
- ✅ Key is valid (not revoked)
- ✅ Key has required scopes
- ✅ Key not expired
- ✅ Rate limits not exceeded

**Request example:**
```
GET https://dev.grippingly.com/api/v1/auth/validate
Headers: Authorization: Bearer {apikey}
```

**Response: Valid**
```
{
  "valid": true,
  "name": "ChatBot-Development-2026-09",
  "scopes": ["read", "write"],
  "expires": "2026-09-30",
  "created": "2026-03-30",
  "last_used": "2026-09-29 14:32:00"
}
```

---

## Step 5: Check Key Status

**Valid key indicators:**
- ✅ Key recognized by system
- ✅ Expiration date in future
- ✅ Not revoked
- ✅ Required scopes available

**Invalid key indicators:**
- ❌ **Revoked** — Key was manually disabled
  - **Recovery:** Create new key
- ❌ **Expired** — Expiration date passed
  - **Recovery:** Create new key with longer expiration
- ❌ **Insufficient scopes** — Key lacks required permissions
  - **Recovery:** Create new key with needed scopes
- ❌ **Rate limited** — Too many requests in short time
  - **Recovery:** Wait 1 minute, try again

---

## Step 6: Summary

**If key is valid:**
```
✅ API Key Validated
Name:        ChatBot-Development-2026-09
Status:      Active
Expires:     2026-09-30 (62 days remaining)
Scopes:      Read, Write
Last used:   2026-09-29 14:32:00
```

**Agent:** "Your API key is valid and ready to use! Using this key for your session."

**Next:** Proceed to [use-apikey-in-session.md](use-apikey-in-session.md)

---

**If key is invalid:**

**Agent:** "This key isn't valid. Let's create a new one instead."

Reasons displayed:
- "Key revoked on {date}"
- "Key expired on {date}"
- "Key missing required scopes: {scopes}"
- "Key is rate-limited (try again in 1 minute)"

**Next:** Proceed to [APIKeyQuestionnaire.md](APIKeyQuestionnaire.md) to create new key

---

## Error Handling

| Error | Cause | Recovery |
|-------|-------|----------|
| API validation timeout | Network issue | Retry after 5 seconds |
| 401 Unauthorized | Invalid/revoked key | Create new key |
| 403 Forbidden | Insufficient scopes | Revoke and create new key with more scopes |
| 429 Too Many Requests | Rate limited | Wait 1 minute, retry |
| Format error | Malformed input | Ask user to double-check key |

---

## Security Considerations

- 🔐 Never log full API key (only last 4 chars)
- 🚫 Never send key over unencrypted connection
- 📝 Never store key in version control
- ⏰ Validate key freshness (max age: 90 days)
- 🔄 Suggest rotation every 90 days
- 🛡️ Use HTTPS for all validation requests
