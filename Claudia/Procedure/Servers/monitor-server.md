# Monitor Server

Procedures for monitoring server health, metrics, and logs.

## Prerequisites
- [ ] Server deployed and running (see [Deploy Application](deploy-application.md))
- [ ] Node Exporter installed and running (port 9100)
- [ ] Application health endpoints available (/health, /metrics)
- [ ] Monitoring system configured (Prometheus, Grafana, or Datadog)
- [ ] Alerts configured

## Step 1: Set Up Metrics Collection

**Configure Prometheus scrape job:**

```yaml
# /etc/prometheus/prometheus.yml

scrape_configs:
  - job_name: 'bizfirst-api'
    scrape_interval: 60s
    scrape_timeout: 10s
    static_configs:
      - targets: ['10.0.1.50:8000']
    relabel_configs:
      - source_labels: [__address__]
        target_label: instance
      - source_labels: [__scheme__]
        target_label: scheme

  - job_name: 'node-exporter'
    scrape_interval: 60s
    static_configs:
      - targets: ['10.0.1.50:9100']
    relabel_configs:
      - source_labels: [__address__]
        target_label: instance
        replacement: 'api-prod-2'
```

**Reload Prometheus:**

```bash
curl -X POST http://prometheus:9090/-/reload
```

**Verify metrics are collected:**

```bash
# Query Prometheus
curl 'http://prometheus:9090/api/v1/query?query=up{instance="10.0.1.50:8000"}'

Response:
{
  "status": "success",
  "data": {
    "resultType": "vector",
    "result": [
      {
        "metric": { "instance": "10.0.1.50:8000", "job": "bizfirst-api" },
        "value": [ 1695998745, "1" ]
      }
    ]
  }
}
```

## Step 2: Configure Dashboards

**Create Grafana dashboard for server monitoring:**

```json
{
  "dashboard": {
    "title": "API Server: api-prod-2",
    "panels": [
      {
        "title": "CPU Usage",
        "targets": [
          {
            "expr": "rate(process_cpu_seconds_total{instance='10.0.1.50:9100'}[5m]) * 100"
          }
        ],
        "yaxes": [
          { "label": "CPU %", "max": 100 }
        ]
      },
      {
        "title": "Memory Usage",
        "targets": [
          {
            "expr": "(1 - (node_memory_MemAvailable_bytes{instance='10.0.1.50:9100'} / node_memory_MemTotal_bytes{instance='10.0.1.50:9100'})) * 100"
          }
        ],
        "yaxes": [
          { "label": "Memory %", "max": 100 }
        ]
      },
      {
        "title": "Disk Usage",
        "targets": [
          {
            "expr": "(1 - (node_filesystem_avail_bytes{instance='10.0.1.50:9100',fstype='ext4'} / node_filesystem_size_bytes{instance='10.0.1.50:9100',fstype='ext4'})) * 100"
          }
        ]
      },
      {
        "title": "Network Bytes In/Out",
        "targets": [
          {
            "expr": "rate(node_network_receive_bytes_total{instance='10.0.1.50:9100'}[5m])"
          },
          {
            "expr": "rate(node_network_transmit_bytes_total{instance='10.0.1.50:9100'}[5m])"
          }
        ]
      },
      {
        "title": "API Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total{instance='10.0.1.50:8000'}[5m])"
          }
        ]
      },
      {
        "title": "API Latency (p95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{instance='10.0.1.50:8000'}[5m]))"
          }
        ]
      }
    ]
  }
}
```

## Step 3: Configure Alerting Rules

**Create alert rules (prometheus rules.yml):**

```yaml
groups:
  - name: bizfirst-api-alerts
    interval: 30s
    rules:
      - alert: HighCPUUsage
        expr: rate(process_cpu_seconds_total{instance='10.0.1.50:9100'}[5m]) * 100 > 80
        for: 5m
        annotations:
          summary: "High CPU on api-prod-2 ({{ $value }}%)"

      - alert: HighMemoryUsage
        expr: |
          (1 - (node_memory_MemAvailable_bytes{instance='10.0.1.50:9100'} / 
          node_memory_MemTotal_bytes{instance='10.0.1.50:9100'})) * 100 > 85
        for: 5m
        annotations:
          summary: "High memory on api-prod-2 ({{ $value }}%)"

      - alert: DiskUsageHigh
        expr: |
          (1 - (node_filesystem_avail_bytes{instance='10.0.1.50:9100'} / 
          node_filesystem_size_bytes{instance='10.0.1.50:9100'})) * 100 > 85
        for: 10m
        annotations:
          summary: "Disk 85% full on api-prod-2 ({{ $value }}%)"

      - alert: ServiceDown
        expr: up{instance='10.0.1.50:8000'} == 0
        for: 1m
        annotations:
          summary: "API service down on api-prod-2"

      - alert: HighErrorRate
        expr: |
          sum(rate(http_requests_total{instance='10.0.1.50:8000', status=~'5..'}[5m])) /
          sum(rate(http_requests_total{instance='10.0.1.50:8000'}[5m])) > 0.05
        for: 5m
        annotations:
          summary: "High error rate on api-prod-2 ({{ $value }}%)"

      - alert: HighLatency
        expr: |
          histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{instance='10.0.1.50:8000'}[5m])) > 1
        for: 5m
        annotations:
          summary: "High latency on api-prod-2 ({{ $value }}s)"
```

