# ProTrader5 v2.0 - API Gateway

## Overview

The API Gateway provides a unified entry point for all ProTrader5 microservices using Kong API Gateway. It handles authentication, rate limiting, CORS, request routing, and monitoring.

---

## Features

- **Unified API Access:** Single entry point for all microservices
- **Authentication:** JWT-based authentication middleware
- **Rate Limiting:** Configurable rate limits per service
- **CORS:** Cross-Origin Resource Sharing configuration
- **Request Tracking:** Request ID and Correlation ID headers
- **Monitoring:** Prometheus metrics integration
- **Admin UI:** Konga web interface for Kong management

---

## Architecture

```
Client → Kong Gateway (Port 8000) → Microservices
         ↓
         Admin API (Port 8001)
         ↓
         Konga UI (Port 1337)
```

---

## Service Routes

| Service | Route | Port | Rate Limit |
|---------|-------|------|------------|
| User Service | `/api/v2/users`, `/api/v2/auth` | 3001 | 100/min |
| Trading Service | `/api/v2/trading` | 3002 | 200/min |
| Copy Trading Service | `/api/v2/copy-trading` | 3003 | 100/min |
| Algo Trading Service | `/api/v2/algo-trading` | 3004 | 100/min |
| Charting Service | `/api/v2/charts` | 3005 | 300/min |
| Risk Management Service | `/api/v2/risk` | 3006 | 100/min |
| Notification Service | `/api/v2/notifications` | 3007 | 100/min |
| Payment Service | `/api/v2/payments` | 3008 | 50/min |

---

## Setup

### Prerequisites

- Docker and Docker Compose
- All microservices running

### Installation

1. **Start Kong and dependencies:**

```bash
cd backend/api-gateway
docker-compose up -d
```

2. **Verify Kong is running:**

```bash
curl http://localhost:8001/status
```

3. **Access Konga Admin UI:**

Open browser: http://localhost:1337

4. **Configure Konga:**

- Create admin account
- Connect to Kong Admin API: http://kong:8001

---

## Configuration

### Kong Declarative Config

The `kong.yml` file defines all services, routes, and plugins in declarative format.

**Key Sections:**

- **Services:** Backend microservice definitions
- **Routes:** URL path routing rules
- **Plugins:** Rate limiting, CORS, JWT, monitoring

### Environment Variables

```bash
# Kong Database
KONG_DATABASE=postgres
KONG_PG_HOST=kong-database
KONG_PG_PORT=5432
KONG_PG_USER=kong
KONG_PG_PASSWORD=kong
KONG_PG_DATABASE=kong

# Kong Ports
KONG_PROXY_LISTEN=0.0.0.0:8000, 0.0.0.0:8443 ssl
KONG_ADMIN_LISTEN=0.0.0.0:8001
```

---

## Usage

### Making API Requests

**Without Authentication:**

```bash
# Login
curl -X POST http://localhost:8000/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

**With Authentication:**

```bash
# Get user profile
curl -X GET http://localhost:8000/api/v2/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Place Order:**

```bash
curl -X POST http://localhost:8000/api/v2/trading/orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "BTCUSD",
    "type": "LIMIT",
    "side": "BUY",
    "quantity": 0.1,
    "price": 50000
  }'
```

---

## Plugins

### Rate Limiting

Protects services from excessive requests.

**Configuration:**
```yaml
plugins:
  - name: rate-limiting
    config:
      minute: 100
      policy: local
```

### JWT Authentication

Validates JWT tokens for protected routes.

**Configuration:**
```yaml
plugins:
  - name: jwt
    config:
      key_claim_name: sub
      secret_is_base64: false
```

### CORS

Enables cross-origin requests from frontend applications.

**Configuration:**
```yaml
plugins:
  - name: cors
    config:
      origins:
        - "*"
      methods:
        - GET
        - POST
        - PUT
        - DELETE
      credentials: true
```

### Prometheus

Exposes metrics for monitoring.

**Configuration:**
```yaml
plugins:
  - name: prometheus
    config:
      per_consumer: true
```

**Metrics Endpoint:**
```bash
curl http://localhost:8001/metrics
```

---

## Monitoring

### Health Check

```bash
curl http://localhost:8001/status
```

### Service Status

```bash
curl http://localhost:8001/services
```

### Routes Status

```bash
curl http://localhost:8001/routes
```

### Metrics

```bash
curl http://localhost:8001/metrics
```

---

## Production Deployment

### Kubernetes

Kong can be deployed on Kubernetes using Helm:

```bash
helm repo add kong https://charts.konghq.com
helm repo update
helm install kong kong/kong --values values.yaml
```

### Load Balancing

For high availability, deploy multiple Kong instances behind a load balancer:

```
Load Balancer → Kong Instance 1
             → Kong Instance 2
             → Kong Instance 3
```

### SSL/TLS

Configure SSL certificates for HTTPS:

```yaml
services:
  kong:
    environment:
      KONG_SSL_CERT: /path/to/cert.pem
      KONG_SSL_CERT_KEY: /path/to/key.pem
```

---

## Troubleshooting

### Kong not starting

Check logs:
```bash
docker-compose logs kong
```

### Database connection issues

Verify PostgreSQL is running:
```bash
docker-compose ps kong-database
```

### Service not accessible

Check service registration:
```bash
curl http://localhost:8001/services
```

### Rate limit errors

Adjust rate limits in `kong.yml` and reload:
```bash
docker-compose restart kong
```

---

## Security Best Practices

1. **Change default passwords** for PostgreSQL and Konga
2. **Use environment variables** for sensitive configuration
3. **Enable HTTPS** in production with valid SSL certificates
4. **Restrict Admin API access** to internal network only
5. **Implement API key authentication** for public APIs
6. **Monitor rate limits** and adjust based on traffic patterns
7. **Regular security updates** for Kong and plugins

---

## Performance Tuning

### Connection Pooling

```yaml
environment:
  KONG_NGINX_HTTP_UPSTREAM_KEEPALIVE: 60
  KONG_NGINX_HTTP_UPSTREAM_KEEPALIVE_REQUESTS: 100
```

### Worker Processes

```yaml
environment:
  KONG_NGINX_WORKER_PROCESSES: 4
```

### Cache

```yaml
environment:
  KONG_DB_CACHE_TTL: 3600
```

---

## References

- [Kong Documentation](https://docs.konghq.com/)
- [Kong Declarative Configuration](https://docs.konghq.com/gateway/latest/production/deployment-topologies/db-less-and-declarative-config/)
- [Konga Documentation](https://github.com/pantsel/konga)
- [Kong Plugins](https://docs.konghq.com/hub/)

---

**Version:** 1.0  
**Last Updated:** November 18, 2025  
**Maintained by:** ProTrader5 DevOps Team
