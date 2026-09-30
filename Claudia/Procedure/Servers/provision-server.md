# Provision Server

Step-by-step procedure for ServerDeveloper agent to provision new servers.

## Prerequisites
- [ ] Capacity plan approved (CPU, memory, network)
- [ ] TenantID and quota verified
- [ ] Network design finalized (VPC, subnet, security groups)
- [ ] Server naming approved
- [ ] Cost estimate reviewed

## Step 1: Analyze Requirements

**Define server specifications:**

```
Q: What is the intended workload?
A: Web API handling 1000 req/s peak

Q: What are resource needs?
A: CPU: 8 cores, Memory: 16GB, Storage: 100GB SSD

Q: Single or multi-tenant?
A: Dedicated to Tenant A (single-tenant)

Q: Region/Zone preference?
A: us-east-1a (primary), us-east-1b (backup)

Q: Deployment model?
A: Cloud (AWS), auto-scalable
```

**Document decision:**
```
Server Plan:
  Name: api-prod-2
  Type: CloudInstance (AWS)
  Region: us-east-1
  Instance: c7i.2xlarge (8vCPU, 16GB RAM)
  Storage: 100GB gp3 SSD
  OS: Ubuntu 22.04 LTS
  Runtimes: .NET 9.0, Node.js 20
  TenantID: 550e8400-e29b-41d4-a716-446655440000
```

## Step 2: Check Quota & Permissions

**Verify tenant has capacity:**

```bash
# Call InstallHub to check quota
GET /tenants/{tenantID}/quota

Response:
{
  "limits": {
    "maxServers": 10,
    "maxCPU": 64,
    "maxMemory": 256,
    "maxStorage": 1000
  },
  "current": {
    "servers": 2,
    "cpu": 16,
    "memory": 32,
    "storage": 200
  }
}

Analysis:
  Current: 2 servers, 16 CPU, 32GB RAM
  Adding: 1 server, 8 CPU, 16GB RAM
  After: 3 servers, 24 CPU, 48GB RAM
  Limits: 10 servers, 64 CPU, 256GB RAM
  Status: ✓ Within quota
```

**Check your permissions:**
- [ ] ServerAdmin or TenantAdmin role
- [ ] Can provision in target region
- [ ] Can assign to this TenantID

## Step 3: Prepare Network Configuration

**Design network:**

```
VPC: prod-vpc (10.0.0.0/16)
  ├─ Public Subnet: 10.0.1.0/24
  │  └─ Route: 0.0.0.0/0 → Internet Gateway
  │
  └─ Private Subnet: 10.0.2.0/24
     └─ Route: 0.0.0.0/0 → NAT Gateway

Security Groups:
  ├─ web-sg (for load balancers)
  │  ├─ Inbound: HTTP (80), HTTPS (443) from 0.0.0.0/0
  │  └─ Outbound: All
  │
  └─ app-sg (for application servers)
     ├─ Inbound: 8000-8999 from web-sg, 22 from admin-ips
     └─ Outbound: All
```

**Verify network exists or create:**
```
GET /vpc/{vpcID}
→ Check subnets, security groups, route tables

If missing:
  POST /vpc/create { "cidr": "10.0.0.0/16", ... }
  POST /subnet/create { "vpcID": ..., "cidr": "10.0.1.0/24", ... }
  POST /security-group/create { "name": "app-sg", ... }
```

## Step 4: Call Provision API

**Prepare request payload:**

```json
{
  "name": "api-prod-2",
  "type": "CloudInstance",
  "cloudProvider": "AWS",
  "instanceType": "c7i.2xlarge",
  "region": "us-east-1",
  "availabilityZone": "us-east-1a",
  "osType": "Linux",
  "osVersion": "Ubuntu 22.04 LTS",
  "amiID": "ami-0c94855ba95c574c8",
  "vpcID": "vpc-0123456789abcdef0",
  "subnetID": "subnet-0123456789abcdef0",
  "securityGroupIDs": ["sg-0234567890abcdef1"],
  "cpuCores": 8,
  "memoryGB": 16,
  "storageGB": 100,
  "storageType": "gp3",
  "runtimes": [".NET 9.0", "Node.js 20"],
  "tenantID": "550e8400-e29b-41d4-a716-446655440000",
  "tags": {
    "Environment": "Production",
    "CostCenter": "Engineering",
    "Owner": "ServerDeveloper",
    "CreatedDate": "2026-09-29"
  }
}
```

**Make API call:**
```
POST https://api.bizfirst.com/servers/v1/servers/provision

Authorization: Bearer {jwt_token}
Content-Type: application/json

{...payload above...}
```

