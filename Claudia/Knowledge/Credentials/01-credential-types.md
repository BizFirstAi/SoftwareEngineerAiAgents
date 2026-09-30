# Credential Types

Supported credential types and their properties.

## Email Credential
**Purpose:** SMTP/IMAP credentials for email communication.

| Property | Type | Required | Notes |
|----------|------|----------|-------|
| Email | string(254) | ✓ | Email address / username |
| Password | string(encrypted) | ✓ | SMTP password (encrypted) |
| Enabled | bool | ✓ | Active/inactive status |
| SmtpServer | string(255) | | SMTP host (e.g., smtp.gmail.com) |
| SmtpPort | int | | SMTP port (25, 465, 587) |

**Example:**
```json
{
  "email": "noreply@bizfirst.com",
  "password": "[encrypted]",
  "smtpServer": "smtp.gmail.com",
  "smtpPort": 587,
  "enabled": true
}
```

## API Key Credential
**Purpose:** API tokens for third-party integrations.

| Property | Type | Required | Notes |
|----------|------|----------|-------|
| ServiceName | string(255) | ✓ | Service (Salesforce, HubSpot, Stripe, etc.) |
| ApiKey | string(encrypted) | ✓ | API key/token (encrypted) |
| ApiSecret | string(encrypted) | | Optional secret (encrypted) |
| BaseUrl | string(500) | | Service endpoint URL |
| Enabled | bool | ✓ | Active/inactive |
| ExpiresAt | datetime | | Optional expiration date |

**Example:**
```json
{
  "serviceName": "Salesforce",
  "apiKey": "[encrypted-token]",
  "baseUrl": "https://instance.salesforce.com",
  "enabled": true,
  "expiresAt": "2026-12-31T23:59:59Z"
}
```

## Database Credential
**Purpose:** Connection credentials for external databases.

| Property | Type | Required | Notes |
|----------|------|----------|-------|
| DatabaseType | string(50) | ✓ | SQL Server, MySQL, PostgreSQL, Oracle, etc. |
| Host | string(255) | ✓ | Database server hostname/IP |
| Port | int | ✓ | Connection port (3306, 5432, 1433, etc.) |
| Username | string(255) | ✓ | Database user |
| Password | string(encrypted) | ✓ | Database password (encrypted) |
| Database | string(255) | ✓ | Database name |
| ConnectionString | string(encrypted) | | Full connection string (alternative) |

**Example:**
```json
{
  "databaseType": "MySQL",
  "host": "db.example.com",
  "port": 3306,
  "username": "dbuser",
  "password": "[encrypted-password]",
  "database": "production",
  "connectionString": "[encrypted]"
}
```

## OAuth2 Credential
**Purpose:** OAuth2 tokens for delegated access.

| Property | Type | Required | Notes |
|----------|------|----------|-------|
| Provider | string(255) | ✓ | Google, Microsoft, GitHub, etc. |
| ClientID | string(encrypted) | ✓ | OAuth client ID |
| ClientSecret | string(encrypted) | ✓ | OAuth client secret |
| RefreshToken | string(encrypted) | ✓ | Refresh token for token renewal |
| AccessToken | string(encrypted) | | Current access token |
| ExpiresAt | datetime | | Token expiration time |
| Scopes | string[] | | Granted scopes |

**Example:**
```json
{
  "provider": "Google",
  "clientId": "[encrypted]",
  "clientSecret": "[encrypted]",
  "refreshToken": "[encrypted]",
  "accessToken": "[encrypted]",
  "expiresAt": "2026-09-29T15:30:00Z",
  "scopes": ["https://www.googleapis.com/auth/calendar", "https://www.googleapis.com/auth/drive"]
}
```

## SSH Key Credential
**Purpose:** Private keys for infrastructure access.

| Property | Type | Required | Notes |
|----------|------|----------|-------|
| KeyType | string(50) | ✓ | RSA, ECDSA, ED25519 |
| PublicKey | string(4000) | ✓ | Public key (plaintext) |
| PrivateKey | string(encrypted) | ✓ | Private key PEM (encrypted) |
| Passphrase | string(encrypted) | | Passphrase for encrypted private key |
| Fingerprint | string(255) | | SHA256 fingerprint |

**Example:**
```json
{
  "keyType": "RSA",
  "publicKey": "ssh-rsa AAAAB3NzaC1yc2E...",
  "privateKey": "[encrypted-pem]",
  "passphrase": "[encrypted-or-null]",
  "fingerprint": "SHA256:+DiY3wvnK6YfwNAaRK..."
}
```

## Custom Credential
**Purpose:** Free-form key-value pairs for custom integrations.

| Property | Type | Required | Notes |
|----------|------|----------|-------|
| Name | string(255) | ✓ | Credential identifier |
| Data | json(encrypted) | ✓ | Key-value pairs (encrypted) |
| Description | string(500) | | Metadata for documentation |
| Schema | json | | JSON schema for validation |

**Example:**
```json
{
  "name": "ElasticsearchCluster",
  "data": {
    "host": "[encrypted]",
    "username": "[encrypted]",
    "password": "[encrypted]",
    "certPath": "[encrypted]"
  },
  "schema": {
    "type": "object",
    "properties": {
      "host": {"type": "string"},
      "username": {"type": "string"},
      "password": {"type": "string"}
    },
    "required": ["host", "username", "password"]
  }
}
```

## Credential Validation Rules

**All credentials must:**
- Have a unique name/identifier within tenant
- Specify credential type
- Pass required field validation per type
- Fit within field length limits
- Not have past expiration dates (if ExpiresAt set)

**Special rules:**
- API keys: Must be non-empty after decryption
- Database: Port must be 1-65535
- SSH: Private key must be valid PEM format
- OAuth2: RefreshToken and ClientSecret required
- Email: Must be valid email address format

## See Also
- [Security Architecture](02-security-architecture.md) — How credentials are encrypted
- [API Reference](03-api-reference.md) — How to CRUD credentials
- [Agent Integration](04-integration-guide.md) — How agents retrieve credentials
