# Configure Server

Step-by-step procedure for configuring a newly provisioned server.

## Prerequisites
- [ ] Server provisioned and running (see [Provision Server](provision-server.md))
- [ ] ServerID available (e.g., srvr-550e8400-e29b-41d4)
- [ ] Server healthy (GET /servers/{id}/health → status: Healthy)
- [ ] Network accessible (SSH/RDP from admin host)

## Step 1: Verify Server Accessibility

**Test SSH connectivity (Linux/Ubuntu):**

```bash
ssh -i admin-key.pem ubuntu@10.0.1.50

Expected output:
  Connected to api-prod-2
  ubuntu@api-prod-2:~$ whoami
  ubuntu
```

**Test RDP connectivity (Windows):**

```
RDP to 10.0.1.50
  Username: Administrator
  Password: (from temporary credentials)
  
Expected: Windows Server desktop
```

**If connectivity fails:**
- [ ] Check security group rules (SSH 22, RDP 3389 allowed from admin-ips)
- [ ] Verify subnet routing (public subnet has internet gateway)
- [ ] Check firewall on server OS

## Step 2: Configure OS Base System

**Login to server and run base setup:**

```bash
# Update OS
sudo apt update && sudo apt upgrade -y
sudo reboot

# After reboot, verify
ubuntu@api-prod-2:~$ uname -a
Linux api-prod-2 5.15.0-86-generic #96-Ubuntu SMP ...

# Set timezone
sudo timedatectl set-timezone UTC
sudo timedatectl status

# Enable essential services
sudo systemctl enable ssh
sudo systemctl start ssh

# Verify hostname
sudo hostnamectl set-hostname api-prod-2
sudo hostnamectl

# Configure DNS
sudo cat > /etc/resolv.conf <<EOF
nameserver 8.8.8.8
nameserver 8.8.4.4
EOF
```

## Step 3: Install Runtime Environments

**Install .NET Runtime 9.0:**

```bash
# Add Microsoft package repository
wget https://dot.net/v1/dotnet-install.sh
chmod +x dotnet-install.sh

# Install .NET 9.0
./dotnet-install.sh --channel 9.0 --runtime aspnetcore

# Verify installation
~/.dotnet/dotnet --version
→ 9.0.0

# Add to PATH
echo 'export PATH="$HOME/.dotnet:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

**Install Node.js 20 (if needed):**

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version
→ v20.11.0
```

**Install Docker (for container deployments):**

```bash
sudo apt-get install -y docker.io docker-compose
sudo usermod -aG docker ubuntu
sudo systemctl enable docker
sudo systemctl start docker

# Verify
docker --version
→ Docker version 24.0.7
```

## Step 4: Configure Security & Hardening

**Disable SSH password authentication (key-based only):**

```bash
sudo nano /etc/ssh/sshd_config

# Change/verify these lines:
PasswordAuthentication no
PermitRootLogin no
X11Forwarding no
AllowUsers ubuntu

# Restart SSH
sudo systemctl restart ssh
```

**Enable firewall (UFW on Ubuntu):**

```bash
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (from admin IPs only)
sudo ufw allow from 10.0.0.0/8 to any port 22

# Allow application ports
sudo ufw allow 8000:8999/tcp  # Application services
sudo ufw allow 443/tcp        # HTTPS
sudo ufw allow 80/tcp         # HTTP (if needed)

# Verify
sudo ufw status
→ Status: active
```

**Install fail2ban (prevent brute force):**

```bash
sudo apt-get install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Verify
sudo fail2ban-client status
```

**Enable audit logging:**

```bash
sudo apt-get install -y auditd
sudo systemctl enable auditd
sudo systemctl start auditd

# Log all sudo commands
echo '-w /etc/sudoers -p wa -k sudoers' | sudo tee -a /etc/audit/rules.d/audit.rules
sudo systemctl restart auditd
```

## Step 5: Install Monitoring & Observability

**Install Node Exporter (Prometheus metrics):**

```bash
wget https://github.com/prometheus/node_exporter/releases/download/v1.7.0/node_exporter-1.7.0.linux-amd64.tar.gz
tar xvfz node_exporter-1.7.0.linux-amd64.tar.gz

sudo mv node_exporter-1.7.0.linux-amd64/node_exporter /usr/local/bin/
sudo useradd --no-create-home --shell /bin/false node_exporter

# Create systemd service
sudo cat > /etc/systemd/system/node_exporter.service <<EOF
[Unit]
Description=Node Exporter
After=network.target

[Service]
User=node_exporter
Group=node_exporter
ExecStart=/usr/local/bin/node_exporter
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable node_exporter
sudo systemctl start node_exporter

# Verify on port 9100
curl http://localhost:9100/metrics | head -20
```

**Install log shipper (Filebeat for ELK):**

```bash
curl -L -O https://artifacts.elastic.co/downloads/beats/filebeat/filebeat-8.11.0-linux-x86_64.tar.gz
tar xzf filebeat-8.11.0-linux-x86_64.tar.gz

# Configure
sudo cat > filebeat.yml <<EOF
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/syslog
    - /var/log/auth.log

output.elasticsearch:
  hosts: ["logs.internal:9200"]
  index: "server-logs-%{+yyyy.MM.dd}"
EOF

sudo ./filebeat-8.11.0-linux-x86_64/filebeat -c filebeat.yml &
```

## Step 6: Configure Storage & Backups

**Mount additional data volume (if applicable):**

```bash
# List volumes
lsblk
→ sda (root, 100GB)
   sdb (data, 1TB - new volume)

# Format and mount
sudo mkfs.ext4 /dev/sdb
sudo mkdir -p /data
sudo mount /dev/sdb /data

# Persistent mount (fstab)
sudo echo '/dev/sdb /data ext4 defaults,nofail 0 2' >> /etc/fstab
sudo mount -a

# Verify
df -h | grep /data
→ /dev/sdb       1.0T   28K  1.0T   1% /data
```

