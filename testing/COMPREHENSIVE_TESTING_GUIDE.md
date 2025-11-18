# Comprehensive Testing Guide for ProTrader5 v2.0

This guide provides detailed instructions for performing comprehensive testing including load testing, security testing, and user acceptance testing (UAT).

## Table of Contents

1. [Testing Overview](#testing-overview)
2. [Unit Testing](#unit-testing)
3. [Integration Testing](#integration-testing)
4. [End-to-End Testing](#end-to-end-testing)
5. [Load Testing](#load-testing)
6. [Security Testing](#security-testing)
7. [User Acceptance Testing](#user-acceptance-testing)
8. [Performance Testing](#performance-testing)
9. [Test Automation](#test-automation)
10. [Test Reports](#test-reports)

---

## Testing Overview

### Testing Pyramid

```
         /\
        /  \  E2E Tests (10%)
       /────\
      /      \  Integration Tests (30%)
     /────────\
    /          \  Unit Tests (60%)
   /────────────\
```

### Testing Phases

1. **Unit Testing** - Test individual components
2. **Integration Testing** - Test service interactions
3. **E2E Testing** - Test complete user flows
4. **Load Testing** - Test system under load
5. **Security Testing** - Test for vulnerabilities
6. **UAT** - Test with real users

---

## Unit Testing

### Setup Jest for Backend

```bash
# Install Jest and dependencies
npm install --save-dev jest @types/jest ts-jest supertest @nestjs/testing
```

```json
// jest.config.js
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
};
```

### Example Unit Tests

```typescript
// src/users/users.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getModelToken } from '@nestjs/mongoose';

describe('UsersService', () => {
  let service: UsersService;
  let mockUserModel: any;

  beforeEach(async () => {
    mockUserModel = {
      findOne: jest.fn(),
      create: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken('User'),
          useValue: mockUserModel,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      const mockUser = {
        _id: '123',
        email: 'test@example.com',
        name: 'Test User',
      };

      mockUserModel.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
    });

    it('should return null if user not found', async () => {
      mockUserModel.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto = {
        email: 'new@example.com',
        name: 'New User',
        password: 'password123',
      };

      const mockCreatedUser = {
        _id: '456',
        ...createUserDto,
      };

      mockUserModel.create.mockResolvedValue(mockCreatedUser);

      const result = await service.create(createUserDto);

      expect(result).toEqual(mockCreatedUser);
      expect(mockUserModel.create).toHaveBeenCalledWith(createUserDto);
    });
  });
});
```

### Frontend Unit Tests (React)

```typescript
// src/components/auth/Login.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import Login from './Login';
import { store } from '../../store';

describe('Login Component', () => {
  it('renders login form', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('validates email format', async () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </Provider>
    );

    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid credentials', async () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <Login />
        </BrowserRouter>
      </Provider>
    );

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      // Assert that login action was dispatched
    });
  });
});
```

### Run Unit Tests

```bash
# Backend
cd backend/services/user-service
npm test

# Frontend
cd frontend/web
npm test

# With coverage
npm test -- --coverage
```

---

## Integration Testing

### API Integration Tests

```typescript
// src/auth/auth.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          name: 'Test User',
          password: 'Password@123',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.email).toBe('test@example.com');
        });
    });

    it('should return 400 for invalid email', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          name: 'Test User',
          password: 'Password@123',
        })
        .expect(400);
    });
  });

  describe('/auth/login (POST)', () => {
    it('should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password@123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
        });
    });

    it('should return 401 for invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrong-password',
        })
        .expect(401);
    });
  });
});
```

---

## End-to-End Testing

### Setup Cypress

```bash
# Install Cypress
cd frontend/web
npm install --save-dev cypress @testing-library/cypress

# Initialize Cypress
npx cypress open
```

### E2E Test Examples

```typescript
// cypress/e2e/auth.cy.ts
describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000');
  });

  it('should register a new user', () => {
    cy.get('[data-testid="register-link"]').click();
    cy.url().should('include', '/register');

    cy.get('[data-testid="name-input"]').type('Test User');
    cy.get('[data-testid="email-input"]').type('test@example.com');
    cy.get('[data-testid="password-input"]').type('Password@123');
    cy.get('[data-testid="confirm-password-input"]').type('Password@123');
    cy.get('[data-testid="register-button"]').click();

    cy.url().should('include', '/dashboard');
    cy.contains('Welcome, Test User').should('be.visible');
  });

  it('should login existing user', () => {
    cy.get('[data-testid="email-input"]').type('test@example.com');
    cy.get('[data-testid="password-input"]').type('Password@123');
    cy.get('[data-testid="login-button"]').click();

    cy.url().should('include', '/dashboard');
  });

  it('should enable 2FA', () => {
    // Login first
    cy.login('test@example.com', 'Password@123');

    // Navigate to security settings
    cy.get('[data-testid="settings-link"]').click();
    cy.get('[data-testid="security-tab"]').click();

    // Enable 2FA
    cy.get('[data-testid="enable-2fa-button"]').click();
    cy.get('[data-testid="qr-code"]').should('be.visible');

    // Enter verification code
    cy.get('[data-testid="2fa-code-input"]').type('123456');
    cy.get('[data-testid="verify-2fa-button"]').click();

    cy.contains('2FA enabled successfully').should('be.visible');
  });
});

// cypress/e2e/trading.cy.ts
describe('Trading Flow', () => {
  beforeEach(() => {
    cy.login('trader@example.com', 'Password@123');
    cy.visit('http://localhost:3000/trading');
  });

  it('should place a market order', () => {
    cy.get('[data-testid="symbol-select"]').select('RELIANCE');
    cy.get('[data-testid="order-type-select"]').select('Market');
    cy.get('[data-testid="side-buy"]').click();
    cy.get('[data-testid="quantity-input"]').type('10');
    cy.get('[data-testid="place-order-button"]').click();

    cy.contains('Order placed successfully').should('be.visible');
    cy.get('[data-testid="open-orders-table"]').should('contain', 'RELIANCE');
  });

  it('should place a limit order', () => {
    cy.get('[data-testid="symbol-select"]').select('TCS');
    cy.get('[data-testid="order-type-select"]').select('Limit');
    cy.get('[data-testid="side-sell"]').click();
    cy.get('[data-testid="quantity-input"]').type('5');
    cy.get('[data-testid="price-input"]').type('3500');
    cy.get('[data-testid="place-order-button"]').click();

    cy.contains('Order placed successfully').should('be.visible');
  });

  it('should cancel an order', () => {
    cy.get('[data-testid="open-orders-table"]')
      .contains('tr', 'RELIANCE')
      .find('[data-testid="cancel-order-button"]')
      .click();

    cy.get('[data-testid="confirm-cancel-button"]').click();

    cy.contains('Order cancelled successfully').should('be.visible');
  });
});
```

### Run E2E Tests

```bash
# Open Cypress Test Runner
npx cypress open

# Run headless
npx cypress run

# Run specific test
npx cypress run --spec "cypress/e2e/auth.cy.ts"
```

---

## Load Testing

### Setup Artillery

```bash
# Install Artillery
npm install -g artillery

# Create test configuration
mkdir -p testing/load-tests
```

### Load Test Configuration

```yaml
# testing/load-tests/api-load-test.yml
config:
  target: "https://api.protrader5.com"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Ramp up load"
    - duration: 300
      arrivalRate: 100
      name: "Sustained load"
    - duration: 60
      arrivalRate: 200
      name: "Peak load"
  variables:
    authToken: "{{ $randomString() }}"
  plugins:
    expect: {}
  processor: "./load-test-processor.js"

scenarios:
  - name: "Authentication Flow"
    weight: 20
    flow:
      - post:
          url: "/auth/login"
          json:
            email: "test{{ $randomNumber(1, 1000) }}@example.com"
            password: "Password@123"
          capture:
            - json: "$.accessToken"
              as: "authToken"
          expect:
            - statusCode: 200

  - name: "Get Market Data"
    weight: 40
    flow:
      - get:
          url: "/market/quotes/RELIANCE"
          headers:
            Authorization: "Bearer {{ authToken }}"
          expect:
            - statusCode: 200
            - contentType: json
            - hasProperty: price

  - name: "Place Order"
    weight: 30
    flow:
      - post:
          url: "/orders"
          headers:
            Authorization: "Bearer {{ authToken }}"
          json:
            symbol: "TCS"
            type: "Market"
            side: "Buy"
            quantity: 10
          expect:
            - statusCode: 201

  - name: "Get Positions"
    weight: 10
    flow:
      - get:
          url: "/positions"
          headers:
            Authorization: "Bearer {{ authToken }}"
          expect:
            - statusCode: 200
```

### Load Test Processor

```javascript
// testing/load-tests/load-test-processor.js
module.exports = {
  setAuthToken: function(requestParams, context, ee, next) {
    // Set authentication token from previous request
    if (context.vars.authToken) {
      requestParams.headers = requestParams.headers || {};
      requestParams.headers['Authorization'] = `Bearer ${context.vars.authToken}`;
    }
    return next();
  },

  logResponse: function(requestParams, response, context, ee, next) {
    // Log response for debugging
    console.log(`Status: ${response.statusCode}, Body: ${JSON.stringify(response.body)}`);
    return next();
  },
};
```

### Run Load Tests

```bash
# Run load test
artillery run testing/load-tests/api-load-test.yml

# Generate HTML report
artillery run --output report.json testing/load-tests/api-load-test.yml
artillery report report.json

# Quick test
artillery quick --duration 60 --rate 10 https://api.protrader5.com/health
```

### Load Test Metrics

Monitor these metrics during load testing:

- **Response Time** - p50, p95, p99
- **Throughput** - Requests per second
- **Error Rate** - Percentage of failed requests
- **CPU Usage** - Server CPU utilization
- **Memory Usage** - Server memory utilization
- **Database Connections** - Active connections
- **WebSocket Connections** - Active WebSocket connections

---

## Security Testing

### 1. OWASP ZAP Scanning

```bash
# Install OWASP ZAP
docker pull owasp/zap2docker-stable

# Run baseline scan
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://protrader5.com \
  -r zap-report.html

# Run full scan
docker run -t owasp/zap2docker-stable zap-full-scan.py \
  -t https://protrader5.com \
  -r zap-full-report.html
```

### 2. SQL Injection Testing

```bash
# Install sqlmap
pip install sqlmap

# Test for SQL injection
sqlmap -u "https://api.protrader5.com/users?id=1" \
  --batch \
  --level=5 \
  --risk=3
```

### 3. XSS Testing

```javascript
// Test XSS vulnerabilities
const xssPayloads = [
  '<script>alert("XSS")</script>',
  '<img src=x onerror=alert("XSS")>',
  '<svg onload=alert("XSS")>',
  'javascript:alert("XSS")',
];

xssPayloads.forEach(payload => {
  // Test in input fields
  cy.get('[data-testid="search-input"]').type(payload);
  cy.get('[data-testid="search-button"]').click();
  
  // Verify payload is sanitized
  cy.get('body').should('not.contain', '<script>');
});
```

### 4. Authentication Testing

```typescript
// Test authentication vulnerabilities
describe('Authentication Security', () => {
  it('should prevent brute force attacks', async () => {
    const attempts = [];
    
    // Try 100 login attempts
    for (let i = 0; i < 100; i++) {
      attempts.push(
        request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'test@example.com',
            password: 'wrong-password',
          })
      );
    }

    const responses = await Promise.all(attempts);
    
    // Should be rate limited after certain attempts
    const rateLimited = responses.filter(r => r.status === 429);
    expect(rateLimited.length).toBeGreaterThan(0);
  });

  it('should prevent session fixation', async () => {
    // Get session ID before login
    const response1 = await request(app.getHttpServer()).get('/');
    const sessionBefore = response1.headers['set-cookie'];

    // Login
    const response2 = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Password@123',
      });

    const sessionAfter = response2.headers['set-cookie'];

    // Session ID should change after login
    expect(sessionBefore).not.toEqual(sessionAfter);
  });
});
```

### 5. API Security Testing

```bash
# Test API security with Postman/Newman
npm install -g newman

# Run security tests
newman run testing/security/api-security-tests.json \
  --environment testing/security/env.json \
  --reporters cli,html \
  --reporter-html-export security-report.html
```

---

## User Acceptance Testing

### UAT Test Plan

#### Test Scenarios

1. **User Registration and Login**
   - Register new account
   - Verify email
   - Login with credentials
   - Enable 2FA
   - Logout

2. **Trading Operations**
   - View market data
   - Place market order
   - Place limit order
   - Modify order
   - Cancel order
   - View positions
   - Close position

3. **Copy Trading**
   - Browse strategies
   - Subscribe to strategy
   - Monitor copied trades
   - Unsubscribe from strategy

4. **Algorithmic Trading**
   - Create algorithm
   - Run backtest
   - Deploy algorithm
   - Monitor performance
   - Pause/stop algorithm

5. **Account Management**
   - Deposit funds
   - Withdraw funds
   - View transaction history
   - Update profile
   - Change password

### UAT Checklist

```markdown
# UAT Checklist for ProTrader5 v2.0

## Authentication
- [ ] User can register successfully
- [ ] User receives verification email
- [ ] User can login with valid credentials
- [ ] User cannot login with invalid credentials
- [ ] User can enable 2FA
- [ ] User can reset password
- [ ] User can logout

## Trading
- [ ] User can view real-time market data
- [ ] User can place market order
- [ ] User can place limit order
- [ ] User can place stop loss order
- [ ] User can modify pending order
- [ ] User can cancel pending order
- [ ] User can view open positions
- [ ] User can close position
- [ ] User receives order confirmations
- [ ] User sees accurate P&L

## Copy Trading
- [ ] User can browse strategy marketplace
- [ ] User can view strategy details
- [ ] User can subscribe to strategy
- [ ] User sees copied trades
- [ ] User can unsubscribe from strategy
- [ ] User receives performance updates

## Payments
- [ ] User can deposit via Razorpay
- [ ] User can deposit via Stripe
- [ ] User receives deposit confirmation
- [ ] User can request withdrawal
- [ ] User receives withdrawal confirmation
- [ ] User can view transaction history

## Performance
- [ ] Pages load within 2 seconds
- [ ] Real-time data updates without lag
- [ ] No errors in browser console
- [ ] Mobile responsive design works
- [ ] Application works on different browsers

## Security
- [ ] Passwords are masked
- [ ] Sessions expire after inactivity
- [ ] Sensitive data is encrypted
- [ ] HTTPS is enforced
- [ ] XSS attacks are prevented
```

---

## Performance Testing

### Performance Benchmarks

| Metric | Target | Acceptable |
|--------|--------|------------|
| Page Load Time | < 2s | < 3s |
| API Response Time (p95) | < 200ms | < 500ms |
| WebSocket Latency | < 50ms | < 100ms |
| Time to Interactive | < 3s | < 5s |
| First Contentful Paint | < 1s | < 2s |

### Lighthouse Testing

```bash
# Install Lighthouse
npm install -g lighthouse

# Run Lighthouse audit
lighthouse https://protrader5.com \
  --output html \
  --output-path ./lighthouse-report.html \
  --chrome-flags="--headless"

# Run for mobile
lighthouse https://protrader5.com \
  --preset=mobile \
  --output html \
  --output-path ./lighthouse-mobile-report.html
```

### WebPageTest

Visit https://www.webpagetest.org/ and test:
- First Byte Time
- Start Render
- Speed Index
- Largest Contentful Paint
- Total Blocking Time
- Cumulative Layout Shift

---

## Test Automation

### CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [ master, develop ]
  pull_request:
    branches: [ master, develop ]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run unit tests
        run: npm test -- --coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v2

  integration-tests:
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo:6
        ports:
          - 27017:27017
      redis:
        image: redis:7
        ports:
          - 6379:6379
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run integration tests
        run: npm run test:e2e

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run Cypress tests
        uses: cypress-io/github-action@v4
        with:
          start: npm start
          wait-on: 'http://localhost:3000'

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run OWASP ZAP scan
        uses: zaproxy/action-baseline@v0.7.0
        with:
          target: 'https://protrader5.com'
```

---

## Test Reports

### Generate Test Reports

```bash
# Jest HTML Report
npm install --save-dev jest-html-reporter

# Cypress Report
npm install --save-dev mochawesome mochawesome-merge mochawesome-report-generator

# Artillery Report
artillery run --output report.json test.yml
artillery report report.json
```

### Test Coverage Goals

- **Unit Tests:** 80%+ coverage
- **Integration Tests:** 70%+ coverage
- **E2E Tests:** Critical user flows
- **Load Tests:** Pass performance benchmarks
- **Security Tests:** No high/critical vulnerabilities

---

## Testing Schedule

### Pre-Launch Testing

**Week 1:**
- Unit tests for all services
- Integration tests for API endpoints

**Week 2:**
- E2E tests for critical flows
- Load testing with 100 concurrent users

**Week 3:**
- Security testing and vulnerability scanning
- UAT with beta users

**Week 4:**
- Performance optimization
- Final regression testing

### Post-Launch Testing

**Daily:**
- Automated smoke tests
- Performance monitoring

**Weekly:**
- Regression test suite
- Security scans

**Monthly:**
- Full load testing
- Penetration testing

---

## Next Steps

1. Set up testing infrastructure
2. Write unit tests for all services
3. Create integration test suite
4. Implement E2E tests with Cypress
5. Perform load testing
6. Conduct security testing
7. Execute UAT with real users
8. Generate test reports
9. Fix identified issues
10. Repeat testing cycle

---

## Support

For testing issues:
- Email: qa@protrader5.com
- GitHub: https://github.com/AMITTHAKKAR3/protrader5-v2/issues

## License

MIT License - See LICENSE file for details
