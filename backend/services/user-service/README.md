# User Service - ProTrader5

## Overview

The User Service handles all user-related operations including authentication, authorization, profile management, two-factor authentication, and API key management for the ProTrader5 platform.

## Features

- ✅ User registration and authentication
- ✅ JWT-based authentication with refresh tokens
- ✅ Two-factor authentication (TOTP) with QR codes
- ✅ API key generation and management
- ✅ User profile management
- ✅ Device tracking
- ✅ KYC document management
- ✅ Role-based access control (RBAC)
- ✅ Password hashing with bcrypt
- ✅ Swagger API documentation

## Tech Stack

- **Framework:** NestJS
- **Language:** TypeScript
- **Database:** MongoDB
- **Cache:** Redis
- **Authentication:** Passport.js with JWT
- **2FA:** Speakeasy (TOTP)
- **Validation:** class-validator
- **Documentation:** Swagger/OpenAPI

## Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Update .env with your configuration
```

## Running the Service

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

## API Documentation

Once the service is running, access the Swagger documentation at:
```
http://localhost:3001/api/docs
```

## API Endpoints

### Authentication

- `POST /api/v2/auth/register` - Register new user
- `POST /api/v2/auth/login` - User login
- `POST /api/v2/auth/refresh` - Refresh access token
- `POST /api/v2/auth/logout` - User logout

### User Management

- `GET /api/v2/users/me` - Get current user profile
- `PATCH /api/v2/users/me` - Update current user profile
- `POST /api/v2/users/me/password` - Change password
- `GET /api/v2/users` - Get all users (Admin only)
- `GET /api/v2/users/:id` - Get user by ID (Admin only)
- `PATCH /api/v2/users/:id` - Update user by ID (Admin only)
- `DELETE /api/v2/users/:id` - Delete user by ID (Admin only)

### Two-Factor Authentication

- `POST /api/v2/users/me/2fa/enable` - Enable 2FA
- `POST /api/v2/users/me/2fa/verify` - Verify 2FA token
- `POST /api/v2/users/me/2fa/disable` - Disable 2FA

### API Key Management

- `POST /api/v2/users/me/api-keys` - Create new API key
- `DELETE /api/v2/users/me/api-keys/:key` - Delete API key

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Docker

```bash
# Build image
docker build -t protrader5/user-service:latest .

# Run container
docker run -p 3001:3001 --env-file .env protrader5/user-service:latest
```

## Environment Variables

See `.env.example` for all available configuration options.

## Security

- Passwords are hashed using bcrypt with 12 salt rounds
- JWT tokens have short expiration (15 minutes for access, 7 days for refresh)
- 2FA secrets are encrypted at rest
- API keys are hashed before storage
- Rate limiting is enabled on all endpoints
- Device fingerprinting for suspicious activity detection

## License

Proprietary - All rights reserved
