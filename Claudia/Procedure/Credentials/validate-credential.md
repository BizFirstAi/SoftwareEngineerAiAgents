# Procedure: Validate Credential

Step-by-step guide to verify a credential is working correctly.

## Overview
Validation ensures a credential is encrypted properly, not expired, and can be used by workflows.

## Prerequisites
- Credential created and credentialID known
- Valid JWT Bearer token
- Permission to read/test credentials

## Steps

### Step 1: Retrieve Credential
Get the credential to check its properties:

```http
GET https://api.bizfirst.com/api/credentials/{credentialID}
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "credentialID": 42,
  "credentialType": "EmailCredential",
  "name": "SendGrid SMTP",
  "data": {
    "email": "noreply@sendgrid.com",
    "password": "[DECRYPTED]",
    "smtpServer": "smtp.sendgrid.net",
    "smtpPort": 587
  },
  "vaultProviderID": 1,
  "encryptionKeyVersion": 5,
  "createdOn": "2026-09-29T10:00:00Z",
  "createdBy": 1,
  "expiresAt": null
}
```

### Step 2: Check Expiration
Verify the credential hasn't expired:

```
IF expiresAt is null:
  ✓ No expiration set (valid indefinitely)

IF expiresAt is in future:
  ✓ Credential valid until expiresAt

IF expiresAt is in past:
  ✗ CREDENTIAL EXPIRED
  → Must rotate or delete
```

**Example:**
```json
"expiresAt": "2027-09-29T23:59:59Z"
→ Today: 2026-09-29 → Valid ✓
→ In 366 days, credential will expire
```

### Step 3: Verify Encryption
Check encryption metadata:

```
VaultProviderID: 1          ← Which provider encrypted this
EncryptionKeyVersion: 5     ← Which key version was used
```

Ensure the vault provider is still enabled:

```http
GET https://api.bizfirst.com/api/vault-providers/{vaultProviderID}
```

**Response should show:**
```json
{
  "vaultProviderID": 1,
  "name": "Local HSM",
  "enabled": true  ← Must be true
}
```

If `enabled: false`:
```
✗ Vault provider disabled
→ Contact admin to re-enable or rotate credential to new provider
```

### Step 4: Type-Specific Validation

#### Email Credential
```bash
# Verify SMTP connectivity
openssl s_client -connect smtp.sendgrid.net:587 -starttls smtp

# Check credentials in SendEmail workflow node
# and test sending a message
```

#### API Key Credential
```bash
# Test API call with credential
curl -X GET https://api.salesforce.com/services/data/ \
  -H "Authorization: Bearer [password-from-credential]"

# Should return 200 OK, not 401 Unauthorized
```

#### Database Credential
```bash
# Test connection using credentials
sqlcmd -S db.example.com,3306 -U [username] -P [password] \
  -Q "SELECT 1"

# Should return 1 without timeout
```

#### OAuth2 Credential
```bash
# Check token not expired
# AccessToken expiration < 5 minutes away?
# If yes, credential needs refresh before use

# Verify refresh token works
POST https://oauth-provider/token \
  -d "grant_type=refresh_token&refresh_token=[refreshToken]"

# Should return new access token
```

#### SSH Key Credential
```bash
# Verify key format
openssl rsa -in [private-key-pem] -check -noout

# Check if passphrase required
ssh-keygen -y -f [private-key-pem]

# Should output public key
```

### Step 5: Test in Workflow
Create a minimal test workflow:

**For Email:**
```
Workflow: Test Email Credential
  ├─ Input: credentialID = 42
  ├─ SendEmail node
  │  ├─ Credential: 42
  │  ├─ To: test@example.com
  │  ├─ Subject: "Test"
  │  └─ Body: "If you see this, credential works"
  └─ Log: Success/Failure
```

**For API:**
```
Workflow: Test API Credential
  ├─ Input: credentialID = 42
  ├─ CallApi node
  │  ├─ Credential: 42
  │  ├─ Method: GET
  │  ├─ Url: https://api.service.com/health
  │  └─ Expected: 200 OK
  └─ Log: Response
```

