# Create API Key - Guided Walkthrough

**Purpose:** Step-by-step user guide to create API key via Passport Admin Dashboard browser UI.

---

## Prerequisites

✅ You have a Passport Admin account with API key creation permissions  
✅ You are logged into Passport Admin Dashboard  
✅ You have completed [APIKeyQuestionnaire.md](APIKeyQuestionnaire.md)  
✅ You have your key details (name, purpose, scopes, expiration)

---

## Step 1: Navigate to API Keys Page

**URL:** https://dev.grippingly.com/passportadmindashboard/api-keys

**Instructions:**
1. Open the URL in your browser
2. Log in if prompted (if not already logged in)
3. Navigate to **Settings** → **API Keys** (or direct URL above)

**Expected screen:**
- Page title: "API Keys"
- List of existing API keys (if any)
- Button: "Create API Key" (blue button, top right)

---

## Step 2: Click "Create API Key" Button

**Location:** Top right corner of API Keys list

**Result:** New form opens with following fields:

```
┌──────────────────────────────────────────┐
│ Create New API Key                       │
├──────────────────────────────────────────┤
│ Key Name *                               │
│ [____________________________]            │
│                                          │
│ Description (optional)                   │
│ [____________________________]            │
│ [____________________________]            │
│                                          │
│ Scopes *                                 │
│ ☐ Read    ☐ Write    ☐ Delete ☐ Admin  │
│                                          │
│ Expires *                                │
│ [Date Picker: MM/DD/YYYY]    ▼           │
│                                          │
│ IP Restrictions (optional)               │
│ ☐ Restrict to IP(s)                     │
│   [____________________________]          │
│                                          │
│            [Cancel]  [Create Key]        │
└──────────────────────────────────────────┘
```

---

## Step 3: Fill Key Name

**Field:** Key Name (required, marked with *)

**What to enter:** Use name from questionnaire  
Example: `ChatBot-Development-2026-09`

**Validation:**
- Required (cannot be empty)
- Max 100 characters
- Alphanumeric + hyphens allowed
- Must be unique (error if duplicate)

**Agent tip:** "Use format: {Purpose}-{Environment}-{Date} for clarity"

**Actions:**
1. Click on "Key Name" field
2. Type your key name
3. Press Tab to move to next field

---

## Step 4: Fill Description (Optional)

**Field:** Description (optional)

**What to enter:** Brief explanation of key's purpose  
Example: `API key for ChatBot workflow agent, used for Octopus RAG retrieval`

**Validation:**
- Optional (can be left blank)
- Max 500 characters
- Can include spaces and special characters

**Actions:**
1. Click on "Description" field
2. Type description (or skip to next field)
3. Press Tab to move to Scopes

---

## Step 5: Select Scopes

**Field:** Scopes (required, at least one must be checked)

**Options:**
- ☐ **Read** — Fetch data, query, list resources (check this for read-only)
- ☐ **Write** — Create, update resources (check for write operations)
- ☐ **Delete** — Remove resources (use carefully!)
- ☐ **Admin** — Full access, manage other keys (advanced only)

**Based on questionnaire:**
- Development: Check **Read** + **Write**
- Production: Check **Read** + **Write** (+ **Delete** if needed)
- Analytics: Check **Read** only
- Admin tasks: Check **Read** + **Write** + **Delete** + **Admin**

**Validation error if:** No scopes selected

**Actions:**
1. Click checkbox next to each scope you need
2. Visual feedback: Checkmark appears
3. Continue to next field

---

## Step 6: Set Expiration Date

**Field:** Expires (required, date picker)

**Date picker format:** MM/DD/YYYY

**Based on questionnaire:**
- 30 days: Today + 30 days (example: 10/29/2026)
- 90 days: Today + 90 days (example: 12/28/2026)
- Custom: Your selected date
- Never: Leave blank (⚠️ less secure)

**Validation:**
- Required (unless "Never expire" option available)
- Must be future date (error if past date selected)
- Recommended max: 1 year

**Agent tip:** "Setting shorter expiration (30 days) is more secure. You can create new keys as needed."

**Actions:**
1. Click on Date field
2. Calendar picker opens
3. Select desired date
4. Click to confirm or type date directly

---

## Step 7: Optional IP Restrictions

**Field:** IP Restrictions (optional)

**Checkbox:** "Restrict to IP(s)"

