# Deploy Application

Step-by-step procedure for deploying BizFirst components to a configured server.

## Prerequisites
- [ ] Server provisioned and running (see [Provision Server](provision-server.md))
- [ ] Server configured (see [Configure Server](configure-server.md))
- [ ] Database migrated (if needed)
- [ ] Application package ready (bizfirst-services-v9.0.1.tar.gz)
- [ ] Configuration files prepared (appsettings.json)
- [ ] Credentials loaded (API keys, connection strings)

## Step 1: Prepare Deployment Package

**Package structure:**

```
bizfirst-services-v9.0.1.tar.gz
├─ services/
│  ├─ Api/
│  │  └─ BizFirst.Ai.Api.dll (compiled application)
│  ├─ Worker/
│  │  └─ BizFirst.Ai.Worker.dll
│  └─ Scheduler/
│     └─ BizFirst.Ai.Scheduler.dll
├─ dependencies/
│  ├─ .NET Runtime 9.0 libraries
│  ├─ NuGet packages (if self-contained)
│  └─ System libraries
├─ config/
│  ├─ appsettings.json (template)
│  ├─ appsettings.Production.json
│  ├─ systemd/*.service files
│  └─ nginx/*.conf (if reverse proxy)
└─ scripts/
   ├─ install.sh
   ├─ migrate-database.sh
   └─ health-check.sh
```

**Verify package integrity:**

```bash
# Download package
wget https://artifacts.bizfirst.com/packages/bizfirst-services-v9.0.1.tar.gz
wget https://artifacts.bizfirst.com/packages/bizfirst-services-v9.0.1.tar.gz.sha256

# Verify checksum
sha256sum -c bizfirst-services-v9.0.1.tar.gz.sha256
→ bizfirst-services-v9.0.1.tar.gz: OK

# Extract
tar xzf bizfirst-services-v9.0.1.tar.gz
ls -la
→ drwxr-xr-x  services/
  drwxr-xr-x  dependencies/
  drwxr-xr-x  config/
  drwxr-xr-x  scripts/
```

## Step 2: Upload Package to Server

**Copy package to server:**

```bash
# From deployment machine
scp -i admin-key.pem -r bizfirst-services-v9.0.1 ubuntu@10.0.1.50:/tmp/

# Verify on server
ssh ubuntu@10.0.1.50
ubuntu@api-prod-2:~$ ls -la /tmp/bizfirst-services-v9.0.1/
→ config/
  dependencies/
  scripts/
  services/
```

**Or using NodeHost API:**

```
POST /servers/{serverID}/upload-package

Request:
{
  "packageID": "bizfirst-services-9.0.1",
  "packageURL": "https://artifacts.bizfirst.com/packages/bizfirst-services-v9.0.1.tar.gz",
  "checksum": "sha256:abc123...",
  "services": ["Api", "Worker", "Scheduler"]
}

Response (202 Accepted):
{
  "uploadID": "upload-uuid",
  "status": "InProgress",
  "progress": 0,
  "estimatedTime": 120
}

Poll status:
GET /servers/{serverID}/upload/{uploadID}
→ { "status": "Completed", "progress": 100 }
```

## Step 3: Prepare Configuration

**Create appsettings.Production.json:**

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft": "Warning",
      "BizFirst": "Information"
    }
  },
  "ConnectionStrings": {
    "DefaultConnection": "Server=db-prod-1.internal;Database=bizfirst;User Id=bizfirst;Password=$SECRET_DB_PASSWORD;"
  },
  "AppSettings": {
    "Environment": "Production",
    "TenantID": "550e8400-e29b-41d4-a716-446655440000",
    "ApiBaseUrl": "https://api.bizfirst.com",
    "MaxConnections": 100,
    "RequestTimeout": 30000
  },
  "Services": {
    "Cache": {
      "Enabled": true,
      "Provider": "Redis",
      "ConnectionString": "cache-prod-1.internal:6379"
    },
    "Queue": {
      "Enabled": true,
      "Provider": "RabbitMQ",
      "ConnectionString": "amqp://queue-prod-1.internal:5672"
    }
  }
}
```

**Load secrets from credential store:**

```bash
# SSH to server
ssh ubuntu@10.0.1.50

# Load secrets (using Credentials MCP)
curl -H "Authorization: Bearer $JWT_TOKEN" \
  https://api.bizfirst.com/credentials/v1/secrets/bizfirst-prod-api \
  > /tmp/secrets.json

