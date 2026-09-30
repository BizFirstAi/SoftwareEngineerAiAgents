# API Key Questionnaire

**Purpose:** Interactive guided questionnaire to help users set up and manage API keys for session authentication.

## Step 1: Do You Have an API Key?

**Agent:** "Let's set up API key authentication for your session. Do you already have an API key?"

Options:
- ✅ **Yes, I have one** → Go to Step 6 (Validate Existing Key)
- ❌ **No, I need to create one** → Go to Step 2
- ❓ **Not sure** → Suggest: "Let's check. Do you have a key stored somewhere (password manager, email, notes)?" If not found → Go to Step 2

---

## Step 2: What Will You Use This API Key For?

**Agent:** "What's the primary purpose of this API key?"

Options with descriptions:
- 📱 **Development/Testing** — Local dev environment, testing workflows
- 🚀 **Production** — Live application, user-facing features (recommended: shorter expiration)
- 🔧 **Automation** — Scripts, scheduled tasks, CI/CD pipelines
- 📊 **Analytics/Reporting** — Read-only access for dashboards
- 🤖 **AI Agent** — For Octopus, Workflow, or other agents to authenticate
- 🔐 **Integration** — Third-party system integration, API bridges
- 📝 **Custom** — Other use case (ask to describe)

Recommendation: "For development, we recommend shorter expiration (30 days) for security. For production, consider IP restrictions."

---

## Step 3: What Scopes/Permissions Do You Need?

**Agent:** "Which operations will this key need to perform?"

Checkboxes:
- [ ] **Read** — Fetch data, query, list resources
- [ ] **Write** — Create, update resources
- [ ] **Delete** — Remove resources (use with caution)
- [ ] **Admin** — Full access, manage other keys (advanced users only)

Recommendation: "Start with minimal scopes (Read only). Add others as needed. Admin scope is rarely needed."

Examples:
- **Read-only dashboard:** Read only
- **Data sync automation:** Read + Write
- **Full CRUD application:** Read + Write + Delete

---

## Step 4: When Should This Key Expire?

**Agent:** "When should this API key expire?"

Options:
- 🔄 **30 days** (Most secure, recommended for development)
- 📅 **90 days** (Standard for production)
- 🔓 **Never expire** (Use carefully, less secure)
- 📆 **Custom date** (Pick your own date)

Warning for "Never expire": "This is less secure. We recommend setting expiration and rotating regularly."

---

## Step 5: Additional Security Options

**Agent:** "Do you need any extra security restrictions?"

Options:
- **IP Whitelist** — Restrict to specific IP address(es)
  - Example: "Allow only 192.168.1.100"
  - Useful for: Server-to-server APIs, internal tools
- **Rate Limiting** — Cap requests per minute
  - Example: "100 requests/minute"
  - Useful for: Preventing abuse, testing
- **Neither** — No restrictions, default limits apply

---

## Step 6: Name This API Key

**Agent:** "Give this key a descriptive name so you can identify it later."

Input field: Text (max 100 chars, required)

**Suggested format:** `{Purpose}-{Environment}-{Date}`

Examples:
- `ChatBot-Development-2026-09`
- `DataSync-Production-Monthly`
- `TestingWorkflows-2026`

---

## Step 7: Optional Description

**Agent:** "Add a description (optional) to help you remember what this key is for."

Input field: Text (max 500 chars, optional)

Examples:
- "API key for Octopus RAG collection testing"
- "Session auth for ChatBot workflow agent"
- "Daily data synchronization from Salesforce"

---

## Step 8: Review & Confirmation

**Agent:** "Here's what I'm creating. Review and confirm:"

Summary:
```
┌─────────────────────────────────────────┐
│ API Key Configuration Summary           │
├─────────────────────────────────────────┤
│ Name:          {Name}                   │
│ Purpose:       {Purpose}                │
│ Scopes:        {Scopes}                 │
│ Expires:       {Expiration}             │
│ Restrictions:  {IP/Rate limits}         │
│ Description:   {Description}            │
└─────────────────────────────────────────┘
```

**Agent:** "Ready to create this key? Once created, you must copy it immediately — it won't be shown again!"

Options:
- ✅ **Create Key** → Proceed to browser (Passport Admin Dashboard API Keys page)
- ✏️ **Edit** → Go back to any step
- ❌ **Cancel** → Exit questionnaire

---

## Step 9: Key Created Successfully

**Agent:** "✅ API key created! Your key appears on the Passport Admin Dashboard."

Success modal shows:
```
API Key: sk_dev_1a2b3c4d5e6f7g8h9i0j

⚠️ IMPORTANT: This key will only be shown once!
Copy it now and store it securely.
```

Next steps:
1. Copy the key (Ctrl+C or click copy button)
2. Store in secure location (password manager, .env file with restricted access)
3. Close this modal
4. Provide key to session/system for authentication

---

## Validation Rules

| Field | Rules | Error Message |
|-------|-------|---------------|
| Name | Required, 1-100 chars, alphanumeric + hyphens | "Name is required and must be 1-100 characters" |
| Purpose | Required, single selection | "Please select a purpose for this key" |
| Scopes | At least 1 required | "Select at least one scope (Read/Write/Delete/Admin)" |
| Expiration | Required | "Please set an expiration date" |
| Custom Date | Must be future date | "Expiration date must be in the future" |

---

## Error Recovery

**If creation fails:**
- **"Name already exists"** → Use different name (add date/ID)
- **"Too many active keys"** → Revoke old unused keys first
- **"Invalid scope selection"** → Select at least Read or Write
- **"Expiration in past"** → Choose future date

**If key is lost:**
- Cannot recover — must create new key
- Revoke old key immediately
- Create new key with same settings
