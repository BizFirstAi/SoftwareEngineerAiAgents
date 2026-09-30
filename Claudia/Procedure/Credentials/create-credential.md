# Procedure: Create Credential

Step-by-step guide for CredentialDeveloper agent to create credentials.

## Overview
Creating a credential stores an encrypted secret that can be used by workflows, apps, and agents.

## Prerequisites
- CredentialDeveloper role or higher
- Valid JWT Bearer token
- Target system credentials (password, API key, etc.)
- Understand the credential type needed

## Steps

### Step 1: Identify Credential Type
Determine what kind of credential you need to store:

| If you need... | Use type... | Details |
|---|---|---|
| SMTP/email password | EmailCredential | Username + password for email service |
| API token (Salesforce, HubSpot, etc.) | ApiKeyCredential | API key ± secret from third-party service |
| Database credentials | DatabaseCredential | Host, port, user, password |
| OAuth2 tokens | OAuth2Credential | Client ID, secret, refresh token |
| SSH private key | SshKeyCredential | PEM-format private key |
| Custom secrets | CustomCredential | Free-form key-value pairs |

**Example:** Storing SendGrid SMTP credentials → Use EmailCredential

### Step 2: Gather Credential Data
Collect all required fields for the credential type:

**Email Credential example:**
- Email: `noreply@sendgrid.com`
- Password: `SG.xxxxxxxxxxxxxxxxxxxx` (SendGrid API key)
- SMTP Server: `smtp.sendgrid.net`
- SMTP Port: `587`

**API Key Credential example:**
- Service Name: `Salesforce`
- API Key: `0Dxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (OAuth token)
- Base URL: `https://instance.my.salesforce.com`

### Step 3: Prepare Request
Build the REST request:

```http
POST https://api.bizfirst.com/api/credentials
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "credentialType": "EmailCredential",
  "name": "SendGrid SMTP",
  "data": {
    "email": "noreply@sendgrid.com",
    "password": "SG.xxxxxxxxxxxxxxxxxxxx",
    "smtpServer": "smtp.sendgrid.net",
    "smtpPort": 587
  },
  "description": "SendGrid SMTP for production transactional emails",
  "expiresAt": "2027-09-29T23:59:59Z"
}
```

**Field explanation:**
- `credentialType` — One of: EmailCredential, ApiKeyCredential, DatabaseCredential, OAuth2Credential, SshKeyCredential, CustomCredential
- `name` — Unique identifier within your tenant
- `data` — Type-specific fields (see Knowledge/Credentials/01-credential-types.md)
- `description` — Optional; for documentation
- `expiresAt` — Optional; after which credential cannot be used

### Step 4: Send Request
Call the Credentials API:

```bash
curl -X POST https://api.bizfirst.com/api/credentials \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @credential-request.json
```

### Step 5: Validate Response
If successful, receive (201 Created):

```json
{
  "credentialID": 42,
  "credentialType": "EmailCredential",
  "name": "SendGrid SMTP",
  "vaultProviderID": 1,
  "encryptionKeyVersion": 5,
  "createdOn": "2026-09-29T10:00:00Z",
  "createdBy": 1
}
```

**Save the credentialID** — You'll use this to reference the credential in workflows.

### Step 6: Document for Workflow Use
Record the credential ID and its purpose:

```markdown
## SendGrid SMTP Credential
- **Credential ID:** 42
- **Type:** EmailCredential
- **Created:** 2026-09-29
- **Expires:** 2027-09-29
- **Use in workflows:** SendEmail node, production emails
- **Maintained by:** DevOps team
```

## Error Handling

### 400 Bad Request - Invalid Type
**Problem:** Credential type not recognized
```json
{
  "errorCode": "INVALID_CREDENTIAL_TYPE",
  "message": "Credential type 'WrongType' not supported"
}
```
**Solution:** Use correct type from Knowledge/Credentials/01-credential-types.md

### 400 Bad Request - Missing Required Field
**Problem:** Missing required field in `data`
```json
{
  "errorCode": "VALIDATION_FAILED",
  "message": "Field 'email' is required for EmailCredential"
}
```
**Solution:** Review credential type schema, add missing field

### 401 Unauthorized
**Problem:** JWT token invalid or expired
**Solution:** Request new JWT token, ensure Authorization header format is `Bearer <token>`

### 403 Forbidden
**Problem:** User doesn't have CredentialDeveloper role
**Solution:** Request elevated permissions from admin

### 409 Conflict
**Problem:** Name already exists in tenant
**Solution:** Use unique name (add timestamp, service identifier, etc.)

## Validation Checklist

Before creating a credential:

- [ ] Credential type correctly identified
- [ ] All required fields for type provided
- [ ] Passwords/secrets are current (not expired, rotated)
- [ ] Name is unique within tenant
- [ ] Expiration date (if set) is in future
- [ ] Email fields are valid email format (if EmailCredential)
- [ ] Database port is 1-65535 (if DatabaseCredential)
- [ ] SSH private key is valid PEM format (if SshKeyCredential)
- [ ] JWT token is valid and has CredentialDeveloper role
- [ ] Vault provider is enabled and reachable

## Testing Credential

After creation, verify the credential works:

### For Email Credentials:
```
1. Create credential
2. In workflow, add SendEmail node
3. Reference credentialID
4. Send test email
5. Verify delivery
```

### For API Credentials:
```
1. Create credential
2. In workflow, add CallApi node
3. Reference credentialID
4. Make test API call
5. Check response in logs
```

### For Database Credentials:
```
1. Create credential
2. In workflow, add DatabaseQuery node
3. Reference credentialID
4. Execute test query
5. Verify results
```

## Troubleshooting

**Q: "Vault provider not responding"**
A: Vault provider may be down. Wait and retry, or contact admin.

**Q: "Encryption failed"**
A: Encryption service issue. Contact support with trace ID.

**Q: "Invalid JWT token"**
A: Token expired or malformed. Regenerate token, check Authorization header.

**Q: "Credential already exists"**
A: Name not unique. Rename credential (append version, timestamp, environment).

## Next Steps

After creating a credential:

1. **Use in workflow** — Reference credentialID in workflow nodes
2. **Rotate if needed** — See Procedure/Credentials/rotate-credential.md
3. **Monitor usage** — Check AccessLogs for unauthorized access
4. **Plan expiration** — Set reminders before ExpiresAt date

## Related Procedures
- [Validate Credential](validate-credential.md) — Verify credential works
- [Rotate Credential](rotate-credential.md) — Change encryption key
- [Troubleshoot](troubleshoot.md) — Common issues and fixes

## See Also
- [Credential Types](../../Knowledge/Credentials/01-credential-types.md) — All supported types
- [API Reference](../../Knowledge/Credentials/03-api-reference.md) — Exact API format
- [Security Architecture](../../Knowledge/Credentials/02-security-architecture.md) — How credentials are encrypted
