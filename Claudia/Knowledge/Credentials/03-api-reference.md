# Credentials API Reference

REST endpoints for managing credentials.

## Base URL
```
https://api.bizfirst.com/api/credentials
```

## Authentication
```
Authorization: Bearer <JWT_TOKEN>
```

JWT must include:
- `tenantid` claim (validated against request)
- `userid` claim (logged in AccessLog)
- `roles` claim (authorization checked)

## CRUD Operations

### Create Credential
```http
POST /api/credentials
Content-Type: application/json

{
  "credentialType": "EmailCredential",
  "name": "SendGrid SMTP",
  "data": {
    "email": "noreply@example.com",
    "password": "sg.xxxxxxxxxxxxxxxxxxxx",
    "smtpServer": "smtp.sendgrid.net",
    "smtpPort": 587
  },
  "description": "SendGrid SMTP for production emails",
  "expiresAt": "2027-09-29T23:59:59Z"
}
```

**Response (201 Created):**
```json
{
  "credentialID": 42,
  "credentialType": "EmailCredential",
  "name": "SendGrid SMTP",
  "vaultProviderID": 1,
  "encryptionKeyVersion": 5,
  "createdOn": "2026-09-29T10:00:00Z",
  "createdBy": 1,
  "lastModifiedOn": "2026-09-29T10:00:00Z",
  "lastModifiedBy": 1
}
```

### Read Credential
```http
GET /api/credentials/{id}
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "credentialID": 42,
  "credentialType": "EmailCredential",
  "name": "SendGrid SMTP",
  "data": {
    "email": "noreply@example.com",
    "password": "[DECRYPTED]",
    "smtpServer": "smtp.sendgrid.net",
    "smtpPort": 587
  },
  "vaultProviderID": 1,
  "encryptionKeyVersion": 5,
  "createdOn": "2026-09-29T10:00:00Z",
  "createdBy": 1
}
```

**AccessLog entry created:**
- Type: Read
- TenantID, UserID, Timestamp logged
- IP address and User-Agent captured

### Update Credential
```http
PATCH /api/credentials/{id}
Content-Type: application/json

{
  "data": {
    "smtpPort": 465  -- Change port, other fields unchanged
  }
}
```

**Response (200 OK):**
```json
{
  "credentialID": 42,
  "lastModifiedOn": "2026-09-29T11:00:00Z",
  "lastModifiedBy": 1,
  "success": true
}
```

### Delete Credential (Soft Delete)
```http
DELETE /api/credentials/{id}
Authorization: Bearer <JWT_TOKEN>
```

**Response (204 No Content)**

Credential marked as Deleted = 1, not permanently removed.

## Search Operations

### Get by Type
```http
GET /api/credentials/search/by-type?credentialType=EmailCredential
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "items": [
    {"credentialID": 42, "name": "SendGrid SMTP", ...},
    {"credentialID": 43, "name": "AWS SES", ...}
  ],
  "totalCount": 2
}
```

### Get by Name
```http
GET /api/credentials/search/by-name?name=SendGrid
Authorization: Bearer <JWT_TOKEN>
```

### Get by Category
```http
GET /api/credentials/search/by-category?category=EmailIntegration
Authorization: Bearer <JWT_TOKEN>
```

### Get All (Paginated)
```http
GET /api/credentials?pageNumber=1&pageSize=20&includeDeleted=false
Authorization: Bearer <JWT_TOKEN>
```

## Key Rotation

### Initiate Rotation
```http
POST /api/credentials/{credentialID}/rotate
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
  "startedAt": "2026-09-29T12:00:00Z"
}
```

### Check Rotation Status
```http
GET /api/credentials/rotations/{rotationID}
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "keyRotationID": 99,
  "status": "Completed",  -- or "Pending", "Failed"
  "completedAt": "2026-09-29T12:05:00Z",
  "failureReason": null
}
```

## Access Logs

### Get Access History
```http
GET /api/credentials/{credentialID}/access-logs?days=30
Authorization: Bearer <JWT_TOKEN>
```

**Response (200 OK):**
```json
{
  "items": [
    {
      "accessLogID": 1001,
      "accessType": "Read",
      "userID": 1,
      "agentID": "AppDeveloper-123",
      "ipAddress": "192.0.2.1",
      "success": true,
      "timestamp": "2026-09-29T10:30:00Z"
    },
    {
      "accessLogID": 1002,
      "accessType": "Update",
      "userID": 1,
      "agentID": null,
      "success": true,
      "timestamp": "2026-09-29T11:00:00Z"
    }
  ],
  "totalCount": 47
}
```

## Error Responses

### 400 Bad Request
```json
{
  "errorCode": "INVALID_CREDENTIAL_TYPE",
  "message": "Credential type 'InvalidType' not supported",
  "details": {
    "supportedTypes": ["EmailCredential", "ApiKeyCredential", "DatabaseCredential", ...]
  }
}
```

### 401 Unauthorized
```json
{
  "errorCode": "UNAUTHORIZED",
  "message": "Missing or invalid JWT token"
}
```

### 403 Forbidden
```json
{
  "errorCode": "TENANT_MISMATCH",
  "message": "Credential belongs to different tenant"
}
```

### 404 Not Found
```json
{
  "errorCode": "CREDENTIAL_NOT_FOUND",
  "message": "Credential {id} does not exist"
}
```

### 409 Conflict
```json
{
  "errorCode": "CREDENTIAL_EXPIRED",
  "message": "Credential has expired. Please rotate or regenerate."
}
```

### 500 Internal Server Error
```json
{
  "errorCode": "ENCRYPTION_FAILED",
  "message": "Unable to encrypt credential. Please contact support.",
  "traceId": "0HN1GNBV4C7KV:00000001"
}
```

## Rate Limiting

- 100 requests/minute per tenant
- 1000 requests/hour per tenant
- Returns `429 Too Many Requests` when exceeded

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60

{
  "errorCode": "RATE_LIMITED",
  "message": "Too many requests. Retry after 60 seconds."
}
```

## See Also
- [Security Architecture](02-security-architecture.md) — How credentials are protected
- [Agent Integration](04-integration-guide.md) — How agents use these APIs
