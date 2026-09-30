# Agent Integration Guide

How agents and workflows retrieve and use credentials.

## Credential Retrieval Pattern

### Step 1: Store Credential
CredentialDeveloper agent or admin stores credential:
```
POST /api/credentials → CredentialID = 42 returned
```

### Step 2: Use in Workflow
Workflow node references the credential:
```
Workflow Node: SendEmail
  Inputs:
    - credentialID: 42
    - to: user@example.com
    - subject: "Welcome"
```

### Step 3: Agent Retrieves at Runtime
Node executor retrieves decrypted credential:
```csharp
var credential = await _credentialService.GetByIdAsync(credentialID);
// credential.data = { email: "...", password: "[decrypted]", ... }
```

### Step 4: Access Log Entry
Every retrieval is logged for compliance:
```
AccessLog {
  credentialID: 42,
  accessType: "Read",
  agentID: "WorkflowExecutor-123",
  timestamp: "2026-09-29T15:30:00Z",
  success: true
}
```

## Common Integration Points

### Workflow Nodes
Nodes that need credentials:

| Node Type | Credential Type | Usage |
|-----------|-----------------|-------|
| SendEmail | EmailCredential | SMTP to send emails |
| CallApi | ApiKeyCredential | Authorization header |
| QueryDatabase | DatabaseCredential | Connection string |
| ConnectElasticsearch | CustomCredential | Host, user, password |
| ConnectOdoo | ApiKeyCredential | Odoo API authentication |
| SFTPUpload | SshKeyCredential | Private key for authentication |
| CallOAuth2 | OAuth2Credential | Refresh token for token renewal |

### Agent Integration Points

**AppDeveloper Agent:**
- Can reference credentials in widget data bindings
- Example: API endpoint widget with auth credentials

**FormDeveloper Agent:**
- Can bind form data submission to API with credentials
- Example: POST form to third-party service with API key

**WorkflowDeveloper Agent:**
- Creates workflow steps that reference credentials
- Validates credential exists and type matches node requirement

## Retrieving Credentials

### By ID
```csharp
// Single credential lookup
var credential = await _credentialService.GetByIdAsync(credentialID);
var data = credential.Data; // Decrypted JSON
```

### By Type
```csharp
// Find all email credentials in tenant
var credentials = await _credentialService.GetByTypeAsync("EmailCredential");
foreach (var cred in credentials) {
    // Process each credential
}
```

### By Name
```csharp
// Find credential by unique name
var credential = await _credentialService.GetByNameAsync("SendGrid SMTP");
```

## Best Practices

### Memory Handling
```csharp
// ✓ Good: Decrypt once, use, then clear
var credential = await _credentialService.GetByIdAsync(id);
try {
    await _emailService.SendAsync(credential.Email, credential.Password);
} finally {
    // Clear sensitive data from memory
    credential.Data?.Clear();
}
```

### Error Handling
```csharp
// ✓ Good: Handle credential errors gracefully
try {
    var credential = await _credentialService.GetByIdAsync(id);
} catch (CredentialExpiredException ex) {
    return Result.Failure("Credential expired. Please rotate.");
} catch (CredentialNotFoundException ex) {
    return Result.Failure("Credential not found.");
}
```

### Validation
```csharp
// ✓ Good: Validate before use
var credential = await _credentialService.GetByIdAsync(id);
if (credential.ExpiresAt < DateTime.UtcNow) {
    throw new CredentialExpiredException();
}
```

### Logging
```csharp
// ✓ Good: Never log the actual credential data
_logger.LogInformation("Using credential {credentialID} for {service}", 
    credentialID, serviceName);

// ✗ Bad: Never log decrypted secrets
// _logger.LogInformation("Using password: {password}", credential.Password);
```

## Credential Lifecycle

```
┌──────────────┐
│   Create     │  CredentialDeveloper creates credential
│   Credential │  → Encrypted with current vault provider
└──────┬───────┘
       │
┌──────▼───────┐
│   In Use     │  Agents retrieve and use credential
│   By Agents  │  → AccessLogs recorded
│   (Days...)  │
└──────┬───────┘
       │
┌──────▼───────┐
│   Rotate     │  Admin initiates key rotation
│   Encryption │  → Re-encrypted with new key/provider
│   (Optional) │  → No agent changes needed
└──────┬───────┘
       │
┌──────▼───────┐
│   Expires    │  Credential reaches expiration date
│   or Delete  │  → Soft-deleted, archived
│   (Optional) │
└──────────────┘
```

## Troubleshooting

### Credential Not Found
**Error:** CredentialNotFoundException
**Causes:**
- CredentialID doesn't exist
- Credential soft-deleted (Deleted = 1)
- Different tenant owns credential
**Fix:** Verify credentialID, check soft-delete flag

### Credential Expired
**Error:** CredentialExpiredException
**Causes:**
- ExpiresAt < now()
- Vault provider disabled
- Key version no longer available
**Fix:** Rotate credential or extend expiration date

### Decryption Failed
**Error:** DecryptionFailedException
**Causes:**
- Vault provider not responding
- Key version corrupted
- Encryption key lost
**Fix:** Check vault provider health, initiate key rotation

### Access Denied
**Error:** UnauthorizedException
**Causes:**
- JWT missing or invalid
- Role lacks permission
- TenantID mismatch
**Fix:** Verify JWT, check user role, confirm tenant

## See Also
- [Security Architecture](02-security-architecture.md) — How data is protected
- [API Reference](03-api-reference.md) — Exact API endpoints
- [Credential Types](01-credential-types.md) — What credential types exist