**Expected response (202 Accepted):**
```json
{
  "serverID": "srvr-550e8400-e29b-41d4",
  "name": "api-prod-2",
  "status": "Provisioning",
  "taskID": "task-abc123def456",
  "estimatedCompletionTime": "2026-09-29T15:30:00Z",
  "details": {
    "stage": "AwaitingVMAllocation",
    "progress": 0
  }
}
```

**Document the result:**
```
Provision Request Submitted:
  ServerID: srvr-550e8400-e29b-41d4
  Status: Provisioning (started at 15:15 UTC)
  Expected completion: 15:30 UTC (15 minutes)
  Task for tracking: task-abc123def456
```

## Step 5: Monitor Provisioning Progress

**Poll status every 2 minutes:**

```
GET /servers/srvr-550e8400-e29b-41d4

Response:
{
  "status": "Provisioning",
  "details": {
    "stage": "AwaitingVMAllocation",
    "progress": 25
  }
}

Timeline:
  T+0 min:  Status = Provisioning (stage: AwaitingVMAllocation)
  T+2 min:  Status = Provisioning (stage: NetworkConfiguration, progress: 50%)
  T+4 min:  Status = Provisioning (stage: OServing, progress: 75%)
  T+6 min:  Status = Provisioning (stage: HealthCheck, progress: 90%)
  T+8 min:  Status = Running (all checks passed)
```

**If provisioning fails:**
```
Status: ProvisioningFailed
Details: {
  "error": "InsufficientCapacity",
  "message": "Not enough capacity in us-east-1a",
  "recommendation": "Retry in us-east-1b"
}

Action:
  1. Note failure reason
  2. Try different region/zone
  3. If still fails, escalate to platform team
```

## Step 6: Verify Server is Running

**Confirm server is healthy:**

```
GET /servers/srvr-550e8400-e29b-41d4

Response:
{
  "serverID": "srvr-550e8400-e29b-41d4",
  "name": "api-prod-2",
  "status": "Running",
  "ipAddresses": ["10.0.1.50", "203.0.113.45"],
  "cpuCores": 8,
  "memoryGB": 16,
  "storageGB": 100,
  "uptime": 120,
  "runtimes": [".NET 9.0", "Node.js 20"]
}
```

**Check health status:**

```
GET /servers/srvr-550e8400-e29b-41d4/health

Response:
{
  "status": "Healthy",
  "metrics": {
    "cpuUsage": 5.2,
    "memoryUsage": 12.1,
    "diskUsage": 15.3,
    "networkLatency": 2.1
  },
  "services": [],
  "issues": []
}

Validation:
  ✓ Server running
  ✓ Network connectivity
  ✓ Disk accessible
  ✓ No issues detected
```

## Step 7: Configure & Deploy (Next Phase)

**Server is now ready for configuration:**

See: [Configure Server](configure-server.md)

```
Next steps:
  1. Install .NET Runtime 9.0
  2. Configure monitoring agent
  3. Deploy BizFirst services
  4. Run health checks
  5. Add to load balancer
```

## Step 8: Document & Alert

**Record in ticket:**
```
[SERVER PROVISIONED]
ServerID: srvr-550e8400-e29b-41d4
Name: api-prod-2
Status: Running ✓
IP: 10.0.1.50 (private), 203.0.113.45 (elastic)
Time: Provisioned 2026-09-29 at 15:23 UTC
Owner: ServerDeveloper Agent
Next: Configure server (Step 7)
```

**Alert monitoring:**
- Register server in observability system
- Enable health checks
- Configure alerting thresholds (CPU >80%, Memory >85%, Disk >90%)
- Set up log collection

## Troubleshooting

| Issue | Cause | Solution |
|-------|-------|----------|
| **Status stuck at "Provisioning"** | Cloud provider slow or quota issue | Check cloud provider, try different zone |
| **ProvisioningFailed: InsufficientCapacity** | Region at capacity | Retry in different AZ or region |
| **Health check fails** | Network or security group issue | Verify security group rules, subnet routing |
| **Services not running** | Configuration not applied | Proceed to [Configure Server](configure-server.md) |

## Checklist

- [ ] Requirements analyzed and documented
- [ ] Quota verified (not over-allocated)
- [ ] Network configuration prepared
- [ ] API request payload prepared
- [ ] Provision API called, serverID received
- [ ] Provisioning progress monitored (8 min total)
- [ ] Server status verified as "Running"
- [ ] Health check passed
- [ ] Ticket documented with serverID and IP
- [ ] Monitoring alerts configured
- [ ] Ready for configuration phase

**Total time:** ~15 minutes (5 min setup + 8 min provisioning + 2 min verification)
