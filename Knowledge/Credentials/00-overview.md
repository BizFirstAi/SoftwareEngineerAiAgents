# Credentials Knowledge — Overview

**Credentials** are encrypted, securely-stored secrets used by agents and workflows to authenticate with external systems.

## Purpose
- Centralize secret storage with encryption and access control
- Support multiple credential types (API keys, OAuth2, database connections, SSH keys, email credentials)
- Enable secure credential rotation and expiration tracking
- Audit access logs and maintain compliance
- Isolate credentials by tenant and organization

## Key Concepts

**Credential** — A secret stored encrypted in the database, associated with a Vault Provider and encryption key version.

**Vault Provider** — A pluggable encryption provider (e.g., Azure Key Vault, AWS Secrets Manager, local HSM). Stores encryption key metadata.

**Key Rotation** — Process of re-encrypting a credential under a new vault provider or key version, with audit trail.

**Access Log** — Audit trail tracking who accessed what credential, when, and from where.

## Use Cases
- **API integrations** — Store API keys for third-party services (Salesforce, HubSpot, Stripe, etc.)
- **Database connections** — Email, DB user/password pairs for external systems
- **OAuth2 flows** — Store refresh tokens and client secrets securely
- **SSH/certificates** — Private keys for infrastructure access
- **Workflow nodes** — Credentials needed by Elasticsearch, Odoo, or custom integrations

## Architecture

```
┌─────────────────────────────────────┐
│      Agent / Workflow Node          │
│  (requests credential by ID)         │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│   Credentials Service (API)          │
│  - CRUD operations                   │
│  - Encryption/decryption             │
│  - Access validation                 │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│   Encryption Service                │
│  - Vault Provider abstraction        │
│  - Encrypt/decrypt with key version  │
│  - Support multiple providers        │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│   Database (CredDbContext)           │
│  - Encrypted credential storage      │
│  - Vault Provider metadata           │
│  - Key rotation history              │
│  - Access logs                       │
└─────────────────────────────────────┘
```

## Multi-Tenancy
- Credentials scoped to TenantID
- Access logs track which tenant accessed credentials
- Soft-delete support (Deleted flag)
- Audit fields: CreatedBy, CreatedOn, LastModifiedBy, LastModifiedOn

## Security Model
- **Encryption at rest** — AES-256 encryption via vault provider
- **Key versioning** — Track which key encrypted each credential
- **Access control** — JWT bearer token validation per request
- **Audit trail** — Immutable access logs
- **Expiration tracking** — Optional expiration dates per credential type

## Common Patterns

**Agent retrieves credential:**
```
1. Agent calls GET /api/credentials/{id}
2. Service validates TenantID from JWT
3. Credential retrieved, decrypted, returned to agent
4. AccessLog recorded (who, when, from where)
```

**Rotate credential encryption:**
```
1. Create KeyRotation record (Pending status)
2. Decrypt with old key, re-encrypt with new key
3. Update credential with new key version
4. Mark KeyRotation as Completed
5. Audit trail shows old/new vault providers and key versions
```

## See Also
- [Credential Types](01-credential-types.md)
- [Security Architecture](02-security-architecture.md)
- [API Reference](03-api-reference.md)
- [Agent Integration](04-integration-guide.md)
