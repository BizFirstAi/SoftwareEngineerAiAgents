# Procedure: Troubleshoot Credentials

Common credential issues and solutions.

## Quick Diagnosis

Start here if something isn't working:

```
Is the credential not found?
  └─ Go to: Credential Not Found

Is credential retrieval returning an error?
  └─ Go to: Decryption Errors

Is workflow failing when using credential?
  └─ Go to: Credential Use Failures

Is credential access being denied?
  └─ Go to: Access Control Errors

Is credential expired?
  └─ Go to: Expiration Issues

Is rotation stuck or failed?
  └─ Go to: Rotation Issues

Something else?
  └─ Go to: Contact Support
```

## Credential Not Found

### Error
```
404 Not Found
{
  "errorCode": "CREDENTIAL_NOT_FOUND",
  "message": "Credential 42 does not exist"
}
```

### Diagnosis

**Check 1: Is credentialID correct?**
```bash
# List all credentials to find correct ID
curl -X GET https://api.bizfirst.com/api/credentials \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.items[] | {id: .credentialID, name: .name}'
```

**Check 2: Is credential soft-deleted?**
```bash
# Query by name to verify existence
curl -X GET "https://api.bizfirst.com/api/credentials/search/by-name?name=SendGrid" \
  -H "Authorization: Bearer $TOKEN"
```

If returns empty, credential was deleted.

**Check 3: Is credential in different tenant?**
```
- Credentials are scoped to TenantID from JWT
- Verify your JWT is for correct tenant
- If credential in different tenant, cannot access
```

### Solutions

| Cause | Solution |
|-------|----------|
| Wrong ID | Find correct ID via search by name |
| Soft-deleted | Credential marked Deleted=1; can be restored by admin |
| Different tenant | Must use credential within same tenant |
| Never created | Follow Procedure: Create Credential |

## Decryption Errors

### Error
```
500 Internal Server Error
{
  "errorCode": "ENCRYPTION_FAILED",
  "message": "Unable to decrypt credential. Please contact support."
}
```

### Diagnosis

**Check 1: Is vault provider healthy?**
```bash
# Check vault provider status
curl -X GET https://api.bizfirst.com/api/vault-providers/{vaultProviderID} \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Should return enabled: true
```

**Check 2: Is encryption key available?**
```
Vault Provider: 1 (Local HSM)
Key Version: 5
Status: ?
  - If key missing/revoked → Cannot decrypt
  - If key disabled → Cannot decrypt
```

**Check 3: Is there network connectivity?**
```
For cloud providers (Azure, AWS):
  - Network timeout → Vault provider unreachable
  - SSL error → Certificate issue
  - Authentication error → Vault credentials wrong
```

### Solutions

| Cause | Solution |
|-------|----------|
| Vault provider down | Wait for provider to recover; contact admin |
| Network timeout | Check network connectivity to vault |
| Key revoked | Rotate credential to new key (Procedure: Rotate) |
| Key version old | Archive old keys only after rotation |
| Certificate issue | Contact vault provider, update certs |
| Bug in code | Contact support with trace ID |

## Credential Use Failures

### Error
```
Workflow fails when using credential:
"Invalid credentials for service X"
```

### Diagnosis

**Check 1: Are credentials still valid in source system?**
```
Email:      Has password changed in email provider?
API:        Has API key been revoked?
Database:   Has database user been locked?
OAuth2:     Has refresh token expired?
```

**Check 2: Does workflow reference correct credentialID?**
```
Workflow node shows credentialID = 42
But created credential has credentialID = 43?
  → Wrong reference
```

**Check 3: Is credential type matching node requirement?**
```
SendEmail node requires: EmailCredential
But passed:             ApiKeyCredential
  → Type mismatch
```

**Check 4: Is credential expired?**
```bash
curl -X GET https://api.bizfirst.com/api/credentials/42 \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.expiresAt'

If expiresAt < now() → EXPIRED
```

### Solutions

| Cause | Solution |
|-------|----------|
| Secret rotated in source | Create new credential with current secret |
| API key revoked | Generate new API key, create new credential |
| Wrong credential reference | Update workflow to use correct credentialID |
| Type mismatch | Ensure workflow node type matches credential type |
| Credential expired | Rotate credential or create new one |
| Temporary service outage | Retry after service recovers |

## Access Control Errors

### Error: 401 Unauthorized
```json
{
  "errorCode": "UNAUTHORIZED",
  "message": "Missing or invalid JWT token"
}
```

**Solutions:**
1. Verify JWT token is included: `Authorization: Bearer <token>`
2. Verify token hasn't expired
3. Regenerate token from auth service
4. Check token format (should be in JWT format)

### Error: 403 Forbidden
```json
{
  "errorCode": "TENANT_MISMATCH",
  "message": "Credential belongs to different tenant"
}
```

**Solutions:**
1. Verify TenantID in JWT matches credential's TenantID
2. Use credential within same tenant as created
3. Contact admin if tenant ID needs correction