**When to use:**
- ✅ Server-to-server API calls (static IP)
- ✅ Internal network access
- ✅ CI/CD pipeline from specific server
- ❌ Not recommended for mobile/desktop clients (changing IPs)

**Format:** Comma-separated IPs
```
192.168.1.100
or
192.168.1.100, 10.0.0.50, 203.0.113.42
```

**Validation:**
- Valid IPv4 format (X.X.X.X)
- Max 10 IP addresses per key
- Whitespace trimmed automatically

**Actions:**
1. Check "Restrict to IP(s)" checkbox
2. Click text field (if appears)
3. Enter IP address(es)
4. Press Tab to move to next field

---

## Step 8: Review Before Creating

**Agent:** "Review your settings before creating:"

Display summary:
```
✓ Name:           ChatBot-Development-2026-09
✓ Description:    API key for ChatBot workflow agent
✓ Scopes:         Read, Write
✓ Expires:        12/28/2026 (90 days)
✓ IP Restrict:    None
```

**Agent:** "Ready? Click 'Create Key' button below."

---

## Step 9: Click "Create Key" Button

**Location:** Bottom right of form

**Expected behavior:**
1. Button disabled during processing (shows spinner/loading state)
2. Processing takes 2-5 seconds
3. On success: Modal appears with generated key
4. On error: Error message displayed (see [troubleshoot.md](troubleshoot.md))

---

## Step 10: SUCCESS - Key Generated

**Success modal displays:**

```
┌─────────────────────────────────────────┐
│ ✅ API Key Created Successfully!        │
├─────────────────────────────────────────┤
│                                         │
│ Key Name: ChatBot-Development-2026-09  │
│                                         │
│ Your API Key:                           │
│ ┌─────────────────────────────────────┐│
│ │sk_dev_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5││
│ └─────────────────────────────────────┘│
│            [Copy to Clipboard]          │
│                                         │
│ ⚠️  IMPORTANT:                          │
│ This key will only be displayed once!  │
│ Copy it now and store it securely.     │
│ You cannot retrieve it later.          │
│                                         │
│ Store in:                               │
│ • Password manager (1Password, etc.)   │
│ • Secure .env file (not in Git!)       │
│ • Environment variable                │
│ • Secure notes                         │
│                                         │
│            [I've copied it] [Close]    │
└─────────────────────────────────────────┘
```

---

## Step 11: Copy Key

**Agent:** "Copy your key now! It will not be shown again."

**Actions:**
1. Click "Copy to Clipboard" button (easiest)
   - OR
   - Triple-click key text to select all
   - Press Ctrl+C (Windows) or Cmd+C (Mac)

2. Paste key into secure location:
   - Password manager
   - Secure notes
   - .env file (NOT in Git repository!)
   - Environment variable

**Verify:** Paste somewhere to verify copy succeeded

---

## Step 12: Close Modal

**Agent:** "Key stored? Click 'I've copied it' or 'Close' to continue."

**Result:**
- Modal closes
- Return to API Keys list page
- New key appears in list with:
  - Name: "ChatBot-Development-2026-09"
  - Created: Today's date/time
  - Expires: 12/28/2026
  - Status: Active (green indicator)

---

## Step 13: Confirm Key in List

**Verify on API Keys page:**

Look for your key in the list:
```
┌────────────────────────────────────────┐
│ API Keys                               │
├────────────────────────────────────────┤
│ Name              Created    Expires    Status │
│ ChatBot-Dev-2026  Today      12/28/26   ✓ Active │
│ [previous key]    2 months ago         ✓ Active │
└────────────────────────────────────────┘
```

**Agent:** "✅ API key successfully created and is now active!"

---

## Next Steps

1. **Store key securely** (if not already done)
2. **Pass key to session** via [use-apikey-in-session.md](use-apikey-in-session.md)
3. **Test key** with API call
4. **Document** key location and expiration

---

## Troubleshooting

If you encounter errors, see [troubleshoot.md](troubleshoot.md):
- Form validation errors
- Duplicate name error
- API creation failure
- Key not appearing in list
- Cannot copy key

---

## Security Reminders

🔐 **DO:**
- Store key in password manager
- Use .env file for local development
- Set reasonable expiration (30-90 days)
- Rotate key periodically
- Keep key private

🚫 **DON'T:**
- Share key via email or chat
- Commit key to Git repository
- Hardcode key in source files
- Log full key in error messages
- Use same key for multiple environments
