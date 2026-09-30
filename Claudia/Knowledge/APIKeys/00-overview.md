# API Keys — Overview

API keys are secure tokens used to authenticate requests to the BizFirst platform. They enable secure, scoped access to APIs.

## What is an API Key?

An API key is a unique identifier that proves your identity to the API. Instead of using username/password for every request, you provide an API key:

```bash
curl -H "X-API-Key: sk_prod_xyz789..." https://api.example.com/data
```

## Key Concepts

### Authentication vs. Authorization

- **Authentication:** "Who are you?" (API key proves your identity)
- **Authorization:** "What can you do?" (scopes define permissions)

### Scopes

Scopes limit what an API key can do. Examples:

| Scope | Permissions | Use Case |
|-------|------------|----------|
| `read` | Fetch data, query, get status | Reporting, monitoring |
| `write` | Create, update, modify data | Data sync, form submission |
| `delete` | Remove data | Data cleanup (use carefully!) |
| `admin` | Full control, manage users | Admin panels only |

**Best practice:** Use the minimum scope needed.

### Expiration

Every API key has an expiration date. After that date, requests fail and you need a new key.

**Recommended expiration periods:**
- **Development:** None or 1 month (non-critical, temporary)
- **Staging:** 6 months (semi-permanent)
- **Production:** 90 days (rotate quarterly for security)

## Types of API Keys

### 1. Session Keys
- Temporary, created for current session
- Automatically revoked when session ends
- Use case: One-time scripts, testing

### 2. Integration Keys
- Service-to-service authentication
- Permanent (until rotated)
- Use case: App accessing backend API

### 3. Personal Keys
- For individual developers
- Not shared with others
- Use case: Local development, debugging

### 4. Service Keys
- For backend services
- High-privilege, restricted scopes recommended
- Use case: Microservices, cross-service calls

### 5. Webhook Keys
- For receiving events from external systems
- HMAC signing recommended
- Use case: Slack, Salesforce webhooks

## Security Model

### Storage

✅ **Secure storage:**
- Password manager (1Password, LastPass)
- Environment variables (development)
- Secrets vault (team/production)
- Database encryption (last resort)

❌ **Never:**
- Hardcoded in code
- Commit to version control
- Send via email/chat
- Log in application logs
- Store in browser localStorage

### Access Control

**Who should have access?**
- **Personal keys:** Only you
- **Team keys:** Only authorized team members
- **Service keys:** Only the service
- **Public webhooks:** External system only

**How to share safely:**
1. Generate the key
2. Share via secure channel (1Password link, vault access)
3. User must view and copy immediately
4. Never resend the key
5. Rotate after sharing to new person

### Monitoring

Monitor key usage:
- Check audit logs regularly
- Alert on unusual activity
- Track creation/rotation dates
- Monitor for expired keys

## API Key Lifecycle

```
1. Create
   ↓
2. Use (in development/production)
   ↓
3. Monitor (watch for expiration, abuse)
   ↓
4. Rotate (create new, revoke old)
   ↓
5. Delete (when no longer needed)
```

## Common Tasks

### I need an API key
→ Follow `Procedure/APIKeyAgent/create-api-key.md`

### My key is expired
→ Follow `Procedure/APIKeyAgent/rotate-api-key.md`

### I don't know if my key works
→ Follow `Procedure/APIKeyAgent/validate-api-key.md`

### I need to revoke a key
→ Follow `Procedure/APIKeyAgent/revoke-api-key.md`

### I lost my key
→ You cannot recover it. Create a new key.

## Best Practices

**Before Creating:**
- Determine environment (dev/staging/prod)
- Decide required scopes (read, write, admin?)
- Set appropriate expiration
- Plan rotation schedule

**After Creating:**
- Store immediately in secure location
- Document where you're using it
- Test that it works
- Set calendar reminder for rotation
- Never share the full key

**Ongoing:**
- Monitor expiration dates (rotate quarterly for prod)
- Check audit logs (monthly)
- Remove unused keys
- Rotate if compromised
- Update team on key rotation policy

**Team Sharing:**
- Only via secure channel (vault, password manager)
- User must be present to view/copy
- Rotate when team member changes
- Document who has access
- Use audit logs to verify usage

## Troubleshooting

### Key not working
- Check if expired
- Verify correct scopes
- Test with sample request
- Check IP whitelist (if enabled)
- See `Knowledge/APIKeys/06-troubleshooting.md`

### Can't find my key
- Check email (might be in notification)
- Look in password manager
- Check with colleagues (shared keys)
- If truly lost, create new key

### Key was leaked
- Revoke immediately
- Create new key
- Update all services using it
- Check audit logs for abuse
- Document incident

## Integration Methods

### Raw HTTP Requests
```bash
curl -H "X-API-Key: sk_prod_..." https://api.example.com/data
```

### SDK/Library
```javascript
const api = new BizFirstAPI({ apiKey: process.env.API_KEY });
```

### Workflow Nodes
```
Workflow → API Node → Configure with API key
```

### Third-Party Services
```
Zapier → BizFirst → Authenticate with API key
```

## Related Documentation

- `01-key-types.md` — Different key types in detail
- `02-security-model.md` — Security best practices
- `03-passport-dashboard.md` — Dashboard walkthrough
- `04-api-reference.md` — REST API reference
- `05-integration-patterns.md` — How to use keys
- `06-troubleshooting.md` — Common issues
- `Procedure/APIKeyAgent/` — Step-by-step guides

## Summary

API keys enable secure API authentication. Use scoped keys, rotate regularly (every 90 days for production), store securely, and monitor usage. When in doubt, ask the APIKeyAgent or consult the knowledge base.