**Configure backup schedule:**

```bash
# Create daily backup script
sudo cat > /usr/local/bin/backup.sh <<EOF
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar czf /data/backups/config_$DATE.tar.gz /etc/ /opt/bizfirst/
find /data/backups -mtime +30 -delete  # Keep 30 days
EOF

sudo chmod +x /usr/local/bin/backup.sh

# Schedule daily at 02:00 UTC
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/backup.sh
```

## Step 7: Configure Networking

**Set static hostname resolution:**

```bash
# Add internal DNS entries
sudo cat >> /etc/hosts <<EOF
10.0.2.10  db-prod-1.internal
10.0.2.20  cache-prod-1.internal
10.0.3.30  queue-prod-1.internal
EOF
```

**Configure NTP (time synchronization):**

```bash
sudo apt-get install -y ntp
sudo systemctl enable ntp
sudo systemctl start ntp

# Verify
ntpq -p
→ remote           refid      st t when poll reach   delay   offset  jitter
→ ntp.ubuntu.com  .POOL.      16 p    -   64    0    0.000    0.000   0.000
```

## Step 8: Test Connectivity to Services

**Test database connectivity (if applicable):**

```bash
sudo apt-get install -y postgresql-client-15
psql -h db-prod-1.internal -U bizfirst -d production -c "SELECT version();"

Expected:
  PostgreSQL 15.4 on x86_64-pc-linux-gnu
```

**Test cache connectivity (Redis):**

```bash
sudo apt-get install -y redis-tools
redis-cli -h cache-prod-1.internal ping
→ PONG
```

**Test queue connectivity:**

```bash
# Test RabbitMQ
sudo apt-get install -y amqp-tools
amqp-declare-queue -H queue-prod-1.internal -q test-queue
```

## Step 9: Verify Configuration

**Create configuration validation script:**

```bash
cat > /tmp/validate-config.sh <<'EOF'
#!/bin/bash

echo "=== OS Configuration ==="
echo "✓ Hostname: $(hostname)"
echo "✓ OS: $(lsb_release -ds)"
echo "✓ Timezone: $(timedatectl | grep 'Time zone')"
echo "✓ NTP: $(systemctl is-active ntp)"

echo ""
echo "=== Runtime Environments ==="
echo "✓ .NET: $($HOME/.dotnet/dotnet --version)"
echo "✓ Node.js: $(node --version)"
echo "✓ Docker: $(docker --version)"

echo ""
echo "=== Security ==="
echo "✓ SSH key-based auth enabled"
echo "✓ Firewall: $(sudo ufw status | head -1)"
echo "✓ Fail2ban: $(sudo systemctl is-active fail2ban)"

echo ""
echo "=== Monitoring ==="
echo "✓ Node Exporter: $(curl -s http://localhost:9100/metrics | wc -l) metrics"
echo "✓ Filebeat: $(pgrep -l filebeat | wc -l) processes"

echo ""
echo "=== Storage ==="
df -h | grep -E '^(Filesystem|/dev)'

echo ""
echo "=== Connectivity ==="
ping -c 1 db-prod-1.internal && echo "✓ Database reachable" || echo "✗ Database unreachable"
redis-cli -h cache-prod-1.internal ping && echo "✓ Cache reachable" || echo "✗ Cache unreachable"

echo ""
echo "Configuration validation complete!"
EOF

chmod +x /tmp/validate-config.sh
/tmp/validate-config.sh
```

## Step 10: Record Configuration

**Document server configuration:**

```yaml
ServerID: srvr-550e8400-e29b-41d4
Name: api-prod-2
HostName: api-prod-2

OS Configuration:
  Type: Ubuntu 22.04 LTS
  Kernel: 5.15.0-86-generic
  Timezone: UTC
  NTP: Enabled (ntp)
  Hostname: api-prod-2

Runtimes Installed:
  - .NET 9.0.0 at /home/ubuntu/.dotnet
  - Node.js 20.11.0
  - Docker 24.0.7

Security:
  - SSH: Key-based auth enabled, password disabled
  - Firewall: UFW enabled
    - SSH from 10.0.0.0/8
    - HTTP/HTTPS from any
    - App ports 8000-8999 open
  - Audit: auditd enabled
  - Fail2ban: Enabled for SSH

Monitoring:
  - Node Exporter: Running on port 9100
  - Filebeat: Configured for logs
  - Health checks: Ready

Storage:
  - Root: /dev/sda (100GB)
  - Data: /dev/sdb (1TB) mounted at /data
  - Backups: Daily at 02:00 UTC

Connectivity:
  - Database: ✓
  - Cache: ✓
  - Queue: ✓

Configuration Date: 2026-09-29
Configured By: ServerDeveloper Agent
Status: Ready for deployment
```

## Checklist

- [ ] SSH/RDP connectivity verified
- [ ] OS updated and hardened
- [ ] .NET 9.0 installed and verified
- [ ] SSH key-based auth enabled
- [ ] Firewall configured (UFW)
- [ ] fail2ban installed
- [ ] Audit logging enabled
- [ ] Node Exporter installed and running
- [ ] Log shipper (Filebeat) configured
- [ ] Data volumes formatted and mounted
- [ ] Backup schedule configured
- [ ] Static hostname resolution added
- [ ] NTP synchronized
- [ ] Database connectivity verified
- [ ] Cache connectivity verified
- [ ] Configuration validation passed
- [ ] Server configuration documented
- [ ] Ready for deployment

**Total time:** ~30-45 minutes

## Next Step

Server is now configured and ready for deployment.

See: [Deploy Application](deploy-application.md)
