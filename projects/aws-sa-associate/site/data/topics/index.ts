import type { TopicContent } from '../../lib/types'

export const TOPICS: TopicContent[] = [
  {
    slug: 'iam',
    title: 'IAM',
    category: 'Security',
    keyFacts: [
      'IAM users have long-term credentials; roles use temporary credentials via STS',
      'IAM roles are preferred over users for applications running on AWS services (EC2, Lambda, ECS)',
      'Permission boundaries set the maximum permissions an identity can have — they do not grant permissions themselves',
      'SCPs in AWS Organizations restrict what member accounts can do — they do not grant permissions',
      'IAM Identity Center (SSO) is the recommended way to federate corporate identities into AWS',
      'Cross-account access uses role assumption with trust policies',
      'Inline policies are embedded in a single identity; managed policies can be attached to many',
      'The root user should not be used for daily tasks — enable MFA and lock it away',
    ],
    examTraps: [
      { trap: '"Allow users to manage their own credentials" → use IAM user self-service policies, not admin access', correct: 'Attach a managed policy that allows users to manage only their own credentials' },
      { trap: 'SCP alone can grant access to a restricted service', correct: 'SCPs only restrict — they never grant. Permissions must still exist in IAM policies' },
      { trap: 'Using IAM users for EC2 instances to call AWS APIs', correct: 'Always use IAM roles attached to EC2 — never hardcode or store credentials on instances' },
    ],
    comparisons: [
      {
        title: 'IAM Role vs IAM User',
        headers: ['Feature', 'IAM User', 'IAM Role'],
        rows: [
          { label: 'Credentials', values: ['Long-term (access key + secret)', 'Temporary (STS token)'] },
          { label: 'Best for', values: ['Humans, CI/CD systems', 'AWS services, cross-account, federation'] },
          { label: 'Rotation needed', values: ['Yes — manually or via automation', 'No — auto-expires'] },
          { label: 'Exam preference', values: ['Avoid for services', 'Always preferred for services'] },
        ],
      },
    ],
    keywordSignals: [
      { keyword: 'temporary credentials', service: 'IAM Role + STS' },
      { keyword: 'cross-account access', service: 'IAM Role with trust policy' },
      { keyword: 'corporate identity / SSO', service: 'IAM Identity Center' },
      { keyword: 'maximum permissions boundary', service: 'Permission Boundary' },
      { keyword: 'restrict entire account', service: 'SCP (Organizations)' },
    ],
  },
  {
    slug: 'kms',
    title: 'KMS',
    category: 'Security',
    keyFacts: [
      'SSE-S3: AWS manages the key — company has zero control',
      'SSE-KMS with AWS-managed key: AWS manages in KMS — company cannot rotate or disable',
      'SSE-KMS with CMK (customer-managed): Company controls key policy, rotation, disable/delete',
      'SSE-C: Customer supplies key with every request — operationally complex, key not stored in AWS',
      'Envelope encryption: data key encrypts data, CMK encrypts the data key',
      'KMS keys are regional — cannot be used directly across regions',
      'Key rotation can be enabled — AWS rotates CMKs annually automatically if enabled',
      'CloudTrail logs every KMS API call for auditing',
    ],
    examTraps: [
      { trap: '"Company must manage their own keys"', correct: 'Answer is SSE-KMS with CMK — not SSE-C (too complex) and not SSE-S3 (AWS manages)' },
      { trap: 'SSE-KMS with AWS-managed key = company manages', correct: 'AWS-managed keys in KMS are still controlled by AWS. Only CMKs give the customer control' },
    ],
    comparisons: [
      {
        title: 'S3 Encryption Options',
        headers: ['Type', 'Who manages key', 'Customer controls', 'Exam trigger'],
        rows: [
          { label: 'SSE-S3', values: ['AWS', 'Nothing', '"Default encryption"'] },
          { label: 'SSE-KMS (AWS-managed)', values: ['AWS (in KMS)', 'Audit via CloudTrail', '"KMS but not CMK"'] },
          { label: 'SSE-KMS (CMK)', values: ['Customer', 'Full key lifecycle', '"Company manages keys"'] },
          { label: 'SSE-C', values: ['Customer (sent each request)', 'Key never stored in AWS', 'Rarely correct answer'] },
        ],
      },
    ],
    keywordSignals: [
      { keyword: 'company manages encryption keys', service: 'SSE-KMS with CMK' },
      { keyword: 'audit key usage', service: 'KMS + CloudTrail' },
      { keyword: 'envelope encryption', service: 'KMS data key' },
    ],
  },
  {
    slug: 'vpc',
    title: 'VPC',
    category: 'Networking',
    keyFacts: [
      'Security Groups are stateful — return traffic is automatically allowed',
      'NACLs are stateless — must explicitly allow both inbound AND outbound (including ephemeral ports)',
      'Default NACL: allows all inbound and outbound traffic',
      'Custom NACL: denies all traffic by default',
      'NAT Gateway: allows private subnet instances outbound internet access, no inbound',
      'VPC Gateway Endpoints: free, for S3 and DynamoDB only',
      'VPC Interface Endpoints (PrivateLink): paid, for most other AWS services',
      'VPC Peering: one-to-one, non-transitive — traffic does not flow A→B→C',
      'Transit Gateway: hub-and-spoke, transitive routing across many VPCs',
    ],
    examTraps: [
      { trap: 'NACL allows inbound but not outbound response', correct: 'NACLs are stateless — must add outbound allow rule for ephemeral ports 1024-65535' },
      { trap: 'VPC peering enables transitive routing', correct: 'VPC peering is non-transitive — A peers with B, B peers with C, but A cannot reach C via B' },
      { trap: 'NAT Instance vs NAT Gateway', correct: 'NAT Gateway is managed, highly available, preferred. NAT Instance is self-managed and a legacy pattern' },
    ],
    comparisons: [
      {
        title: 'Security Group vs NACL',
        headers: ['Feature', 'Security Group', 'NACL'],
        rows: [
          { label: 'Level', values: ['Instance (ENI)', 'Subnet'] },
          { label: 'Stateful?', values: ['Yes — return auto-allowed', 'No — must allow both directions'] },
          { label: 'Rules', values: ['Allow only', 'Allow and Deny'] },
          { label: 'Default (custom)', values: ['Deny all inbound', 'Deny all'] },
          { label: 'Rule evaluation', values: ['All rules evaluated', 'Lowest number first, stops at match'] },
        ],
      },
      {
        title: 'VPC Connectivity Options',
        headers: ['Scenario', 'Solution', 'Cost'],
        rows: [
          { label: 'Private access to S3/DynamoDB', values: ['Gateway Endpoint', 'Free'] },
          { label: 'Private access to other AWS services', values: ['Interface Endpoint (PrivateLink)', 'Paid'] },
          { label: '2-3 VPCs need to connect', values: ['VPC Peering', 'Low'] },
          { label: 'Many VPCs + on-premises', values: ['Transit Gateway', 'Higher, transitive'] },
          { label: 'On-premises secure connection', values: ['Site-to-Site VPN (internet) or Direct Connect (dedicated)', 'VPN < DX'] },
        ],
      },
    ],
    keywordSignals: [
      { keyword: 'stateless firewall / block specific IP', service: 'NACL' },
      { keyword: 'outbound internet from private subnet', service: 'NAT Gateway' },
      { keyword: 'free private access to S3', service: 'VPC Gateway Endpoint' },
      { keyword: 'connect many VPCs centrally', service: 'Transit Gateway' },
      { keyword: 'consistent dedicated throughput to on-prem', service: 'Direct Connect' },
    ],
  },
  {
    slug: 'rds',
    title: 'RDS & Aurora',
    category: 'Database',
    keyFacts: [
      'Multi-AZ: synchronous replication, automatic failover, standby is NOT readable',
      'Read Replicas: asynchronous replication, manually promoted, ARE readable',
      'Aurora is MySQL/PostgreSQL compatible with up to 5x MySQL and 3x PostgreSQL performance',
      'Aurora automatically replicates across 3 AZs with 6 copies of data',
      'Aurora Read Replicas use shared storage — lag is typically <10ms',
      'Aurora Global Database: cross-region with <1s RPO, <1min RTO',
      'RDS Proxy: pools connections — critical for Lambda (which creates many short-lived connections)',
      'PITR (Point-in-Time Recovery): restore to any second within the retention period (1-35 days)',
      'Aurora Serverless v2: auto-scales in fine-grained increments, good for variable workloads',
    ],
    examTraps: [
      { trap: '"Read-heavy workload" → Multi-AZ', correct: 'Multi-AZ is for HA/failover — Read Replicas are for read scaling' },
      { trap: '"Automatic failover" → Read Replica', correct: 'Only Multi-AZ provides automatic failover — Read Replicas require manual promotion' },
      { trap: 'Lambda + RDS causes connection exhaustion', correct: 'Use RDS Proxy to pool Lambda connections to RDS' },
      { trap: 'ElastiCache Redis for DynamoDB caching', correct: 'Use DAX for DynamoDB — ElastiCache Redis is for RDS/Aurora/general caching' },
    ],
    comparisons: [
      {
        title: 'RDS Multi-AZ vs Read Replicas',
        headers: ['Feature', 'Multi-AZ', 'Read Replica'],
        rows: [
          { label: 'Purpose', values: ['High availability / failover', 'Read scalability'] },
          { label: 'Replication', values: ['Synchronous', 'Asynchronous'] },
          { label: 'Readable?', values: ['No (standby is passive)', 'Yes'] },
          { label: 'Failover', values: ['Automatic', 'Manual promotion'] },
          { label: 'Cross-region?', values: ['No', 'Yes'] },
        ],
      },
    ],
    keywordSignals: [
      { keyword: 'automatic failover / HA', service: 'RDS Multi-AZ' },
      { keyword: 'scale read-heavy workload', service: 'RDS Read Replicas' },
      { keyword: 'Lambda + RDS connection exhaustion', service: 'RDS Proxy' },
      { keyword: 'MySQL/PostgreSQL compatible, high performance', service: 'Aurora' },
      { keyword: 'variable/idle database workload', service: 'Aurora Serverless v2' },
    ],
  },
  {
    slug: 'sqs-sns-kinesis',
    title: 'SQS / SNS / Kinesis',
    category: 'Integration',
    keyFacts: [
      'SQS: pull-based, async decoupling, messages retained up to 14 days, max 256KB',
      'SQS FIFO: exactly-once processing, strict ordering, 300 TPS (3000 with batching)',
      'SQS DLQ: messages that fail maxReceiveCount go here for inspection',
      'SQS visibility timeout: how long a message is hidden after a consumer reads it',
      'SNS: push-based fan-out, no retention, subscribers include SQS, Lambda, HTTP, email',
      'SNS FIFO: can only fan out to SQS FIFO queues',
      'Kinesis Data Streams: real-time, ordered within shard, replay up to 7 days',
      'Kinesis Data Firehose: delivery to S3/Redshift/ES — no replay, near-real-time',
      'EventBridge: event bus for AWS service events and custom events, rule-based routing',
    ],
    examTraps: [
      { trap: 'Use SQS to fan out to multiple consumers independently', correct: 'Use SNS to fan out to multiple SQS queues — each consumer gets its own queue' },
      { trap: 'SNS alone when message persistence is needed', correct: 'SNS has zero retention — add SQS subscriber for durability' },
      { trap: 'Use Kinesis Firehose when replay is needed', correct: 'Firehose discards after delivery — use Kinesis Data Streams for replay' },
      { trap: 'SNS for AWS service event routing (e.g. S3 events to multiple targets)', correct: 'Use EventBridge for rich AWS service event routing with filtering' },
    ],
    comparisons: [
      {
        title: 'Messaging Service Selection',
        headers: ['Keyword', 'Service'],
        rows: [
          { label: 'Decouple / async / buffer', values: ['SQS'] },
          { label: 'Fan-out to multiple subscribers', values: ['SNS'] },
          { label: 'Real-time ordered streaming / replay', values: ['Kinesis Data Streams'] },
          { label: 'Deliver to S3/Redshift, near-real-time', values: ['Kinesis Firehose'] },
          { label: 'AWS service events / rule-based routing', values: ['EventBridge'] },
          { label: 'Strict ordering + exactly-once', values: ['SQS FIFO'] },
          { label: 'Multiple independent consumers of same stream', values: ['Kinesis Data Streams'] },
        ],
      },
    ],
    keywordSignals: [
      { keyword: 'decouple / async processing', service: 'SQS' },
      { keyword: 'fan-out to multiple services', service: 'SNS' },
      { keyword: 'real-time streaming / replay', service: 'Kinesis Data Streams' },
      { keyword: 'deliver to S3 / near-real-time ingestion', service: 'Kinesis Firehose' },
      { keyword: 'AWS service events / schedule triggers', service: 'EventBridge' },
      { keyword: 'strict order + exactly-once', service: 'SQS FIFO' },
    ],
  },
  {
    slug: 'cloudwatch',
    title: 'CloudWatch',
    category: 'Monitoring',
    keyFacts: [
      'CloudWatch does NOT natively capture EC2 memory, disk space, or swap utilization',
      'Memory/disk metrics require the CloudWatch agent installed on the instance — these are custom metrics',
      'Default EC2 metrics: CPU utilization, disk I/O ops/bytes, network in/out, status checks',
      'CloudWatch Logs: collect, monitor, and store log files from EC2, Lambda, etc.',
      'CloudWatch Alarms: trigger actions (SNS, Auto Scaling, EC2 action) based on metrics',
      'CloudWatch Events / EventBridge: respond to state changes in AWS services',
      'CloudWatch Dashboards: visualize metrics across regions',
      'CloudTrail logs API calls; CloudWatch monitors performance metrics — these are different services',
    ],
    examTraps: [
      { trap: '"Monitor memory utilization" → native CloudWatch metric', correct: 'Memory is NOT a native metric — requires CloudWatch agent and counts as a custom metric' },
      { trap: 'CloudWatch for API call auditing', correct: 'CloudTrail logs API calls. CloudWatch monitors operational metrics' },
    ],
    keywordSignals: [
      { keyword: 'monitor memory / disk / swap on EC2', service: 'CloudWatch agent (custom metrics)' },
      { keyword: 'audit API calls', service: 'CloudTrail' },
      { keyword: 'alarm on metric threshold', service: 'CloudWatch Alarm' },
      { keyword: 'collect application logs', service: 'CloudWatch Logs' },
    ],
  },
  {
    slug: 'elb',
    title: 'Elastic Load Balancing',
    category: 'Compute',
    keyFacts: [
      'ALB (Application): Layer 7, HTTP/HTTPS, path-based and host-based routing, WebSocket support',
      'NLB (Network): Layer 4, TCP/UDP, ultra-low latency, static IP, handles millions of RPS',
      'CLB (Classic): legacy, avoid on new architectures',
      'ALB supports Lambda functions as targets',
      'NLB supports static Elastic IP addresses — useful for whitelisting',
      'Cross-zone load balancing: distributes traffic evenly across all AZs (enabled by default on ALB)',
      'Connection draining / deregistration delay: allows in-flight requests to complete before instance is removed',
      'Sticky sessions (session affinity): ALB supports via cookies — routes user to same target',
    ],
    examTraps: [
      { trap: 'Use ALB for high-throughput TCP traffic requiring static IP', correct: 'NLB supports static IPs and is designed for Layer 4 TCP/UDP at extreme scale' },
      { trap: 'ALB for WebSocket connections', correct: 'ALB does support WebSocket — it is a valid choice alongside API Gateway WebSocket' },
    ],
    comparisons: [
      {
        title: 'ALB vs NLB',
        headers: ['Feature', 'ALB', 'NLB'],
        rows: [
          { label: 'Layer', values: ['7 (Application)', '4 (Transport)'] },
          { label: 'Protocols', values: ['HTTP, HTTPS, WebSocket', 'TCP, UDP, TLS'] },
          { label: 'Routing', values: ['Path, host, header, query', 'IP + port only'] },
          { label: 'Static IP', values: ['No', 'Yes (Elastic IP)'] },
          { label: 'Best for', values: ['Web apps, microservices', 'Gaming, IoT, high TPS TCP'] },
        ],
      },
    ],
    keywordSignals: [
      { keyword: 'path-based routing / microservices', service: 'ALB' },
      { keyword: 'static IP / IP whitelisting', service: 'NLB' },
      { keyword: 'ultra-low latency / Layer 4 TCP', service: 'NLB' },
      { keyword: 'Lambda as target', service: 'ALB' },
    ],
  },
  {
    slug: 's3',
    title: 'Amazon S3',
    category: 'Storage',
    keyFacts: [
      'S3 is object storage — not block storage (EBS) or file storage (EFS)',
      'Max object size: 5TB. Use multipart upload for objects >100MB',
      'S3 static website endpoints do NOT support HTTPS — use CloudFront',
      'Versioning enables recovery of overwritten/deleted objects',
      'MFA Delete requires MFA to delete versions — adds extra protection',
      'S3 Replication (CRR/SRR): requires versioning enabled on both source and destination',
      'CRR (Cross-Region): different regions. SRR (Same-Region): same region',
      'Existing objects are NOT replicated when CRR is enabled — use S3 Batch Operations',
      'S3 Transfer Acceleration: speeds up uploads to S3 using CloudFront edge locations',
      'Pre-signed URLs: grant temporary access to private objects without changing bucket policy',
    ],
    examTraps: [
      { trap: 'CRR automatically replicates existing objects', correct: 'Only new objects are replicated — existing objects need S3 Batch Operations' },
      { trap: 'S3 static website can serve HTTPS', correct: 'S3 website endpoints cannot serve HTTPS — requires CloudFront' },
      { trap: 'Use S3 Transfer Acceleration for global users downloading files', correct: 'Transfer Acceleration speeds up uploads TO S3, not downloads. Use CloudFront for downloads' },
    ],
    comparisons: [
      {
        title: 'S3 Storage Classes',
        headers: ['Class', 'Min Duration', 'Retrieval Fee', 'Best For'],
        rows: [
          { label: 'Standard', values: ['None', 'None', 'Frequent access'] },
          { label: 'Standard-IA', values: ['30 days', 'Yes', 'Infrequent, rapid retrieval'] },
          { label: 'One Zone-IA', values: ['30 days', 'Yes', 'Infrequent, single AZ ok'] },
          { label: 'Intelligent-Tiering', values: ['None', 'None', 'Unknown/changing access'] },
          { label: 'Glacier Instant', values: ['90 days', 'Yes', 'Archive, ms retrieval'] },
          { label: 'Glacier Flexible', values: ['90 days', 'Yes', 'Archive, min-hr retrieval'] },
          { label: 'Glacier Deep Archive', values: ['180 days', 'Yes', 'Long-term, hr retrieval'] },
        ],
      },
    ],
    keywordSignals: [
      { keyword: 'HTTPS for static website', service: 'CloudFront in front of S3' },
      { keyword: 'recover deleted files', service: 'S3 Versioning' },
      { keyword: 'replicate to another region', service: 'S3 CRR' },
      { keyword: 'archive after X days', service: 'S3 Lifecycle → Glacier' },
      { keyword: 'temporary access to private object', service: 'Pre-signed URL' },
    ],
  },
  {
    slug: 'cost-optimization',
    title: 'Cost Optimization',
    category: 'Cost',
    keyFacts: [
      'Standard Reserved Instances: up to 72% savings vs On-Demand (3yr all-upfront)',
      'Convertible Reserved Instances: up to 66% savings, can change instance family',
      'Compute Savings Plans: up to 66%, covers EC2 + Lambda + Fargate, most flexible',
      'EC2 Instance Savings Plans: up to 72%, locked to instance family in one region',
      'Spot Instances: up to 90% savings, interruptible with 2-min warning',
      'Spot Blocks (scheduled) are discontinued — do not choose this option',
      'VPC Gateway Endpoints for S3 and DynamoDB are FREE — eliminate NAT Gateway data processing cost',
      'Trusted Advisor full checks require Business or Enterprise support plan',
      'Cost Explorer: view 12 months history + 3 month forecast, rightsizing recommendations',
      'AWS Budgets: set cost/usage thresholds with alerts and automated actions',
    ],
    examTraps: [
      { trap: '"Flexibility to change instance family" → Standard RI', correct: 'Convertible RIs or Compute Savings Plans allow changing instance family' },
      { trap: 'Trusted Advisor checks free on all plans', correct: 'Full Trusted Advisor checks (all 5 categories) require Business or Enterprise support' },
      { trap: 'Use Spot for steady-state production workload', correct: 'Spot instances can be interrupted — use Reserved/Savings Plans for steady-state' },
    ],
    comparisons: [
      {
        title: 'EC2 Purchasing Options',
        headers: ['Option', 'Discount', 'Best For'],
        rows: [
          { label: 'On-Demand', values: ['None', 'Short-term, unpredictable'] },
          { label: 'Standard RI (3yr)', values: ['Up to 72%', 'Steady-state, known instance'] },
          { label: 'Convertible RI', values: ['Up to 66%', 'Steady-state, need flexibility'] },
          { label: 'Compute Savings Plan', values: ['Up to 66%', 'EC2 + Lambda + Fargate flex'] },
          { label: 'Spot', values: ['Up to 90%', 'Fault-tolerant, interruptible'] },
          { label: 'Dedicated Host', values: ['Varies', 'Licensing, compliance isolation'] },
        ],
      },
    ],
    keywordSignals: [
      { keyword: 'steady-state 24/7 for 3 years', service: 'Standard RI (3yr all-upfront)' },
      { keyword: 'interruptible / batch / fault-tolerant', service: 'Spot Instances' },
      { keyword: 'free private access to S3/DynamoDB', service: 'VPC Gateway Endpoint' },
      { keyword: 'cost breakdown / forecast', service: 'Cost Explorer' },
      { keyword: 'automated cost enforcement', service: 'AWS Budgets with Budget Actions' },
      { keyword: 'full Trusted Advisor checks', service: 'Business or Enterprise support plan' },
    ],
  },
]

export function getTopicBySlug(slug: string): TopicContent | undefined {
  return TOPICS.find(t => t.slug === slug)
}

export const CATEGORIES = [...new Set(TOPICS.map(t => t.category))]

export function getTopicsByCategory(category: string): TopicContent[] {
  return TOPICS.filter(t => t.category === category)
}
