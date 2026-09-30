# Infrastructure Architecture

How servers integrate with the BizFirst ecosystem.

## System Components

```
┌─────────────────────────────────────────────────┐
│         InstallHub (Provisioning)                │
│  - Server registration, lifecycle events        │
│  - Tenant assignment, quota management          │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────┴───────────────────────────────┐
│         Server Infrastructure                    │
│  ┌──────────┬──────────┬─────────┬────────┐    │
│  │ Physical │    VM    │Container│ Cloud  │    │
│  └──────────┴──────────┴─────────┴────────┘    │
└──────────────────┬────────────────────────────┘
                   │
┌──────────────────┴────────────────────────────┐
│     NodeHost (Deployment)                     │
│  - Package management, service installation  │
│  - Configuration push, auto-update            │
└──────────────────┬────────────────────────────┘
                   │
  ┌────────────────┼────────────────┐
  │                │                │
┌─┴────────┐  ┌───┴────────┐  ┌───┴────────┐
│IaaS/      │  │Observab.   │  │Credentials │
│Deployment │  │(Metrics)   │  │(Secrets)   │
└───────────┘  └────────────┘  └────────────┘
```

## Network Architecture

```
┌────────────────────────────────────────────────┐
│  Internet / Public Network                      │
└────────────────┬───────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
    ┌───┴────┐        ┌──┴────┐
    │ LoadBal│        │NAT GW │
    └───┬────┘        └──┬────┘
        │                │
  ┌─────┴────────────────┴─────┐
  │  VPC / Virtual Network      │
  │  ┌──────────────────────┐   │
  │  │ Public Subnet        │   │
  │  │ ┌──────┐ ┌──────┐   │   │
  │  │ │Web   │ │API   │   │   │
  │  │ └──────┘ └──────┘   │   │
  │  └──────────┬───────────┘   │
  │  ┌──────────┴───────────┐   │
  │  │ Private Subnet       │   │
  │  │ ┌──────┐ ┌──────┐   │   │
  │  │ │DB    │ │Cache│   │   │
  │  │ └──────┘ └──────┘   │   │
  │  └──────────────────────┘   │
  └─────────────────────────────┘

Security Groups / Firewall Rules:
- Inbound: HTTP (80), HTTPS (443), SSH (22)
- Outbound: DNS (53), NTP (123), Internet
- Inter-server: Custom rules per tier
```

## Multi-Tenancy Isolation

```
┌─────────────────────────────────────────┐
│  Single Physical / Cloud Infrastructure │
│                                         │
│  ┌──────────────┬──────────────┐       │
│  │  Tenant A    │  Tenant B    │       │
│  │  VPC/Network │  VPC/Network │       │
│  │              │              │       │
│  │ ┌──────────┐ │ ┌──────────┐ │       │
│  │ │ Servers  │ │ │ Servers  │ │       │
│  │ │ TenantID │ │ │TenantID  │ │       │
│  │ │ = A      │ │ │ = B      │ │       │
│  │ └──────────┘ │ └──────────┘ │       │
│  └──────────────┴──────────────┘       │
│                                         │
│  Isolation Mechanisms:                  │
│  - Network: VPC/Subnet per tenant       │
│  - Security Groups: Tenant-specific     │
│  - IAM: RBAC per tenant                 │
│  - Data: TenantID column in all tables  │
│  - Storage: Separate volumes/buckets    │
└─────────────────────────────────────────┘
```

## Monitoring and Observability

```
Servers
  └─→ Health Agent (logs, metrics, events)
      └─→ Observability Service
          ├─→ Metrics Store (Prometheus/InfluxDB)
          ├─→ Log Store (ELK / CloudWatch)
          ├─→ Trace Store (Jaeger / Application Insights)
          └─→ Dashboard + Alerting
              ├─→ CPU/Memory/Disk thresholds
              ├─→ Network latency
              ├─→ Service availability
              └─→ Custom business metrics
```

**Monitored Metrics:**
- **System** — CPU %, Memory %, Disk %, Network I/O
- **Process** — Service uptime, restart count, error rate
- **Application** — Request latency, throughput, error codes
- **Security** — Failed login attempts, privilege escalation, unusual activity

## Disaster Recovery

```
Primary Data Center         Secondary Data Center
┌──────────────────┐       ┌──────────────────┐
│  Servers         │       │  Servers         │
│  ├─ Active       │──────→│  ├─ Standby      │
│  └─ Services     │       │  └─ Services     │
└──────────────────┘       └──────────────────┘
     │                             ↓
     └─────────────────────────────┘
          Replication (RTO/RPO)
```

**Recovery Strategies:**
- **RTO (Recovery Time Objective)** — Target downtime (minutes to hours)
- **RPO (Recovery Point Objective)** — Data loss tolerance (seconds to hours)
- **Active-Active** — Both sites serve traffic (RTO: seconds, RPO: seconds)
- **Active-Passive** — Failover on demand (RTO: minutes, RPO: minutes)
- **Backup-Only** — Restore from backups (RTO: hours, RPO: hours)

## Security Hardening

**Server Hardening Checklist:**
- [ ] OS: Latest patches, minimal services, disabled unused ports
- [ ] Network: Firewall rules, NACLs, VPC isolation
- [ ] Auth: Disable default accounts, SSH key-based only (no passwords)
- [ ] Encryption: TLS/mTLS for service-to-service, encryption-at-rest
- [ ] Secrets: Use Credentials system (never hardcoded)
- [ ] Audit: Enable logging, monitor access, alert on anomalies

## Next Steps
- [Configuration Schema](03-configuration-schema.md)
- [Deployment Model](04-deployment-model.md)
- [API Reference](05-api-reference.md)
