# Deployment Model

Installation workflows, package management, and operational procedures.

## Installation Workflow

```
1. Planning Phase
   ├─ Capacity planning (CPU, memory, storage, bandwidth)
   ├─ Network design (VPC, subnets, security groups)
   ├─ Multi-tenancy layout (dedicated vs. shared)
   └─ Cost estimation

2. Provisioning Phase
   ├─ InstallHub: Register server (ServerID, TenantID)
   ├─ Allocate cloud resources (or rack physical hardware)
   ├─ Assign network (IP, DNS, security groups)
   └─ Create storage volumes (root, data, snapshots)

3. Configuration Phase
   ├─ Install OS (Windows/Linux from image)
   ├─ Apply hardening (firewall, SSH, audit logging)
   ├─ Install runtimes (.NET, Node, Python)
   ├─ Configure networking (DNS, NTP, proxy)
   └─ Install monitoring agent (Prometheus exporter, Datadog)

4. Deployment Phase
   ├─ NodeHost: Register server with package manager
   ├─ Deploy BizFirst packages (APIs, services, workers)
   ├─ Configure service startup (systemd, Windows Services)
   ├─ Database migrations (apply schema changes)
   └─ Health checks (verify all services running)

5. Monitoring Phase
   ├─ Baseline metrics (normal CPU, memory, disk)
   ├─ Configure alerts (thresholds, escalation)
   ├─ Enable audit logs (security events)
   └─ Test failover (DR procedures)

6. Production Phase
   ├─ Load balancer health checks
   ├─ Auto-scaling policies (if applicable)
   ├─ Backup/snapshot schedules
   └─ Scheduled maintenance windows
```

## Package Management

### NodeHost Package Structure
```
bizfirst-services-v9.0.0.tar.gz
├─ bizfirst-api-9.0.0.deb
├─ bizfirst-worker-9.0.0.deb
├─ bizfirst-scheduler-9.0.0.deb
├─ Dependencies/
│  ├─ .NET Runtime 9.0.0
│  ├─ PostgreSQL Client 15
│  └─ Redis Client 7
├─ Config/
│  ├─ appsettings.json
│  ├─ systemd/*.service
│  └─ nginx/*.conf
└─ Scripts/
   ├─ install.sh
   ├─ migrate-database.sh
   ├─ health-check.sh
   └─ rollback.sh
```

### Deployment Strategies

#### Blue-Green Deployment
```
Blue (Current)          Green (New)
┌──────────────┐       ┌──────────────┐
│ v9.0.0       │       │ v9.0.1       │
│ Running      │       │ Ready        │
└──────────────┘       └──────────────┘
       ↑                      │
       │ Traffic             │
   Load Balancer ←───────────┘
       │
       ↓
    Users

Steps:
1. Deploy v9.0.1 to Green (no traffic)
2. Run smoke tests on Green
3. Switch load balancer → Green
4. Keep Blue running 24h (quick rollback)
5. If Blue proves stable, update and reuse for next deploy
```

**Advantages:** Zero downtime, instant rollback, full A/B testing

#### Rolling Deployment
```
Server 1: v9.0.0  ┐
Server 2: v9.0.0  ├─ Gradual update
Server 3: v9.0.0  ┤
Server 4: v9.0.0  ┘

Phase 1: Update Server 1 → v9.0.1 (traffic continues on 2,3,4)
Phase 2: Update Server 2 → v9.0.1 (traffic continues on 3,4)
Phase 3: Update Server 3 → v9.0.1 (traffic continues on 4)
Phase 4: Update Server 4 → v9.0.1 (all on v9.0.1)
```

**Advantages:** Reduced load during update, backward-compat validation

#### Canary Deployment
```
Production (100%)
├─ Canary: 5% traffic, v9.0.1 ← Monitor errors, latency
├─ Stable: 95% traffic, v9.0.0
│
→ If canary metrics OK: expand to 25%, 50%, 100%
→ If canary errors spike: rollback instantly
```

**Advantages:** Risk minimization, early error detection

## Auto-Scaling Policies

```yaml
AutoScaling:
  Min: 2 instances
  Max: 20 instances
  
  Metrics:
    - CPUUtilization > 70% → Scale up
    - CPUUtilization < 30% → Scale down
    - MemoryUtilization > 80% → Scale up
    - RequestLatency > 500ms → Scale up

  Cooldown: 5 minutes (prevent flapping)
  
  Target: Add/remove 1 instance per cycle
  
  Example Timeline:
    14:00 - Traffic spike, CPU jumps to 85%
    14:05 - Add 2 instances (cooldown expires)
    14:10 - CPU normalizes to 65%
    14:40 - Traffic drops, CPU at 25%
    14:45 - Remove 1 instance
    14:50 - CPU at 35%, stable
```

## Disaster Recovery Procedures

### Backup Strategy
```yaml
Backup:
  Database:
    Frequency: Hourly (incremental), Daily (full)
    Retention: 30 days
    Location: Primary + Secondary region
    Encryption: AES-256
    Test Restore: Weekly (schedule)

  Application Files:
    Frequency: Daily
    Retention: 7 days
    Deduplication: Enabled
    Compression: zstd

  Configuration:
    Frequency: On change
    Retention: Unlimited (version control)
    Audit: All changes logged
```

### Disaster Recovery Runbook

**Scenario: Primary Data Center Lost**

```
Time  Action
────  ──────────────────────────────────────
T+0   Alert fires: Datacenter unreachable
T+5   Incident commander declares disaster
T+10  Activate secondary datacenter
      - Promote standby database to primary
      - Update DNS to point to secondary
      - Bring up load balancers, APIs, workers
T+30  Verify database integrity (latest backup)
T+45  Restore from backup if needed
T+60  Resume customer traffic (potentially stale by <1hr)
T+120 Root cause analysis begins
```

**Recovery Time Objective (RTO):** 60 minutes max
**Recovery Point Objective (RPO):** 1 hour max data loss acceptable

### Testing & Validation
- [ ] Monthly: Restore database from backup, verify integrity
- [ ] Quarterly: Full failover test to secondary DC (non-prod)
- [ ] Annually: Production DR drill (maintenance window)

## Scheduled Maintenance

```
Weekly Maintenance Window
  When: Sunday 02:00-04:00 UTC
  Affected: Non-critical workloads only
  Advance Notice: 2 weeks

Activities:
  1. OS patches (kernel, security libraries)
  2. Runtime updates (.NET, Node)
  3. Dependency upgrades (compatible versions)
  4. Hardware firmware (if applicable)
  5. Network configuration changes

Validation:
  - Health checks pass
  - Service restart successful
  - Monitoring alerts normal
  - Log review (no anomalies)

Rollback Plan:
  - If issues detected, revert to previous snapshot
  - Notify affected customers
  - Post-mortem within 48 hours
```

## Next Steps
- [API Reference](05-api-reference.md)
- [Integration Guide](06-integration-guide.md)