# Parse and set environment variables
export DB_PASSWORD=$(jq -r '.database_password' /tmp/secrets.json)
export API_KEY=$(jq -r '.api_key' /tmp/secrets.json)

# Substitute in config
sed -i "s|\$SECRET_DB_PASSWORD|$DB_PASSWORD|g" appsettings.Production.json
```

## Step 4: Install Services

**Run installation script:**

```bash
cd /tmp/bizfirst-services-v9.0.1

# Make script executable
chmod +x scripts/install.sh

# Run installation
sudo ./scripts/install.sh \
  --install-path /opt/bizfirst \
  --config-path /etc/bizfirst \
  --log-path /var/log/bizfirst \
  --services "Api,Worker,Scheduler"

Output:
  ✓ Creating installation directories
  ✓ Installing service binaries
  ✓ Setting up systemd services
  ✓ Creating log directories
  ✓ Setting permissions
  ✓ Installation complete
```

**Verify installation:**

```bash
ls -la /opt/bizfirst/
→ drwxr-xr-x  9.0.1/
  lrwxrwxrwx  current -> 9.0.1

/opt/bizfirst/current/
→ drwxr-xr-x  Api/
  drwxr-xr-x  Worker/
  drwxr-xr-x  Scheduler/

# Check systemd services
sudo systemctl list-unit-files | grep bizfirst
→ bizfirst-api.service
  bizfirst-worker.service
  bizfirst-scheduler.service
```

## Step 5: Configure Services

**Copy config files:**

```bash
cp /tmp/bizfirst-services-v9.0.1/config/appsettings.json /etc/bizfirst/
cp /tmp/bizfirst-services-v9.0.1/config/appsettings.Production.json /etc/bizfirst/

# Set permissions
sudo chown -R bizfirst:bizfirst /etc/bizfirst
sudo chmod 600 /etc/bizfirst/appsettings*.json
```

**Configure systemd services:**

```bash
# Create/update service files
sudo cat > /etc/systemd/system/bizfirst-api.service <<'EOF'
[Unit]
Description=BizFirst API Service
After=network.target

[Service]
Type=simple
User=bizfirst
WorkingDirectory=/opt/bizfirst/current
ExecStart=/home/ubuntu/.dotnet/dotnet Api/BizFirst.Ai.Api.dll
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
Environment="ASPNETCORE_ENVIRONMENT=Production"
Environment="ASPNETCORE_URLS=http://0.0.0.0:8000"

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
```

**Configure environment variables:**

```bash
# Create .env file
sudo cat > /etc/bizfirst/bizfirst-env <<EOF
# Database
DB_HOST=db-prod-1.internal
DB_NAME=bizfirst
DB_USER=bizfirst
DB_PASSWORD=$(jq -r '.database_password' /tmp/secrets.json)

# Cache
REDIS_HOST=cache-prod-1.internal
REDIS_PORT=6379

# Queue
RABBITMQ_HOST=queue-prod-1.internal
RABBITMQ_PORT=5672

# Application
ASPNETCORE_ENVIRONMENT=Production
LOG_LEVEL=Information
EOF

sudo chown bizfirst:bizfirst /etc/bizfirst/bizfirst-env
sudo chmod 600 /etc/bizfirst/bizfirst-env
```

## Step 6: Database Migration

**Apply database schema changes:**

```bash
cd /tmp/bizfirst-services-v9.0.1

# Run migrations
chmod +x scripts/migrate-database.sh
sudo ./scripts/migrate-database.sh \
  --connection-string "Server=db-prod-1.internal;Database=bizfirst;User Id=bizfirst;Password=$DB_PASSWORD;" \
  --version 9.0.1

Output:
  Connecting to database...
  ✓ Connected
  ✓ Applying migration: 001_initial_schema.sql
  ✓ Applying migration: 002_add_audit_fields.sql
  ✓ Applying migration: 003_add_indexes.sql
  ✓ Migrations applied successfully
```

**Verify schema:**

```bash
psql -h db-prod-1.internal -U bizfirst -d bizfirst -c \
  "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"

→ Should show tables like:
  - users
  - servers
  - deployments
  - audit_logs
  - etc.
```

## Step 7: Start Services

**Enable and start services:**

```bash
# Enable on boot
sudo systemctl enable bizfirst-api
sudo systemctl enable bizfirst-worker
sudo systemctl enable bizfirst-scheduler

