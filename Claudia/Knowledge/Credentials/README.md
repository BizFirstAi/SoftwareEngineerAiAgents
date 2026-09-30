# Credentials Knowledge Index

Complete knowledge base for the Credentials subsystem.

## Quick Start

**New to Credentials?** Start here:
1. [Overview](00-overview.md) — Understand what credentials are and why
2. [Credential Types](01-credential-types.md) — See what credential types are supported
3. [API Reference](03-api-reference.md) — Learn the REST endpoints

## Documentation

| Document | Purpose |
|----------|---------|
| [00-overview.md](00-overview.md) | What credentials are, architecture, use cases, key concepts |
| [01-credential-types.md](01-credential-types.md) | All supported credential types (Email, API Key, Database, OAuth2, SSH, Custom) with properties and examples |
| [02-security-architecture.md](02-security-architecture.md) | Encryption model, vault providers, key versioning, audit trails, compliance |
| [03-api-reference.md](03-api-reference.md) | Complete REST API reference (CRUD, search, rotation, access logs) |
| [04-integration-guide.md](04-integration-guide.md) | How agents retrieve credentials, workflow integration, best practices |

## For Different Roles

### CredentialDeveloper Agent
- Read [Overview](00-overview.md) → [Credential Types](01-credential-types.md) → [API Reference](03-api-reference.md)
- Focus: Creating credentials, validation, enabling workflows
- See: Procedure → create-credential.md

### Workflow Developer
- Read [Integration Guide](04-integration-guide.md) → [Credential Types](01-credential-types.md)
- Focus: Referencing credentials in workflow nodes
- See: How to pass credentialID to nodes

### Security Admin
- Read [Security Architecture](02-security-architecture.md) → [API Reference](03-api-reference.md)
- Focus: Key rotation, audit logs, compliance
- See: Access control, encryption, retention policies

### Agent Executor
- Read [Integration Guide](04-integration-guide.md) → [Credential Types](01-credential-types.md)
- Focus: Retrieving and using credentials at runtime
- See: Credential retrieval pattern, error handling, best practices

## Key Concepts

**Credential** — Encrypted secret (API key, password, token, etc.)

**Vault Provider** — Pluggable encryption backend (local HSM, Azure KV, AWS KMS, HashiCorp Vault)

**Key Rotation** — Re-encrypting credentials under new key/provider, preserving credential IDs

**Access Log** — Immutable audit trail of every credential access

**Soft Delete** — Mark as deleted without removing (preserves history)

**Multi-Tenancy** — Credentials scoped to TenantID, with strict isolation

## Common Tasks

**Create an email credential:**
→ [Credential Types: Email](01-credential-types.md#email-credential) + [API: Create](03-api-reference.md#create-credential)

**Use credential in workflow:**
→ [Integration: Workflow Nodes](04-integration-guide.md#common-integration-points)

**Rotate encryption keys:**
→ [Security Architecture: Key Rotation](02-security-architecture.md#key-versioning) + [API: Key Rotation](03-api-reference.md#key-rotation)

**Check who accessed credentials:**
→ [API: Access Logs](03-api-reference.md#access-logs)

**Troubleshoot credential errors:**
→ [Integration: Troubleshooting](04-integration-guide.md#troubleshooting)

## Architecture Diagram

```
┌─────────────────────────────────────────┐
│  Agent / Workflow / UI                  │
│  (references credentialID)              │
└────────────┬────────────────────────────┘
             │
     ┌───────▼────────────┐
     │ JWT Bearer Token   │
     │ TenantID validated │
     └───────┬────────────┘
             │
┌────────────▼──────────────────────┐
│ Credentials API Service           │
│ - CRUD operations (Create/Read... │
│ - Validation (type, format, ...)  │
│ - AccessLog recording             │
└────────────┬──────────────────────┘
             │
┌────────────▼──────────────────────┐
│ Encryption Service                │
│ - Vault Provider abstraction      │
│ - Encrypt/decrypt with key v.     │
│ - Support multiple providers      │
└────────────┬──────────────────────┘
             │
┌────────────▼──────────────────────┐
│ Database (CredDbContext)           │
│ - Encrypted credentials            │
│ - Vault provider metadata          │
│ - Key rotation history             │
│ - Immutable access logs            │
└────────────────────────────────────┘
```

## Standards & Compliance

- **Encryption:** NIST AES-256-GCM
- **Secrets handling:** OWASP credential management
- **Key management:** PCI-DSS 3.4 compliance
- **Audit:** SOC2 requirements
- **Retention:** 7-year access log retention

## Database Schema

Three main tables:
1. **Cred_[Type]Credentials** — Encrypted credential data
2. **Cred_VaultProviders** — Encryption provider metadata
3. **Cred_KeyRotations** — Key rotation history
4. **Cred_AccessLogs** — Immutable audit trail

See: [Security Architecture](02-security-architecture.md#storage-model)

## Related Systems

- **Routes:** CredentialDeveloper agent specs (Agents/Builders/CredentialDeveloper/)
- **Procedures:** Step-by-step guides (Procedure/Credentials/)
- **Backend:** BizFirstPayrollV3/src/mvc-server/Credentials/

## See Also
- [Procedure: Create Credential](../../Procedure/Credentials/create-credential.md)
- [Procedure: Validate Credential](../../Procedure/Credentials/validate-credential.md)
- [Procedure: Rotate Credential](../../Procedure/Credentials/rotate-credential.md)
