# API Key Questionnaire

Interactive questionnaire for creating API keys. Guides users through configuration.

## Phase 1: Purpose & Environment

**Question 1: Why do you need an API key?**
- Session authentication (this session only)
- Service-to-service integration (backend API)
- Third-party integration (Salesforce, Slack)
- Development/Testing (temporary)
- Production deployment (long-term)

**Question 2: Which environment?**
- **Development** — High flexibility, no expiration recommended
- **Staging** — 6-month expiration, production scopes
- **Production** — 90-day expiration, minimal scopes (RECOMMENDED)

## Phase 2: Scope & Permissions

**Question 3: What operations?**
- Read (fetch data, query, status)
- Write (create, update, modify)
- Delete (remove data)
- Admin (full control)

> **Recommendation:** Start with minimal scope

**Question 4: Specific scopes?**
Common combinations:
- API monitoring: `api:read`
- Data sync: `data:read`, `data:write`
- Admin panel: `admin:*`
- Webhook receiver: `events:read`, `data:write`

## Phase 3: Expiration & Security

**Question 5: Expiration?**
- Never (Dev only)
- 1 Month (Recommended for dev)
- 3 Months (Recommended for prod)
- 6 Months (Recommended for staging)
- 1 Year (Limited use)
- Custom date

**Question 6: Expiration reminder?**
- Email 2 weeks before (Recommended)
- Email 1 week before
- Email 1 day before
- No reminder (manual rotation)

## Phase 4: Integration Details

**Question 7: How will this key be used?**
- Direct API calls (curl, HTTP requests)
- SDK/Library (programmatic access)
- Workflow integration (BizFirst workflows)
- Third-party service (Zapier, Make, etc.)
- Webhook/Callback (incoming events)

**Question 8: Will this key be shared?**
- Personal only (just for me)
- Team access (multiple members)
- Public/Webhook (external systems)

> **⚠️ Security:** Personal → password manager; Team → vault; Public → minimal scopes

## Phase 5: Special Requirements

**Question 9: Special options?**
- IP whitelisting (restrict to specific IPs)
- Rate limiting (requests per minute)
- Webhook signing (HMAC signatures)
- Audit logging (track all usage)

## Phase 6: Review & Confirmation

**Summary:**
```
Purpose: [User's selection]
Environment: [Dev/Staging/Prod]
Scopes: [read, write, ...]
Expiration: [90 days]
Shared: [Personal only]
Security: 🟢 Good

Ready to create? [Yes] [Edit] [Cancel]
```

## Phase 7: Key Creation (Passport Dashboard)

Agent guides:
1. Navigate to: https://dev.grippingly.com/passportadmindashboard/api-keys
2. Click "Generate New Key"
3. Enter name (example: prod-data-sync-90d)
4. Select scopes (matching questionnaire)
5. Set expiration
6. Click "Create"
7. Copy key immediately (shown once only!)

## Phase 8: Post-Creation

✅ Key created successfully!

Key: `sk_prod_xyz789...` (shown once, must copy now!)
ID: `key_abc123...`
Expires: 2026-12-28

Next steps:
1. Store securely (password manager/vault)
2. Add to application config
3. Test with sample request
4. Set renewal reminder (2 weeks before expiry)
5. Document where using it

Test key? [Test] [Done]

---
**Time:** 5-10 minutes | **Security:** High
