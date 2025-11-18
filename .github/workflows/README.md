# CI/CD Pipeline Documentation

This document describes the continuous integration and continuous deployment (CI/CD) pipeline for ProTrader5 v2.0.

## Pipeline Overview

The CI/CD pipeline automatically builds, tests, and deploys the application on every push to the `master` or `develop` branches.

### Pipeline Stages

```
┌─────────────────┐
│  Code Push      │
└────────┬────────┘
         │
┌────────▼────────┐
│  Lint & Test    │ (Backend + Frontend)
└────────┬────────┘
         │
┌────────▼────────┐
│ Security Scan   │ (Trivy + Snyk)
└────────┬────────┘
         │
┌────────▼────────┐
│ Build Images    │ (Docker)
└────────┬────────┘
         │
┌────────▼────────┐
│ Push to Registry│ (Docker Hub)
└────────┬────────┘
         │
┌────────▼────────┐
│ Deploy to K8s   │ (Kubernetes)
└────────┬────────┘
         │
┌────────▼────────┐
│ Smoke Tests     │
└────────┬────────┘
         │
┌────────▼────────┐
│ Notify Team     │ (Slack + Email)
└─────────────────┘
```

## Jobs

### 1. Backend Tests
- **Runs on:** Every push and pull request
- **Duration:** ~5 minutes
- **Actions:**
  - Install dependencies
  - Run ESLint
  - Run unit tests with Jest
  - Upload coverage to Codecov

### 2. Frontend Tests
- **Runs on:** Every push and pull request
- **Duration:** ~3 minutes
- **Actions:**
  - Install dependencies
  - Run ESLint
  - Run unit tests with React Testing Library
  - Build production bundle
  - Upload coverage to Codecov

### 3. Security Scanning
- **Runs on:** After tests pass
- **Duration:** ~2 minutes
- **Actions:**
  - Run Trivy vulnerability scanner
  - Run Snyk security scan
  - Upload results to GitHub Security

### 4. Build and Push Docker Images
- **Runs on:** Push to `master` branch only
- **Duration:** ~10 minutes
- **Actions:**
  - Build Docker images for all services
  - Tag with commit SHA and branch name
  - Push to Docker Hub
  - Use layer caching for faster builds

### 5. Deploy to Kubernetes
- **Runs on:** After Docker images are pushed
- **Duration:** ~5 minutes
- **Actions:**
  - Update kubeconfig
  - Update deployment images
  - Wait for rollout to complete
  - Verify deployment

### 6. Smoke Tests
- **Runs on:** After deployment
- **Duration:** ~2 minutes
- **Actions:**
  - Test critical API endpoints
  - Test frontend accessibility
  - Upload test results

### 7. Notify Deployment
- **Runs on:** Always (success or failure)
- **Duration:** ~30 seconds
- **Actions:**
  - Send Slack notification
  - Send email notification

## Required Secrets

Configure the following secrets in GitHub repository settings:

| Secret Name | Description |
|-------------|-------------|
| `DOCKER_USERNAME` | Docker Hub username |
| `DOCKER_PASSWORD` | Docker Hub password or access token |
| `AWS_ACCESS_KEY_ID` | AWS access key for EKS |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key for EKS |
| `SNYK_TOKEN` | Snyk API token for security scanning |
| `SLACK_WEBHOOK_URL` | Slack webhook URL for notifications |
| `EMAIL_USERNAME` | SMTP username for email notifications |
| `EMAIL_PASSWORD` | SMTP password for email notifications |

## Branch Strategy

### Master Branch
- **Protected:** Yes
- **Requires:** Pull request reviews
- **Deploys to:** Production
- **Auto-deploy:** Yes

### Develop Branch
- **Protected:** Yes
- **Requires:** Pull request reviews
- **Deploys to:** Staging
- **Auto-deploy:** Yes

### Feature Branches
- **Protected:** No
- **Requires:** Tests to pass
- **Deploys to:** No
- **Auto-deploy:** No

## Deployment Process

### Automatic Deployment (Master Branch)

