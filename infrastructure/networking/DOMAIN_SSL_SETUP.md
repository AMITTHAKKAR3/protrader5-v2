# ProTrader5 v2.0 - Domain and SSL Configuration Guide

This guide provides step-by-step instructions for configuring domain, SSL certificates, and networking for ProTrader5 v2.0.

## Table of Contents

1. [Domain Registration](#domain-registration)
2. [DNS Configuration](#dns-configuration)
3. [SSL Certificate Setup](#ssl-certificate-setup)
4. [Load Balancer Configuration](#load-balancer-configuration)
5. [CDN Configuration](#cdn-configuration)
6. [Email Configuration](#email-configuration)

---

## Domain Registration

### Step 1: Choose Domain Name

Recommended domain names:
- `protrader5.com` (primary)
- `protrader5.io` (alternative)
- `protrader5.app` (alternative)

### Step 2: Register Domain

**Option 1: AWS Route 53**

```bash
# Search for available domains
aws route53domains check-domain-availability \
  --domain-name protrader5.com

# Register domain
aws route53domains register-domain \
  --domain-name protrader5.com \
  --duration-in-years 1 \
  --admin-contact file://contact.json \
  --registrant-contact file://contact.json \
  --tech-contact file://contact.json \
  --auto-renew
```

**Option 2: GoDaddy / Namecheap / Google Domains**

1. Visit domain registrar website
2. Search for `protrader5.com`
3. Add to cart and complete purchase
4. Enable auto-renewal
5. Enable domain privacy protection

**Cost:** $10-$15/year

---

## DNS Configuration

### Step 1: Create Hosted Zone (AWS Route 53)

```bash
# Create hosted zone
aws route53 create-hosted-zone \
  --name protrader5.com \
  --caller-reference $(date +%s)

# Note the name servers from the output
export HOSTED_ZONE_ID=<zone-id>
```

### Step 2: Update Name Servers

If domain is registered with external registrar:

1. Log in to domain registrar
2. Navigate to DNS settings
3. Update name servers to Route 53 name servers:
   - `ns-1234.awsdns-12.org`
   - `ns-5678.awsdns-34.com`
   - `ns-9012.awsdns-56.net`
   - `ns-3456.awsdns-78.co.uk`

### Step 3: Create DNS Records

```bash
# Get load balancer DNS name
export LB_DNS=$(kubectl get svc kong-proxy -n kong -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

# Create A record for root domain
cat > change-batch.json <<EOF
{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "protrader5.com",
      "Type": "A",
      "AliasTarget": {
        "HostedZoneId": "Z35SXDOTRQ7X7K",
        "DNSName": "$LB_DNS",
        "EvaluateTargetHealth": false
      }
    }
  }]
}
EOF

aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch file://change-batch.json

# Create CNAME for www
cat > www-record.json <<EOF
{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "www.protrader5.com",
      "Type": "CNAME",
      "TTL": 300,
      "ResourceRecords": [{"Value": "protrader5.com"}]
    }
  }]
}
EOF

aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch file://www-record.json

# Create CNAME for API
cat > api-record.json <<EOF
{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "api.protrader5.com",
      "Type": "A",
      "AliasTarget": {
        "HostedZoneId": "Z35SXDOTRQ7X7K",
        "DNSName": "$LB_DNS",
        "EvaluateTargetHealth": false
      }
    }
  }]
}
EOF

aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch file://api-record.json
```

### Step 4: Verify DNS Propagation

```bash
# Check DNS resolution
dig protrader5.com
dig www.protrader5.com
dig api.protrader5.com

# Or use online tools
# https://dnschecker.org
```

---

## SSL Certificate Setup

### Option 1: AWS Certificate Manager (ACM)

**Step 1: Request Certificate**

```bash
# Request certificate for multiple domains
aws acm request-certificate \
  --domain-name protrader5.com \
  --subject-alternative-names www.protrader5.com api.protrader5.com *.protrader5.com \
  --validation-method DNS \
  --region us-east-1

# Note the certificate ARN
export CERT_ARN=<certificate-arn>
```

**Step 2: Validate Certificate**

```bash
# Get validation records
aws acm describe-certificate \
  --certificate-arn $CERT_ARN \
  --region us-east-1

# Add CNAME records to Route 53 for validation
# (ACM will provide the Name and Value)

cat > validation-record.json <<EOF
{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "_validation-hash.protrader5.com",
      "Type": "CNAME",
      "TTL": 300,
      "ResourceRecords": [{"Value": "_validation-value.acm-validations.aws."}]
    }
  }]
}
EOF

aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch file://validation-record.json

# Wait for validation (usually 5-30 minutes)
aws acm wait certificate-validated \
  --certificate-arn $CERT_ARN \
  --region us-east-1
```

### Option 2: Let's Encrypt with cert-manager

**Step 1: Install cert-manager**

```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Verify installation
kubectl get pods -n cert-manager
```

**Step 2: Create ClusterIssuer**

```yaml
# cluster-issuer.yaml
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
```

```bash
kubectl apply -f cluster-issuer.yaml
```

**Step 3: Create Certificate**

```yaml
# certificate.yaml
apiVersion: cert-manager.io/v1
kind:Certificate
metadata:
  name: protrader5-tls
  namespace: default
spec:
  secretName: protrader5-tls
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
  - protrader5.com
  - www.protrader5.com
  - api.protrader5.com
```

```bash
kubectl apply -f certificate.yaml

# Check certificate status
kubectl get certificate
kubectl describe certificate protrader5-tls
```

---

## Load Balancer Configuration

### AWS Application Load Balancer

**Step 1: Create Target Groups**

```bash
# Create target group for frontend
aws elbv2 create-target-group \
  --name protrader5-frontend \
  --protocol HTTP \
  --port 80 \
  --vpc-id $VPC_ID \
  --health-check-path / \
  --health-check-interval-seconds 30 \
  --health-check-timeout-seconds 5 \
  --healthy-threshold-count 2 \
  --unhealthy-threshold-count 3

# Create target group for API
aws elbv2 create-target-group \
  --name protrader5-api \
  --protocol HTTP \
  --port 8000 \
  --vpc-id $VPC_ID \
  --health-check-path /health \
  --health-check-interval-seconds 30
```

**Step 2: Create Application Load Balancer**

```bash
# Create ALB
aws elbv2 create-load-balancer \
  --name protrader5-alb \
  --subnets subnet-xxxxx subnet-yyyyy \
  --security-groups sg-xxxxx \
  --scheme internet-facing \
  --type application \
  --ip-address-type ipv4

export ALB_ARN=<alb-arn>
```

**Step 3: Create Listeners**

```bash
# Create HTTPS listener
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=$CERT_ARN \
  --default-actions Type=forward,TargetGroupArn=$FRONTEND_TG_ARN

# Create HTTP listener (redirect to HTTPS)
aws elbv2 create-listener \
  --load-balancer-arn $ALB_ARN \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=redirect,RedirectConfig={Protocol=HTTPS,Port=443,StatusCode=HTTP_301}
```

**Step 4: Create Listener Rules**

```bash
# Rule for API subdomain
aws elbv2 create-rule \
  --listener-arn $LISTENER_ARN \
  --priority 1 \
  --conditions Field=host-header,Values=api.protrader5.com \
  --actions Type=forward,TargetGroupArn=$API_TG_ARN
```

### Kubernetes Ingress

```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: protrader5-ingress
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/force-ssl-redirect: "true"
spec:
  tls:
  - hosts:
    - protrader5.com
    - www.protrader5.com
    - api.protrader5.com
    secretName: protrader5-tls
  rules:
  - host: protrader5.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 80
  - host: www.protrader5.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 80
  - host: api.protrader5.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: kong-proxy
            port:
              number: 8000
```

```bash
kubectl apply -f ingress.yaml
```

---

## CDN Configuration

### CloudFront Setup

**Step 1: Create Distribution**

```bash
# Create distribution config
cat > distribution-config.json <<EOF
{
  "CallerReference": "$(date +%s)",
  "Aliases": {
    "Quantity": 2,
    "Items": ["protrader5.com", "www.protrader5.com"]
  },
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [{
      "Id": "ALB-Origin",
      "DomainName": "$ALB_DNS",
      "CustomOriginConfig": {
        "HTTPPort": 80,
        "HTTPSPort": 443,
        "OriginProtocolPolicy": "https-only",
        "OriginSslProtocols": {
          "Quantity": 1,
          "Items": ["TLSv1.2"]
        }
      }
    }]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "ALB-Origin",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 7,
      "Items": ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    },
    "ForwardedValues": {
      "QueryString": true,
      "Cookies": {"Forward": "all"},
      "Headers": {
        "Quantity": 1,
        "Items": ["*"]
      }
    },
    "MinTTL": 0,
    "DefaultTTL": 0,
    "MaxTTL": 31536000,
    "Compress": true
  },
  "ViewerCertificate": {
    "ACMCertificateArn": "$CERT_ARN",
    "SSLSupportMethod": "sni-only",
    "MinimumProtocolVersion": "TLSv1.2_2021"
  },
  "Enabled": true
}
EOF

# Create distribution
aws cloudfront create-distribution \
  --distribution-config file://distribution-config.json
```

**Step 2: Update DNS to Point to CloudFront**

```bash
# Get CloudFront domain name
export CF_DOMAIN=<cloudfront-domain-name>

# Update Route 53 A record
cat > cloudfront-record.json <<EOF
{
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "protrader5.com",
      "Type": "A",
      "AliasTarget": {
        "HostedZoneId": "Z2FDTNDATAQYW2",
        "DNSName": "$CF_DOMAIN",
        "EvaluateTargetHealth": false
      }
    }
  }]
}
EOF

aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch file://cloudfront-record.json
```

---

## Email Configuration

### AWS SES Setup

**Step 1: Verify Domain**

```bash
# Verify domain
aws ses verify-domain-identity \
  --domain protrader5.com

# Add TXT record for verification
# (SES will provide the verification token)
```

**Step 2: Configure DKIM**

```bash
# Generate DKIM tokens
aws ses verify-domain-dkim \
  --domain protrader5.com

# Add CNAME records for DKIM
# (SES will provide 3 CNAME records)
```

**Step 3: Configure SPF and DMARC**

```bash
# Add SPF record
cat > spf-record.json <<EOF
{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "protrader5.com",
      "Type": "TXT",
      "TTL": 300,
      "ResourceRecords": [{"Value": "\"v=spf1 include:amazonses.com ~all\""}]
    }
  }]
}
EOF

aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch file://spf-record.json

# Add DMARC record
cat > dmarc-record.json <<EOF
{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "_dmarc.protrader5.com",
      "Type": "TXT",
      "TTL": 300,
      "ResourceRecords": [{"Value": "\"v=DMARC1; p=quarantine; rua=mailto:dmarc@protrader5.com\""}]
    }
  }]
}
EOF

aws route53 change-resource-record-sets \
  --hosted-zone-id $HOSTED_ZONE_ID \
  --change-batch file://dmarc-record.json
```

---

## Verification Checklist

- [ ] Domain registered and auto-renewal enabled
- [ ] DNS name servers updated
- [ ] A records created for root and www
- [ ] CNAME record created for API subdomain
- [ ] SSL certificate issued and validated
- [ ] Load balancer configured with HTTPS listener
- [ ] HTTP to HTTPS redirect enabled
- [ ] CDN configured (optional)
- [ ] Email domain verified
- [ ] DKIM, SPF, and DMARC configured
- [ ] All DNS changes propagated (24-48 hours)

---

## Testing

```bash
# Test HTTPS
curl -I https://protrader5.com
curl -I https://www.protrader5.com
curl -I https://api.protrader5.com

# Test HTTP redirect
curl -I http://protrader5.com

# Test SSL certificate
openssl s_client -connect protrader5.com:443 -servername protrader5.com

# Test email sending
aws ses send-email \
  --from noreply@protrader5.com \
  --destination ToAddresses=test@example.com \
  --message Subject={Data="Test Email"},Body={Text={Data="This is a test email"}}
```

---

## Troubleshooting

### DNS Not Resolving

- Wait 24-48 hours for DNS propagation
- Check name servers are correctly configured
- Use `dig` or `nslookup` to verify DNS records

### SSL Certificate Not Working

- Verify certificate is issued and validated
- Check certificate ARN in load balancer configuration
- Ensure certificate includes all required domains

### Load Balancer Not Accessible

- Check security groups allow inbound traffic on ports 80 and 443
- Verify target groups have healthy targets
- Check listener rules are correctly configured

---

## Cost Summary

| Service | Monthly Cost |
|---------|--------------|
| Domain Registration | $1-$2 |
| Route 53 Hosted Zone | $0.50 |
| ACM Certificate | Free |
| Application Load Balancer | $25 |
| CloudFront (optional) | $50-$100 |
| SES (1M emails) | $10 |
| **Total** | **~$87-$138/month** |

---

## Next Steps

After completing domain and SSL setup:

1. Deploy applications to Kubernetes
2. Configure monitoring and logging
3. Perform load testing
4. Go live!

---

## Support

For issues or questions:
- GitHub: https://github.com/AMITTHAKKAR3/protrader5-v2
- Documentation: See individual service READMEs

## License

MIT License - See LICENSE file for details
