# ProTrader5 (v2.0) - Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the ProTrader5 platform to production environments using Kubernetes on AWS.

## Prerequisites

Before deploying, ensure you have the following:

- **AWS Account** with appropriate permissions
- **kubectl** CLI tool installed
- **Docker** installed for building images
- **Terraform** installed for infrastructure provisioning
- **GitHub** account for CI/CD
- **Domain name** for the platform

## Infrastructure Setup

### 1. AWS Resources

The following AWS resources are required:

- **EKS Cluster** (Kubernetes)
- **RDS for MongoDB** (or MongoDB Atlas)
- **ElastiCache for Redis**
- **RDS for TimescaleDB** (PostgreSQL)
- **Amazon MQ** (RabbitMQ)
- **Amazon MSK** (Kafka)
- **S3 Buckets** (for static assets and backups)
- **CloudFront** (CDN)
- **Route 53** (DNS)
- **ACM** (SSL certificates)

### 2. Provision Infrastructure with Terraform

```bash
cd infrastructure/terraform

# Initialize Terraform
terraform init

# Review the plan
terraform plan

# Apply the configuration
terraform apply
```

This will create:
- EKS cluster with 3 worker nodes
- VPC with public and private subnets
- Security groups
- IAM roles and policies
- Database instances
- Load balancers

## Kubernetes Setup

### 1. Configure kubectl

```bash
# Update kubeconfig
aws eks update-kubeconfig --name protrader5-cluster --region us-east-1

# Verify connection
kubectl get nodes
```

### 2. Create Namespace

```bash
kubectl create namespace protrader5
```

### 3. Create Secrets

```bash
# Create secrets for database connections
kubectl create secret generic protrader5-secrets \
  --from-literal=mongodb-uri='mongodb://...' \
  --from-literal=redis-url='redis://...' \
  --from-literal=jwt-secret='your-jwt-secret' \
  --from-literal=timescaledb-uri='postgresql://...' \
  -n protrader5
```

### 4. Deploy Services

```bash
# Deploy all microservices
kubectl apply -f infrastructure/kubernetes/

# Verify deployments
kubectl get deployments -n protrader5
kubectl get pods -n protrader5
kubectl get services -n protrader5
```

## CI/CD Setup

### 1. GitHub Secrets

Add the following secrets to your GitHub repository:

- `KUBE_CONFIG` - Kubernetes configuration file
- `TEST_MONGODB_URI` - Test database URI
- `TEST_REDIS_URL` - Test Redis URL
- `SLACK_WEBHOOK` - Slack webhook for notifications
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key

### 2. Enable GitHub Actions

The CI/CD pipeline is defined in `.github/workflows/ci-cd.yml` and will automatically:

1. Run tests on pull requests
2. Build Docker images on merge to main
3. Push images to GitHub Container Registry
4. Deploy to Kubernetes cluster
5. Send notifications to Slack

## Database Migration

### 1. Run Initial Migrations

```bash
# Connect to the MongoDB instance
mongosh "mongodb://..."

# Run migration scripts
cd backend/migrations
node run-migrations.js
```

### 2. Seed Initial Data

```bash
# Seed roles, permissions, and initial admin user
node seed-data.js
```

## Monitoring Setup

### 1. Deploy Prometheus

```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack -n monitoring --create-namespace
```

### 2. Deploy Grafana

Grafana is included with the Prometheus stack. Access it via:

```bash
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
```

Default credentials: admin/prom-operator

### 3. Import Dashboards

Import the pre-configured dashboards from `infrastructure/monitoring/dashboards/`.

## SSL Certificate Setup

### 1. Request Certificate from ACM

```bash
aws acm request-certificate \
  --domain-name 500x.pro \
  --subject-alternative-names "*.500x.pro" \
  --validation-method DNS
```

### 2. Configure DNS Validation

Add the CNAME records provided by ACM to your Route 53 hosted zone.

### 3. Update Ingress

Update the ingress configuration to use the ACM certificate ARN.

## Domain Configuration

### 1. Create Route 53 Hosted Zone

```bash
aws route53 create-hosted-zone --name 500x.pro --caller-reference $(date +%s)
```

### 2. Add DNS Records

```bash
# A record for main domain
# CNAME for api subdomain
# CNAME for www subdomain
```

## Load Testing

Before going live, perform load testing:

```bash
cd testing/load-tests
npm install
npm run test:load
```

## Production Checklist

Before deploying to production, verify:

- [ ] All environment variables are set correctly
- [ ] Database backups are configured
- [ ] SSL certificates are valid
- [ ] Monitoring and alerting are configured
- [ ] Rate limiting is enabled
- [ ] Security headers are configured
- [ ] CORS policies are set correctly
- [ ] Load testing is completed
- [ ] Disaster recovery plan is in place
- [ ] Documentation is up to date

## Rollback Procedure

If issues occur after deployment:

```bash
# Rollback to previous version
kubectl rollout undo deployment/user-service -n protrader5
kubectl rollout undo deployment/trading-service -n protrader5

# Verify rollback
kubectl rollout status deployment/user-service -n protrader5
```

## Scaling

### Manual Scaling

```bash
# Scale a specific service
kubectl scale deployment/trading-service --replicas=5 -n protrader5
```

### Auto-scaling

Horizontal Pod Autoscaler (HPA) is already configured for each service. It will automatically scale based on CPU and memory usage.

## Backup and Disaster Recovery

### 1. Database Backups

- **MongoDB:** Automated daily backups via AWS Backup
- **TimescaleDB:** Point-in-time recovery enabled
- **Redis:** AOF persistence enabled

### 2. Application Backups

```bash
# Backup Kubernetes configurations
kubectl get all -n protrader5 -o yaml > backup-$(date +%Y%m%d).yaml
```

## Troubleshooting

### Check Pod Logs

```bash
kubectl logs -f deployment/user-service -n protrader5
```

### Check Pod Status

```bash
kubectl describe pod <pod-name> -n protrader5
```

### Access Pod Shell

```bash
kubectl exec -it <pod-name> -n protrader5 -- /bin/sh
```

## Support

For deployment support, contact:
- DevOps Team: devops@500x.pro
- Emergency: +91-XXXXXXXXXX
