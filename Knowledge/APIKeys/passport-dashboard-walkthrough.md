# Passport Dashboard Walkthrough — Step-by-Step

This guide walks you through creating an API key in the Passport Admin Dashboard with visual descriptions.

## Step 1: Open the Dashboard

**URL:** https://dev.grippingly.com/passportadmindashboard/api-keys

In your browser address bar, type the URL above and press Enter.

**Expected screen:**
- You'll see a login form (if not already logged in)
- Fields: Email/Username, Password
- Button: "Sign In"

## Step 2: Log In

**Action:** Enter your credentials

1. **Email field:** Click and type your BizFirst account email
2. **Password field:** Click and type your password
3. **Sign In button:** Click the blue "Sign In" button in the center-bottom

**After clicking Sign In:**
- Page loads
- You may see a loading spinner
- Redirects to the dashboard

## Step 3: Navigate to API Keys

**Expected screen after login:**
- Dashboard with left sidebar menu
- Menu items: Dashboard, Settings, Credentials, API Keys, Webhooks, Logs

**Action:** Click "API Keys"

- Look for "API Keys" text in the left sidebar
- Click it
- Page updates to show API Keys section

**You are now on:** `https://dev.grippingly.com/passportadmindashboard/api-keys`

## Step 4: Create a New Key

**Expected screen:**
- "API Keys" heading
- Existing keys list (if you have any)
- Button in top-right: "Create API Key" or "+ New API Key" (blue button)

**Action:** Click "Create API Key" button

- Look for blue button with "+ " or "Create"
- Usually in top-right area
- Click center of button

## Step 5: Fill the Form

**A form appears with fields:**

### Name Field
```
Field label: "Key Name" or "Name"
Input box: [____________________]
```

**Action:** Click the name field and type:
```
AI Session - [Today's Date]
```

Example: `AI Session - December 30, 2024`

### Description Field
```
Field label: "Description" (optional)
Input box: [____________________]
```

**Action:** Click and type:
```
Used by AI agent for session operations in workflow execution
```

### Scopes Section
```
Section heading: "Scopes" or "Permissions"
List of checkboxes:
☐ read:apps
☐ read:workflows
☐ read:data
☐ read:forms
☐ write:apps
☐ write:workflows
☐ write:data
☐ execute:workflows
☐ execute:agents
☐ manage:credentials
☐ admin:users
☐ admin:*
```

**Action:** Check these boxes (click to select):
- ☑ read:apps (click the checkbox)
- ☑ read:workflows (click the checkbox)
- ☑ execute:workflows (click the checkbox)
- ☑ execute:agents (click the checkbox)

**After checking:**
```
✓ read:apps
✓ read:workflows
✓ execute:workflows
✓ execute:agents
```

### Expiration Field (Optional)

```
Field label: "Expiration" or "Expires"
Dropdown: [24 hours ▼]
```

**Action:** This should already be set to "24 hours" by default.
If not:
- Click the dropdown
- Select "24 hours"

**Why 24 hours?** Session keys are temporary. New sessions create new keys.

### Advanced Options (if visible)

Can ignore these for now:
- IP Whitelist (leave blank)
- Rate Limiting (use default)
- Metadata (leave blank)

## Step 6: Create the Key

**Form should look like:**
```
┌──────────────────────────────────────┐
│ Create API Key                       │
├──────────────────────────────────────┤
│ Name: AI Session - December 30, 2024 │
│ Description: Used by AI agent...     │
│                                      │
│ Scopes:                              │
│  ✓ read:apps                         │
│  ✓ read:workflows                    │
│  ✓ execute:workflows                 │
│  ✓ execute:agents                    │
│                                      │
│ Expiration: 24 hours                 │
│                                      │
│ [Cancel] [Create API Key] (blue)     │
└──────────────────────────────────────┘
```

**Action:** Click the blue "Create API Key" button (bottom-right of form)

## Step 7: Copy Your Key

**After clicking Create, a modal/popup appears:**

```
┌─────────────────────────────────────────────────┐
│ ✓ API Key Created Successfully!                │
├─────────────────────────────────────────────────┤
│                                                 │
│ Your API Key:                                   │
│ ... │
│                                                 │
│           [Copy Button - looks like 📋]         │
│                                                 │
│ ⚠️  IMPORTANT:                                  │
│ Save this key in a secure location.             │
│ You will not be able to see it again.           │
│ If you lose it, create a new key.               │
│                                                 │
│ [OK] or [Done]                                  │
└─────────────────────────────────────────────────┘
```