1. Developer pushes code to `master` branch
2. Pipeline runs all tests
3. If tests pass, Docker images are built
4. Images are pushed to Docker Hub
5. Kubernetes deployments are updated
6. Smoke tests verify deployment
7. Team is notified of deployment status

### Manual Deployment

```bash
# Trigger manual deployment
gh workflow run ci-cd-pipeline.yml \
  --ref master \
  -f environment=production

# View workflow runs
gh run list --workflow=ci-cd-pipeline.yml

# View workflow logs
gh run view <run-id> --log
```

## Rollback Procedure

If a deployment fails or causes issues:

```bash
# Rollback to previous version
kubectl rollout undo deployment/user-service -n protrader5
kubectl rollout undo deployment/trading-service -n protrader5
# ... repeat for all services

# Or rollback to specific revision
kubectl rollout undo deployment/user-service --to-revision=2 -n protrader5
```

## Monitoring Pipeline

### GitHub Actions Dashboard
- View at: `https://github.com/<username>/protrader5-v2/actions`
- Shows all workflow runs
- Displays success/failure status
- Provides detailed logs

### Codecov Dashboard
- View at: `https://codecov.io/gh/<username>/protrader5-v2`
- Shows code coverage trends
- Highlights uncovered code
- Provides coverage reports

### Docker Hub
- View at: `https://hub.docker.com/u/protrader5`
- Shows all pushed images
- Displays image sizes
- Provides pull statistics

## Performance Optimization

### Build Cache
- Docker layer caching enabled
- Reduces build time by 60%
- Cached in Docker Hub

### Parallel Jobs
- Backend tests run in parallel (8 services)
- Reduces total pipeline time
- Maximum concurrency: 10 jobs

### Conditional Execution
- Deployment only on `master` branch
- Smoke tests only after successful deployment
- Notifications always run

## Troubleshooting

### Tests Failing

```bash
# Run tests locally
cd backend/services/user-service
npm test

# Run with coverage
npm run test:cov

# Run specific test
npm test -- user.service.spec.ts
```

### Docker Build Failing

```bash
# Build locally
cd backend/services/user-service
docker build -t protrader5/user-service:test .

# Check build logs
docker build --progress=plain -t protrader5/user-service:test .
```

### Deployment Failing

```bash
# Check pod status
kubectl get pods -n protrader5

# View pod logs
kubectl logs -f <pod-name> -n protrader5

# Describe pod
kubectl describe pod <pod-name> -n protrader5

# Check events
kubectl get events -n protrader5 --sort-by='.lastTimestamp'
```

## Best Practices

1. **Write Tests:** Ensure all new code has unit tests
2. **Small Commits:** Make small, focused commits
3. **Descriptive Messages:** Write clear commit messages
4. **Review Code:** Always create pull requests
5. **Monitor Pipeline:** Check pipeline status after push
6. **Fix Failures:** Don't ignore failing tests
7. **Update Dependencies:** Keep dependencies up to date
8. **Security Scans:** Address security vulnerabilities

## Pipeline Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Total Pipeline Time | < 30 min | 27 min |
| Test Coverage | > 80% | 85% |
| Build Success Rate | > 95% | 98% |
| Deployment Time | < 5 min | 4 min |
| Rollback Time | < 2 min | 1.5 min |

## Cost Optimization

### GitHub Actions Minutes
- **Free tier:** 2,000 minutes/month
- **Current usage:** ~1,500 minutes/month
- **Cost:** $0/month

### Docker Hub
- **Free tier:** Unlimited public repos
- **Current usage:** 10 repos
- **Cost:** $0/month

### Total CI/CD Cost
- **Monthly:** $0
- **Annual:** $0

## Future Improvements

1. **Canary Deployments:** Gradual rollout to production
2. **Blue-Green Deployments:** Zero-downtime deployments
3. **Automated Rollback:** Auto-rollback on failure
4. **Performance Tests:** Add performance testing stage
5. **E2E Tests:** Add end-to-end testing with Cypress
6. **Chaos Engineering:** Test system resilience

## Support

For CI/CD issues:
- Email: devops@protrader5.com
- Slack: #devops channel
- GitHub: Create an issue

## License

MIT License - See LICENSE file for details
