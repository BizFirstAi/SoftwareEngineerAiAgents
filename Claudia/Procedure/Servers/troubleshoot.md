# Troubleshoot Server

Diagnostic and resolution procedures for common server issues.

## Diagnosis Framework

**When an issue is reported:**

```
1. Determine severity
   - Critical (service down): Escalate immediately, start incident
   - High (degraded): Begin diagnosis
   - Medium (warning): Schedule investigation
   - Low (advisory): Log for next maintenance window

2. Isolate the problem
   - Server-level: Network, hardware, OS
   - Service-level: Application, dependencies
   - Data-level: Database, cache, queue

3. Implement fix
   - Quick fix (if safe): Apply immediately
   - Require change control: Escalate
   - Unknown cause: Page specialist

4. Verify resolution
   - Confirm service restored
   - Monitor for regression
   - Document findings
```

## Common Issues & Solutions

### Issue 1: Service Down (HTTP 503)

**Symptoms:**
- API not responding
- Health endpoint returns connection refused
- Load balancer showing server unhealthy

**Diagnosis:**

```bash
# 1. Verify process is running
ps aux | grep "[d]otnet.*Api"
→ If no output: Service crashed

# 2. Check service status
sudo systemctl status bizfirst-api
→ Check if Active or Failed

# 3. View recent logs
sudo journalctl -u bizfirst-api -n 50
→ Look for error messages, stack traces

# 4. Check exit code
sudo systemctl show -p ExecMainStatus bizfirst-api
→ 0 = success, non-zero = error
```

**Solution:**

```bash
# If service crashed, restart it
sudo systemctl restart bizfirst-api

# Wait for startup
sleep 5

# Verify it started
sudo systemctl status bizfirst-api
→ Should show "active (running)"

# Check health
curl http://localhost:8000/health
→ Should return JSON with "status": "Healthy"

# If still failing, check dependencies
curl http://localhost:8000/health/database
→ Check if database connectivity issue
curl http://localhost:8000/health/cache
→ Check if cache connectivity issue
```

**Prevention:**

- [ ] Set `Restart=always` in systemd service
- [ ] Enable automatic restart on failure
- [ ] Monitor process uptime metric

---

### Issue 2: High CPU Usage (>85%)

**Symptoms:**
- Slow API responses
- CPU alert firing
- Load average high

**Diagnosis:**

```bash
# 1. Identify CPU-consuming process
top -b -n 1 | head -15
→ Identify process with high CPU%

# 2. Check for specific process
ps aux | grep "[d]otnet"
→ Get PID of API service

# 3. Thread analysis (if available)
sudo jcmd <PID> Thread.print > threads.txt
grep "runnable" threads.txt | head -20
→ Identify runnable threads, may indicate lock contention

# 4. Check application logs for warnings
sudo journalctl -u bizfirst-api --since "10 minutes ago" | grep -E "WARN|ERROR"
```

**Solution:**

**Option A: If caused by request spike**
```bash
# Verify auto-scaling policy
GET /servers/{serverID}/auto-scaling-policy
→ Check min/max replicas, thresholds

# Trigger auto-scale (if manual)
POST /servers/provision
{ "name": "api-prod-3", "config": "clone-from-api-prod-2" }
→ New instance provisions, adds to load balancer

# Monitor CPU after scale-out
watch -n 5 'curl http://localhost:8000/metrics | grep cpu'
→ Should decrease as traffic redistributes
```

**Option B: If caused by memory leak**
```bash
# Check memory usage trend
curl 'http://prometheus:9090/api/v1/query_range?query=process_resident_memory_bytes{instance="10.0.1.50:8000"}&step=5m' \
  | jq '.data.result[0].values | map(.[1] | tonumber)' | head -20
→ Look for steadily increasing values (leak pattern)

# If memory leaking, restart service (short-term fix)
sudo systemctl restart bizfirst-api

# Escalate for code review (long-term fix)
→ Create ticket for memory leak investigation
→ Profile application during production workload
→ May require code changes to release unused memory
```

**Option C: If caused by inefficient query**
```bash
# Check database query logs
tail -f /var/log/postgresql/postgresql.log | grep "duration:"
→ Look for slow queries taking >1 second

# Enable query logging (if not enabled)
sudo systemctl stop bizfirst-api
# Update appsettings to enable query logging
sudo systemctl start bizfirst-api

# Analyze slow queries
SELECT query, calls, mean_exec_time FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;

# Create index or optimize query
→ May require code changes
```

---

### Issue 3: High Memory Usage (>85%)

**Symptoms:**
- Memory alert firing
- OOM killer (out of memory)
- Swapping occurring

