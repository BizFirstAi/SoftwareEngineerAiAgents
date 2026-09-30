# Configuration Schema

Server configuration properties and runtime environment setup.

## Server Entity

```csharp
class Server : BaseEntity
{
    // Identity
    string ServerID { get; set; }           // PK
    string Name { get; set; }              // Display name
    string HostName { get; set; }          // DNS hostname
    string[] IPAddresses { get; set; }     // Primary, secondary IPs

    // Classification
    ServerType Type { get; set; }          // Physical, VM, Container, Cloud, Edge
    string CloudProvider { get; set; }     // AWS, Azure, GCP (if Cloud)
    string Region { get; set; }            // us-east-1, eastus, etc.

    // Compute Resources
    int CPUCores { get; set; }
    int MemoryGB { get; set; }
    int StorageGB { get; set; }
    string StorageType { get; set; }       // SSD, HDD, NVMe
    int? GPUs { get; set; }                // GPU count (optional)
    string? GPUType { get; set; }          // A100, V100, RTX4090

    // Runtime
    string OSType { get; set; }            // Windows, Linux, macOS
    string OSVersion { get; set; }         // Windows Server 2022, Ubuntu 22.04
    string[] Runtimes { get; set; }        // ".NET 9.0", "Node.js 20", "Python 3.11"
    string ContainerRuntime { get; set; }  // docker, containerd (if applicable)

    // Network
    string VPCID { get; set; }
    string SubnetID { get; set; }
    string[] SecurityGroupIDs { get; set; }
    string[] DNSServers { get; set; }      // Default: 8.8.8.8, 8.8.4.4
    int? BandwidthMbps { get; set; }       // Network capacity

    // Status & Lifecycle
    ServerStatus Status { get; set; }      // Provisioning, Running, Maintenance, Stopped, Decommissioned
    DateTime CreatedOn { get; set; }
    DateTime? DecommissionedOn { get; set; }
    int UptimeSeconds { get; set; }

    // Multi-tenancy
    Guid TenantID { get; set; }
    // ... standard audit fields (Deleted, Archived, CreatedBy, etc.)
}

enum ServerType { Physical, VirtualMachine, ContainerHost, CloudInstance, EdgeNode }
enum ServerStatus { Provisioning, Running, Maintenance, Stopped, Decommissioned }
```

## Configuration Properties

### Compute Configuration
```yaml
Compute:
  CPUAllocation:
    Min: 1 core
    Max: 256 cores
    DefaultRequest: Varies by workload type
  Memory:
    Min: 512MB
    Max: 3.75TB
    Overcommit: 1.5x (VM only)
  Storage:
    RootVolume: 50GB-500GB
    DataVolume: 100GB-100TB
    Type: SSD | HDD | NVMe
    IOPS: 1000-100000
```

### Network Configuration
```yaml
Network:
  VPC:
    CIDR: 10.0.0.0/16 (typical)
    TenantIsolation: Strict
  Subnets:
    Public: For load balancers, gateways
    Private: For applications, databases
  SecurityGroups:
    Inbound:
      - SSH (22): Admin only
      - HTTP (80): Public
      - HTTPS (443): Public
      - Custom: Application-specific
    Outbound:
      - HTTPS (443): All
      - DNS (53): All
  LoadBalancing:
    Algorithm: RoundRobin | LeastConnections | IPHash
    HealthCheckInterval: 10s
    HealthCheckTimeout: 5s
    UnhealthyThreshold: 3
```

### Storage Configuration
```yaml
Storage:
  RootFS:
    Size: 50-500GB
    Type: SSD
  DataVolumes:
    - Mount: /data
      Size: 1-100TB
      Type: SSD | HDD
      Backup: Daily | Weekly
      Retention: 30 days
  Snapshots:
    Frequency: Daily
    Retention: 7 days
    Replication: Local | Cross-region
```

### Runtime Environment
```yaml
Runtime:
  OS:
    Type: Windows Server 2022 | Ubuntu 22.04 | CentOS 9
    Kernel: Latest LTS
    Timezone: UTC | Regional
  Runtimes:
    - .NET: 9.0
    - Node.js: 20 LTS
    - Python: 3.11
    - Java: 21
  Services:
    - SSH: Enabled
    - Docker: v24.0 (if container host)
    - Kubernetes: v1.28 (if orchestrated)
  Packages:
    - System: curl, wget, jq, htop
    - Security: fail2ban, auditd
    - Monitoring: Node Exporter, Telegraf
```

### Performance Tuning
```yaml
Performance:
  CPUScaling:
    Governor: powersave | performance | ondemand
    MaxFrequency: 3.8 GHz
  NetworkOptimization:
    MTU: 9000 (jumbo frames)
    TCPBuffers: auto | custom
  Disk:
    IOScheduler: noop | deadline
    ReadAhead: 256KB
  Memory:
    Swappiness: 10 (prefer RAM)
    VirtualMemory: 2x physical RAM
```

### Monitoring Configuration
```yaml
Monitoring:
  Metrics:
    Interval: 60s
    Retention: 30 days
    Destinations:
      - Prometheus
      - CloudWatch
      - Datadog
  Logs:
    Level: INFO | DEBUG
    Retention: 7 days
    Destinations:
      - ELK Stack
      - CloudWatch Logs
      - Splunk
  Alerts:
    - CPUUsage > 80%
    - MemoryUsage > 85%
    - DiskUsage > 90%
    - ServiceDown: page oncall
```

## Configuration Templates

### Web Server (Standard)
```yaml
Name: web-prod-1
Type: CloudInstance
Provider: AWS
Instance: c7i.2xlarge (8vCPU, 16GB RAM)
Storage: 100GB SSD
OS: Ubuntu 22.04 LTS
Runtimes: [".NET 9.0"]
Network:
  VPC: prod-vpc
  Subnet: public-1
  SecurityGroups: [web, http, https]
```

### Database Server (High Performance)
```yaml
Name: db-prod-1
Type: CloudInstance
Provider: AWS
Instance: r7g.4xlarge (16vCPU, 128GB RAM)
Storage: 1TB NVMe SSD
OS: Ubuntu 22.04 LTS
Runtimes: ["PostgreSQL 15", "Redis 7"]
Network:
  VPC: prod-vpc
  Subnet: private-1
  SecurityGroups: [database, internal-only]
```

### Edge Node (IoT)
```yaml
Name: edge-warehouse-5
Type: EdgeNode
CPU: 4 cores
Memory: 8GB
Storage: 256GB SSD
OS: Ubuntu Core 22
Runtime: [".NET Runtime 9.0"]
Network:
  Connectivity: WiFi + Cellular (4G/5G)
  SyncPolicy: Event-driven (file changes, time-based)
```

## Next Steps
- [Deployment Model](04-deployment-model.md)
- [API Reference](05-api-reference.md)
