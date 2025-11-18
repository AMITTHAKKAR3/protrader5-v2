# User Service - Technical Specification

## Overview

The User Service is responsible for all user-related operations including authentication, authorization, profile management, KYC verification, and API key management.

## Responsibilities

- User registration and authentication
- JWT token generation and validation
- Two-factor authentication (2FA)
- User profile management
- KYC/AML verification
- API key generation and management
- Role-based access control (RBAC)
- Device management and tracking

## Technology Stack

- **Framework:** NestJS
- **Database:** MongoDB
- **Cache:** Redis
- **Authentication:** Passport.js with JWT strategy
- **2FA:** speakeasy (TOTP)
- **Validation:** class-validator

## Database Schema

### Users Collection

```typescript
{
  _id: ObjectId,
  email: string (unique, indexed),
  phone: string (unique, indexed),
  password: string (hashed with bcrypt),
  profile: {
    firstName: string,
    lastName: string,
    dateOfBirth: Date,
    address: object,
    avatar: string
  },
  role: string (enum: SuperAdmin, Admin, Master, Broker, Client),
  status: string (enum: Active, Inactive, Suspended),
  balance: number,
  margin: {
    used: number,
    free: number,
    total: number
  },
  leverage: number,
  twoFactorAuth: {
    enabled: boolean,
    secret: string,
    backupCodes: [string]
  },
  apiKeys: [{
    key: string (unique),
    secret: string (hashed),
    permissions: [string],
    ipWhitelist: [string],
    createdAt: Date,
    lastUsedAt: Date
  }],
  kyc: {
    status: string (enum: Pending, Verified, Rejected),
    documents: [object],
    verifiedAt: Date
  },
  devices: [{
    deviceId: string,
    deviceType: string,
    lastLoginAt: Date,
    ipAddress: string
  }],
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Authentication

- `POST /api/v2/auth/register` - Register new user
- `POST /api/v2/auth/login` - User login
- `POST /api/v2/auth/logout` - User logout
- `POST /api/v2/auth/refresh` - Refresh JWT token
- `POST /api/v2/auth/forgot-password` - Request password reset
- `POST /api/v2/auth/reset-password` - Reset password

### Two-Factor Authentication

- `POST /api/v2/auth/2fa/enable` - Enable 2FA
- `POST /api/v2/auth/2fa/verify` - Verify 2FA code
- `POST /api/v2/auth/2fa/disable` - Disable 2FA
- `GET /api/v2/auth/2fa/backup-codes` - Get backup codes

### User Profile

- `GET /api/v2/users/me` - Get current user profile
- `PUT /api/v2/users/me` - Update user profile
- `PUT /api/v2/users/me/password` - Change password
- `GET /api/v2/users/:id` - Get user by ID (Admin only)

### API Keys

- `POST /api/v2/users/me/api-keys` - Create new API key
- `GET /api/v2/users/me/api-keys` - List all API keys
- `DELETE /api/v2/users/me/api-keys/:key` - Delete API key
- `PUT /api/v2/users/me/api-keys/:key` - Update API key permissions

### KYC Management

- `POST /api/v2/users/me/kyc` - Submit KYC documents
- `GET /api/v2/users/me/kyc` - Get KYC status
- `PUT /api/v2/users/:id/kyc/verify` - Verify KYC (Admin only)
- `PUT /api/v2/users/:id/kyc/reject` - Reject KYC (Admin only)

## Events Published

- `user.registered` - When a new user registers
- `user.login` - When a user logs in
- `user.logout` - When a user logs out
- `user.profile.updated` - When user profile is updated
- `user.kyc.submitted` - When KYC documents are submitted
- `user.kyc.verified` - When KYC is verified
- `user.2fa.enabled` - When 2FA is enabled

## Dependencies

- **Internal:** None (this is a foundational service)
- **External:** Email service (for notifications), SMS service (for OTP)

## Security Considerations

- Passwords must be hashed using bcrypt with salt rounds >= 12
- JWT tokens should have short expiration (15 minutes for access, 7 days for refresh)
- 2FA secrets must be encrypted at rest
- API keys must be hashed before storage
- Rate limiting on authentication endpoints (5 attempts per 15 minutes)
- IP whitelisting for API keys
- Device fingerprinting for suspicious activity detection

## Performance Requirements

- Authentication response time: < 100ms
- Profile retrieval: < 50ms
- Support for 10,000+ concurrent authenticated users

## Testing

- Unit tests for all business logic
- Integration tests for API endpoints
- E2E tests for authentication flows
- Security testing (penetration testing, vulnerability scanning)