**Diagnosis:**

```bash
# 1. Check total memory
free -h
→ Identify how much is used vs. available

# 2. Check per-process memory
ps aux --sort=-%mem | head -10
→ Identify which process(es) consuming memory

# 3. Check if swapping
free -h | grep "Swap"
→ If Swap > 0: System is swapping (very slow)

# 4. Check memory breakdown
cat /proc/meminfo | grep -E "^Mem|^Swap"
→ MemFree, MemAvailable, SwapFree

# 5. Check for memory leaks over time
curl 'http://prometheus:9090/api/v1/query_range?query=process_resident_memory_bytes{instance="10.0.1.50:8000"}&step=10m&start=<24h-ago>&end=<now>' \
  | jq '.data.result[0].values[-5:]'
→ Last 5 points should be similar; if growing = leak
```

**Solution:**

**Option A: If temporary spike**
```bash
# Restart application to clear memory
sudo systemctl restart bizfirst-api

# Monitor memory after restart
watch -n 5 'free -h'
→ Should drop significantly

# If returns to high levels quickly = leak
```

**Option B: If memory leak**
```bash
# Short-term: Increase instance memory
POST /servers/{serverID}/update
{ "memoryGB": 32 }
→ May trigger brief downtime

# Long-term: Find and fix leak
→ Create ticket for memory profiling
→ Run memory profiler in lower environment first
→ Identify unreleased objects or circular references
```

**Option C: If legitimate high usage (large dataset)**
```bash
# Verify this is expected
→ Check data volume in database
→ Confirm application caching strategy
→ Review if load has increased

# Scale up instance
POST /servers/{serverID}/update
{ "memoryGB": 32 }
```

---

### Issue 4: Disk Space Full (>90%)

**Symptoms:**
- Disk space alert
- Application can't write logs
- Database transactions fail

**Diagnosis:**

```bash
# 1. Check disk usage
df -h /
→ Identify filesystem and usage percentage

# 2. Find large files/directories
du -sh /* | sort -h | tail -10
→ Identify largest directories

# 3. Check log directory size
du -sh /var/log/bizfirst/
→ Logs often cause space issues

# 4. Find large files by age
find /var/log -name "*.log" -type f -exec ls -lh {} \; | sort -k5 -h | tail -20
→ Identify old log files that should be rotated

# 5. Check application temp directory
du -sh /tmp /var/tmp
→ May contain old uploads, cache
```

**Solution:**

**Option A: Clean logs**
```bash
# Rotate logs immediately
sudo logrotate -f /etc/logrotate.d/bizfirst
sudo logrotate -f /etc/logrotate.conf

# Remove old log archives
find /var/log/bizfirst -name "*.gz" -mtime +30 -delete
→ Remove gzipped logs older than 30 days

# Verify disk space freed
df -h /
```

**Option B: Clean temp files**
```bash
# Remove old temp files
find /tmp -type f -atime +7 -delete
→ Delete files not accessed in 7 days

find /var/tmp -type f -atime +7 -delete

# Verify space
du -sh /tmp /var/tmp
df -h /
```

**Option C: Extend storage**
```bash
# If immediate action needed
# Add new volume and mount
POST /servers/{serverID}/storage
{ "size": 500, "mountPoint": "/data2" }

# Long-term: Increase root volume
POST /servers/{serverID}/update
{ "storageGB": 200 }
→ May require downtime and resize

# Update log retention policy
# Edit /etc/logrotate.d/bizfirst
# Reduce maxage or compress more aggressively
```

---

### Issue 5: High Network Latency (>100ms)

**Symptoms:**
- API responses slow
- Database queries slow
- Cross-datacenter communication degraded

**Diagnosis:**

```bash
# 1. Check network connectivity
ping db-prod-1.internal
→ Check round-trip time (should be <10ms local, <100ms cross-region)

# 2. Check for packet loss
ping -c 100 db-prod-1.internal | grep "loss"
→ Any loss % indicates network issues

# 3. Check network interface stats
ethtool -S eth0 | grep -E "rx|tx|drop|err"
→ Look for dropped packets or errors

# 4. Check route to destination
traceroute db-prod-1.internal
→ Identify hops, find slow one

# 5. Check if VPN/tunnel involved
ip link show
→ Check for vpn, tun, or encrypted interfaces
```

**Solution:**

**If VPN/tunnel slow:**
```bash
# Restart tunnel
sudo systemctl restart vpn-tunnel

# Check if tunnel is encrypted
ip link show vpn0
→ Encrypted tunnels add overhead

# Verify key exchange
sudo ipsec status
```

