# APIKey Guided Experience Examples

**Purpose:** Real-world examples of how the APIKeyAgent guides users through API key creation, validation, rotation, and management scenarios.

## Overview

The APIKeyAgent manages the complete API key lifecycle with guided interactions. Users follow step-by-step prompts to create keys, validate existing keys, handle expiration, and manage multiple environments.

---

## Scenario 1: User Has No API Key (Simple Path)

**Flow:** No key → Gather requirements → Create new key → Secure storage → Ready

```
Agent: "Welcome! Let's set up your session API key. 
Do you currently have an API key?"

User: "No, I don't think so"

Agent: "No problem! I'll guide you through creating one.
What do you need this API key for?"

User: "For this session to authenticate with the system"

Agent: "Perfect! Session authentication - that's the primary use case.
You'll need:
- Read access (view data)
- Write access (create/update)
- Admin access (optional - manage settings)

Which permissions do you need?"

User: "Read and Write should be enough"

Agent: "Great! How long should the key be valid?
- No expiration (not recommended for security)
- 30 days
- 90 days (recommended)
- Custom date

I recommend 90 days for security."

User: "90 days sounds good"

Agent: "Perfect! Here's the plan:
✓ Create API key with Read+Write permissions
✓ Valid for 90 days
✓ Name it 'Session Key 2026-09'

Ready? I'll guide you through the dashboard."

User: "Yes, go ahead"

Agent: "STEP 1: Open Passport Admin Dashboard
Navigate to: https://dev.grippingly.com/passportadmindashboard/api-keys

Once you're there, you should see:
- API Keys page header
- List of existing keys (if any)
- 'Create API Key' button (top right)

Let me know when you see this page."

User: "I'm on the page and see the Create button"

Agent: "Excellent! Now click the 'Create API Key' button.
This will open a form. You should see fields for:
- Name (text input)
- Description (text input)
- Permissions (checkboxes: Read, Write, Admin)
- Expiration (date picker)

Let me know when the form appears."

User: "Form is open"

Agent: "Perfect! Fill in the form exactly:
- Name: 'Session Key 2026-09'
- Description: 'API key for session authentication'
- Permissions: Check 'Read' and 'Write' (leave Admin unchecked)
- Expiration: 90 days from today (Dec 27, 2026)

Once filled, click the 'Create' button at the bottom."

User: "Done! A modal appeared with my key"

Agent: "🎉 SUCCESS! Your API key has been created!

⚠️ CRITICAL: Copy your key NOW! 
This is your only chance to see the full key.

Key: sk_test_abc123def456... (showing sample)
Click the 'Copy' button to copy the full key.

SAVE it to:
- Password manager (preferred)
- Encrypted file
- Secure location

You will NOT be able to see this key again!"

User: "Copied! Now what?"

Agent: "Excellent! Close this modal by clicking 'Close' or X.
You should see your new key in the list.

Summary:
✓ Key ID: api_key_12345
✓ Name: Session Key 2026-09
✓ Permissions: Read, Write
✓ Expires: Dec 27, 2026
✓ Status: Active

Your API key is ready to use!
This session will now use this key for authentication."
```

---

## Scenario 2: User Has Existing Key (Validation Path)

**Flow:** Has key → Retrieve → Validate → Use

```
Agent: "Do you have an API key for this session?"

User: "Yes, I have one somewhere"

Agent: "Great! Do you have the key available right now?"

User: "Not here, but I have it saved in my password manager"

Agent: "Perfect! Retrieve it when you're ready.

The key format should be: sk_... or api_key_...

When you have it, paste it here and I'll validate it."

User: [pastes: sk_test_abc123def456]

Agent: "Validating key... ✓ Key is valid!

Name: Session Key 2026-09
Scopes: Read, Write
Expires: Dec 27, 2026
Status: Active
Days remaining: 89

This key is ready to use for this session. 
We'll authenticate with this key."

Agent: "Ready to proceed? [Yes/Use Different Key]"

User: "Yes"

Agent: "Perfect! Session authenticated with your key.
You're all set! 🎉"
```

---

## Scenario 3: Key Expired (Rotation Path)

**Flow:** Validation fails → Key expired → Create new → Rotate

```
Agent: "Checking your current API key...
⚠️ Your key expired on Aug 15, 2026!

We need to create a new key to continue working.

Do you want to create a new key?"

User: "Yes please"

Agent: "Will you keep the same permissions?
Your old key had: Read, Write

[Options:
- Yes, same permissions
- No, different permissions
- Let me decide]"

User: "Same permissions should be fine"

Agent: "Great! I'll create a new key with:
✓ Name: Session Key 2026-10
✓ Permissions: Read, Write
✓ Expiration: 90 days

Ready?"

User: "Go ahead"

Agent: "STEP 1: Go back to API Keys page
https://dev.grippingly.com/passportadmindashboard/api-keys

Click 'Create API Key' button"

[Continues with creation steps from Scenario 1]

Agent: "💡 Tip: You can also DELETE the old expired key 
to keep your dashboard clean. Want me to guide you?"

User: "Sure"

Agent: "On the API Keys list, find your old key:
Session Key 2026-09 (Expired)

Click the ... menu or Delete button next to it.
Confirm deletion."

User: "Deleted!"

Agent: "Perfect! Your old key is removed.
You now have only the active key."
```

---

## Scenario 4: Multiple Environments (Advanced)

