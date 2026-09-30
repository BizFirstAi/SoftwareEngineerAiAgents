# API Keys — Overview

## What Are API Keys?

An **API key** is a unique identifier that grants access to platform resources and operations. It proves your identity and authorizes actions without needing passwords in code or sessions.

## Why Use API Keys?

- **Session Authentication** — Secure your session without storing passwords
- **Service-to-Service** — Authenticate between your apps and BizFirst
- **External Integrations** — Allow external systems (Zapier, webhooks, custom apps) to access your data
- **Programmatic Access** — Manage resources via APIs instead of the UI
- **Fine-Grained Control** — Limit what each key can do (scopes/permissions)
- **Audit Trail** — Track who did what, revoke access instantly

## Security Model

**Your API Key is Like a Password**
- Never share it publicly
- Store securely (environment variables, vaults, not in code)
- Rotate regularly (monthly or quarterly)
- Revoke immediately if compromised
- Monitor usage for suspicious activity

**Key Features:**
- **Expiration** — Automatic invalidation after a set time
- **Scopes** — Fine-grained permissions (read, write, execute, delete)
- **IP Whitelisting** — Optional: Only work from specific IPs
- **Rate Limiting** — Optional: Prevent abuse by limiting requests per minute
- **Audit Logs** — Track every use of each key

## API Key Types in BizFirst

| Type | Purpose | Scope | Expiration |
|------|---------|-------|-----------|
| **Session Key** | Current session auth | User-specific | Days/hours |
| **Integration Key** | External system access | Limited scopes | Months/years |
| **Service Key** | Service-to-service | Full platform access | Years |
| **Bot/Agent Key** | AI agent operations | Specific workflow permissions | Months |

## Common Use Cases

### 1. Session API Key (This Agent's Primary Use)
```
User doesn't have API key
↓
APIKeyAgent asks: "Do you have an API key?"
↓
User says: "No"
↓
APIKeyAgent guides user to create one via Passport Admin Dashboard
↓
User copies generated key
↓
Agent uses key in session for API calls
↓
Key is stored securely (not logged/shown again)
```

### 2. Integration Key
Connect external systems:
- Zapier workflow triggering BizFirst actions
- Custom webhook receivers
- Third-party dashboards reading your data

### 3. Service Key
Backend-to-backend:
- Microservice authentication
- Scheduled jobs needing platform access
- CI/CD pipelines deploying to BizFirst

## Key Permissions (Scopes)

Common scopes (what the key can do):
- `read:apps` — View apps and content
- `write:apps` — Create and modify apps
- `execute:workflows` — Run workflows
- `manage:credentials` — Create/delete credentials
- `manage:servers` — Provision and configure servers
- `read:audit-logs` — Access activity logs
- `admin:keys` — Create/revoke other keys

## Where to Create API Keys

**Passport Admin Dashboard**
- URL: https://dev.grippingly.com/passportadmindashboard/api-keys
- Login with your account
- Click "Create API Key"
- Fill in name, description, scopes
- Optionally set expiration or IP whitelist
- Click "Create"
- Copy and store safely

## Next Steps

- **[API Key Types](01-apikey-types.md)** — Deep dive into each type
- **[Passport Dashboard](02-passport-admin-dashboard.md)** — Screenshots and UI guide
- **[Lifecycle](03-api-key-lifecycle.md)** — Managing, rotating, revoking
- **[Integration Guide](04-integration-guide.md)** — Using keys in code/sessions
- **[Dashboard Walkthrough](passport-dashboard-walkthrough.md)** — Step-by-step creation
