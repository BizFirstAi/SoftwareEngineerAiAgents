# Server Setup Questionnaire

**This questionnaire captures all requirements needed to provision and configure a server.**

## 1. What Will This Server Do? (Purpose)

**Question:** What application or service runs on this server?

Examples:
- Web application server (Node.js, .NET, Python)
- Database server (SQL Server, PostgreSQL, MySQL)
- Cache server (Redis, Memcached)
- Message queue (RabbitMQ, Kafka)
- File storage (NAS, object storage)
- Monitoring/logging (Elasticsearch, Grafana)

**Your answer:** ________________

**Recommendation:** Be specific. "Customer API backend" is better than "web server."

---

## 2. What Type of Server? (Infrastructure)

**Choose one:**

- **Physical Server** — Dedicated hardware in data center
  - *Best for: High performance, maximum control, compliance requirements*
  - *Cost: High upfront, ongoing maintenance*
  
- **Virtual Machine (VM)** — Virtualized server on shared hardware
  - *Best for: Flexible scaling, cost-effective, standard deployments*
  - *Cost: Medium, pay per VM*
  
- **Container (Docker/Kubernetes)** — Lightweight containerized deployment
  - *Best for: Microservices, rapid scaling, CI/CD integration*
  - *Cost: Low, efficient resource usage*
  
- **Cloud Instance** — AWS EC2, Azure VM, Google Compute Engine
  - *Best for: Global reach, auto-scaling, managed services*
  - *Cost: Variable, pay-as-you-go*
  
- **Edge Node** — Local/distributed compute, closer to users
  - *Best for: Low latency, offline capability, IoT*
  - *Cost: Medium, depends on location*

**Your answer:** ________________

---

## 3. Operating System & Runtime

**Operating System:**
- [ ] Windows Server (2019, 2022, 2025) — Version: ________
- [ ] Linux (Ubuntu 20.04, 22.04, CentOS, Rocky) — Version: ________
- [ ] Other: ________

**Application Runtime (what runs on this OS?):**
- [ ] .NET (ASP.NET Core) — Version: 8.0 / 9.0 / other: ________
- [ ] Node.js/npm — Version: 18 / 20 / LTS: ________
- [ ] Python — Version: 3.10 / 3.11 / 3.12: ________
- [ ] Java — Version: 11 / 17 / 21: ________
- [ ] Database (SQL Server, PostgreSQL, MySQL) — Version: ________
- [ ] Other: ________

**Recommendation:** Match your application's runtime. For .NET apps, use Windows Server or Linux with .NET runtime.

---

## 4. Compute Resources (Sizing)

**CPU Cores:**
- [ ] 1 core (small apps, testing)
- [ ] 2-4 cores (small-medium apps, light usage)
- [ ] 8-16 cores (medium-large apps, moderate traffic)
- [ ] 32+ cores (high-performance, heavy workloads)

**RAM (Memory):**
- [ ] 1-2 GB (development, testing)
- [ ] 4-8 GB (small production apps)
- [ ] 16-32 GB (medium production apps)
- [ ] 64+ GB (large databases, heavy workloads)

**Storage:**
- **Type:** [ ] SSD (fast) [ ] HDD (cheaper) [ ] NVMe (fastest)
- **Capacity:** _______ GB
- **Purpose:** [ ] OS + application [ ] Database [ ] File storage [ ] Logs/archives

**GPU Required?**
- [ ] No
- [ ] Yes — Type (NVIDIA, AMD, Intel): ________

**Calculation Helper:**
- Small app (e.g., API): 2 cores, 4 GB RAM, 100 GB SSD
- Medium app (e.g., web + DB): 8 cores, 16 GB RAM, 500 GB SSD
- Large app (e.g., complex system): 16+ cores, 32+ GB RAM, 1+ TB SSD

---

## 5. Network Requirements

**Network Connectivity:**
- [ ] Public IP (accessible from internet)
- [ ] Private IP only (internal network only)
- [ ] Both public and private

**Public IP Details (if needed):**
- Incoming ports: _______ (e.g., 80, 443, 3306)
- Outgoing: [ ] Full internet [ ] Restricted to: ________

**Security Groups/Firewall:**
- [ ] Allow all traffic (NOT recommended for production)
- [ ] Allow specific IPs: ________________
- [ ] Allow specific ports: ________________
- [ ] VPN/private network only

