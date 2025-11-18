# Kubernetes Deployment Guide for ProTrader5 v2.0

This guide provides comprehensive instructions for deploying ProTrader5 v2.0 to production using Kubernetes.

## Table of Contents

1. [Deployment Overview](#deployment-overview)
2. [Prerequisites](#prerequisites)
3. [Kubernetes Cluster Setup](#kubernetes-cluster-setup)
4. [Container Registry](#container-registry)
5. [Kubernetes Manifests](#kubernetes-manifests)
6. [Deployment Process](#deployment-process)
7. [Monitoring and Logging](#monitoring-and-logging)
8. [Scaling and High Availability](#scaling-and-high-availability)
9. [Troubleshooting](#troubleshooting)

---

## Deployment Overview

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Load Balancer                        │
│                   (AWS ALB / Nginx)                      │
└──────────────────────┬──────────────────────────────────┘
                       │
┌──────────────────────┴──────────────────────────────────┐
│              Kubernetes Ingress Controller               │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼──────┐ ┌────▼─────┐ ┌─────▼──────┐
│ User Service │ │ Trading  │ │ Payment    │
│   (3 pods)   │ │ Service  │ │ Service    │
│              │ │ (5 pods) │ │ (3 pods)   │
└──────────────┘ └──────────┘ └────────────┘
        │              │              │
        └──────────────┼──────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼──────┐ ┌────▼─────┐ ┌─────▼──────┐
│   MongoDB    │ │  Redis   │ │ PostgreSQL │
│  (StatefulSet│ │(StatefulSet│(External)  │
│   3 replicas)│ │ 3 replicas)│            │
└──────────────┘ └──────────┘ └────────────┘
```

---

## Prerequisites

### Required Tools

```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install Helm
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

# Install AWS CLI (for EKS)
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Install eksctl (for EKS)
curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
sudo mv /tmp/eksctl /usr/local/bin
```

---

## Kubernetes Cluster Setup

### Option 1: AWS EKS

```bash
# Create EKS cluster
eksctl create cluster \
  --name protrader5-cluster \
  --version 1.28 \
  --region us-east-1 \
  --nodegroup-name standard-workers \
  --node-type t3.large \
  --nodes 3 \
  --nodes-min 3 \
  --nodes-max 10 \
  --managed

# Configure kubectl
aws eks update-kubeconfig --region us-east-1 --name protrader5-cluster

# Verify connection
kubectl get nodes
```

### Option 2: Google GKE

```bash
# Create GKE cluster
gcloud container clusters create protrader5-cluster \
  --zone us-central1-a \
  --num-nodes 3 \
  --machine-type n1-standard-2 \
  --enable-autoscaling \
  --min-nodes 3 \
  --max-nodes 10

# Get credentials
gcloud container clusters get-credentials protrader5-cluster --zone us-central1-a

# Verify connection
kubectl get nodes
```

### Option 3: Azure AKS

```bash
# Create resource group
az group create --name protrader5-rg --location eastus

# Create AKS cluster
az aks create \
  --resource-group protrader5-rg \
  --name protrader5-cluster \
  --node-count 3 \
  --enable-addons monitoring \
  --generate-ssh-keys

# Get credentials
az aks get-credentials --resource-group protrader5-rg --name protrader5-cluster

# Verify connection
kubectl get nodes
```

---

## Container Registry

### Build and Push Docker Images

```bash
# Login to Docker Hub
docker login

# Build images for all services
services=("user-service" "trading-service" "copy-trading-service" "algo-trading-service" "charting-service" "risk-management-service" "notification-service" "payment-service")

for service in "${services[@]}"; do
  echo "Building $service..."
  cd backend/services/$service
  docker build -t protrader5/$service:v1.0.0 .
  docker tag protrader5/$service:v1.0.0 protrader5/$service:latest
  docker push protrader5/$service:v1.0.0
  docker push protrader5/$service:latest
  cd ../../..
done

# Build frontend
cd frontend/web
docker build -t protrader5/web-app:v1.0.0 .
docker tag protrader5/web-app:v1.0.0 protrader5/web-app:latest
docker push protrader5/web-app:v1.0.0
docker push protrader5/web-app:latest
cd ../..

# Build WebSocket server
cd backend/websocket-server
docker build -t protrader5/websocket-server:v1.0.0 .
docker tag protrader5/websocket-server:v1.0.0 protrader5/websocket-server:latest
docker push protrader5/websocket-server:v1.0.0
docker push protrader5/websocket-server:latest
cd ../..
```

---

## Kubernetes Manifests

### Namespace

```yaml
# infrastructure/kubernetes/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: protrader5
```

### ConfigMap

```yaml
# infrastructure/kubernetes/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: protrader5-config
  namespace: protrader5
data:
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  MONGODB_URI: "mongodb://mongodb-0.mongodb:27017,mongodb-1.mongodb:27017,mongodb-2.mongodb:27017/protrader5?replicaSet=rs0"
  REDIS_HOST: "redis-master"
  REDIS_PORT: "6379"
  API_GATEWAY_URL: "https://api.protrader5.com"
  WEB_APP_URL: "https://protrader5.com"
```

### Secrets

```yaml
# infrastructure/kubernetes/secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: protrader5-secrets
  namespace: protrader5
type: Opaque
stringData:
  JWT_SECRET: "your-jwt-secret-here"
  MONGODB_PASSWORD: "your-mongodb-password"
  REDIS_PASSWORD: "your-redis-password"
  RAZORPAY_KEY_SECRET: "your-razorpay-secret"
  STRIPE_SECRET_KEY: "your-stripe-secret"
  ENCRYPTION_KEY: "your-encryption-key"
```

### User Service Deployment

```yaml
# infrastructure/kubernetes/user-service-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
  namespace: protrader5
spec:
  replicas: 3
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
    spec:
      containers:
      - name: user-service
        image: protrader5/user-service:v1.0.0
        ports:
        - containerPort: 3001
        envFrom:
        - configMapRef:
            name: protrader5-config
        - secretRef:
            name: protrader5-secrets
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: user-service
  namespace: protrader5
spec:
  selector:
    app: user-service
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3001
  type: ClusterIP
```

### Trading Service Deployment

```yaml
# infrastructure/kubernetes/trading-service-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: trading-service
  namespace: protrader5
spec:
  replicas: 5
  selector:
    matchLabels:
      app: trading-service
  template:
    metadata:
      labels:
        app: trading-service
    spec:
      containers:
      - name: trading-service
        image: protrader5/trading-service:v1.0.0
        ports:
        - containerPort: 3002
        envFrom:
        - configMapRef:
            name: protrader5-config
        - secretRef:
            name: protrader5-secrets
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3002
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3002
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: trading-service
  namespace: protrader5
spec:
  selector:
    app: trading-service
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3002
  type: ClusterIP
```

### MongoDB StatefulSet

```yaml
# infrastructure/kubernetes/mongodb-statefulset.yaml
apiVersion: v1
kind: Service
metadata:
  name: mongodb
  namespace: protrader5
spec:
  ports:
  - port: 27017
    targetPort: 27017
  clusterIP: None
  selector:
    app: mongodb
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: mongodb
  namespace: protrader5
spec:
  serviceName: mongodb
  replicas: 3
  selector:
    matchLabels:
      app: mongodb
  template:
    metadata:
      labels:
        app: mongodb
    spec:
      containers:
      - name: mongodb
        image: mongo:6
        ports:
        - containerPort: 27017
        env:
        - name: MONGO_INITDB_ROOT_USERNAME
          value: "admin"
        - name: MONGO_INITDB_ROOT_PASSWORD
          valueFrom:
            secretKeyRef:
              name: protrader5-secrets
              key: MONGODB_PASSWORD
        volumeMounts:
        - name: mongodb-data
          mountPath: /data/db
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
  volumeClaimTemplates:
  - metadata:
      name: mongodb-data
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 50Gi
```

### Redis StatefulSet

```yaml
# infrastructure/kubernetes/redis-statefulset.yaml
apiVersion: v1
kind: Service
metadata:
  name: redis-master
  namespace: protrader5
spec:
  ports:
  - port: 6379
    targetPort: 6379
  selector:
    app: redis
    role: master
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redis
  namespace: protrader5
spec:
  serviceName: redis-master
  replicas: 3
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
        role: master
    spec:
      containers:
      - name: redis
        image: redis:7
        ports:
        - containerPort: 6379
        command:
        - redis-server
        - --requirepass
        - $(REDIS_PASSWORD)
        env:
        - name: REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: protrader5-secrets
              key: REDIS_PASSWORD
        volumeMounts:
        - name: redis-data
          mountPath: /data
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
  volumeClaimTemplates:
  - metadata:
      name: redis-data
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 10Gi
```

### Ingress

```yaml
# infrastructure/kubernetes/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: protrader5-ingress
  namespace: protrader5
  annotations:
    kubernetes.io/ingress.class: "nginx"
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  tls:
  - hosts:
    - protrader5.com
    - api.protrader5.com
    - ws.protrader5.com
    secretName: protrader5-tls
  rules:
  - host: protrader5.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: web-app
            port:
              number: 80
  - host: api.protrader5.com
    http:
      paths:
      - path: /users
        pathType: Prefix
        backend:
          service:
            name: user-service
            port:
              number: 80
      - path: /trading
        pathType: Prefix
        backend:
          service:
            name: trading-service
            port:
              number: 80
      - path: /copy-trading
        pathType: Prefix
        backend:
          service:
            name: copy-trading-service
            port:
              number: 80
      - path: /algo-trading
        pathType: Prefix
        backend:
          service:
            name: algo-trading-service
            port:
              number: 80
      - path: /charting
        pathType: Prefix
        backend:
          service:
            name: charting-service
            port:
              number: 80
      - path: /risk
        pathType: Prefix
        backend:
          service:
            name: risk-management-service
            port:
              number: 80
      - path: /notifications
        pathType: Prefix
        backend:
          service:
            name: notification-service
            port:
              number: 80
      - path: /payments
        pathType: Prefix
        backend:
          service:
            name: payment-service
            port:
              number: 80
  - host: ws.protrader5.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: websocket-server
            port:
              number: 80
```

### Horizontal Pod Autoscaler

```yaml
# infrastructure/kubernetes/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: trading-service-hpa
  namespace: protrader5
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: trading-service
  minReplicas: 5
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

---

## Deployment Process

### Step 1: Create Namespace and Secrets

```bash
# Create namespace
kubectl apply -f infrastructure/kubernetes/namespace.yaml

# Create secrets (use actual values)
kubectl create secret generic protrader5-secrets \
  --from-literal=JWT_SECRET=your-jwt-secret \
  --from-literal=MONGODB_PASSWORD=your-mongodb-password \
  --from-literal=REDIS_PASSWORD=your-redis-password \
  --from-literal=RAZORPAY_KEY_SECRET=your-razorpay-secret \
  --from-literal=STRIPE_SECRET_KEY=your-stripe-secret \
  --from-literal=ENCRYPTION_KEY=your-encryption-key \
  -n protrader5

# Create ConfigMap
kubectl apply -f infrastructure/kubernetes/configmap.yaml
```

### Step 2: Deploy Databases

```bash
# Deploy MongoDB
kubectl apply -f infrastructure/kubernetes/mongodb-statefulset.yaml

# Wait for MongoDB to be ready
kubectl wait --for=condition=ready pod -l app=mongodb -n protrader5 --timeout=300s

# Deploy Redis
kubectl apply -f infrastructure/kubernetes/redis-statefulset.yaml

# Wait for Redis to be ready
kubectl wait --for=condition=ready pod -l app=redis -n protrader5 --timeout=300s
```

### Step 3: Deploy Microservices

```bash
# Deploy all services
kubectl apply -f infrastructure/kubernetes/user-service-deployment.yaml
kubectl apply -f infrastructure/kubernetes/trading-service-deployment.yaml
kubectl apply -f infrastructure/kubernetes/copy-trading-service-deployment.yaml
kubectl apply -f infrastructure/kubernetes/algo-trading-service-deployment.yaml
kubectl apply -f infrastructure/kubernetes/charting-service-deployment.yaml
kubectl apply -f infrastructure/kubernetes/risk-management-service-deployment.yaml
kubectl apply -f infrastructure/kubernetes/notification-service-deployment.yaml
kubectl apply -f infrastructure/kubernetes/payment-service-deployment.yaml
kubectl apply -f infrastructure/kubernetes/websocket-server-deployment.yaml

# Wait for all deployments to be ready
kubectl wait --for=condition=available deployment --all -n protrader5 --timeout=300s
```

### Step 4: Deploy Frontend

```bash
# Deploy web app
kubectl apply -f infrastructure/kubernetes/web-app-deployment.yaml

# Wait for deployment
kubectl wait --for=condition=available deployment/web-app -n protrader5 --timeout=300s
```

### Step 5: Configure Ingress

```bash
# Install Nginx Ingress Controller
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.2/deploy/static/provider/cloud/deploy.yaml

# Install cert-manager for SSL
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create ClusterIssuer for Let's Encrypt
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@protrader5.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF

# Deploy Ingress
kubectl apply -f infrastructure/kubernetes/ingress.yaml
```

### Step 6: Configure Autoscaling

```bash
# Deploy HPA for all services
kubectl apply -f infrastructure/kubernetes/hpa.yaml

# Verify HPA
kubectl get hpa -n protrader5
```

---

## Monitoring and Logging

### Install Prometheus and Grafana

```bash
# Add Helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install Prometheus
helm install prometheus prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace

# Access Grafana
kubectl port-forward -n monitoring svc/prometheus-grafana 3000:80
# Username: admin, Password: prom-operator
```

### Install ELK Stack

```bash
# Add Elastic Helm repo
helm repo add elastic https://helm.elastic.co
helm repo update

# Install Elasticsearch
helm install elasticsearch elastic/elasticsearch \
  --namespace logging \
  --create-namespace

# Install Kibana
helm install kibana elastic/kibana \
  --namespace logging

# Install Filebeat
helm install filebeat elastic/filebeat \
  --namespace logging
```

---

## Scaling and High Availability

### Cluster Autoscaling

```bash
# Enable cluster autoscaler (EKS)
eksctl create iamserviceaccount \
  --name cluster-autoscaler \
  --namespace kube-system \
  --cluster protrader5-cluster \
  --attach-policy-arn arn:aws:iam::aws:policy/AutoScalingFullAccess \
  --approve

# Deploy cluster autoscaler
kubectl apply -f https://raw.githubusercontent.com/kubernetes/autoscaler/master/cluster-autoscaler/cloudprovider/aws/examples/cluster-autoscaler-autodiscover.yaml
```

### Pod Disruption Budget

```yaml
# infrastructure/kubernetes/pdb.yaml
apiVersion: policy/v1
kind: PodDisruptionBudget
metadata:
  name: trading-service-pdb
  namespace: protrader5
spec:
  minAvailable: 3
  selector:
    matchLabels:
      app: trading-service
```

---

## Troubleshooting

### Common Issues

```bash
# Check pod status
kubectl get pods -n protrader5

# View pod logs
kubectl logs -f <pod-name> -n protrader5

# Describe pod
kubectl describe pod <pod-name> -n protrader5

# Execute command in pod
kubectl exec -it <pod-name> -n protrader5 -- /bin/sh

# Check service endpoints
kubectl get endpoints -n protrader5

# Check ingress
kubectl describe ingress protrader5-ingress -n protrader5

# View events
kubectl get events -n protrader5 --sort-by='.lastTimestamp'
```

---

## Deployment Checklist

- [ ] Kubernetes cluster created
- [ ] kubectl configured
- [ ] Docker images built and pushed
- [ ] Namespace created
- [ ] Secrets configured
- [ ] ConfigMap created
- [ ] MongoDB deployed
- [ ] Redis deployed
- [ ] All microservices deployed
- [ ] Frontend deployed
- [ ] Ingress configured
- [ ] SSL certificates issued
- [ ] HPA configured
- [ ] Monitoring installed
- [ ] Logging configured
- [ ] Backup configured
- [ ] DNS configured
- [ ] Load testing completed
- [ ] Production ready!

---

## Cost Estimate

| Component | Monthly Cost |
|-----------|--------------|
| EKS Cluster | $73 |
| EC2 Instances (3x t3.large) | $150 |
| EBS Volumes (100GB) | $10 |
| Load Balancer | $20 |
| Data Transfer | $50 |
| **Total** | **$303/month** |

---

## Next Steps

1. Create Kubernetes cluster
2. Build and push Docker images
3. Deploy databases
4. Deploy microservices
5. Configure ingress
6. Set up monitoring
7. Configure autoscaling
8. Run smoke tests
9. Go live!

---

## Support

For deployment issues:
- Email: devops@protrader5.com
- GitHub: https://github.com/AMITTHAKKAR3/protrader5-v2

## License

MIT License - See LICENSE file for details