**If cross-datacenter:**
```bash
# Use accelerated networking (AWS)
POST /servers/{serverID}/update
{ "networkOptimization": "enhanced" }

# Or migrate to same datacenter
POST /servers/provision
{ "region": "same-as-database", ... }
```

**If packet loss on link:**
```bash
# Escalate to network team
→ Check router logs
→ Verify ISP connectivity
→ May be upstream issue
```

---

### Issue 6: Database Connection Failures

**Symptoms:**
- "Connection refused" errors
- Application logs show "could not connect to server"
- Health check fails for database

**Diagnosis:**

```bash
# 1. Verify database server is running
ping db-prod-1.internal
→ Check if reachable at all

# 2. Check database port
nc -zv db-prod-1.internal 5432
→ Verify port 5432 is open and listening

# 3. Test direct connection
psql -h db-prod-1.internal -U bizfirst -d bizfirst -c "SELECT 1;"
→ Should return successful result

# 4. Check connection limit
psql -h db-prod-1.internal -U postgres -d postgres -c "SHOW max_connections;"
→ Check if limit reached

# 5. Check active connections
psql -h db-prod-1.internal -U postgres -d postgres -c "SELECT count(*) FROM pg_stat_activity;"
→ If equals max_connections, that's the issue
```

**Solution:**

**If database unreachable:**
```bash
# 1. Check network connectivity
ping db-prod-1.internal
traceroute db-prod-1.internal
→ If fails, network/routing issue

# 2. Check security groups
→ Verify port 5432 allowed from api-prod-2
→ Check if IP in whitelist

# 3. Check database logs
ssh db-prod-1
tail -f /var/log/postgresql/postgresql.log
→ Look for "FATAL" or "ERROR" entries
```

**If connection limit reached:**
```bash
# Check what's holding connections
SELECT usename, count(*) FROM pg_stat_activity GROUP BY usename;

# Kill idle connections
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle' AND query_start < now() - interval '10 minutes';

# Increase max_connections
ALTER SYSTEM SET max_connections = 200;
SELECT pg_reload_conf();

# Long-term: Use connection pooling
→ Deploy PgBouncer or similar
```

---

## Quick Troubleshooting Checklist

| Issue | Quick Check | Quick Fix |
|-------|-----------|----------|
| **Service Down** | `systemctl status bizfirst-api` | `systemctl restart bizfirst-api` |
| **High CPU** | `top` → identify process | Scale out or restart service |
| **High Memory** | `free -h` → check availability | Restart service or scale up |
| **Disk Full** | `df -h` → check usage | `logrotate -f`, delete old files |
| **No DB Connection** | `nc -zv db:5432` | Check security group, network |
| **Slow Requests** | `curl /health` → check latency | Check if CPU/memory constrained |
| **Failed Deployment** | `journalctl -u bizfirst-api` | Check logs, verify config, retry |

## Escalation Path

```
Issue Found
├─ Does service respond? (curl /health)
│  ├─ No → Restart service
│  │  └─ Still no → Page on-call
│  └─ Yes → Check logs
│
├─ Can you identify root cause in logs?
│  ├─ Yes (e.g., DB connection, config error)
│  │  └─ Apply targeted fix
│  └─ No (e.g., obscure error, performance)
│     └─ Page specialist (SRE, DBA, etc.)
│
└─ If fix doesn't work or unknown cause
   └─ Declare incident
      ├─ Page incident commander
      ├─ Create war room
      └─ Begin deep investigation
```

## When to Escalate

**Page On-Call If:**
- Service is completely down (0% availability)
- Data loss risk
- Security breach suspected
- Can't fix within 15 minutes

**Create Ticket If:**
- Degradation (slow, but working)
- Warning signs (high memory, disk, temp spike)
- Preventive investigation needed

**Schedule Deep Dive If:**
- Recurring issue (second time this week)
- Performance baseline degraded
- Resource usage trending wrong

## Checklist

- [ ] Service health verified
- [ ] Application logs reviewed
- [ ] Dependency connectivity tested
- [ ] System resources checked (CPU, memory, disk)
- [ ] Root cause identified or narrowed
- [ ] Fix applied and verified
- [ ] Monitoring alerts cleared
- [ ] Ticket documented with findings
- [ ] Team notified if escalated
- [ ] Prevention step identified

## Related Documentation
- [Monitor Server](monitor-server.md) — Metrics and alerting
- [Infrastructure Architecture](../../Knowledge/Servers/02-infrastructure-architecture.md) — System overview
- [Deployment Model](../../Knowledge/Servers/04-deployment-model.md) — Common patterns and procedures