**Flow:** Choose environment → Set security level → Create scoped key

```
Agent: "Do you need different keys for different environments?

Common setup:
- Development (testing, short expiration)
- Staging (pre-prod, medium security)
- Production (live, strict security)

Which environment is this for?"

User: "Production"

Agent: "Production environment - we'll prioritize security!

I recommend:
- Permissions: Read + Write only (no Admin)
- Expiration: 30 days (rotate monthly for security)
- IP Whitelist: Enabled (optional, advanced)
- Rate Limit: Standard

Sound good?"

User: "Yes, let's do it"

Agent: "Perfect! Here's the plan:
✓ Name: Session Key 2026-09 (Production)
✓ Permissions: Read, Write
✓ Expiration: 30 days (Oct 27, 2026)
✓ IP Whitelist: Disabled (you can enable later)

Ready to create?"

User: "Yes"

Agent: "STEP 1: Navigate to API Keys
https://dev.grippingly.com/passportadmindashboard/api-keys

[Creation steps follow]

Agent: "✓ Production key created!

Security Notes:
- Rotate every 30 days (calendar reminder?)
- Never commit this key to code
- Never share this key
- Use environment variables to store it

Want guidance on rotation in 30 days?"

User: "Sure, remind me"

Agent: "Set a calendar reminder for Oct 27, 2026
(30 days from now) to rotate this key.

I can also notify you through the system."
```

---

## Scenario 5: Error Recovery

**Flow:** Error occurs → Understand issue → Recover gracefully

```
Agent: "Creating your API key...
Processing..."

[After submission]

Agent: "❌ Error: 'Duplicate key name'

The name 'Session Key 2026-09' already exists.
Choose a different name? 

Options:
- Session Key 2026-09-B
- Session Key 2026-09 (Backup)
- Session Key 2026-09 (New)
- Custom name"

User: "Use Session Key 2026-09-B"

Agent: "Got it! Updating name to 'Session Key 2026-09-B'

On the form, change:
- Name field: 'Session Key 2026-09-B'

Then click 'Create' again."

User: "Done!"

Agent: "✓ Success! Key created with name 'Session Key 2026-09-B'

[Shows key as in Scenario 1]"
```

### Alternative Error: Permission Denied

```
Agent: "⚠️ Error: 'Insufficient permissions'

Your account doesn't have permission to create API keys.

You need 'Admin' role. Contact your workspace admin
to grant you this permission.

Workspace Admin: [admin@company.com]"
```

### Alternative Error: Rate Limited

```
Agent: "⚠️ Rate limited: Too many requests

You've created 3 keys in the last hour.
Please wait 5 minutes before creating another.

(Free tier limit: 3 keys/hour. Upgrade for unlimited.)"
```

---

## Key Patterns in All Scenarios

### Discovery Phase
- Ask clarifying questions
- Show options and recommendations
- Let user make informed choices
- Explain security implications

### Execution Phase
- Step-by-step instructions
- Clear visual markers ("STEP 1", "✓")
- Tell user what to expect
- Confirm actions before proceeding

### Success Phase
- Clear success messaging with emoji
- Show key details and status
- Explain what comes next
- Offer related actions (rotation, deletion, etc.)

### Error Recovery
- Explain what went wrong clearly
- Offer solutions and alternatives
- Don't blame the user
- Graceful retry with guidance

---

## Navigation Patterns

### URLs User Should See
- API Keys Dashboard: `https://dev.grippingly.com/passportadmindashboard/api-keys`
- Create Form: Opens in modal on same page
- Key Display: Modal after successful creation

### UI Elements to Expect
- "Create API Key" button (top right of dashboard)
- Form fields: Name, Description, Permissions (checkboxes), Expiration (date picker)
- "Create" button (submits form)
- Success modal with key display and "Copy" button
- API Keys list (shows created keys with delete option)

### Expected Form Fields
```
Name: [text input]
Description: [text area]
Permissions:
  ☑ Read (allow viewing data)
  ☑ Write (allow creating/updating)
  ☐ Admin (allow managing settings)
Expiration: [date picker with presets: 30/90/180 days]
[Create Button]
```

---

## Success Criteria

User has successfully completed the flow when:
1. ✓ API key is created and visible in dashboard
2. ✓ Key is copied and stored securely
3. ✓ User understands permissions and expiration
4. ✓ User knows how to rotate the key
5. ✓ Session is now authenticated with the key

---

## Common User Mistakes to Prevent

| Mistake | Prevention |
|---------|-----------|
| Copy-pasting incomplete key | Emphasize "Copy" button, show warning about seeing key only once |
| Using same key everywhere | Recommend different keys for dev/staging/prod |
| Never rotating key | Set rotation reminders, explain security why |
| Sharing key in chat/code | Warn: "Never share this key", show secure storage options |
| Forgetting key expiration | Calendar reminder, proactive notification at 7 days |

---

## Recommended Response Templates

### When user is uncertain:
"Not sure what you need? Here are common scenarios:
- [Option A with explanation]
- [Option B with explanation]
Which sounds closest?"

### When user makes a mistake:
"No problem! Easy fix:
[Clear recovery steps]
Try again?"

### When showing the key:
"🎉 Here's your API key! ⚠️ You'll only see it once!
Copy it now to [password manager / secure file]
Then close this modal."

### When key expires soon (7 days):
"⏰ Your API key expires in 7 days.
Ready to create a new one?
I can guide you through rotation."