**Regional/Geolocation:**
- [ ] US (region: East, West, Central)
- [ ] EU (GDPR compliance)
- [ ] Asia-Pacific
- [ ] Multi-region (distributed)

**Recommendation:** For production, use a **security group** that allows only necessary ports (e.g., 80/443 for web, 5432 for database).

---

## 6. High Availability & Redundancy

**Will this server handle production traffic?**
- [ ] No (development/testing only)
- [ ] Yes (production, customers depend on it)

**If Production — Choose HA strategy:**
- [ ] Single instance (acceptable for non-critical apps)
- [ ] 2+ instances with load balancer (recommended)
- [ ] Auto-scaling group (scale based on traffic)
- [ ] Multi-region failover (for critical apps)

**Load Balancer:**
- [ ] Not needed
- [ ] Needed — [ ] Round-robin [ ] Sticky sessions [ ] Health-based

---

## 7. Backup & Disaster Recovery

**Backup Strategy:**
- Backup frequency: [ ] Never [ ] Daily [ ] Weekly [ ] Continuous
- Backup location: [ ] Same region [ ] Different region (more secure)
- Retention period: [ ] 7 days [ ] 30 days [ ] 1 year [ ] Custom: ________

**Disaster Recovery:**
- RTO (Recovery Time Objective): How fast must you recover? [ ] 1 hour [ ] 4 hours [ ] 1 day
- RPO (Recovery Point Objective): How much data loss is acceptable? [ ] None [ ] Minutes [ ] Hours
- Failover: [ ] Manual [ ] Automatic

**Recommendation:** For production databases, use **continuous replication** with automatic failover. For stateless apps, regular snapshots suffice.

---

## 8. Monitoring & Alerting

**What should be monitored?**
- [ ] CPU usage (alert if > 80%)
- [ ] Memory usage (alert if > 85%)
- [ ] Disk usage (alert if > 90%)
- [ ] Network latency (alert if > X ms)
- [ ] Application errors (alert on failures)
- [ ] Database query performance
- [ ] Custom metrics: ________________

**Alert Destinations:**
- [ ] Email
- [ ] SMS
- [ ] Slack/Teams
- [ ] PagerDuty

---

## 9. Scaling & Cost Management

**Traffic Expectations:**
- [ ] Flat/predictable traffic
- [ ] Spiky (peak hours, seasonal)
- [ ] Rapidly growing

**Scaling Strategy:**
- [ ] Fixed size (no scaling)
- [ ] Vertical scaling (bigger machine when needed)
- [ ] Horizontal scaling (more machines when needed)
- [ ] Auto-scaling (automatically add/remove based on metrics)

**Cost Budget:**
- Monthly budget: $________
- Growth allowance: _______%

**Recommendation:** For variable workloads, auto-scaling is most cost-effective. For predictable workloads, fixed sizing is simpler.

---

## 10. Deployment Timeline & Testing

**Timeline:**
- Needed by: _______ (date)
- Maintenance window: [ ] 9-5 [ ] After hours [ ] Anytime

**Testing & Validation:**
- [ ] Connectivity test (SSH/RDP works)
- [ ] Application deployment test (app starts and responds)
- [ ] Load test (simulate expected traffic)
- [ ] Failover test (verify HA works)
- [ ] Backup/recovery test (verify backups work)

**Sign-off:**
- Who needs to approve? ________________
- Final checklist before going live? ________________

---

## 11. Summary & Next Steps

**Server Summary:**
- **Purpose:** [what runs here]
- **Type:** [Physical / VM / Container / Cloud / Edge]
- **OS & Runtime:** [Windows Server 2022 / Ubuntu 22.04 + .NET 9.0 / etc.]
- **Compute:** [8 cores, 16 GB RAM, 500 GB SSD]
- **Network:** [Public + Private / Security groups: 80, 443]
- **HA Strategy:** [Single / Load-balanced / Auto-scaling]
- **Backup:** [Daily / Different region]
- **Monitoring:** [CPU, Memory, Disk, Errors]
- **Timeline:** [Go-live date]

**Next Steps:**
1. ✅ Review questionnaire for completeness
2. ✅ Validate sizing recommendations with team
3. ✅ Confirm budget and cost estimates
4. ✅ Check timeline vs. capacity (any constraints?)
5. ✅ Submit to ServerAgent for provisioning
6. ✅ Prepare deployment/testing plan
7. ✅ Set up monitoring before go-live

**Questions?** Refer to [Servers Knowledge Base](../../Knowledge/Servers/) or ask your infrastructure team.
