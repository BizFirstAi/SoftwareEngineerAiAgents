# APIKeys Knowledge Base

Comprehensive documentation about API keys, security, and integration patterns.

## Quick Navigation

### For Different Needs

| You want to... | Read this |
|---|---|
| Understand what API keys are | 00-overview.md |
| Learn about different key types | 01-key-types.md |
| Understand security best practices | 02-security-model.md |
| Create a key in Passport Dashboard | 03-passport-dashboard.md |
| Call APIs with your key | 04-api-reference.md |
| Integrate keys into your system | 05-integration-patterns.md |
| Fix problems with keys | 06-troubleshooting.md |

### Files

- **00-overview.md** (800 words)
  What API keys are, how they work, security model overview

- **01-key-types.md** (600 words)
  Session, Integration, Personal, Service, Webhook keys with use cases

- **02-security-model.md** (800 words)
  Storage, access control, rotation policies, compliance

- **03-passport-dashboard.md** (600 words)
  Step-by-step guide to Passport Admin Dashboard key creation

- **04-api-reference.md** (500 words)
  REST endpoints, request formats, error codes

- **05-integration-patterns.md** (700 words)
  How to use keys in apps, workflows, third-party services

- **06-troubleshooting.md** (400 words)
  Common issues and solutions

## Key Concepts Explained

### API Key
Secure token proving your identity to an API. Example: `sk_prod_xyz789...`

### Scope
Permissions the key has. Examples: read, write, admin.

### Expiration
When the key stops working. Production keys: rotate every 90 days.

### Rotation
Creating a new key, revoking the old. Regular rotation improves security.

### Audit Log
Record of all actions using the key (who, when, what).

## Common Scenarios

### Scenario 1: New API Integration
1. Read: 00-overview.md (understand concepts)
2. Read: 01-key-types.md (choose right type)
3. Read: 02-security-model.md (security requirements)
4. Go to: Procedure/APIKeyAgent/APIKeyQuestionnaire.md (interactive setup)
5. Read: 05-integration-patterns.md (how to use it)

### Scenario 2: Key Not Working
1. Read: 06-troubleshooting.md (diagnose)
2. Go to: Procedure/APIKeyAgent/validate-api-key.md (verify key)
3. Read: 02-security-model.md (security check)

### Scenario 3: Need to Rotate Key
1. Read: 02-security-model.md (rotation policy)
2. Go to: Procedure/APIKeyAgent/rotate-api-key.md (step-by-step)

## Learning Path

**Beginner (understanding basics):**
1. 00-overview.md
2. 01-key-types.md
3. Procedure/APIKeyAgent/APIKeyQuestionnaire.md

**Intermediate (using keys):**
1. 02-security-model.md
2. 03-passport-dashboard.md
3. 04-api-reference.md

**Advanced (integrations):**
1. 05-integration-patterns.md
2. 06-troubleshooting.md
3. Procedure/APIKeyAgent/ (all procedures)

## Key Takeaways

✅ **Do:**
- Use minimal required scopes
- Rotate every 90 days (production)
- Store in secure location (password manager/vault)
- Document where keys are used
- Monitor expiration dates
- Use environment variables (not hardcoded)

❌ **Don't:**
- Hardcode keys in source code
- Commit keys to version control
- Share keys via email/chat
- Use unlimited scope for simple tasks
- Log full API keys
- Ignore expiration dates

## Related Resources

- **Procedure/APIKeyAgent/** — Step-by-step guides
- **Agents/Builders/APIKeyAgent/AGENT.md** — APIKeyAgent specification
- **CLAUDE.md** — Project guidelines
- **index.md** — Root navigation

## Questions?

- Consult the appropriate knowledge file above
- Follow the step-by-step procedures
- Contact APIKeyAgent for interactive guidance
- Check troubleshooting guide for common issues

---

**Status:** Complete knowledge base ready for use
**Last updated:** 2026-09-29
**Audience:** Developers, integrators, administrators