**Run the workflow and check:**
```
✓ Workflow completes successfully
✓ No "Credential not found" error
✓ No "Invalid credentials" error
✓ AccessLog shows Read entry
```

### Step 6: Check Access Logs
Verify the credential is being used properly:

```http
GET https://api.bizfirst.com/api/credentials/{credentialID}/access-logs
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "items": [
    {
      "accessLogID": 1001,
      "accessType": "Read",
      "userID": 1,
      "agentID": "TestWorkflow-123",
      "ipAddress": "192.0.2.1",
      "success": true,
      "timestamp": "2026-09-29T15:30:00Z"
    }
  ],
  "totalCount": 1
}
```

**Check:**
- ✓ Recent access (timestamp = now)
- ✓ Access type = Read (expected)
- ✓ Success = true (no errors)
- ✓ No unauthorized access patterns

## Validation Checklist

```
[ ] Credential retrieval succeeds (200 OK)
[ ] Data decrypts properly (no encryption errors)
[ ] Expiration: expiresAt is null or in future
[ ] Vault provider: enabled = true
[ ] Encryption key version: matches vault provider
[ ] Type-specific validation passes:
    [ ] Email: SMTP connects, credentials work
    [ ] API: API call succeeds with credential
    [ ] Database: Connection succeeds
    [ ] OAuth2: Tokens valid and not expired
    [ ] SSH: Private key valid PEM format
[ ] Workflow test: Credential used successfully
[ ] Access log: Most recent entry shows success
[ ] No suspicious access patterns in log
```

## Common Issues

### "Credential Not Found" Error
```
Problem: GET /api/credentials/{id} returns 404
Causes:
  1. Wrong credentialID
  2. Credential soft-deleted (Deleted=1)
  3. Different tenant owns credential
Solution:
  - Verify credentialID
  - Check soft-delete status
  - Confirm you're in same tenant as credential
```

### "Vault Provider Not Responding"
```
Problem: Decryption fails with timeout
Causes:
  1. Vault provider service down
  2. Network connectivity issue
  3. Vault provider disabled
Solution:
  - Contact admin to check vault provider health
  - Verify network connectivity
  - Check if enabled=true
```

### "Invalid Credentials" Error
```
Problem: Workflow fails with 401/403 when using credential
Causes:
  1. Password/secret incorrect or rotated
  2. API key revoked or expired
  3. Database user locked
Solution:
  - Verify secret is current with source system
  - Check third-party system hasn't changed password
  - Update credential with new secret
  - See Procedure: Create Credential (create new one)
```

### "Credential Expired"
```
Problem: Credential returns "expired" error
Causes:
  1. expiresAt < now()
  2. Key expired in vault
Solution:
  - Rotate credential to new key/provider
  - Or delete if no longer needed
  - See Procedure: Rotate Credential
```

## Monitoring

Set up recurring validation:

**Daily:**
```
- Check for credentials expiring in 7 days
- Review access logs for unusual patterns
```

**Weekly:**
- Run test workflows for critical credentials
- Verify vault provider health

**Monthly:**
- Rotate credentials approaching expiration
- Audit access logs for compliance

## Next Steps

After validation:

1. **Credential valid** → Can be used in workflows confidently
2. **Credential invalid** → See troubleshooting, fix, re-validate
3. **Credential expiring soon** → Plan rotation (see Procedure: Rotate Credential)
4. **Unusual access** → Review security, consider re-keying

## Related Procedures
- [Create Credential](create-credential.md) — Create new credential
- [Rotate Credential](rotate-credential.md) — Change encryption key
- [Troubleshoot](troubleshoot.md) — Detailed issue resolution

## See Also
- [Integration Guide](../../Knowledge/Credentials/04-integration-guide.md) — How agents use credentials
- [API Reference](../../Knowledge/Credentials/03-api-reference.md) — Exact endpoints
- [Security Architecture](../../Knowledge/Credentials/02-security-architecture.md) — Encryption details