# Start services
sudo systemctl start bizfirst-api
sudo systemctl start bizfirst-worker
sudo systemctl start bizfirst-scheduler

# Check status
sudo systemctl status bizfirst-api
→ ● bizfirst-api.service - BizFirst API Service
    Loaded: loaded (/etc/systemd/system/bizfirst-api.service; enabled; ...)
    Active: active (running) since 2026-09-29 15:45:30 UTC; 2s ago
    Main PID: 12345 (dotnet)
```

**Verify services are running:**

```bash
# Check processes
ps aux | grep bizfirst
→ ubuntu    12345  0.0  5.2 1234567 123456 ?  Ssl 15:45   0:02 /home/ubuntu/.dotnet/dotnet Api/BizFirst.Ai.Api.dll
  ubuntu    12346  0.0  4.8 1234567 112345 ?  Ssl 15:45   0:01 /home/ubuntu/.dotnet/dotnet Worker/BizFirst.Ai.Worker.dll
  ubuntu    12347  0.0  3.2 1234567 89012  ?  Ssl 15:45   0:01 /home/ubuntu/.dotnet/dotnet Scheduler/BizFirst.Ai.Scheduler.dll

# Check port listening
sudo ss -tlnp | grep dotnet
→ LISTEN 0.0.0.0:8000  (API)
  LISTEN 0.0.0.0:8001  (Worker)
  LISTEN 0.0.0.0:8002  (Scheduler)
```

## Step 8: Health Checks

**Run health checks:**

```bash
# Application health endpoint
curl http://localhost:8000/health
→ {
    "status": "Healthy",
    "timestamp": "2026-09-29T15:45:45Z",
    "version": "9.0.1"
  }

# Database connectivity
curl http://localhost:8000/health/database
→ {
    "database": "Healthy",
    "connection": "db-prod-1.internal",
    "responseTime": "12ms"
  }

# Cache connectivity
curl http://localhost:8000/health/cache
→ {
    "cache": "Healthy",
    "connection": "cache-prod-1.internal",
    "responseTime": "2ms"
  }

# Run custom health script
chmod +x scripts/health-check.sh
./scripts/health-check.sh

Output:
  ✓ API service running
  ✓ Database connectivity OK
  ✓ Cache connectivity OK
  ✓ Queue connectivity OK
  ✓ All health checks passed
```

## Step 9: Register with Load Balancer

**Add server to load balancer pool:**

```
POST /load-balancer/pools/api-pool/targets

Request:
{
  "targetID": "srvr-550e8400-e29b-41d4",
  "address": "10.0.1.50",
  "port": 8000,
  "healthCheckPath": "/health",
  "healthCheckInterval": 10,
  "weight": 1
}

Response (201):
{
  "targetID": "target-uuid",
  "status": "HealthChecking",
  "healthStatus": "Unknown"
}

Poll until healthy:
GET /load-balancer/pools/api-pool/targets/target-uuid
→ { "healthStatus": "Healthy" }
```

## Step 10: Monitor Deployment

**Check logs for errors:**

```bash
# View recent logs
sudo journalctl -u bizfirst-api -n 50

# Follow logs in real-time
sudo journalctl -u bizfirst-api -f

# Check for errors
sudo journalctl -u bizfirst-api | grep ERROR

# Check application logs
tail -f /var/log/bizfirst/api.log
```

**Monitor metrics:**

```bash
# CPU and memory usage
ps aux | grep bizfirst | head -5
→ Check CPU% and MEM%

# Check Node Exporter metrics
curl http://localhost:9100/metrics | grep process_

# Check custom application metrics
curl http://localhost:8000/metrics
```

## Checklist

- [ ] Package downloaded and verified
- [ ] Configuration files prepared
- [ ] Secrets loaded from credential store
- [ ] Services installed
- [ ] Configuration files copied
- [ ] Systemd services configured
- [ ] Database migrations applied
- [ ] Services started successfully
- [ ] All services running (ps aux)
- [ ] Ports listening (ss -tlnp)
- [ ] Health checks passing
- [ ] Logs clean (no errors)
- [ ] Registered with load balancer
- [ ] Load balancer health check passing
- [ ] Monitoring metrics flowing
- [ ] Ready for traffic

**Total time:** ~20-30 minutes

## Next Steps
- [Monitor Server](monitor-server.md)
- [Troubleshoot Server](troubleshoot.md)
