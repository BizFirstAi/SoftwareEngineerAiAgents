# Servers — Overview

**Servers** are the physical and virtual infrastructure that hosts BizFirst components, applications, and workloads across the enterprise ecosystem.

## What are Servers?

Servers provide:
- **Compute resources** — CPU, memory, storage for running BizFirst services
- **Isolation** — Multi-tenant separation via security groups, virtual networks
- **Lifecycle management** — Provisioning, configuration, monitoring, decommissioning
- **Integration** — Webhook events, monitoring APIs, deployment coordination

## Server Types

| Type | Use Case | Characteristics |
|------|----------|-----------------|
| **Physical Servers** | On-premise deployments | Dedicated hardware, high performance, capital intensive |
| **Virtual Machines (VMs)** | Flexible cloud/on-prem | Snapshots, migration, cost-efficient |
| **Containers (Docker)** | Microservice workloads | Lightweight, portable, orchestrated via K8s |
| **Cloud Instances** | AWS/Azure/GCP | Auto-scaling, managed infrastructure, pay-per-use |
| **Edge Nodes** | Distributed processing | Low-latency, decentralized execution, limited resources |

## Server Lifecycle

```
Provision → Configure → Deploy → Monitor → Scale/Update → Decommission
```

1. **Provision** — Allocate infrastructure, assign resources
2. **Configure** — Set runtime environment, network, security
3. **Deploy** — Install BizFirst components and dependencies
4. **Monitor** — Track health, metrics, logs
5. **Scale/Update** — Auto-scale, apply patches, upgrade services
6. **Decommission** — Retire, archive data, release resources

## Key Properties

Every server has:
- **Identity** — ServerID, name, IP address(es), hostname
- **Compute** — CPU cores, RAM, storage capacity, GPU (optional)
- **Network** — VPC/Subnet, security groups, firewall rules
- **Runtime** — OS, .NET runtime, Docker, Node.js, Python
- **Monitoring** — Health agent, metric collection, alerting
- **Multi-tenancy** — TenantID, data isolation, access control

## Integration Points

- **InstallHub** — Server registration, provisioning workflows
- **NodeHost** — Server deployment and package management
- **Observability** — Health monitoring, metrics, logs
- **IaaS/Deployment** — Auto-scaling, orchestration, disaster recovery
- **Credentials** — Secret management, certificate handling

## Deployment Models

1. **Dedicated** — Single tenant per server
2. **Shared** — Multiple tenants with isolation
3. **Managed** — Fully automated by platform (K8s, serverless)
4. **Hybrid** — Mix of on-prem and cloud

## Next Steps
- [Server Types Detail](01-server-types.md)
- [Infrastructure Architecture](02-infrastructure-architecture.md)
- [Configuration Schema](03-configuration-schema.md)
