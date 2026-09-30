# Revoke API Key

**Purpose:** Procedure to revoke (disable) an API key via Passport Admin Dashboard.

---

## When to Revoke

✅ **You should revoke when:**
- Key is no longer needed
- Key has been compromised or leaked
- Rotating to a new key
- Ending a project or decommissioning service
- Employee leaving organization
- Reducing attack surface area

---

## Step 1: Navigate to API Keys Page

**URL:** https://dev.grippingly.com/passportadmindashboard/api-keys

**Actions:**
1. Open URL in browser
2. Log in if prompted
3. You should see list of your API keys:

```
┌──────────────────────────────────────────────┐
│ API Keys                                     │
├──────────────────────────────────────────────┤
│ Name                  Created    Expires   Status │
│ ChatBot-Dev-2026      Today      12/28/26  ✓ Active │
│ OldProject-Prod       2 months   10/15/25  ✓ Active │
│ TestKey-2026-Aug      5 days     11/01/26  ✓ Active │
└──────────────────────────────────────────────┘
```

---

## Step 2: Find the Key to Revoke

**Identify the key:**
- Look for key by **Name**
- Check **Created** date (when was it created)
- Check **Expires** date (when it expires)
- Verify **Status** is "Active"

**Example:**
- Want to revoke: "OldProject-Prod"
- Created: 2 months ago
- Expires: 10/15/25 (in future, but no longer used)
- Status: Active (currently working)

---

## Step 3: Click Revoke/Delete Button

**Location:** Right side of the key row

**Buttons present:**
- 🔄 **Details/View** — Show key details
- 🗑️ **Revoke** — Disable the key
- ❌ **Delete** — Permanently remove

**Action:** Click **Revoke** button (or Delete if removing completely)

---

## Step 4: Confirm Revocation

**Confirmation dialog appears:**

```
┌─────────────────────────────────────────┐
│ Revoke API Key?                         │
├─────────────────────────────────────────┤
│                                         │
│ You are about to revoke:                │
│ "OldProject-Prod"                       │
│                                         │
│ This action will:                       │
│ ✓ Disable the key immediately          │
│ ✓ Prevent further API calls            │
│ ✓ NOT delete historical data            │
│ ✓ NOT delete logs/audit trail           │
│                                         │
│ You can re-activate the key later if    │
│ you change your mind.                   │
│                                         │
│ ⚠️  WARNING:                            │
│ Any services using this key will fail   │
│ with 401 Unauthorized errors.           │
│                                         │
│ Are you sure?                           │
│            [Cancel]  [Revoke]           │
└─────────────────────────────────────────┘
```

**Agent:** "This will immediately disable the key. All API calls with this key will fail. Continue?"

**Options:**
- ✅ **[Revoke]** — Proceed with revocation
- ❌ **[Cancel]** — Keep key active

---

## Step 5: Revocation Complete

**Success message:**

```
✅ API Key Revoked Successfully

Name:        OldProject-Prod
Status:      REVOKED
Revoked at:  Today 2:45 PM
```

**Key status changes:**
- From: ✓ Active (green)
- To: ✗ Revoked (red/grayed out)

---

## Step 6: Verify Revocation

**In API Keys list:**
- Key now shows **Status: Revoked** (red indicator)
- Key is still visible in list (for audit trail)
- Key cannot be reactivated (must create new one if needed)

**Verify via API:**
```csharp
var response = await client.GetAsync(
    "https://dev.grippingly.com/api/v1/data",
    new { Authorization = "Bearer sk_dev_OldProject..." }
);

// Response: 401 Unauthorized
// Error: "This API key has been revoked"
```

---

## Step 7: Notify Services/Users

**After revoking, notify:**

| Stakeholder | Action |
|-------------|--------|
| **Developers** | Update code to use new key (if needed) |
| **DevOps** | Update environment variables |
| **Services** | Restart services using new key |
| **Users** | Inform of maintenance if user-facing |
| **Team** | Document reason for revocation |

**Example notification:**
```
Subject: API Key "OldProject-Prod" Revoked

The API key "OldProject-Prod" has been revoked as of 2026-09-30.

If you were using this key, please:
1. Create a new API key
2. Update your configuration
3. Redeploy your application

New key should be stored securely in:
- Password manager
- Environment variables (.env)
- Cloud secrets vault

Contact [admin] if you have questions.
```

---

## Special Cases

### Case 1: Key Compromised/Leaked

**Immediate action:**
1. Revoke key immediately (do not wait)
2. Create new key with different scope restrictions
3. Audit API calls made with compromised key
4. Check for unauthorized access in logs

**Audit query:**
```sql
SELECT * FROM APICallLogs
WHERE ApiKeyLastFourChars = 'xxxx'  -- Last 4 chars of compromised key
  AND CreatedAt > @CompromiseTime
ORDER BY CreatedAt DESC;
```

### Case 2: Bulk Revocation (Multiple Keys)

If revoking many keys:
1. Create new keys first with same scopes
2. Update services to use new keys
3. Verify new keys working
4. Revoke old keys in batches
5. Monitor for failures

### Case 3: User/Employee Leaving

**Revocation checklist:**
- [ ] Revoke all of user's API keys
- [ ] Check key usage in last 30 days
- [ ] Audit API calls (ensure no unusual activity)
- [ ] Offboard user from system
- [ ] Archive documentation

---

## Auditing Revoked Keys

**View revocation history:**
```
API Key Activity Log

Key Name:              OldProject-Prod
Status:                REVOKED
Created:               2026-07-30
Revoked:               2026-09-30
Revoked by:            admin@company.com
Reason:                Project decommissioned

Last activity:         2026-09-29 14:32:00 (1 day ago)
Total API calls:       1,247 calls
Success rate:          99.8%
```

---

## Recovery Options

### If Key Revoked by Mistake

**Option 1: Create New Key (Recommended)**
- Cannot reactivate revoked key
- Create new key with same settings
- Use [APIKeyQuestionnaire.md](APIKeyQuestionnaire.md)

**Option 2: Request Re-activation**
- Contact admin (within 24 hours of revocation)
- Admin can re-activate key (if not deleted)
- Not guaranteed — depends on policy

---

## Best Practices

✅ **DO:**
- Revoke keys when no longer needed
- Document reason for revocation
- Notify teams affected by revocation
- Audit key usage before revoking
- Keep revoked keys in audit log (for compliance)

❌ **DON'T:**
- Revoke another user's key without permission
- Revoke key without warning (unless compromised)
- Delete key immediately (keep audit trail)
- Forget to update systems using the key

---

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| Can't find key to revoke | Key already revoked | Check "Revoked" filter in list |
| "Permission denied" error | No admin access | Contact admin to revoke for you |
| Key still works after revoke | Cache not updated | Wait 1-2 minutes, clear cache, retry |
| Need to re-activate key | Key was revoked | Create new key instead |
| Audit trail missing | Very old key | Check archived logs database |

---

## Related Procedures

- [APIKeyQuestionnaire.md](APIKeyQuestionnaire.md) — Create new API key
- [check-existing-apikey.md](check-existing-apikey.md) — Verify existing key
- [use-apikey-in-session.md](use-apikey-in-session.md) — Use key in session
- [troubleshoot.md](troubleshoot.md) — Debug API key issues