## Step 4: Manual Health Checks

**Daily health check procedure:**

```bash
# Login to server
ssh ubuntu@10.0.1.50

echo "=== System Health ==="
free -h
→ Check memory available
df -h /
→ Check disk space
uptime
→ Check load average

echo "=== Service Status ==="
sudo systemctl status bizfirst-api
sudo systemctl status bizfirst-worker
sudo systemctl status bizfirst-scheduler

echo "=== Application Health ==="
curl -s http://localhost:8000/health | jq .
curl -s http://localhost:8000/health/database | jq .
curl -s http://localhost:8000/health/cache | jq .

echo "=== Recent Logs (last 20 lines) ==="
sudo journalctl -u bizfirst-api -n 20

echo "=== Error Count (last 1 hour) ==="
sudo journalctl -u bizfirst-api --since "1 hour ago" | grep ERROR | wc -l

echo "=== Network Connections ==="
netstat -tlnp | grep 8000
→ Verify API listening on port 8000

echo "=== Process Resources ==="
ps aux | grep "[d]otnet.*Api" | head -1
→ Check CPU%, MEM%

echo "=== Disk I/O ==="
iostat -x 1 5 | tail -5
→ Check disk utilization
```

**Weekly health check:**

```bash
# SSH to server
ssh ubuntu@10.0.1.50

echo "=== Database Connectivity ==="
psql -h db-prod-1.internal -U bizfirst -d bizfirst -c "SELECT COUNT(*) FROM servers;"
→ Should return count, not error

echo "=== Cache Connectivity ==="
redis-cli -h cache-prod-1.internal ping
→ Should return PONG

echo "=== Queue Connectivity ==="
amqp-declare-queue -H queue-prod-1.internal -q test-conn 2>/dev/null && echo "OK" || echo "FAILED"

echo "=== Backup Verification ==="
ls -lh /data/backups/ | tail -5
→ Check recent backups exist

echo "=== Log Rotation ==="
sudo logrotate -f /etc/logrotate.d/bizfirst
ls -lh /var/log/bizfirst/ | head -10
→ Check log files rotated

echo "=== Security Updates ==="
sudo apt update
sudo apt list --upgradable
→ Check for security updates
```

## Step 5: Log Aggregation

**Query logs from ELK Stack:**

```bash
# Using Kibana
curl -X GET "localhost:9200/server-logs-*/_search?pretty" -H 'Content-Type: application/json' -d'{
  "query": {
    "bool": {
      "must": [
        { "term": { "hostname": "api-prod-2" } },
        { "match": { "log_level": "ERROR" } },
        { "range": { "@timestamp": { "gte": "now-1h" } } }
      ]
    }
  },
  "sort": [{ "@timestamp": { "order": "desc" } }],
  "size": 50
}'

# Or via Kibana UI:
1. Open Kibana dashboard
2. Go to Discover
3. Filter: hostname = "api-prod-2" AND log_level = "ERROR"
4. Time range: Last 24 hours
```

**Common log queries:**

```bash
# API response time distribution
curl -X GET "localhost:9200/server-logs-*/_search" -H 'Content-Type: application/json' -d'{
  "query": {
    "term": { "service": "bizfirst-api" }
  },
  "aggs": {
    "response_time_percentiles": {
      "percentiles": {
        "field": "response_time_ms",
        "percents": [50, 95, 99]
      }
    }
  }
}'

# Error rate by endpoint
curl -X GET "localhost:9200/server-logs-*/_search" -H 'Content-Type: application/json' -d'{
  "query": {
    "bool": {
      "must": [
        { "term": { "service": "bizfirst-api" } },
        { "range": { "status_code": { "gte": 400 } } }
      ]
    }
  },
  "aggs": {
    "errors_by_endpoint": {
      "terms": { "field": "endpoint", "size": 10 }
    }
  }
}'
```

