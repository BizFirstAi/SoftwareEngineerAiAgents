# API Reference

REST endpoints for server provisioning, configuration, monitoring, and decommissioning.

## Base URL
```
https://api.bizfirst.com/servers/v1
```

## Authentication
All endpoints require Bearer token (JWT) with `ServerAdmin` or `TenantAdmin` scope.
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

## Endpoints

### Server Lifecycle

#### Create Server
```
POST /servers/provision

Request:
{
  "name": "web-prod-1",
  "type": "CloudInstance",
  "cloudProvider": "AWS",
  "instanceType": "c7i.2xlarge",
  "region": "us-east-1",
  "osType": "Linux",
  "osVersion": "Ubuntu 22.04 LTS",
  "tenantID": "550e8400-e29b-41d4-a716-446655440000",
  "vpcID": "vpc-0123456789abcdef0",
  "subnetID": "subnet-0123456789abcdef0",
  "securityGroupIDs": ["sg-0123456789abcdef0"],
  "runtimes": [".NET 9.0", "Node.js 20"],
  "tags": {
    "Environment": "Production",
    "CostCenter": "Engineering"
  }
}

Response (202 Accepted):
{
  "serverID": "srvr-uuid-1234",
  "status": "Provisioning",
  "taskID": "task-uuid-5678",
  "estimatedCompletionTime": "2026-09-29T15:30:00Z"
}
```

#### Get Server
```
GET /servers/{serverID}

Response (200):
{
  "serverID": "srvr-uuid-1234",
  "name": "web-prod-1",
  "type": "CloudInstance",
  "status": "Running",
  "ipAddresses": ["10.0.1.10", "203.0.113.45"],
  "cpuCores": 8,
  "memoryGB": 16,
  "storageGB": 100,
  "osType": "Linux",
  "osVersion": "Ubuntu 22.04 LTS",
  "runtimes": [".NET 9.0", "Node.js 20"],
  "uptime": 2592000,
  "createdOn": "2026-09-20T10:00:00Z",
  "createdBy": "alice@example.com"
}
```

#### List Servers
```
GET /servers?tenantID={tenantID}&status={status}&page={page}&pageSize={pageSize}

Query Parameters:
  - tenantID (required): Filter by tenant
  - status (optional): Running | Provisioning | Maintenance | Stopped | Decommissioned
  - page (optional, default=1): Page number
  - pageSize (optional, default=20): Results per page

Response (200):
{
  "servers": [
    {
      "serverID": "srvr-1",
      "name": "web-prod-1",
      "type": "CloudInstance",
      "status": "Running",
      "cpuCores": 8,
      "memoryGB": 16
    },
    ...
  ],
  "pagination": {
    "total": 42,
    "page": 1,
    "pageSize": 20,
    "totalPages": 3
  }
}
```

#### Update Server Configuration
```
PATCH /servers/{serverID}/config

Request:
{
  "cpuCores": 16,
  "memoryGB": 32,
  "tags": {
    "Environment": "Production",
    "Version": "9.0.1"
  }
}

Response (200):
{
  "serverID": "srvr-uuid-1234",
  "status": "ConfigPending",
  "applyTime": "2026-09-30T02:00:00Z"
}
```

#### Decommission Server
```
DELETE /servers/{serverID}

Request:
{
  "reason": "Replaced with larger instance",
  "backupData": true,
  "retentionDays": 30
}

Response (202 Accepted):
{
  "serverID": "srvr-uuid-1234",
  "status": "Decommissioning",
  "estimatedCompletionTime": "2026-09-29T16:00:00Z"
}
```

### Configuration Management

#### Deploy Package
```
POST /servers/{serverID}/deploy

Request:
{
  "packageID": "bizfirst-services-9.0.1",
  "services": ["Api", "Worker", "Scheduler"],
  "deploymentStrategy": "BlueGreen",
  "healthCheckPath": "/health"
}

Response (202 Accepted):
{
  "deploymentID": "deploy-uuid-9abc",
  "status": "InProgress",
  "progress": 0,
  "estimatedTime": 300
}
```

#### Get Deployment Status
```
GET /servers/{serverID}/deployments/{deploymentID}

Response (200):
{
  "deploymentID": "deploy-uuid-9abc",
  "status": "InProgress",
  "progress": 65,
  "services": {
    "Api": { "status": "Deployed", "version": "9.0.1" },
    "Worker": { "status": "InProgress", "progress": 30 },
    "Scheduler": { "status": "Queued" }
  },
  "rollbackAvailable": true
}
```

