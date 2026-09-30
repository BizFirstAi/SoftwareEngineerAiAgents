# Servers — Knowledge Base

Complete reference for ServerDeveloper agent provisioning, configuring, and managing BizFirst infrastructure.

## Quick Start Paths

**I want to...**
- **Provision a new server** → [Overview](00-overview.md) → [Configuration Schema](03-configuration-schema.md) → [API Reference](05-api-reference.md) → [Integration Guide](06-integration-guide.md)
- **Understand server types** → [Server Types](01-server-types.md) → [Configuration Schema](03-configuration-schema.md)
- **Set up disaster recovery** → [Infrastructure Architecture](02-infrastructure-architecture.md) → [Deployment Model](04-deployment-model.md)
- **Deploy an application** → [Deployment Model](04-deployment-model.md) → [API Reference](05-api-reference.md) → [Integration Guide](06-integration-guide.md)
- **Monitor server health** → [API Reference](05-api-reference.md) (Health & Monitoring section)
- **Auto-scale on demand** → [Deployment Model](04-deployment-model.md) (Auto-Scaling section) → [Integration Guide](06-integration-guide.md)

## Document Map

| Document | Purpose | Audience |
|----------|---------|----------|
| [00-overview.md](00-overview.md) | What servers are, lifecycle, integration points | Everyone |
| [01-server-types.md](01-server-types.md) | Physical, VM, Container, Cloud, Edge definitions | Architects, Developers |
| [02-infrastructure-architecture.md](02-infrastructure-architecture.md) | Network, multi-tenancy, monitoring, DR architecture | Infrastructure, DevOps |
| [03-configuration-schema.md](03-configuration-schema.md) | Server entity, compute, network, storage, runtime config | Developers, Platform |
| [04-deployment-model.md](04-deployment-model.md) | Installation workflows, deployment strategies, auto-scaling, DR | DevOps, SRE |
| [05-api-reference.md](05-api-reference.md) | REST endpoints, payloads, webhooks, errors | Developers, Integration |
| [06-integration-guide.md](06-integration-guide.md) | Agent workflows, patterns, error handling, best practices | Agents, Platform |

## Key Concepts

### Server Lifecycle
1. **Provision** — Allocate infrastructure (cloud VM, physical hardware, container host)
2. **Configure** — Set up runtime, network, storage, monitoring
3. **Deploy** — Install BizFirst services and applications
4. **Monitor** — Track health, metrics, logs
5. **Scale/Update** — Auto-scale on demand, apply patches/upgrades
6. **Decommission** — Retire and archive data

### Server Types
- **Physical Servers** — Dedicated hardware (on-prem)
- **Virtual Machines** — Hypervisor-based instances (flexible)
- **Containers** — Docker/Kubernetes (lightweight, auto-scaling)
- **Cloud Instances** — AWS/Azure/GCP (managed, global)
- **Edge Nodes** — Distributed compute (IoT, low-latency)

### Multi-Tenancy
- Every server tagged with TenantID
- VPC/network isolation per tenant
- Security groups enforce tenant boundaries
- Data filtered by TenantID in all queries

### Deployment Strategies
- **Blue-Green** — Zero downtime, instant rollback
- **Rolling** — Gradual update, reduced load
- **Canary** — Risk-minimized, early error detection

## API Quick Reference

### Create Server
```
POST /servers/provision
{ "name": "web-prod-1", "type": "CloudInstance", ... }
→ 202 Accepted { serverID, status: "Provisioning", ... }
```

### Get Server Status
```
GET /servers/{serverID}
→ 200 { serverID, name, status, ipAddresses, metrics, ... }
```

### Deploy Package
```
POST /servers/{serverID}/deploy
{ "packageID": "bizfirst-services-9.0.1", "services": [...] }
→ 202 Accepted { deploymentID, status: "InProgress", ... }
```

### Get Health
```
GET /servers/{serverID}/health
→ 200 { status: "Healthy", metrics: { cpu, memory, disk, ... } }
```

### Decommission
```
DELETE /servers/{serverID}
{ "reason": "...", "backupData": true, ... }
→ 202 Accepted { status: "Decommissioning", ... }
```

## Common Scenarios

### Auto-Scale on High Load
1. Monitoring alerts: CPU > 80%
2. ServerDeveloper calls: POST /servers/provision
3. New server provisions (3-5 min)
4. Load balancer adds to pool
5. Traffic redistributes, CPU normalizes

### Rolling Deployment (v9.0.0 → v9.0.1)
1. Phase 1: Deploy to server-1, verify, return to pool
2. Phase 2: Deploy to server-2, monitor, return to pool
3. Phase 3: Deploy to server-3, all on v9.0.1
4. **Total time:** ~15 minutes with zero downtime

### Disaster Recovery (Primary DC Lost)
1. Alert fires, incident commander activated
2. Activate secondary datacenter servers
3. Promote standby database to primary
4. Update DNS to secondary IPs
5. **RTO:** 60 minutes max

## Error Handling

**Provisioning timeout (>15 min)**
- Check cloud provider logs
- Try different region/zone
- Escalate to platform team

**Deployment failure**
- Automatic rollback available
- Check service logs: GET /servers/{id}/logs
- Verify application health

**Health degradation**
- Auto-scale triggered on CPU/memory thresholds
- Check for resource leaks in application
- Review recent deployments

## Monitoring & Alerting

**Key Metrics:**
- Provision Time (target: 3-5 min)
- Deployment Success Rate (target: 99.9%)
- Auto-Scale Latency (target: <10 min)
- Failover Time (target: <5 min)

**Alerts:**
- ProvisioningFailure (>15 min)
- HealthDegraded (CPU >85%, Memory >90%)
- FailoverRequired (primary unreachable)
- DeploymentFailure (with rollback)

## Next Steps
- [Procedure: Provision Server](../../Procedure/Servers/provision-server.md)
- [Procedure: Configure Server](../../Procedure/Servers/configure-server.md)
- [Procedure: Deploy Application](../../Procedure/Servers/deploy-application.md)
- [Integration Guide](06-integration-guide.md)
