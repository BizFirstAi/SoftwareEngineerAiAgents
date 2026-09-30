# Procedure: Rotate Credential

Step-by-step guide to rotate a credential's encryption key or vault provider.

## Overview
Credential rotation re-encrypts a secret under a new vault provider or key version, without changing the credential ID or requiring workflow updates.

## When to Rotate

- **Key expiration** — Current encryption key approaching end-of-life
- **Provider migration** — Moving from one vault provider to another
- **Compliance** — Policy requires periodic key rotation
- **Security incident** — Vault provider compromised, need new key ASAP
- **Performance** — Migrate to higher-performance vault provider

## Prerequisites
- Credential created and working
- Admin or SystemAdmin role (rotation requires elevated permissions)
- Target vault provider is available and enabled
- Target key version exists in vault provider

## Steps

### Step 1: Check Current Encryption
Retrieve the credential to see current encryption:

```http
GET https://api.bizfirst.com/api/credentials/{credentialID}
Authorization: Bearer <jwt-admin-token>
```

**Response:**
```json
{
  "credentialID": 42,
  "credentialType": "EmailCredential",
  "vaultProviderID": 1,
  "encryptionKeyVersion": 5
}
```

**Note:**
- Current vault: VaultProviderID = 1 (Local HSM)
- Current key: EncryptionKeyVersion = 5

### Step 2: Choose New Vault Provider
List available vault providers:

```http
GET https://api.bizfirst.com/api/vault-providers
Authorization: Bearer <jwt-admin-token>
```

**Response:**
```json
{
  "items": [
    {
      "vaultProviderID": 1,
      "name": "Local HSM",
      "code": "LOCAL_HSM",
      "enabled": true
    },
    {
      "vaultProviderID": 2,
      "name": "Azure Key Vault",
      "code": "AZURE_KV",
      "enabled": true
    },
    {
      "vaultProviderID": 3,
      "name": "AWS KMS",
      "code": "AWS_KMS",
      "enabled": true
    }
  ]
}
```

**Requirements:**
- Provider must be enabled (enabled = true)
- Provider must have target key version available
- Provider should be healthy and responding

### Step 3: Get New Key Version
Contact vault admin to provision a new encryption key:

```
Request:
  Provider: Azure Key Vault
  Algorithm: AES-256-GCM
  Status: Active
  Rotation frequency: Annual

Response:
  Key Version: 6
  Created: 2026-09-29
  Expiration: 2027-09-29
```

### Step 4: Initiate Rotation
Start the rotation process:

```http
POST https://api.bizfirst.com/api/credentials/{credentialID}/rotate
Authorization: Bearer <jwt-admin-token>
Content-Type: application/json

{
  "newVaultProviderID": 2,
  "newKeyVersion": 6
}
```

**Response (201 Created):**
```json
{
  "keyRotationID": 99,
  "credentialID": 42,
  "oldVaultProviderID": 1,
  "oldKeyVersion": 5,
  "newVaultProviderID": 2,
  "newKeyVersion": 6,
  "status": "Pending",
  "startedAt": "2026-09-29T12:00:00Z",
  "completedAt": null
}
```

**Save the keyRotationID** — Use to check status.

### Step 5: Monitor Rotation Progress
Poll the rotation status:

```http
GET https://api.bizfirst.com/api/credentials/rotations/{keyRotationID}
Authorization: Bearer <jwt-admin-token>
```

**Response (in progress):**
```json
{
  "keyRotationID": 99,
  "status": "Pending",
  "completedAt": null
}
```

**Response (completed):**
```json
{
  "keyRotationID": 99,
  "status": "Completed",
  "completedAt": "2026-09-29T12:02:00Z"
}
```

**Timeline:**
- Typically takes seconds to minutes
- May take longer if credential is large
- Check every 30 seconds until Completed or Failed

### Step 6: Verify Rotation Success
Retrieve the credential to confirm:

```http
GET https://api.bizfirst.com/api/credentials/{credentialID}
Authorization: Bearer <jwt-admin-token>
```

**Response should show:**
```json
{
  "credentialID": 42,
  "vaultProviderID": 2,        ← New provider
  "encryptionKeyVersion": 6     ← New key version
}
```

**Verification:**
- ✓ VaultProviderID changed to 2 (Azure)
- ✓ EncryptionKeyVersion changed to 6
- ✓ credentialID unchanged (42)
- ✓ Data still decrypts correctly

### Step 7: Test After Rotation
Ensure credential still works in workflows:

```
Workflow: Test Rotated Credential
  ├─ Input: credentialID = 42
  ├─ SendEmail node
  │  ├─ Credential: 42
  │  └─ Send test email
  └─ Verify: Email sent successfully
```

**Checks:**
- ✓ Workflow can retrieve credential
- ✓ Credential decrypts under new key
- ✓ Actual operation succeeds (email sent, API called, etc.)
- ✓ AccessLog shows successful Read

### Step 8: Decommission Old Key (Optional)
After rotation is verified, old encryption key can be retired:

```
Contact vault admin:
  "Key version 5 in Local HSM (provider 1) can be archived.
   All credentials using this key have been rotated to Azure KMS (provider 2).
   Safe to retire on 2026-10-29."
```

**Note:** Keep old keys for minimum 30-90 days in case rollback needed.

## Rotation Checklist

```
[ ] Current encryption status checked (old provider/key noted)
[ ] New vault provider identified and enabled
[ ] New key version provisioned in vault
[ ] Rotation initiated (keyRotationID obtained)
[ ] Rotation status monitored (waited for Completed)
[ ] Credential retrieved and verified new provider/key
[ ] Test workflow run successfully
[ ] AccessLog shows successful credential access
[ ] Stakeholders notified (if needed)
[ ] Old key archival scheduled (optional)
```

## Error Handling

### "Vault Provider Not Found"
```
Problem: New VaultProviderID doesn't exist
Response: 404 Not Found
Solution:
  - Verify vault provider ID is correct
  - List providers: GET /vault-providers
  - Choose existing provider
```

### "Key Version Not Available"
```
Problem: New key version doesn't exist in vault
Response: 400 Bad Request
Solution:
  - Contact vault admin to provision key version
  - Verify key version number is correct
  - Check new provider has the version available
```

### "Rotation Failed"
```
Problem: Rotation initiated but failed partway
Response: GET /rotations/{rotationID} → status: "Failed"
Solution:
  1. Check failureReason field
  2. Verify both providers are healthy
  3. Check network connectivity to vault providers
  4. May need to retry rotation
  5. Contact support if persistent
```

### "Credential Decryption Fails After Rotation"
```
Problem: New key decrypts but returns garbage
Causes:
  1. Key version mismatch (new key v6 but data says v5)
  2. Old key still in use (rotation didn't complete)
Solution:
  - Retry rotation if status is Pending
  - Verify rotation completed (status: Completed)
  - Restore from backup if critical
```

## Rollback (If Needed)

If rotation fails and credential is broken:

```
Option 1: Rotate Again
  - Initiate new rotation back to old provider/key
  - Verify credential works
  - Then investigate root cause

Option 2: Restore from Backup
  - If available, restore credential from backup
  - Test thoroughly before using
  - Schedule rotation after stability confirmed
```

## Monitoring Rotations

**Track rotation history:**
```http
GET https://api.bizfirst.com/api/credentials/{credentialID}/rotations
Authorization: Bearer <jwt-admin-token>
```

**Response shows:**
```json
{
  "items": [
    {"keyRotationID": 99, "status": "Completed", ...},
    {"keyRotationID": 98, "status": "Completed", ...}
  ]
}
```

**For compliance:**
- Keep audit log of all rotations
- Who initiated, when, old/new provider/key
- Date and time rotation completed
- Any failures or retries

## Best Practices

1. **Plan ahead** — Don't rotate on Friday before holidays
2. **Notify users** — Let teams know migration is happening
3. **Test thoroughly** — Always test after rotation before critical use
4. **Keep backups** — Maintain credential snapshots in case of emergency
5. **Monitor access logs** — Watch for unusual access patterns after rotation
6. **Rotate regularly** — Annual or when provider changes
7. **Document** — Record why and when rotations happened

## Next Steps

After successful rotation:

1. **Decommission old key** — Work with vault admin to retire
2. **Update runbooks** — If documentation mentions old provider
3. **Plan next rotation** — Schedule next key rotation (annually)
4. **Monitor** — Check access logs for any issues

## Related Procedures
- [Create Credential](create-credential.md) — Initial credential creation
- [Validate Credential](validate-credential.md) — Verify credential works
- [Troubleshoot](troubleshoot.md) — Detailed issue resolution

## See Also
- [Security Architecture](../../Knowledge/Credentials/02-security-architecture.md) — Key versioning details
- [API Reference](../../Knowledge/Credentials/03-api-reference.md) — Rotation endpoints