### Copy the Key

**Action:** 
1. Look for the key string (starts with ``)
2. Click the "Copy" button (usually right of the key)
3. Or triple-click the key text to select all, then Ctrl+C (Cmd+C on Mac)

**You should see:** A small toast/notification saying "Copied!" or "Copied to clipboard"

### Store the Key Securely

**Action:** Paste the key into a secure location:
- Password manager
- Secure note-taking app
- Environment variable in your development setup

**Do NOT:**
- Leave it in chat history
- Save in unencrypted files
- Email it unencrypted
- Commit to version control

## Step 8: Confirm and Return

**Action:** Click "OK" or "Done" button

- Modal closes
- You return to API Keys list
- Your new key appears in the list with status "Active"

**Example list view:**
```
API Keys
┌─────────────────────────────────────────┐
│ Name                    Status  Created │
├─────────────────────────────────────────┤
│ AI Session - Dec 30     Active  Today   │
│ (Expires in 24 hours)                   │
└─────────────────────────────────────────┘
```

## Step 9: Provide Key to Agent

**Action:** Copy your key and provide it to the AI Agent

**In conversation:**
```
Agent: "Please provide your API key:"

You: 
     (Paste the key)

Agent: "✓ Key received and validated!
        Your session is authenticated.
        Ready to proceed."
```

## Done! ✓

Your API key is now created and being used by the session.

---

## Visual Location Reference

### Dashboard URL Bar Location
```
┌─────────────────────────────────────────────────────────┐
│ https://dev.grippingly.com/passportadmindashboard... ▼ │
└─────────────────────────────────────────────────────────┘
```

### Sidebar Menu Location (Left side)
```
┌──────────────────┐
│ MENU             │
├──────────────────┤
│ Dashboard        │
│ Settings         │
│ Credentials      │
│ API Keys ← Click │
│ Webhooks         │
│ Logs             │
└──────────────────┘
```

### Create Button Location (Top-right)
```
┌─────────────────────────────────────────────────┐
│ Passport Admin Dashboard                        │
│                   [Create API Key] ← Click Here │
├─────────────────────────────────────────────────┤
│ [API Keys list shows below]                     │
```

### Key Display Location (In Modal)
```
┌─────────────────────────────────────────────┐
│ ✓ API Key Created Successfully!             │
├─────────────────────────────────────────────┤
│ Your API Key:                               │
│ ┌─────────────────────────────────────────┐ │
│ │ ... │ │
│ │ [Copy Icon ← Click to Copy]             │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ ⚠️  Save this in a secure location         │
│                                             │
│ [OK / Done] ← Click to Close               │
└─────────────────────────────────────────────┘
```

---

## Troubleshooting

### Form Won't Submit

**Issue:** "Create API Key" button not working

**Solutions:**
1. Ensure "Name" field has text
2. Ensure at least one scope is checked
3. Scroll down to see if there are validation errors in red
4. Refresh page and try again

### Can't Find API Keys Menu

**Issue:** No "API Keys" in sidebar

**Solutions:**
1. Are you logged in? Check for username in top-right
2. Scroll down in sidebar (menu might be hidden)
3. Check URL — should be passportadmindashboard
4. Try directly: `https://dev.grippingly.com/passportadmindashboard/api-keys`

### Key Disappeared

**Issue:** Don't see the key value anymore

**This is normal.** The key is only shown once immediately after creation.

**Solutions:**
1. If you copied it: You have it stored securely
2. If you didn't copy it: Create a new key (revoke the old one)
3. Check API Keys list (key still exists, just hidden)

### Can't Copy Button

**Issue:** Copy button not working

**Solutions:**
1. Try triple-clicking the key text to select all
2. Use Ctrl+C (Windows) or Cmd+C (Mac)
3. Manually write it down (if displayed)
4. Try a different browser

---

## Summary

✓ Logged in to dashboard
✓ Navigated to API Keys
✓ Clicked "Create API Key"
✓ Filled in name, description, scopes, expiration
✓ Clicked "Create"
✓ Copied the generated key
✓ Provided key to AI Agent
✓ Session authenticated ✓

You're ready to use the session with full API access!

---

**Next:** Return to agent to complete your task
