# Server Types

Detailed taxonomy of server types supported by BizFirst infrastructure.

## Physical Servers

**Definition:** Dedicated hardware on customer premises or in managed data center.

**Characteristics:**
- High performance, predictable latency
- Capital intensive (CapEx)
- Manual scaling (replace hardware)
- Physical security required
- Permanent installation

**Configuration:**
```
ServerType: "Physical"
Specs:
  CPU: 16-64 cores
  Memory: 64GB-512GB
  Storage: 2TB-100TB
  Network: Dedicated NIC, bonded ports
Runtime: Windows Server / Linux (RHEL, Ubuntu)
```

**Use Cases:**
- High-transaction workloads (payments, transactions)
- Data-sensitive operations (on-prem compliance)
- Long-term stable workloads

## Virtual Machines (VMs)

**Definition:** Virtualized compute instance on hypervisor (ESXi, Hyper-V, KVM).

**Characteristics:**
- Flexible resource allocation (CPU/memory hot-add)
- Snapshots, cloning, migration
- Lower cost than physical
- Shared physical infrastructure
- Rapid provisioning

**Configuration:**
```
ServerType: "VirtualMachine"
Hypervisor: "ESXi" | "HyperV" | "KVM"
Specs:
  vCPU: 2-32
  Memory: 4GB-256GB
  Storage: 100GB-10TB
  IOPS: 1000-10000
Runtime: Windows Server / Linux
```

**Use Cases:**
- Development/test environments
- Mixed workloads requiring flexibility
- Cost optimization via consolidation

## Containers (Docker)

**Definition:** Lightweight process isolation running on container host.

**Characteristics:**
- Minimal overhead vs VMs
- Portable across infrastructure
- Orchestrated (Kubernetes, Docker Swarm)
- Ephemeral (stateless preferred)
- Fast startup (milliseconds)

**Configuration:**
```
ServerType: "ContainerHost"
ContainerRuntime: "Docker" | "ContainerD"
Orchestration: "Kubernetes" | "DockerSwarm" | "None"
Specs:
  CPURequest: 500m-8000m
  MemoryRequest: 256MB-32GB
  Storage: Ephemeral or PersistentVolume
  Replicas: 1-N
Runtime: Linux, .NET Runtime
```

**Use Cases:**
- Microservices (API, workers)
- Auto-scaling workloads
- CI/CD pipelines
- DevOps environments

## Cloud Instances

**Definition:** Managed virtual instance in public cloud (AWS, Azure, GCP).

**Characteristics:**
- Pay-as-you-go (OpEx)
- Auto-scaling, managed services
- Global region availability
- Shared responsibility model
- Abstracted infrastructure

**Configuration:**
```
ServerType: "CloudInstance"
Provider: "AWS" | "Azure" | "GCP"
Instance: "t3.xlarge" | "Standard_D4s_v3" | "e2-standard-4"
Specs:
  vCPU: 1-96
  Memory: 512MB-3.75TB
  Storage: 20GB-40TB (EBS/Disk)
  Network: Managed VPC/VNet
Runtime: Windows / Linux (AMI/Image)
AutoScaling: Min/Max replicas, scaling policy
```

**Use Cases:**
- Global deployments
- Burst traffic handling
- Multi-region redundancy
- SaaS deployments

## Edge Nodes

**Definition:** Lightweight compute at network edge (IoT gateways, branch offices, field locations).

**Characteristics:**
- Limited resources (1-4 cores, 2-8GB RAM)
- Decentralized processing
- Low-latency local operations
- Intermittent connectivity tolerance
- Long-range deployment

**Configuration:**
```
ServerType: "EdgeNode"
Form: "Appliance" | "Embedded" | "MobileGateway"
Specs:
  CPU: 1-4 cores
  Memory: 2GB-8GB
  Storage: 32GB-256GB (SSD)
  Network: Cellular, WiFi, Satellite
Runtime: Linux (lightweight distro), .NET Runtime
SyncPolicy: "OnDemand" | "Scheduled" | "Event-driven"
```

**Use Cases:**
- Field data collection
- Local caching/relay
- Offline-first mobile workers
- IoT data aggregation

## Comparison Matrix

| Aspect | Physical | VM | Container | Cloud | Edge |
|--------|----------|----|-----------| ------|------|
| **Cost** | High (CapEx) | Medium | Low | Medium (OpEx) | Low |
| **Setup Time** | Weeks | Hours | Minutes | Minutes | Hours |
| **Scaling** | Manual | Manual | Automatic | Automatic | Manual |
| **Resource Overhead** | ~2% | ~10-15% | ~2-5% | Managed | Minimal |
| **Multi-tenancy** | Low | High | Very High | Very High | Low |
| **Compliance** | Full control | Good | Good | Shared | Full control |

## Next Steps
- [Infrastructure Architecture](02-infrastructure-architecture.md)
- [Configuration Schema](03-configuration-schema.md)
- [Deployment Model](04-deployment-model.md)
