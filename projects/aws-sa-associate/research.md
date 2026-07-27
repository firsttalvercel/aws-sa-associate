# SAA-C03 Deep Research — Verified Findings

*92 agents, 622 tool uses, 10 sources fetched, 25 claims verified, 18 confirmed, 7 refuted*
*Sources: AWS official exam guide (primary), AWS certification page (primary), AWS docs (primary), Whizlabs, DigitalCloud, Jayendra Patil, ExamTopics*

---

## Exam Logistics (all 3-0 verified)

| Field | Detail |
|-------|--------|
| Exam code | SAA-C03 |
| Questions | 65 total (50 scored + 15 unscored) |
| Duration | 130 minutes |
| Passing score | 720 / 1,000 |
| Cost | $150 USD |
| Format | Pearson VUE (in-person or online proctored) |
| Question types | Multiple choice (1 correct of 4) and Multiple response (2+ correct of 5+) |
| Unscored items | 15 questions embedded invisibly — used for future question evaluation, no score impact |
| ESL accommodation | Non-native English speakers may request +30 minutes |
| Recommended experience | 1 year hands-on designing cloud solutions on AWS |

---

## Domain Weights (all 3-0 verified)

| # | Domain | Weight |
|---|--------|--------|
| 1 | Design Secure Architectures | 30% |
| 2 | Design Resilient Architectures | 26% |
| 3 | Design High-Performing Architectures | 24% |
| 4 | Design Cost-Optimized Architectures | 20% |

> Note: The SAA-C02 domain was named "Design Secure *Applications and* Architectures" — SAA-C03 shortened it. Several prep resources still use the old name; it's wrong.

---

## Top Exam Traps (all 3-0 verified)

### 1. VPN vs. Direct Connect
| Service | Key Distinction |
|---------|----------------|
| AWS VPN | Routes over the public internet — variable throughput, no SLA |
| Direct Connect | Dedicated private circuit — consistent throughput, bypasses internet |

**When to pick Direct Connect:** Consistent throughput required, sensitive data, low-latency hybrid connectivity.

---

### 2. S3 Static Website vs. CloudFront
- S3 website endpoints **do not support HTTPS** — confirmed by AWS docs verbatim
- To serve an S3 static site over HTTPS → use **CloudFront** in front of the S3 bucket
- Exam question pattern: "HTTPS required for static website" → answer is always CloudFront

---

### 3. RDS Read Replicas vs. Multi-AZ
| Feature | Read Replicas | Multi-AZ |
|---------|--------------|----------|
| Replication | Asynchronous | Synchronous |
| Purpose | **Read scalability** | **High availability / failover** |
| Readable? | Yes | No (standby is passive) |
| Failover | Manual promotion | Automatic |

**Keyword signal:** "scale read-heavy workload" → Read Replicas. "automatic failover / HA" → Multi-AZ.

---

### 4. Security Groups vs. NACLs
| Feature | Security Groups | NACLs |
|---------|----------------|-------|
| Statefulness | **Stateful** (return traffic auto-allowed) | **Stateless** (must explicitly allow return traffic) |
| Scope | Instance level | Subnet level |
| Default | Deny all inbound | Allow all (default NACL) |
| Rules | Allow only | Allow and Deny |

---

### 5. CloudWatch — Missing Metrics Trap
CloudWatch **cannot natively capture** from EC2:
- Memory utilization
- Disk space utilization
- Swap utilization

These require the **CloudWatch agent** installed on the instance → pushed as **custom metrics** (billed separately).

Native EC2 metrics: CPU utilization, disk I/O ops/bytes, network in/out, status checks.

---

## Refuted Claims (do not use these in study)

| Claim | Why Refuted |
|-------|-------------|
| "Exam focused on cost and performance" | Misleading marketing phrase — security is the #1 domain at 30% |
| "SAA-C03 domains include Design Secure Applications and Architectures" | That's the SAA-C02 name — outdated |
| "90% of questions are scenario-based" | Unverified estimate, refuted 3-0 |
| "Savings Plans now preferred over Reserved Instances" | Not confirmed by AWS documentation |
| "Aurora stores 6 copies across AZs" | Refuted — nuance around Aurora storage architecture not confirmed |
| "WAF and Shield are complementary, not interchangeable" | True technically, but the framing as an exam trap was refuted |

---

## Strategy Notes (medium confidence)

- Simple/fundamental questions are high-value — candidates lose them under time pressure by overthinking
- Read scenario stems carefully for signal words:
  - "fault-tolerant / always available" → resilience pattern (Multi-AZ, decoupling)
  - "lowest latency / scale automatically" → performance pattern (Auto Scaling, CloudFront)
  - "company manages keys" → SSE-KMS with CMK
  - "consistent throughput" → Direct Connect over VPN
  - "decouple / async" → SQS; "fan-out / push" → SNS; "real-time streaming / ordered" → Kinesis

---

## Open Questions (not yet verified — need domain deep-dives)

1. Aurora, DynamoDB, Lambda, and Kinesis configuration details most tested in SAA-C03
2. Has SAA-C03 increased emphasis on serverless (Lambda, Step Functions, EventBridge) vs SAA-C02?
3. Exact proportion of scenario-based vs. knowledge questions (90% figure was refuted — no verified estimate)
4. Are Transit Gateway, PrivateLink, and VPC peering now heavily tested alongside Direct Connect/VPN?

---

## Key Services to Master (from exam guide + research)

| Category | Services |
|----------|---------|
| Compute | EC2, Lambda, ECS, EKS, Elastic Beanstalk, Auto Scaling |
| Storage | S3, EBS, EFS, Glacier/S3 Glacier, Storage Gateway |
| Database | RDS, Aurora, DynamoDB, ElastiCache (Redis vs Memcached), Redshift |
| Networking | VPC, Route 53, CloudFront, API Gateway, Direct Connect, VPN, Transit Gateway |
| Security | IAM, KMS, Secrets Manager, WAF, Shield, Cognito |
| Integration | SQS, SNS, EventBridge, Step Functions, Kinesis |
| Monitoring | CloudWatch, CloudTrail, Config, Trusted Advisor |
| Migration | DMS, SMS, Snowball, DataSync |

---

## Common Service Confusions to Practice

| Pair | Key Distinction |
|------|----------------|
| SQS vs SNS vs Kinesis | SQS=async decouple, SNS=fan-out push, Kinesis=ordered streaming/replay |
| EBS vs EFS | EBS=single AZ block storage (one instance), EFS=multi-AZ NFS (many instances) |
| RDS vs Aurora | Aurora=MySQL/PG compatible, higher performance, auto-scaling storage |
| Redis vs Memcached (ElastiCache) | Redis=persistence/replication/sorted sets, Memcached=simple multi-thread cache |
| ALB vs NLB | ALB=HTTP/HTTPS Layer 7, NLB=TCP/UDP Layer 4 ultra-low latency |
| WAF vs Shield | WAF=web exploit rules (SQL injection, XSS), Shield=DDoS protection |
| IAM Role vs User | Role=temporary credentials for services/cross-account, User=long-term human/app credentials |
| S3 Standard vs Glacier | Standard=frequent access, Glacier=archival (retrieval minutes to hours) |