### Error: 403 Forbidden - Insufficient Role
```json
{
  "errorCode": "INSUFFICIENT_ROLE",
  "message": "User role 'CredentialViewer' cannot create credentials"
}
```

**Solutions:**
1. For Read-only: You have CredentialViewer (correct)
2. For Create/Update/Delete: Need CredentialManager role
3. For Rotation: Need CredentialRotator or SystemAdmin role
4. Request elevated role from admin

## Expiration Issues

### Error
```
409 Conflict
{
  "errorCode": "CREDENTIAL_EXPIRED",
  "message": "Credential has expired. Please rotate or regenerate."
}
```

### Diagnosis
```bash
# Check expiration date
curl -X GET https://api.bizfirst.com/api/credentials/42 \
  -H "Authorization: Bearer $TOKEN" \
  | jq '{expiresAt, daysUntilExpiration}'
```

### Solutions

**If expired:**
1. Create new credential (Procedure: Create Credential)
2. Update workflows to reference new credentialID
3. Delete or archive old credential

**If expiring soon (< 7 days):**
1. Set calendar reminder
2. Create new credential now
3. Plan migration date
4. Update workflows before expiration
5. Delete old credential after testing new one

**To prevent future expiration:**
```bash
# Monitor credentials expiring in 30 days
curl -X GET "https://api.bizfirst.com/api/credentials/expiring-soon?daysAhead=30" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Result: List of credentials to refresh
```

## Rotation Issues

### Issue: Rotation Stuck in "Pending"
```json
{
  "status": "Pending",
  "startedAt": "2026-09-29T12:00:00Z",
  "completedAt": null
}
```

**Solutions:**
1. Wait up to 5 minutes (normal operation)
2. Check vault provider health
3. If stuck > 5 min, contact support with keyRotationID
4. May need to retry rotation

### Issue: Rotation Failed
```json
{
  "status": "Failed",
  "failureReason": "New vault provider unreachable"
}
```

**Diagnosis:**
```bash
# Check both vault providers
curl -X GET https://api.bizfirst.com/api/vault-providers/1 \
  -H "Authorization: Bearer $ADMIN_TOKEN"

curl -X GET https://api.bizfirst.com/api/vault-providers/2 \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Both should have enabled: true
```

**Solutions:**
1. Check vault provider health with admin
2. Verify both providers are reachable
3. Retry rotation once provider recovers
4. If repeated failures, escalate to support

### Issue: Credential Won't Decrypt After Rotation
```
Before: GET /credentials/42 → Returns decrypted data ✓
After:  GET /credentials/42 → 500 Encryption Error ✗
```

**Solutions:**
1. Rotation may not have completed properly
2. Verify rotation status: `status: "Completed"`
3. If Pending: Wait and retry later
4. If Failed: Investigate failure reason
5. If Completed but still failing: Rotate back to old key

## Performance Issues

### Issue: Credential Retrieval Slow

**Diagnosis:**
```bash
# Measure request time
time curl -X GET https://api.bizfirst.com/api/credentials/42 \
  -H "Authorization: Bearer $TOKEN"

# Should respond in < 100ms
```

**If slow:**
1. Check vault provider network latency
2. Check database query performance
3. For cloud providers: May be first request (cold start)
4. Contact support if consistently slow

### Solution: Scale Vault Provider
```
If vault provider is bottleneck:
  - Migrate to higher-performance provider
  - Rotate credentials to new provider
  - See Procedure: Rotate Credential
```

## Data Integrity Issues

### Issue: Credential Data Corrupted
```
Error: Invalid JSON in decrypted data
  or  Unexpected format after decryption
```

**Solutions:**
1. This indicates encryption/decryption bug
2. Contact support with credentialID and trace ID
3. May need to restore from backup
4. If critical: Create new credential

### Issue: Encryption Key Lost
```
Cannot decrypt because key deleted from vault
```

**Solutions:**
1. Catastrophic scenario - requires data recovery
2. Contact support immediately
3. May require backup restoration
4. Recreate credential if backup unavailable

## Getting Help

### What to include in support ticket:

1. **Credential ID** — `credentialID: 42`
2. **Error message** — Full error response
3. **Steps to reproduce** — How to trigger issue
4. **Trace ID** — From error response header
5. **Timestamp** — When error occurred
6. **Vault provider** — Which provider in use
7. **Credential type** — EmailCredential, ApiKeyCredential, etc.

### Contact Support
```
Email: support@bizfirst.com
Subject: "[Credentials] Issue with credential X"
Body:
  Credential ID: 42
  Error Code: ENCRYPTION_FAILED
  Trace ID: 0HN1GNBV4C7KV:00000001
  Steps: Created credential → Test workflow failed
```

## Related Procedures
- [Create Credential](create-credential.md)
- [Validate Credential](validate-credential.md)
- [Rotate Credential](rotate-credential.md)

## See Also
- [Security Architecture](../../Knowledge/Credentials/02-security-architecture.md)
- [API Reference](../../Knowledge/Credentials/03-api-reference.md)
- [Integration Guide](../../Knowledge/Credentials/04-integration-guide.md)
