# Passport Admin Dashboard — API Keys Interface

## Overview

The **Passport Admin Dashboard** is where you create, manage, and revoke API keys. It's a web-based interface you access in your browser.

**URL:** https://dev.grippingly.com/passportadmindashboard/api-keys

## Getting to the API Keys Page

### Step-by-Step Navigation

1. **Open the dashboard** in your browser
   - URL: https://dev.grippingly.com/passportadmindashboard/
   - You should see a login page if not already logged in

2. **Log in** with your account credentials
   - Username/Email: Your BizFirst account email
   - Password: Your account password
   - Click "Sign In"

3. **Find the API Keys section**
   - Look for navigation menu on the left sidebar
   - Scroll down and find "API Keys" or "Credentials" section
   - Click it

4. **You're now on the API Keys page**
   - URL bar shows: `.../passportadmindashboard/api-keys`
   - You'll see existing API keys listed (if any)
   - Top-right: "Create API Key" or "New API Key" button

## Page Layout

```
┌─────────────────────────────────────────────────────────┐
│ Passport Admin Dashboard                                │
├─────────────────────────────────────────────────────────┤
│ SIDEBAR                  │  MAIN CONTENT                 │
│ • Dashboard              │                               │
│ • Settings               │  API Keys                     │
│ • Credentials            │  [Create API Key] (button)    │
│ • API Keys ← YOU ARE HERE                                │
│ • Webhooks               │  Existing Keys:               │
│ • Logs                   │  ┌─────────────────────────┐  │
│                          │  │ Key Name    Status Copy │  │
│                          │  │ Key 1       Active  ...  │  │
│                          │  │ Key 2       Expired ...  │  │
│                          │  │ Key 3       Active  ...  │  │
│                          │  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## UI Elements Explained

### Create Button
- **Location:** Top-right of the API Keys section
- **Label:** "Create API Key" or "+ New API Key"
- **Action:** Opens a form to create a new API key
- **Click:** Center of the button

### API Keys List

Each row in the list shows:
- **Name** — The name you gave the key
- **Type** — Session, Integration, Service, or Agent
- **Status** — Active, Expired, Revoked, or Disabled
- **Created** — When the key was created
- **Expires** — Expiration date (if applicable)
- **Last Used** — When it was last used (for audit)
- **Actions** — Menu with Copy, Revoke, Edit, Delete

### Action Buttons

**Copy Button** ✓
- Copies the API key to your clipboard
- Only works on newly created keys (within 1 hour)
- Once you close the page, you cannot see the key again
- Icon: Usually looks like two overlapping squares

**Revoke Button** ✗
- Immediately disables the key
- Key stops working for all integrations
- Useful if key is compromised
- Cannot be undone (must create a new key)
- Confirmation dialog appears

**Edit Button** ✎
- Modify key properties (name, description, scopes, expiration)
- Cannot change which user owns it
- Changes take effect immediately
- Useful for extending expiration or adjusting scopes

**Delete Button** 🗑️
- Permanently removes the key from your account
- Cannot be undone
- Use "Revoke" instead if key might be in use

## Creating a New API Key — Form Fields

When you click "Create API Key", a form appears with these fields:

### Required Fields

**1. Key Name**
- What you want to call this key
- Examples: "Chat Assistant Session", "Zapier Integration", "Daily Backup Service"
- Should be descriptive and unique
- 50 character limit

**2. Description** (optional but recommended)
- Why you're creating this key
- Who/what will use it
- Example: "Used by AI agent during user session for workflow execution"
- Helps with auditing later

### Scope Selection (Critical)

Select which operations this key can perform:
- ☐ `read:apps` — View apps
- ☐ `read:workflows` — View workflows
- ☐ `read:data` — Read database
- ☐ `write:apps` — Create/modify apps
- ☐ `write:workflows` — Create/modify workflows
- ☐ `execute:workflows` — Run workflows
- ☐ `execute:agents` — Run AI agents
- ☐ `manage:credentials` — Create/delete credentials
- ☐ `admin:*` — Full access (Service keys only)

**For Session API Key, typically select:**
- ✓ `read:apps`
- ✓ `read:workflows`
- ✓ `execute:workflows`
- ✓ `execute:agents`

### Advanced Options (Expand for more)

**Expiration**
- Default: No expiration
- Options: 24 hours, 7 days, 30 days, 90 days, 1 year, Custom date
- For Session keys: Recommend 24 hours
- Leave blank: Key never expires (not recommended)

**IP Whitelist** (optional)
- Enter IP addresses that can use this key
- Example: `192.168.1.100` or `10.0.0.0/8`
- Leave blank: Key works from any IP
- Useful for restricting to your server or office

**Rate Limiting** (optional)
- Default: 1000 requests per minute
- Can adjust higher or lower
- Helps prevent accidental abuse
- Example: Set to 100 for testing

**Metadata** (optional)
- Add custom tags or notes
- Example: `environment=staging, owner=alice`
- For organization and audit

## Creating Your First API Key — Quick Start

1. **Click "Create API Key"** button
2. **Name:** "AI Session Key - [Today's Date]"
3. **Description:** "For AI agent session operations"
4. **Scopes:** Check `read:apps`, `read:workflows`, `execute:workflows`, `execute:agents`
5. **Expiration:** Select "24 hours"
6. **Click "Create"** button

→ A modal appears with your new key displayed

## Viewing Your Generated Key

After creation:

```
┌────────────────────────────────────────────┐
│ API Key Created Successfully!              │
│                                            │
│ Your API Key:                              │
│ ┌──────────────────────────────────────┐  │
│ │ ... │  │
│ │              [Copy]                  │  │
│ └──────────────────────────────────────┘  │
│                                            │
│ ⚠️  Save this key in a secure location   │
│     You won't be able to see it again     │
│     If you lose it, create a new one      │
│                                            │
│ [OK / Done]                                │
└────────────────────────────────────────────┘
```

**Important:**
- ✓ Copy the key immediately
- ✓ Store it securely (environment variable, vault, secure note)
- ❌ Don't screenshot or email it unencrypted
- ❌ Don't log it in debug output
- ❌ Don't commit it to version control

## After Creation

Once you close the modal:
- The key appears in your API Keys list
- Status shows "Active"
- Last Used shows "—" (not used yet)
- You can no longer see the full key value
- If you need the key again, create a new one (and revoke the old one)

## Common Actions

### Revoke a Compromised Key

1. Find the key in the list
2. Click the "..." menu (three dots)
3. Select "Revoke"
4. Confirm "Yes, revoke this key"
5. Status changes to "Revoked"
6. Create a new key immediately

### Check Key Usage

1. Click on a key name to view details
2. See "Last Used" timestamp
3. See "Usage Statistics" (requests per day)
4. Check if usage looks normal

### Extend an Expiring Key

1. Click "Edit" on the key
2. Change "Expiration" to a later date
3. Click "Save"
4. Key continues to work beyond original expiration

### Deactivate (But Not Delete) a Key

1. Click "Revoke" instead of "Delete"
2. Key stops working immediately
3. Can check later if anything broke
4. Delete it later if sure it's not needed

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't find API Keys section | Make sure you're logged in; check sidebar menu |
| Key shows "Expired" but just created it | Check server time/timezone settings |
| Copy button doesn't work | Try clicking exactly on the copy icon |
| Lost my key value | Create a new key; revoke the old one |
| Key is "Revoked" but I didn't revoke it | Someone else on account may have; check audit logs |
| Form won't submit | Ensure name is filled; select at least 1 scope |

## Security Reminders

✓ **Do:**
- Store keys in environment variables (`API_KEY=sk_...`)
- Use vault systems for production keys
- Rotate keys monthly
- Revoke keys you no longer need
- Monitor usage for suspicious activity

❌ **Don't:**
- Hardcode keys in source code
- Commit keys to Git
- Log or print keys
- Share keys via chat/email
- Use the same key for multiple systems

---

**Next:** [Dashboard Walkthrough](passport-dashboard-walkthrough.md) for step-by-step visuals
