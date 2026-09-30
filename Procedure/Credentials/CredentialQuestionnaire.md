# Credential Setup Questionnaire

**This questionnaire captures all information needed to securely create and manage credentials.**

## 1. What Are You Protecting? (Credential Purpose)

**Question:** What system or resource does this credential grant access to?

Examples:
- Database server (PostgreSQL, SQL Server, MySQL)
- External API (Stripe, Twilio, SendGrid)
- Cloud service (AWS, Azure, Google Cloud)
- Internal service (microservice, webhook, file storage)
- SSH/remote access (Linux server, Git repository)

**Your answer:** ________________

**Recommendation:** Be specific. "Customer database" is better than "database."

---

## 2. What Type of Credential? (Credential Type)

**Choose one:**

- **API Key** — Simple key-based authentication (REST APIs, webhooks)
  - *Easiest to set up. Use for public APIs with limited scope.*
  
- **OAuth2** — Modern token-based authentication (Google, Microsoft, GitHub)
  - *Most secure for user-facing integrations. Supports token refresh.*
  
- **Database Connection** — Username + password for database servers
  - *Standard for data access. Supports encryption and rotation.*
  
- **SSH Key** — Public/private key pair for remote access
  - *Secure for server access. Can't be guessed, only stolen.*
  
- **Custom** — Proprietary or multi-part credentials (API key + secret, certificates, etc.)
  - *For specialized systems. Requires manual configuration.*

**Your answer:** ________________

---

## 3. Type-Specific Details

**If API Key:**
- API endpoint URL: ________________
- Where to get the key: ________________
- Key format (alphanumeric, JWT, etc.): ________________
- Header name it goes in: ________________

**If OAuth2:**
- Provider (Google, Microsoft, GitHub, custom): ________________
- Client ID: ________________
- Client Secret: ________________
- Authorization URL: ________________
- Token endpoint: ________________

**If Database:**
- Server address: ________________
- Database name: ________________
- Username: ________________
- Password: ________________ (will be encrypted)
- Port (default 5432 PostgreSQL, 1433 SQL Server): ________________

**If SSH:**
- Private key content or file path: ________________
- Key passphrase (if protected): ________________
- Server host: ________________
- Username for SSH: ________________

---

## 4. Scope & Permissions

**Question:** What can this credential do?

Examples:
- **Read-only:** View data, list resources, download files
- **Read-write:** Create, update, delete data; modify configurations
- **Admin:** All permissions, plus user/role management
- **Limited scope:** Only specific resources (e.g., one S3 bucket, one API endpoint)

**Your answer:** ________________

**Recommendation:** Follow the **Principle of Least Privilege** — give only what's needed. An app API key should *not* have admin access.

---

## 5. Security & Lifecycle

**Rotation Policy:** How often should this credential be refreshed?
- [ ] Never rotate (static key)
- [ ] Every 30 days
- [ ] Every 90 days
- [ ] Every 1 year
- [ ] On-demand only

**Expiration:** Should this credential auto-expire?
- [ ] No expiration
- [ ] Expires in _______ days/months/years

**Encryption:** How should this be stored?
- [ ] AES-256 encryption (recommended, default)
- [ ] Encrypted with HSM (hardware security module)
- [ ] Plaintext (NOT recommended—only for non-sensitive cases)

**Backup & Recovery:**
- Do you need a backup copy? [ ] Yes [ ] No
- Where will backups be stored? ________________
- Who has access to backups? ________________

---

## 6. Access Control

**Who can use this credential?**
- [ ] Single user
- [ ] Specific team (list names): ________________
- [ ] Application/service (list app names): ________________
- [ ] Role-based (list roles, e.g., "Admin", "Developer"): ________________

**Multi-tenant:** Is this credential:
- [ ] Single-tenant (used by one customer only)
- [ ] Shared/multi-tenant (used by multiple customers)

---

## 7. Testing & Validation

**How will you test this works?**

Example tests:
- Call API endpoint with the key
- Connect to database with username/password
- SSH into server using the key
- Verify permissions are correctly scoped

**Your test plan:** ________________

**Expected result:** ________________

---

## 8. Deployment Target

**Where will this credential be used?**
- [ ] Development (local, test environment)
- [ ] Staging (pre-production, testing environment)
- [ ] Production (live, customer-facing)
- [ ] All environments

**Recommendation:** Use *different* credentials per environment. Never use production creds in dev.

---

## 9. Summary & Next Steps

**Credential Summary:**
- **Purpose:** What system this protects
- **Type:** [API Key / OAuth2 / Database / SSH / Custom]
- **Scope:** [Read-only / Read-write / Admin / Limited]
- **Rotation:** [Never / 30 days / 90 days / 1 year / On-demand]
- **Access:** [Single user / Team / Application / Role-based]
- **Environment:** [Dev / Staging / Prod / All]

**Next Steps:**
1. ✅ Review questionnaire answers for completeness
2. ✅ Validate credential details (URLs, usernames, etc. are correct)
3. ✅ Test the credential in target system (verify access works)
4. ✅ Submit to CredentialAgent for creation
5. ✅ Store backup copy securely (if needed)
6. ✅ Add rotation reminder to calendar (if applicable)

**Questions?** Refer to [Credentials Knowledge Base](../../Knowledge/Credentials/) or ask your team lead.