## Step 6: Performance Trending

**Weekly performance report:**

```bash
#!/bin/bash

WEEK_START=$(date -d "7 days ago" +%Y-%m-%d)
WEEK_END=$(date +%Y-%m-%d)

echo "=== Weekly Performance Report: api-prod-2 ==="
echo "Period: $WEEK_START to $WEEK_END"
echo ""

# Average CPU usage
curl -s "http://prometheus:9090/api/v1/query_range?query=avg(rate(process_cpu_seconds_total{instance='10.0.1.50:9100'}[5m]))*100&start=${WEEK_START}T00:00:00Z&end=${WEEK_END}T00:00:00Z&step=1h" | \
  jq '.data.result[0].values | map(.[1] | tonumber) | add/length' | \
  xargs echo "Average CPU:"

# Peak memory usage
curl -s "http://prometheus:9090/api/v1/query_range?query=max(node_memory_MemTotal_bytes{instance='10.0.1.50:9100'}-node_memory_MemAvailable_bytes{instance='10.0.1.50:9100'})&start=${WEEK_START}T00:00:00Z&end=${WEEK_END}T00:00:00Z&step=1h" | \
  jq '.data.result[0].values | map(.[1] | tonumber) | max | . / 1073741824' | \
  xargs echo "Peak Memory (GB):"

# Total requests
curl -s "http://prometheus:9090/api/v1/query_range?query=increase(http_requests_total{instance='10.0.1.50:8000'}[7d])&start=${WEEK_START}T00:00:00Z&end=${WEEK_END}T23:59:59Z&step=1d" | \
  jq '.data.result[0].values | map(.[1] | tonumber) | add' | \
  xargs echo "Total Requests:"

# Average latency (p95)
curl -s "http://prometheus:9090/api/v1/query_range?query=avg(histogram_quantile(0.95,rate(http_request_duration_seconds_bucket{instance='10.0.1.50:8000'}[5m])))&start=${WEEK_START}T00:00:00Z&end=${WEEK_END}T00:00:00Z&step=1h" | \
  jq '.data.result[0].values | map(.[1] | tonumber) | add/length' | \
  xargs echo "Average P95 Latency (sec):"

# Error rate
curl -s "http://prometheus:9090/api/v1/query_range?query=sum(rate(http_requests_total{instance='10.0.1.50:8000',status=~'5..'}[5m]))/sum(rate(http_requests_total{instance='10.0.1.50:8000'}[5m]))&start=${WEEK_START}T00:00:00Z&end=${WEEK_END}T00:00:00Z&step=1h" | \
  jq '.data.result[0].values | map(.[1] | tonumber) | add/length * 100' | \
  xargs echo "Average Error Rate (%):"
```

## Step 7: Alert Response

**When CPU alert fires:**

```
Alert: HighCPUUsage > 80% for 5 minutes

Response steps:
1. SSH to server
   → Check running processes: ps aux | sort -k3 -r | head -10
   → Check what changed recently

2. Check application logs
   → journalctl -u bizfirst-api | grep WARN | tail -20
   → Look for resource leaks, infinite loops

3. Analyze query performance (if DB-bound)
   → Query the slow query log
   → Run EXPLAIN ANALYZE on slow queries

4. Increase resources (if needed)
   → Update instance type: POST /servers/{id}/update
   → This may require brief downtime

5. Or auto-scale (if load-based)
   → Verify auto-scaling policy enabled
   → Check new instances added

6. Document in incident ticket
   → Root cause
   → Resolution
   → Prevention
```

## Checklist

- [ ] Prometheus scrape jobs configured
- [ ] Metrics verified flowing
- [ ] Grafana dashboard created
- [ ] Alert rules configured
- [ ] Alert notifications working (test alert)
- [ ] Log aggregation configured
- [ ] Daily health check procedure documented
- [ ] Weekly deep-dive scheduled
- [ ] Performance baseline established
- [ ] Alert thresholds tuned (not too noisy)

**Monitoring cadence:**
- **Every 5 min:** Automated alerts (via Prometheus)
- **Daily:** Manual health check (script)
- **Weekly:** Deep-dive (database, cache, performance)
- **Monthly:** Trending analysis + capacity planning

## Next Steps
- [Troubleshoot Server](troubleshoot.md)
- [Knowledge: Infrastructure Architecture](../../Knowledge/Servers/02-infrastructure-architecture.md#monitoring-and-observability)
