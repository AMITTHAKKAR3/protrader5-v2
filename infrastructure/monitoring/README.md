# ProTrader5 Monitoring Infrastructure

Comprehensive monitoring and logging infrastructure for ProTrader5 v2.0 using Prometheus, Grafana, and ELK Stack.

## Overview

This monitoring setup provides:
- **Metrics Collection** - Prometheus for time-series metrics
- **Visualization** - Grafana dashboards for real-time monitoring
- **Log Aggregation** - ELK Stack (Elasticsearch, Logstash, Kibana) for centralized logging
- **Alerting** - Prometheus Alertmanager for proactive notifications

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     ProTrader5 Services                      │
│  (User, Trading, Copy Trading, Algo, Charting, Risk, etc.)  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ├─── Metrics ───────► Prometheus ───► Grafana
                 │                          │
                 │                          └───► Alertmanager
                 │
                 └─── Logs ─────────► Logstash ───► Elasticsearch ───► Kibana
```

## Components

### 1. Prometheus

**Purpose:** Metrics collection and storage

**Configuration:** `prometheus/prometheus.yml`

**Monitored Services:**
- All 8 microservices (User, Trading, Copy Trading, Algo, Charting, Risk, Notification, Payment)
- WebSocket Server
- API Gateway (Kong)
- MongoDB
- Redis
- System metrics (Node Exporter)

**Metrics Collected:**
- HTTP request rate
- Response time (p50, p95, p99)
- Error rate
- CPU usage
- Memory usage
- Database connections
- WebSocket connections

**Alert Rules:** `prometheus/rules/alerts.yml`

**Alerts:**
- Service down
- High response time
- High error rate
- High CPU/memory usage
- Database connection issues
- Disk space low

**Access:** http://localhost:9090

### 2. Grafana

**Purpose:** Metrics visualization and dashboards

**Dashboards:**
- ProTrader5 Overview (`grafana/dashboards/protrader5-overview.json`)
  - Service health
  - Request rate
  - Response time
  - Error rate
  - CPU/memory usage
  - WebSocket connections
  - Database connections

**Features:**
- Real-time monitoring
- Custom dashboards
- Alert visualization
- Historical data analysis

**Access:** http://localhost:3000
- Default credentials: admin/admin

### 3. ELK Stack

**Purpose:** Centralized logging and log analysis

#### Elasticsearch
- Log storage and indexing
- Full-text search
- Log retention: 30 days (configurable)
- **Access:** http://localhost:9200

#### Logstash
- Log parsing and transformation
- JSON log parsing
- Error categorization
- Request detail extraction
- **Configuration:** `elk/logstash/pipeline/logstash.conf`

#### Kibana
- Log visualization
- Search and filtering
- Dashboard creation
- Log pattern analysis
- **Access:** http://localhost:5601

#### Filebeat
- Log shipping from Docker containers
- Automatic container discovery
- Metadata enrichment

## Setup Instructions

### Prerequisites
- Docker and Docker Compose installed
- Sufficient disk space (10GB+ recommended)
- Ports available: 9090, 3000, 9200, 5601, 5000

### 1. Start Prometheus and Grafana

```bash
cd infrastructure/monitoring/prometheus
docker-compose up -d
```

### 2. Start ELK Stack

```bash
cd infrastructure/monitoring/elk
docker-compose up -d
```

### 3. Verify Services

```bash
# Check Prometheus
curl http://localhost:9090/-/healthy

# Check Elasticsearch
curl http://localhost:9200/_cluster/health

# Check Grafana (web browser)
open http://localhost:3000

# Check Kibana (web browser)
open http://localhost:5601
```

### 4. Configure Grafana

1. Open Grafana: http://localhost:3000
2. Login with admin/admin
3. Add Prometheus data source:
   - URL: http://prometheus:9090
   - Access: Server (default)
4. Import dashboard:
   - Upload `grafana/dashboards/protrader5-overview.json`

### 5. Configure Kibana

1. Open Kibana: http://localhost:5601
2. Create index pattern:
   - Pattern: `protrader5-logs-*`
   - Time field: `@timestamp`
3. Create error index pattern:
   - Pattern: `protrader5-errors-*`
   - Time field: `@timestamp`

## Monitoring Best Practices

### Metrics to Watch

1. **Service Health**
   - All services should show `up = 1`
   - Alert if any service is down for > 1 minute

2. **Response Time**
   - p99 should be < 1 second
   - Alert if p99 > 1 second for > 5 minutes

3. **Error Rate**
   - Should be < 1%
   - Alert if > 5% for > 5 minutes

4. **Resource Usage**
   - CPU < 80%
   - Memory < 2GB per service
   - Alert if sustained high usage

5. **Database Connections**
   - MongoDB: Should have active connections
   - Redis: Should have connected clients
   - Alert if connections drop to 0

### Log Analysis

**Common Queries:**

```
# Find all errors in the last hour
level:ERROR AND @timestamp:[now-1h TO now]

