# Security Architecture

How Credentials are encrypted, stored, and protected.

## Encryption Model

### At-Rest Encryption
- **Algorithm:** AES-256-GCM
- **Key source:** Vault Provider (pluggable)
- **Key versioning:** Each credential tracks which key version encrypted it
- **Stored format:** Base64-encoded ciphertext (not plaintext)

### Vault Provider Abstraction
Vault Providers are pluggable encryption backends:

| Provider | Where | Key Storage | Notes |
|----------|-------|-------------|-------|
| **Local HSM** | On-premise | Hardware security module | Default, airgapped |
| **Azure Key Vault** | Cloud | Microsoft-managed | Cross-tenant isolation |
| **AWS KMS** | Cloud | Amazon-managed | Region-specific |
| **HashiCorp Vault** | On-premise or cloud | Distributed | Enterprise standard |

**Switching providers:**
- Create new VaultProvider record
- Initiate KeyRotation process
- Re-encrypt credentials under new provider
- No downtime or credential regeneration needed

### Key Versioning
Each credential stores:
- `EncryptionKeyVersion` — Which key version encrypted this credential
- `VaultProviderID` — Which provider holds the key

Allows:
- Key rotation without breaking existing credentials
- Gradual migration to new keys
- Audit trail of encryption history
- Ability to rollback if needed

## Storage Model

### Database Tables

**Credential Storage (encrypted):**
```sql
CREATE TABLE Cred_[Type]Credentials (
    CredentialID INT PRIMARY KEY,
    CredentialData NVARCHAR(MAX) NOT NULL,  -- AES-256 encrypted JSON
    EncryptedDataKey NVARCHAR(MAX) NOT NULL, -- Key encrypted with KMS
    EncryptionKeyVersion INT NOT NULL,
    VaultProviderID INT NOT NULL,
    -- Standard BaseEntity fields
    TenantID INT NOT NULL,
    CreatedBy INT NOT NULL,
    CreatedOn DATETIME NOT NULL,
    LastModifiedBy INT NOT NULL,
    LastModifiedOn DATETIME NOT NULL,
    Deleted BIT DEFAULT 0,
    Archived BIT DEFAULT 0
);
```

**Vault Provider Registry:**
```sql
CREATE TABLE Cred_VaultProviders (
    VaultProviderID INT PRIMARY KEY,
    Name NVARCHAR(200) NOT NULL,
    Code NVARCHAR(50) NOT NULL UNIQUE,
    Description NVARCHAR(200),
    Enabled BIT DEFAULT 1,
    Configuration NVARCHAR(MAX) -- Vault-specific config (encrypted)
);
```

**Key Rotation History:**
```sql
CREATE TABLE Cred_KeyRotations (
    KeyRotationID INT PRIMARY KEY,
    CredentialID INT NOT NULL,
    OldVaultProviderID INT NOT NULL,
    OldKeyVersion INT NOT NULL,
    NewVaultProviderID INT NOT NULL,
    NewKeyVersion INT NOT NULL,
    Status NVARCHAR(20) NOT NULL, -- Pending, Completed, Failed
    FailureReason NVARCHAR(200),
    StartedAt DATETIME NOT NULL,
    CompletedAt DATETIME,
    -- Audit fields
    CreatedBy INT NOT NULL,
    CreatedOn DATETIME NOT NULL
);
```

**Access Logs (immutable):**
```sql
CREATE TABLE Cred_AccessLogs (
    AccessLogID INT PRIMARY KEY,
    CredentialID INT NOT NULL,
    AccessType NVARCHAR(20) NOT NULL, -- Read, Create, Update, Delete
    TenantID INT NOT NULL,
    UserID INT,
    AgentID INT,
    IpAddress NVARCHAR(45),
    UserAgent NVARCHAR(500),
    Success BIT NOT NULL,
    FailureReason NVARCHAR(500),
    Timestamp DATETIME NOT NULL
);
```

## Access Control

### Authentication
- **JWT Bearer Token** — Required for all API calls
- **TenantID claim** — Validated from JWT; credentials scoped to tenant
- **UserID claim** — Logged in AccessLog for audit trail
- **Role-based** — Specific roles can: Read, Create, Update, Delete, Rotate credentials

### Authorization Rules
```
┌─────────────────────────────────────┐
│  Tenant Isolation                   │
│  - Can only access own credentials  │
│  - TenantID from JWT validated      │
│  - Soft-delete prevents orphaning   │
└─────────────────────────────────────┘
                 │
┌─────────────────────────────────────┐
│  Role-Based Access                  │
│  - CredentialManager: All CRUD      │
│  - CredentialViewer: Read only      │
│  - CredentialRotator: Rotate only   │
│  - SystemAdmin: All + vault config  │
└─────────────────────────────────────┘
```

## Audit Trail

### AccessLog Entry
Logged on every credential operation:
```json
{
  "accessLogID": 12345,
  "credentialID": 789,
  "accessType": "Read",
  "tenantID": 1,
  "userID": 42,
  "agentID": "AppDeveloper-123",
  "ipAddress": "192.0.2.1",
  "userAgent": "BizFirst-Agent/1.0",
  "success": true,
  "timestamp": "2026-09-29T10:30:00Z"
}
```

### What Is Logged
- **Create** — New credential stored
- **Read** — Credential retrieved by agent/user
- **Update** — Credential modified
- **Delete** — Credential soft-deleted
- **Rotate** — KeyRotation initiated/completed

### Audit Queries
```
SELECT * FROM Cred_AccessLogs
WHERE CredentialID = @credID
AND TenantID = @tenantID
ORDER BY Timestamp DESC;

-- Find who accessed what
SELECT al.*, cred.* 
FROM Cred_AccessLogs al
JOIN Cred_[Type]Credentials cred ON al.CredentialID = cred.CredentialID
WHERE al.Timestamp >= @startDate
AND al.AccessType = 'Read';
```

## Compliance & Standards

### Encryption Standards
- NIST-approved AES-256-GCM
- OWASP credential management guidelines
- PCI-DSS 3.4 (secure key management)
- SOC2 encryption at rest

### Retention
- Access logs: 7 years (per compliance)
- Deleted credentials: Soft-deleted, marked for purge at 90 days
- Key rotation history: Immutable, indefinite retention

### Secrets Handling
- ✓ Encrypted in transit (HTTPS only)
- ✓ Encrypted at rest (AES-256)
- ✓ Never logged in plain text
- ✓ Cleared from memory after use
- ✓ Not returned in error messages
- ✓ Audit trail on every access

## See Also
- [Credential Types](01-credential-types.md) — What can be stored
- [API Reference](03-api-reference.md) — How to use the APIs safely
- [Implementation](04-implementation.md) — Code patterns for encryption
