# Security Hardening and Compliance Guide for ProTrader5 v2.0

This guide provides comprehensive instructions for implementing security hardening and ensuring compliance for ProTrader5 v2.0.

## Table of Contents

1. [Security Overview](#security-overview)
2. [Authentication Security](#authentication-security)
3. [API Security](#api-security)
4. [Database Security](#database-security)
5. [Network Security](#network-security)
6. [Application Security](#application-security)
7. [Compliance Requirements](#compliance-requirements)
8. [Security Monitoring](#security-monitoring)
9. [Incident Response](#incident-response)
10. [Security Checklist](#security-checklist)

---

## Security Overview

### Security Layers

```
┌─────────────────────────────────────┐
│   Layer 7: Application Security     │
├─────────────────────────────────────┤
│   Layer 6: API Security             │
├─────────────────────────────────────┤
│   Layer 5: Authentication/AuthZ     │
├─────────────────────────────────────┤
│   Layer 4: Network Security         │
├─────────────────────────────────────┤
│   Layer 3: Infrastructure Security  │
├─────────────────────────────────────┤
│   Layer 2: Database Security        │
├─────────────────────────────────────┤
│   Layer 1: Physical Security        │
└─────────────────────────────────────┘
```

### Security Principles

1. **Defense in Depth** - Multiple layers of security
2. **Least Privilege** - Minimum necessary permissions
3. **Zero Trust** - Verify everything, trust nothing
4. **Encryption Everywhere** - Data at rest and in transit
5. **Regular Audits** - Continuous security assessment

---

## Authentication Security

### 1. Password Policy

```typescript
// src/auth/password-policy.ts
export const PASSWORD_POLICY = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true,
  preventUserInfo: true,
  expiryDays: 90,
  historyCount: 5, // Prevent reuse of last 5 passwords
};

export function validatePassword(password: string, user: any): boolean {
  // Minimum length
  if (password.length < PASSWORD_POLICY.minLength) {
    throw new Error(`Password must be at least ${PASSWORD_POLICY.minLength} characters`);
  }

  // Uppercase
  if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
    throw new Error('Password must contain at least one uppercase letter');
  }

  // Lowercase
  if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
    throw new Error('Password must contain at least one lowercase letter');
  }

  // Numbers
  if (PASSWORD_POLICY.requireNumbers && !/[0-9]/.test(password)) {
    throw new Error('Password must contain at least one number');
  }

  // Special characters
  if (PASSWORD_POLICY.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    throw new Error('Password must contain at least one special character');
  }

  // Common passwords
  if (PASSWORD_POLICY.preventCommonPasswords) {
    const commonPasswords = ['password', '123456', 'qwerty', 'admin'];
    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
      throw new Error('Password is too common');
    }
  }

  // User info
  if (PASSWORD_POLICY.preventUserInfo) {
    const userInfo = [user.email, user.name, user.username].filter(Boolean);
    if (userInfo.some(info => password.toLowerCase().includes(info.toLowerCase()))) {
      throw new Error('Password cannot contain user information');
    }
  }

  return true;
}
```

### 2. Multi-Factor Authentication (MFA)

```typescript
// src/auth/mfa.service.ts
import { Injectable } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

@Injectable()
export class MFAService {
  // Generate MFA secret
  async generateSecret(user: any) {
    const secret = speakeasy.generateSecret({
      name: `ProTrader5 (${user.email})`,
      issuer: 'ProTrader5',
    });

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
    };
  }

  // Verify MFA token
  verifyToken(secret: string, token: string): boolean {
    return speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps before/after
    });
  }

  // Generate backup codes
  generateBackupCodes(count: number = 10): string[] {
    const codes = [];
    for (let i = 0; i < count; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }
}
```

### 3. Session Management

```typescript
// src/auth/session.service.ts
import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class SessionService {
  private redis: Redis;
  private readonly SESSION_TTL = 3600; // 1 hour
  private readonly MAX_SESSIONS_PER_USER = 5;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }

  // Create session
  async createSession(userId: string, metadata: any): Promise<string> {
    const sessionId = this.generateSessionId();
    const sessionKey = `session:${sessionId}`;
    const userSessionsKey = `user:${userId}:sessions`;

    // Store session data
    await this.redis.setex(
      sessionKey,
      this.SESSION_TTL,
      JSON.stringify({
        userId,
        ...metadata,
        createdAt: new Date().toISOString(),
      })
    );

    // Add to user's sessions
    await this.redis.sadd(userSessionsKey, sessionId);

    // Enforce max sessions
    const sessions = await this.redis.smembers(userSessionsKey);
    if (sessions.length > this.MAX_SESSIONS_PER_USER) {
      const oldestSession = sessions[0];
      await this.deleteSession(oldestSession);
    }

    return sessionId;
  }

  // Validate session
  async validateSession(sessionId: string): Promise<any> {
    const sessionKey = `session:${sessionId}`;
    const sessionData = await this.redis.get(sessionKey);

    if (!sessionData) {
      throw new Error('Invalid or expired session');
    }

    // Refresh TTL
    await this.redis.expire(sessionKey, this.SESSION_TTL);

    return JSON.parse(sessionData);
  }

  // Delete session
  async deleteSession(sessionId: string): Promise<void> {
    const sessionKey = `session:${sessionId}`;
    const sessionData = await this.redis.get(sessionKey);

    if (sessionData) {
      const { userId } = JSON.parse(sessionData);
      const userSessionsKey = `user:${userId}:sessions`;

      await this.redis.del(sessionKey);
      await this.redis.srem(userSessionsKey, sessionId);
    }
  }

  // Delete all user sessions
  async deleteAllUserSessions(userId: string): Promise<void> {
    const userSessionsKey = `user:${userId}:sessions`;
    const sessions = await this.redis.smembers(userSessionsKey);

    for (const sessionId of sessions) {
      await this.deleteSession(sessionId);
    }
  }

  private generateSessionId(): string {
    return require('crypto').randomBytes(32).toString('hex');
  }
}
```

---

## API Security

### 1. Rate Limiting

```typescript
// src/common/guards/rate-limit.guard.ts
import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RateLimitGuard implements CanActivate {
  private redis: Redis;
  private readonly WINDOW_SIZE = 60; // 1 minute
  private readonly MAX_REQUESTS = 100;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const identifier = this.getIdentifier(request);
    const key = `rate_limit:${identifier}`;

    const current = await this.redis.incr(key);

    if (current === 1) {
      await this.redis.expire(key, this.WINDOW_SIZE);
    }

    if (current > this.MAX_REQUESTS) {
      throw new HttpException(
        'Too many requests. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    // Add rate limit headers
    request.res.setHeader('X-RateLimit-Limit', this.MAX_REQUESTS);
    request.res.setHeader('X-RateLimit-Remaining', Math.max(0, this.MAX_REQUESTS - current));
    request.res.setHeader('X-RateLimit-Reset', Date.now() + this.WINDOW_SIZE * 1000);

    return true;
  }

  private getIdentifier(request: any): string {
    // Use user ID if authenticated, otherwise use IP
    return request.user?.id || request.ip;
  }
}
```

### 2. Input Validation

```typescript
// src/common/pipes/validation.pipe.ts
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import * as DOMPurify from 'isomorphic-dompurify';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // Sanitize input
    const sanitized = this.sanitizeInput(value);

    // Validate
    const object = plainToClass(metatype, sanitized);
    const errors = await validate(object);

    if (errors.length > 0) {
      throw new BadRequestException('Validation failed');
    }

    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private sanitizeInput(value: any): any {
    if (typeof value === 'string') {
      return DOMPurify.sanitize(value);
    } else if (typeof value === 'object' && value !== null) {
      const sanitized = {};
      for (const key in value) {
        sanitized[key] = this.sanitizeInput(value[key]);
      }
      return sanitized;
    }
    return value;
  }
}
```

### 3. CORS Configuration

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS configuration
  app.enableCors({
    origin: [
      'https://protrader5.com',
      'https://www.protrader5.com',
      'https://app.protrader5.com',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 3600,
  });

  await app.listen(3000);
}
bootstrap();
```

### 4. API Key Management

```typescript
// src/auth/api-key.service.ts
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class ApiKeyService {
  // Generate API key
  generateApiKey(): { key: string; secret: string } {
    const key = 'pk_' + crypto.randomBytes(16).toString('hex');
    const secret = 'sk_' + crypto.randomBytes(32).toString('hex');

    return { key, secret };
  }

  // Hash API secret
  hashSecret(secret: string): string {
    return crypto.createHash('sha256').update(secret).digest('hex');
  }

  // Verify API key
  async verifyApiKey(key: string, secret: string): Promise<boolean> {
    // Fetch stored hash from database
    const storedHash = await this.getStoredHash(key);
    const providedHash = this.hashSecret(secret);

    return storedHash === providedHash;
  }

  // Generate HMAC signature
  generateSignature(payload: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  }

  // Verify HMAC signature
  verifySignature(payload: string, signature: string, secret: string): boolean {
    const expectedSignature = this.generateSignature(payload, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  private async getStoredHash(key: string): Promise<string> {
    // Implement database lookup
    return '';
  }
}
```

---

## Database Security

### 1. Encryption at Rest

```typescript
// src/common/encryption/encryption.service.ts
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor() {
    // Derive key from environment variable
    this.key = crypto.scryptSync(
      process.env.ENCRYPTION_KEY,
      'salt',
      32
    );
  }

  // Encrypt data
  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  // Decrypt data
  decrypt(encryptedData: string): string {
    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
```

### 2. SQL Injection Prevention

```typescript
// Always use parameterized queries
// Bad - Vulnerable to SQL injection
const query = `SELECT * FROM users WHERE email = '${email}'`;

// Good - Using parameterized query
const query = 'SELECT * FROM users WHERE email = $1';
const result = await db.query(query, [email]);

// With Mongoose (MongoDB)
// Bad
const user = await User.findOne({ email: req.body.email });

// Good - Using query builder
const user = await User.findOne().where('email').equals(req.body.email);
```

### 3. Database Access Control

```yaml
# MongoDB user roles
roles:
  - role: readWrite
    db: protrader5
  - role: dbAdmin
    db: protrader5

# Create restricted user
db.createUser({
  user: "protrader5_app",
  pwd: "strong_password",
  roles: [
    { role: "readWrite", db: "protrader5" }
  ]
})
```

---

## Network Security

### 1. Firewall Rules

```bash
# Allow only necessary ports
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# Restrict SSH access
sudo ufw allow from 203.0.113.0/24 to any port 22
```

### 2. VPN Configuration

```bash
# Install WireGuard VPN
sudo apt update
sudo apt install wireguard

# Generate keys
wg genkey | tee privatekey | wg pubkey > publickey

# Configure WireGuard
sudo nano /etc/wireguard/wg0.conf

[Interface]
PrivateKey = <private-key>
Address = 10.0.0.1/24
ListenPort = 51820

[Peer]
PublicKey = <peer-public-key>
AllowedIPs = 10.0.0.2/32

# Start VPN
sudo wg-quick up wg0
sudo systemctl enable wg-quick@wg0
```

### 3. DDoS Protection

```nginx
# nginx.conf
http {
    # Limit request rate
    limit_req_zone $binary_remote_addr zone=one:10m rate=10r/s;
    limit_req zone=one burst=20 nodelay;

    # Limit connections
    limit_conn_zone $binary_remote_addr zone=addr:10m;
    limit_conn addr 10;

    # Timeout settings
    client_body_timeout 10s;
    client_header_timeout 10s;
    send_timeout 10s;

    # Buffer size limits
    client_body_buffer_size 1K;
    client_header_buffer_size 1k;
    client_max_body_size 1k;
    large_client_header_buffers 2 1k;
}
```

---

## Application Security

### 1. Dependency Scanning

```bash
# Install npm audit
npm audit

# Fix vulnerabilities
npm audit fix

# Install Snyk
npm install -g snyk
snyk test
snyk monitor
```

### 2. Security Headers

```typescript
// src/common/middleware/security-headers.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class SecurityHeadersMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // Prevent MIME sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Enable XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Content Security Policy
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
    );

    // Strict Transport Security
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );

    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions Policy
    res.setHeader(
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=()'
    );

    next();
  }
}
```

### 3. Logging and Auditing

```typescript
// src/common/interceptors/audit-log.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, ip, body } = request;

    const logEntry = {
      timestamp: new Date().toISOString(),
      method,
      url,
      userId: user?.id,
      ip,
      userAgent: request.headers['user-agent'],
      body: this.sanitizeBody(body),
    };

    return next.handle().pipe(
      tap({
        next: (response) => {
          this.log({ ...logEntry, status: 'success', response });
        },
        error: (error) => {
          this.log({ ...logEntry, status: 'error', error: error.message });
        },
      })
    );
  }

  private sanitizeBody(body: any): any {
    // Remove sensitive fields
    const sanitized = { ...body };
    delete sanitized.password;
    delete sanitized.apiKey;
    delete sanitized.secret;
    return sanitized;
  }

  private log(entry: any): void {
    // Send to logging service (e.g., Elasticsearch)
    console.log(JSON.stringify(entry));
  }
}
```

---

## Compliance Requirements

### 1. GDPR Compliance

**Data Protection Measures:**
- Data encryption at rest and in transit
- Right to access personal data
- Right to data portability
- Right to erasure (right to be forgotten)
- Data breach notification within 72 hours
- Privacy by design and by default

```typescript
// src/users/gdpr.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class GDPRService {
  // Export user data
  async exportUserData(userId: string): Promise<any> {
    // Collect all user data from all services
    const userData = {
      profile: await this.getUserProfile(userId),
      trades: await this.getUserTrades(userId),
      orders: await this.getUserOrders(userId),
      transactions: await this.getUserTransactions(userId),
    };

    return userData;
  }

  // Delete user data
  async deleteUserData(userId: string): Promise<void> {
    // Anonymize or delete user data
    await this.anonymizeUserProfile(userId);
    await this.deleteUserTrades(userId);
    await this.deleteUserOrders(userId);
    await this.deleteUserTransactions(userId);
  }

  // Data breach notification
  async notifyDataBreach(breach: any): Promise<void> {
    // Notify affected users within 72 hours
    // Notify supervisory authority
  }
}
```

### 2. PCI DSS Compliance

**Requirements:**
1. Install and maintain firewall configuration
2. Do not use vendor-supplied defaults
3. Protect stored cardholder data
4. Encrypt transmission of cardholder data
5. Use and regularly update anti-virus software
6. Develop and maintain secure systems
7. Restrict access to cardholder data
8. Assign unique ID to each person with access
9. Restrict physical access to cardholder data
10. Track and monitor all access to network resources
11. Regularly test security systems and processes
12. Maintain information security policy

**Implementation:**
- Use payment gateway (Razorpay/Stripe) - never store card data
- Implement tokenization
- Use TLS 1.2+ for all connections
- Regular security audits
- Access control and monitoring

### 3. KYC/AML Compliance

```typescript
// src/compliance/kyc.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class KYCService {
  // Verify user identity
  async verifyIdentity(userId: string, documents: any): Promise<boolean> {
    // Verify government-issued ID
    // Verify address proof
    // Perform facial recognition
    // Check against sanctions lists
    return true;
  }

  // Monitor suspicious activity
  async monitorTransactions(userId: string): Promise<void> {
    // Flag large transactions
    // Flag unusual patterns
    // Report suspicious activity
  }

  // Generate compliance report
  async generateComplianceReport(): Promise<any> {
    // Generate report for regulatory authorities
    return {};
  }
}
```

---

## Security Monitoring

### 1. Intrusion Detection

```bash
# Install Fail2Ban
sudo apt install fail2ban

# Configure Fail2Ban
sudo nano /etc/fail2ban/jail.local

[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = 22
logpath = /var/log/auth.log

# Start Fail2Ban
sudo systemctl start fail2ban
sudo systemctl enable fail2ban
```

### 2. Security Alerts

```typescript
// src/security/alert.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class SecurityAlertService {
  async sendAlert(alert: {
    severity: 'low' | 'medium' | 'high' | 'critical';
    type: string;
    message: string;
    metadata?: any;
  }): Promise<void> {
    // Send to security team
    // Log to SIEM
    // Create incident ticket

    if (alert.severity === 'critical') {
      // Send SMS/call to on-call engineer
      // Trigger automated response
    }
  }
}
```

---

## Incident Response

### Incident Response Plan

1. **Preparation**
   - Define incident response team
   - Establish communication channels
   - Create runbooks

2. **Detection**
   - Monitor security alerts
   - Analyze logs
   - Investigate anomalies

3. **Containment**
   - Isolate affected systems
   - Block malicious traffic
   - Preserve evidence

4. **Eradication**
   - Remove malware
   - Patch vulnerabilities
   - Update credentials

5. **Recovery**
   - Restore from backups
   - Verify system integrity
   - Monitor for recurrence

6. **Lessons Learned**
   - Document incident
   - Update procedures
   - Implement improvements

---

## Security Checklist

### Pre-Launch Checklist

- [ ] All passwords meet complexity requirements
- [ ] MFA enabled for all admin accounts
- [ ] API keys rotated and secured
- [ ] Rate limiting implemented
- [ ] Input validation on all endpoints
- [ ] CORS configured correctly
- [ ] Security headers implemented
- [ ] Database encryption enabled
- [ ] SSL/TLS certificates installed
- [ ] Firewall rules configured
- [ ] VPN access configured
- [ ] DDoS protection enabled
- [ ] Dependency vulnerabilities fixed
- [ ] Security audit completed
- [ ] Penetration testing completed
- [ ] Incident response plan documented
- [ ] Backup and recovery tested
- [ ] Compliance requirements met
- [ ] Security monitoring enabled
- [ ] Logging and auditing configured

### Ongoing Security Tasks

**Daily:**
- Monitor security alerts
- Review failed login attempts
- Check system logs

**Weekly:**
- Review access logs
- Update security patches
- Scan for vulnerabilities

**Monthly:**
- Rotate API keys
- Review user permissions
- Conduct security training
- Test backup recovery

**Quarterly:**
- Security audit
- Penetration testing
- Compliance review
- Incident response drill

**Annually:**
- Full security assessment
- Update security policies
- Renew SSL certificates
- Review disaster recovery plan

---

## Cost Summary

| Item | Monthly Cost |
|------|--------------|
| WAF (Web Application Firewall) | $50-$200 |
| DDoS Protection | $100-$500 |
| Security Monitoring | $100-$300 |
| Vulnerability Scanning | $50-$150 |
| Compliance Tools | $100-$500 |
| **Total** | **$400-$1,650/month** |

---

## Next Steps

1. Implement all security measures
2. Conduct security audit
3. Perform penetration testing
4. Document security procedures
5. Train team on security practices
6. Establish monitoring and alerting
7. Create incident response plan

---

## Support

For security issues:
- Email: security@protrader5.com
- Bug Bounty: https://protrader5.com/security/bug-bounty
- GitHub: https://github.com/AMITTHAKKAR3/protrader5-v2

## License

MIT License - See LICENSE file for details
