# ProTrader5 v2.0 - Production Infrastructure Setup Guide

This guide provides step-by-step instructions for setting up the production infrastructure for ProTrader5 v2.0.

## Table of Contents

1. [Cloud Provider Selection](#cloud-provider-selection)
2. [AWS Setup](#aws-setup)
3. [Azure Setup](#azure-setup)
4. [GCP Setup](#gcp-setup)
5. [Database Configuration](#database-configuration)
6. [Redis Configuration](#redis-configuration)
7. [Network Configuration](#network-configuration)
8. [Security Configuration](#security-configuration)

---

## Cloud Provider Selection

### Comparison

| Feature | AWS | Azure | GCP |
|---------|-----|-------|-----|
| **Pricing** | Moderate | Moderate | Competitive |
| **Global Reach** | Excellent | Excellent | Good |
| **Managed Kubernetes** | EKS | AKS | GKE |
| **Managed MongoDB** | DocumentDB | Cosmos DB | Atlas on GCP |
| **Managed Redis** | ElastiCache | Cache for Redis | Memorystore |
| **Support** | Excellent | Excellent | Good |
| **Learning Curve** | Moderate | Moderate | Easy |

### Recommendation

**AWS** is recommended for ProTrader5 v2.0 due to:
- Comprehensive service offerings
- Excellent documentation
- Strong ecosystem
- Proven track record for financial applications

---

## AWS Setup

### Prerequisites

- AWS account with billing enabled
- AWS CLI installed
- Terraform installed (optional, for infrastructure as code)
- kubectl installed

### Step 1: Create VPC

```bash
# Create VPC
aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=protrader5-vpc}]'

# Note the VPC ID from the output
export VPC_ID=<vpc-id>

# Create public subnet
aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.1.0/24 \
  --availability-zone us-east-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=protrader5-public-subnet-1}]'

# Create private subnet
aws ec2 create-subnet \
  --vpc-id $VPC_ID \
  --cidr-block 10.0.2.0/24 \
  --availability-zone us-east-1a \
  --tag-specifications 'ResourceType=subnet,Tags=[{Key=Name,Value=protrader5-private-subnet-1}]'

# Create internet gateway
aws ec2 create-internet-gateway \
  --tag-specifications 'ResourceType=internet-gateway,Tags=[{Key=Name,Value=protrader5-igw}]'

export IGW_ID=<igw-id>

# Attach internet gateway to VPC
aws ec2 attach-internet-gateway \
  --vpc-id $VPC_ID \
  --internet-gateway-id $IGW_ID
```

### Step 2: Create EKS Cluster

```bash
# Create EKS cluster
eksctl create cluster \
  --name protrader5-prod \
  --version 1.28 \
  --region us-east-1 \
  --nodegroup-name standard-workers \
  --node-type t3.xlarge \
  --nodes 3 \
  --nodes-min 2 \
  --nodes-max 10 \
  --managed

# Configure kubectl
aws eks update-kubeconfig --region us-east-1 --name protrader5-prod

# Verify cluster
kubectl get nodes
```

### Step 3: Set Up MongoDB Atlas

```bash
# Create MongoDB Atlas account at https://www.mongodb.com/cloud/atlas

# Create cluster
# - Cluster Tier: M10 (Production)
# - Region: us-east-1
# - Cluster Name: protrader5-prod
# - MongoDB Version: 7.0

# Configure network access
# - Add IP: 0.0.0.0/0 (for development, restrict in production)

# Create database user
# - Username: protrader5_user
# - Password: <generate-strong-password>
# - Database: admin
# - Role: readWriteAnyDatabase

# Get connection string
# mongodb+srv://protrader5_user:<password>@protrader5-prod.xxxxx.mongodb.net/protrader5?retryWrites=true&w=majority
```

### Step 4: Set Up ElastiCache (Redis)

```bash
# Create subnet group
aws elasticache create-cache-subnet-group \
  --cache-subnet-group-name protrader5-redis-subnet \
  --cache-subnet-group-description "ProTrader5 Redis Subnet Group" \
  --subnet-ids subnet-xxxxx subnet-yyyyy

# Create Redis cluster
aws elasticache create-replication-group \
  --replication-group-id protrader5-redis \
  --replication-group-description "ProTrader5 Redis Cluster" \
  --engine redis \
  --cache-node-type cache.t3.medium \
  --num-cache-clusters 2 \
  --cache-subnet-group-name protrader5-redis-subnet \
  --security-group-ids sg-xxxxx \
  --automatic-failover-enabled

# Get endpoint
aws elasticache describe-replication-groups \
  --replication-group-id protrader5-redis \
  --query 'ReplicationGroups[0].NodeGroups[0].PrimaryEndpoint.Address'
```

### Step 5: Set Up RDS (TimescaleDB)

```bash
# Create DB subnet group
aws rds create-db-subnet-group \
  --db-subnet-group-name protrader5-timescale-subnet \
  --db-subnet-group-description "ProTrader5 TimescaleDB Subnet Group" \
  --subnet-ids subnet-xxxxx subnet-yyyyy

# Create TimescaleDB instance
aws rds create-db-instance \
  --db-instance-identifier protrader5-timescale \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.3 \
  --master-username protrader5_admin \
  --master-user-password <generate-strong-password> \
  --allocated-storage 100 \
  --storage-type gp3 \
  --db-subnet-group-name protrader5-timescale-subnet \
  --vpc-security-group-ids sg-xxxxx \
  --backup-retention-period 7 \
  --multi-az

# Get endpoint
aws rds describe-db-instances \
  --db-instance-identifier protrader5-timescale \
  --query 'DBInstances[0].Endpoint.Address'

# Install TimescaleDB extension
psql -h <endpoint> -U protrader5_admin -d postgres
CREATE EXTENSION IF NOT EXISTS timescaledb;
```

### Step 6: Configure Security Groups

```bash
# Create security group for EKS nodes
aws ec2 create-security-group \
  --group-name protrader5-eks-nodes \
  --description "Security group for ProTrader5 EKS nodes" \
  --vpc-id $VPC_ID

export SG_EKS=<sg-id>

# Allow all traffic within security group
aws ec2 authorize-security-group-ingress \
  --group-id $SG_EKS \
  --protocol all \
  --source-group $SG_EKS

# Allow HTTPS from anywhere
aws ec2 authorize-security-group-ingress \
  --group-id $SG_EKS \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

# Create security group for databases
aws ec2 create-security-group \
  --group-name protrader5-databases \
  --description "Security group for ProTrader5 databases" \
  --vpc-id $VPC_ID

export SG_DB=<sg-id>

# Allow MongoDB (27017) from EKS nodes
aws ec2 authorize-security-group-ingress \
  --group-id $SG_DB \
  --protocol tcp \
  --port 27017 \
  --source-group $SG_EKS

# Allow Redis (6379) from EKS nodes
aws ec2 authorize-security-group-ingress \
  --group-id $SG_DB \
  --protocol tcp \
  --port 6379 \
  --source-group $SG_EKS

# Allow PostgreSQL (5432) from EKS nodes
aws ec2 authorize-security-group-ingress \
  --group-id $SG_DB \
  --protocol tcp \
  --port 5432 \
  --source-group $SG_EKS
```

### Step 7: Set Up S3 for Static Assets

```bash
# Create S3 bucket
aws s3 mb s3://protrader5-assets --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket protrader5-assets \
  --versioning-configuration Status=Enabled

# Configure CORS
cat > cors.json <<EOF
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://protrader5.com"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF

aws s3api put-bucket-cors \
  --bucket protrader5-assets \
  --cors-configuration file://cors.json

# Set up CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name protrader5-assets.s3.amazonaws.com \
  --default-root-object index.html
```

### Step 8: Set Up Secrets Manager

```bash
# Create secrets for environment variables
aws secretsmanager create-secret \
  --name protrader5/prod/mongodb-uri \
  --secret-string "mongodb+srv://protrader5_user:<password>@protrader5-prod.xxxxx.mongodb.net/protrader5"

aws secretsmanager create-secret \
  --name protrader5/prod/redis-url \
  --secret-string "redis://<elasticache-endpoint>:6379"

aws secretsmanager create-secret \
  --name protrader5/prod/jwt-secret \
  --secret-string "<generate-random-string>"

aws secretsmanager create-secret \
  --name protrader5/prod/jwt-refresh-secret \
  --secret-string "<generate-random-string>"

# Create IAM role for EKS to access secrets
aws iam create-role \
  --role-name protrader5-eks-secrets-role \
  --assume-role-policy-document file://trust-policy.json

aws iam attach-role-policy \
  --role-name protrader5-eks-secrets-role \
  --policy-arn arn:aws:iam::aws:policy/SecretsManagerReadWrite
```

---

## Azure Setup

### Step 1: Create Resource Group

```bash
# Login to Azure
az login

# Create resource group
az group create \
  --name protrader5-prod \
  --location eastus
```

### Step 2: Create AKS Cluster

```bash
# Create AKS cluster
az aks create \
  --resource-group protrader5-prod \
  --name protrader5-aks \
  --node-count 3 \
  --node-vm-size Standard_D4s_v3 \
  --enable-addons monitoring \
  --generate-ssh-keys

# Get credentials
az aks get-credentials \
  --resource-group protrader5-prod \
  --name protrader5-aks

# Verify cluster
kubectl get nodes
```

### Step 3: Set Up Cosmos DB (MongoDB API)

```bash
# Create Cosmos DB account
az cosmosdb create \
  --name protrader5-cosmos \
  --resource-group protrader5-prod \
  --kind MongoDB \
  --server-version 4.2 \
  --default-consistency-level Session

# Create database
az cosmosdb mongodb database create \
  --account-name protrader5-cosmos \
  --resource-group protrader5-prod \
  --name protrader5

# Get connection string
az cosmosdb keys list \
  --name protrader5-cosmos \
  --resource-group protrader5-prod \
  --type connection-strings
```

### Step 4: Set Up Azure Cache for Redis

```bash
# Create Redis cache
az redis create \
  --name protrader5-redis \
  --resource-group protrader5-prod \
  --location eastus \
  --sku Standard \
  --vm-size c1

# Get connection string
az redis list-keys \
  --name protrader5-redis \
  --resource-group protrader5-prod
```

---

## GCP Setup

### Step 1: Create Project

```bash
# Login to GCP
gcloud auth login

# Create project
gcloud projects create protrader5-prod \
  --name="ProTrader5 Production"

# Set project
gcloud config set project protrader5-prod

# Enable billing
gcloud beta billing projects link protrader5-prod \
  --billing-account=<billing-account-id>
```

### Step 2: Create GKE Cluster

```bash
# Enable Kubernetes Engine API
gcloud services enable container.googleapis.com

# Create GKE cluster
gcloud container clusters create protrader5-gke \
  --zone us-central1-a \
  --num-nodes 3 \
  --machine-type n1-standard-4 \
  --enable-autoscaling \
  --min-nodes 2 \
  --max-nodes 10

# Get credentials
gcloud container clusters get-credentials protrader5-gke \
  --zone us-central1-a

# Verify cluster
kubectl get nodes
```

### Step 3: Set Up MongoDB Atlas

(Same as AWS setup - MongoDB Atlas works across all cloud providers)

### Step 4: Set Up Memorystore (Redis)

```bash
# Create Redis instance
gcloud redis instances create protrader5-redis \
  --size=5 \
  --region=us-central1 \
  --redis-version=redis_6_x

# Get connection info
gcloud redis instances describe protrader5-redis \
  --region=us-central1
```

---

## Cost Estimation

### AWS Monthly Costs (Estimated)

| Service | Configuration | Monthly Cost |
|---------|--------------|--------------|
| EKS Cluster | 3 t3.xlarge nodes | $450 |
| MongoDB Atlas | M10 cluster | $60 |
| ElastiCache | 2 cache.t3.medium | $100 |
| RDS TimescaleDB | db.t3.medium | $120 |
| S3 + CloudFront | 1TB storage, 10TB transfer | $150 |
| Load Balancer | Application LB | $25 |
| Data Transfer | Estimated | $100 |
| **Total** | | **~$1,005/month** |

### Scaling Considerations

- **Small Scale** (1,000 users): $1,000-$1,500/month
- **Medium Scale** (10,000 users): $3,000-$5,000/month
- **Large Scale** (100,000 users): $10,000-$20,000/month

---

## Next Steps

After completing infrastructure setup:

1. Configure domain and SSL certificates
2. Deploy applications to Kubernetes
3. Set up monitoring and logging
4. Configure backups and disaster recovery
5. Perform load testing
6. Go live!

---

## Support

For issues or questions:
- GitHub: https://github.com/projectai397/protrader5-v2
- Documentation: See individual service READMEs

## License

MIT License - See LICENSE file for details