#### Rollback Deployment
```
POST /servers/{serverID}/deployments/{deploymentID}/rollback

Response (202 Accepted):
{
  "deploymentID": "deploy-uuid-9abc",
  "rollbackStarted": "2026-09-29T15:05:00Z",
  "estimatedTime": 120
}
```

### Health & Monitoring

#### Get Server Health
```
GET /servers/{serverID}/health

Response (200):
{
  "serverID": "srvr-uuid-1234",
  "status": "Healthy",
  "timestamp": "2026-09-29T15:10:00Z",
  "metrics": {
    "cpuUsage": 45.2,
    "memoryUsage": 62.1,
    "diskUsage": 35.8,
    "networkLatency": 2.3,
    "serviceCount": 5,
    "healthyServices": 5
  },
  "issues": []
}
```

#### Get Metrics
```
GET /servers/{serverID}/metrics?from={timestamp}&to={timestamp}&metric={metric}

Query Parameters:
  - from, to: ISO 8601 timestamps
  - metric: cpu | memory | disk | network | requests

Response (200):
{
  "serverID": "srvr-uuid-1234",
  "metric": "cpu",
  "datapoints": [
    { "timestamp": "2026-09-29T14:00:00Z", "value": 42.5 },
    { "timestamp": "2026-09-29T14:05:00Z", "value": 48.1 },
    ...
  ]
}
```

#### Get Logs
```
GET /servers/{serverID}/logs?service={service}&level={level}&from={timestamp}&to={timestamp}

Query Parameters:
  - service: Api | Worker | Scheduler | System
  - level: DEBUG | INFO | WARN | ERROR
  - from, to: ISO 8601 timestamps

Response (200):
{
  "logs": [
    {
      "timestamp": "2026-09-29T15:05:32Z",
      "level": "INFO",
      "service": "Api",
      "message": "Request processed",
      "metadata": { "duration": 45, "statusCode": 200 }
    },
    ...
  ]
}
```

### Webhooks

#### Server Lifecycle Events
```
Event: server.provisioned
{
  "eventID": "evt-uuid",
  "timestamp": "2026-09-29T15:00:00Z",
  "serverID": "srvr-uuid-1234",
  "status": "Running",
  "ipAddress": "10.0.1.10"
}

Event: server.health_degraded
{
  "eventID": "evt-uuid",
  "timestamp": "2026-09-29T15:05:00Z",
  "serverID": "srvr-uuid-1234",
  "severity": "Warning",
  "issue": "CPUUsage > 85%"
}

Event: server.decommissioning
{
  "eventID": "evt-uuid",
  "timestamp": "2026-09-29T16:00:00Z",
  "serverID": "srvr-uuid-1234",
  "reason": "Replaced with larger instance",
  "dataRetention": { "backupID": "bkp-uuid", "expiresAt": "2026-10-29T16:00:00Z" }
}
```

#### Register Webhook
```
POST /webhooks

Request:
{
  "url": "https://customer-app.example.com/bizfirst/webhooks",
  "events": ["server.provisioned", "server.health_degraded", "server.decommissioning"],
  "secret": "whsk_secret_xxxxx" (for signature verification)
}

Response (201):
{
  "webhookID": "whk-uuid",
  "url": "https://customer-app.example.com/...",
  "events": [...],
  "active": true
}
```

## Error Responses

```
400 Bad Request
{
  "error": "InvalidConfiguration",
  "message": "CPU cores must be between 1 and 256",
  "field": "cpuCores"
}

403 Forbidden
{
  "error": "InsufficientPermissions",
  "message": "You lack ServerAdmin permission for this tenant"
}

429 Too Many Requests
{
  "error": "RateLimited",
  "message": "100 requests per minute exceeded",
  "retryAfter": 30
}

500 Internal Server Error
{
  "error": "ServiceUnavailable",
  "message": "Could not contact cloud provider",
  "requestID": "req-uuid-xxxx"
}
```

## Next Steps
- [Integration Guide](06-integration-guide.md)
- [Procedure: Provision Server](../../Procedure/Servers/provision-server.md)