# Find errors for a specific service
service_name:"trading-service" AND level:ERROR

# Find slow requests (> 1 second)
http.duration:>1000

# Find failed authentication attempts
message:"authentication failed"

# Find high-value transactions
message:"transaction" AND amount:>10000
```

### Alert Configuration

**Slack Integration:**

```yaml
# alertmanager.yml
route:
  receiver: 'slack-notifications'

receivers:
  - name: 'slack-notifications'
    slack_configs:
      - api_url: 'YOUR_SLACK_WEBHOOK_URL'
        channel: '#protrader5-alerts'
        title: '{{ .GroupLabels.alertname }}'
        text: '{{ range .Alerts }}{{ .Annotations.description }}{{ end }}'
```

**Email Integration:**

```yaml
# alertmanager.yml
receivers:
  - name: 'email-notifications'
    email_configs:
      - to: 'ops@protrader5.com'
        from: 'alerts@protrader5.com'
        smarthost: 'smtp.gmail.com:587'
        auth_username: 'alerts@protrader5.com'
        auth_password: 'YOUR_PASSWORD'
```

## Maintenance

### Data Retention

**Prometheus:**
- Default: 15 days
- Configure: `--storage.tsdb.retention.time=30d`

**Elasticsearch:**
- Default: 30 days
- Configure with Index Lifecycle Management (ILM)

### Backup

**Prometheus:**
```bash
# Snapshot
curl -XPOST http://localhost:9090/api/v1/admin/tsdb/snapshot
```

**Elasticsearch:**
```bash
# Create snapshot repository
curl -X PUT "localhost:9200/_snapshot/backup" -H 'Content-Type: application/json' -d'
{
  "type": "fs",
  "settings": {
    "location": "/backup"
  }
}
'

# Create snapshot
curl -X PUT "localhost:9200/_snapshot/backup/snapshot_1?wait_for_completion=true"
```

### Scaling

**Prometheus:**
- Use federation for multiple Prometheus instances
- Configure remote storage for long-term retention

**Elasticsearch:**
- Add more nodes to the cluster
- Configure sharding and replication

## Troubleshooting

### Prometheus Not Scraping Metrics

1. Check service is running: `docker ps`
2. Check metrics endpoint: `curl http://service:port/metrics`
3. Check Prometheus targets: http://localhost:9090/targets
4. Check Prometheus logs: `docker logs prometheus`

### Elasticsearch Not Receiving Logs

1. Check Logstash is running: `docker ps | grep logstash`
2. Check Logstash logs: `docker logs logstash`
3. Check Elasticsearch health: `curl http://localhost:9200/_cluster/health`
4. Check Filebeat logs: `docker logs filebeat`

### High Resource Usage

1. Reduce scrape interval in Prometheus
2. Reduce log retention in Elasticsearch
3. Optimize queries in Grafana dashboards
4. Add resource limits in Docker Compose

## Security

### Production Recommendations

1. **Enable Authentication:**
   - Prometheus: Use basic auth or OAuth2
   - Grafana: Configure SSO
   - Elasticsearch: Enable X-Pack security

2. **Use HTTPS:**
   - Configure TLS certificates
   - Use reverse proxy (Nginx)

3. **Network Isolation:**
   - Use Docker networks
   - Firewall rules
   - VPN access

4. **Access Control:**
   - Role-based access control (RBAC)
   - Audit logging
   - IP whitelisting

## Support

For issues or questions:
- GitHub: https://github.com/projectai397/protrader5-v2
- Documentation: See individual component READMEs

## License

MIT License - See LICENSE file for details
