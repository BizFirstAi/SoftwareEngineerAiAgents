# APIKeyAgent Procedures

Step-by-step guides for managing API keys through the APIKeyAgent.

## Quick Navigation

- **create-api-key.md** — Create a new API key (step-by-step)
- **validate-api-key.md** — Validate an existing key
- **rotate-api-key.md** — Rotate to a new key
- **revoke-api-key.md** — Revoke/delete a key
- **APIKeyQuestionnaire.md** — Interactive questionnaire for key creation

## Getting Started

### For New Users
1. Start with **APIKeyQuestionnaire.md** (guides you through questions)
2. Follow **create-api-key.md** (step-by-step dashboard walkthrough)
3. Test with your key (follow verification steps)

### For Existing Keys
1. Use **validate-api-key.md** (check if key still works)
2. If expired, follow **rotate-api-key.md** (create replacement)
3. Use **revoke-api-key.md** to clean up old keys

## Key Concepts

**API Key:** Secure token for API authentication. Never share. Store securely.

**Scopes:** Permissions (read, write, admin). Start with minimal needed.

**Expiration:** When key stops working. Production: 90 days recommended.

**Rotation:** Creating new key, revoking old. Do every 90 days for security.

## Common Scenarios

| Need | Procedure |
|------|-----------|
| Create key for new app | APIKeyQuestionnaire → create-api-key.md |
| Key expired or lost | rotate-api-key.md |
| Key not working | validate-api-key.md → troubleshoot |
| Done with key | revoke-api-key.md |
| Team member left | rotate-api-key.md (for security) |

## Security Reminders

✅ **DO:**
- Store key in password manager
- Use environment variables (not hardcoded)
- Rotate every 90 days
- Use minimal required scopes
- Document where you're using it

❌ **DON'T:**
- Share keys via email/chat
- Commit keys to code
- Use unlimited-scope keys for simple tasks
- Ignore expiration dates
- Share production keys casually

## Getting Help

Need help? Check Knowledge/APIKeys/ for detailed explanations:
- 00-overview.md — Key concepts
- 01-key-types.md — Different key types
- 02-security-model.md — Security best practices
- 03-passport-dashboard.md — Dashboard walkthrough
- 04-api-reference.md — API reference
- 05-integration-patterns.md — How to use keys
- 06-troubleshooting.md — Common issues & solutions
