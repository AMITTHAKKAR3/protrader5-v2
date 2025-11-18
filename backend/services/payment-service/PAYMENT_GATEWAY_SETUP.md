# Payment Gateway Configuration Guide for ProTrader5 v2.0

This guide provides comprehensive instructions for configuring Razorpay and Stripe payment gateways.

## Table of Contents

1. [Overview](#overview)
2. [Razorpay Setup](#razorpay-setup)
3. [Stripe Setup](#stripe-setup)
4. [Payment Flow Implementation](#payment-flow-implementation)
5. [Webhook Configuration](#webhook-configuration)
6. [Testing](#testing)
7. [Security Best Practices](#security-best-practices)

---

## Overview

### Payment Gateway Comparison

| Feature | Razorpay | Stripe |
|---------|----------|--------|
| **Primary Market** | India | Global |
| **Setup Difficulty** | Easy | Easy |
| **Transaction Fee** | 2% + GST | 2.9% + $0.30 |
| **Settlement Time** | T+3 days | 7 days |
| **Payment Methods** | UPI, Cards, Netbanking, Wallets | Cards, ACH, Wire |
| **Recurring Payments** | Yes | Yes |
| **Refunds** | Yes | Yes |
| **Documentation** | Excellent | Excellent |
| **Dashboard** | Excellent | Excellent |

### Integration Strategy

- **Primary Gateway:** Razorpay (for Indian users)
- **Secondary Gateway:** Stripe (for international users)
- **Fallback:** Manual bank transfer

---

## Razorpay Setup

### Step 1: Create Razorpay Account

1. Visit https://razorpay.com
2. Sign up for business account
3. Complete KYC verification
4. Submit business documents
5. Wait for account activation (1-2 business days)

### Step 2: Get API Credentials

1. Log in to Razorpay Dashboard
2. Navigate to Settings → API Keys
3. Generate Test Keys (for development)
4. Generate Live Keys (for production)
5. Note Key ID and Key Secret

```env
# Test Mode
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx

# Live Mode
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 3: Install Razorpay SDK

```bash
npm install razorpay
```

### Step 4: Implementation

```typescript
// src/payments/razorpay/razorpay.service.ts
import { Injectable } from '@nestjs/common';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

@Injectable()
export class RazorpayService {
  private razorpay: Razorpay;

  constructor() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }

  // Create order
  async createOrder(params: {
    amount: number; // in paise (₹100 = 10000 paise)
    currency: string;
    receipt: string;
    notes?: Record<string, any>;
  }) {
    try {
      const order = await this.razorpay.orders.create({
        amount: params.amount,
        currency: params.currency || 'INR',
        receipt: params.receipt,
        notes: params.notes,
      });
      return order;
    } catch (error) {
      throw new Error(`Failed to create Razorpay order: ${error.message}`);
    }
  }

  // Verify payment signature
  verifyPaymentSignature(params: {
    order_id: string;
    payment_id: string;
    signature: string;
  }): boolean {
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${params.order_id}|${params.payment_id}`)
      .digest('hex');

    return generated_signature === params.signature;
  }

  // Fetch payment details
  async getPayment(paymentId: string) {
    try {
      return await this.razorpay.payments.fetch(paymentId);
    } catch (error) {
      throw new Error(`Failed to fetch payment: ${error.message}`);
    }
  }

  // Capture payment
  async capturePayment(paymentId: string, amount: number) {
    try {
      return await this.razorpay.payments.capture(paymentId, amount, 'INR');
    } catch (error) {
      throw new Error(`Failed to capture payment: ${error.message}`);
    }
  }

  // Refund payment
  async refundPayment(paymentId: string, amount?: number) {
    try {
      const refundData: any = { payment_id: paymentId };
      if (amount) {
        refundData.amount = amount;
      }
      return await this.razorpay.payments.refund(paymentId, refundData);
    } catch (error) {
      throw new Error(`Failed to refund payment: ${error.message}`);
    }
  }

  // Create subscription
  async createSubscription(params: {
    plan_id: string;
    customer_notify: number;
    total_count: number;
    notes?: Record<string, any>;
  }) {
    try {
      return await this.razorpay.subscriptions.create(params);
    } catch (error) {
      throw new Error(`Failed to create subscription: ${error.message}`);
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string) {
    try {
      return await this.razorpay.subscriptions.cancel(subscriptionId);
    } catch (error) {
      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }
  }

  // Create customer
  async createCustomer(params: {
    name: string;
    email: string;
    contact: string;
    notes?: Record<string, any>;
  }) {
    try {
      return await this.razorpay.customers.create(params);
    } catch (error) {
      throw new Error(`Failed to create customer: ${error.message}`);
    }
  }

  // Create payment link
  async createPaymentLink(params: {
    amount: number;
    currency: string;
    description: string;
    customer: {
      name: string;
      email: string;
      contact: string;
    };
    notify: {
      sms: boolean;
      email: boolean;
    };
    callback_url: string;
    callback_method: string;
  }) {
    try {
      return await this.razorpay.paymentLink.create(params);
    } catch (error) {
      throw new Error(`Failed to create payment link: ${error.message}`);
    }
  }
}
```

### Step 5: Frontend Integration

```typescript
// frontend/src/services/razorpay.ts
export const initiateRazorpayPayment = async (orderData: {
  orderId: string;
  amount: number;
  currency: string;
  name: string;
  email: string;
  contact: string;
}) => {
  const options = {
    key: process.env.REACT_APP_RAZORPAY_KEY_ID,
    amount: orderData.amount,
    currency: orderData.currency,
    name: 'ProTrader5',
    description: 'Account Top-up',
    order_id: orderData.orderId,
    handler: async function (response: any) {
      // Verify payment on backend
      const verifyResponse = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: response.razorpay_order_id,
          payment_id: response.razorpay_payment_id,
          signature: response.razorpay_signature,
        }),
      });

      if (verifyResponse.ok) {
        alert('Payment successful!');
      } else {
        alert('Payment verification failed!');
      }
    },
    prefill: {
      name: orderData.name,
      email: orderData.email,
      contact: orderData.contact,
    },
    theme: {
      color: '#1976d2',
    },
  };

  const razorpay = new (window as any).Razorpay(options);
  razorpay.open();
};
```

---

## Stripe Setup

### Step 1: Create Stripe Account

1. Visit https://stripe.com
2. Sign up for account
3. Complete business verification
4. Submit required documents
5. Wait for account activation

### Step 2: Get API Credentials

1. Log in to Stripe Dashboard
2. Navigate to Developers → API keys
3. Copy Publishable Key and Secret Key

```env
# Test Mode
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxx

# Live Mode
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxx
```

### Step 3: Install Stripe SDK

```bash
npm install stripe
npm install --save-dev @types/stripe
```

### Step 4: Implementation

```typescript
// src/payments/stripe/stripe.service.ts
import { Injectable } from '@nestjs/common';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });
  }

  // Create payment intent
  async createPaymentIntent(params: {
    amount: number; // in cents ($100 = 10000 cents)
    currency: string;
    customer?: string;
    description?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      return await this.stripe.paymentIntents.create({
        amount: params.amount,
        currency: params.currency || 'usd',
        customer: params.customer,
        description: params.description,
        metadata: params.metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });
    } catch (error) {
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  }

  // Confirm payment intent
  async confirmPaymentIntent(paymentIntentId: string, paymentMethod: string) {
    try {
      return await this.stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethod,
      });
    } catch (error) {
      throw new Error(`Failed to confirm payment intent: ${error.message}`);
    }
  }

  // Retrieve payment intent
  async getPaymentIntent(paymentIntentId: string) {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      throw new Error(`Failed to retrieve payment intent: ${error.message}`);
    }
  }

  // Create refund
  async createRefund(params: {
    payment_intent: string;
    amount?: number;
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
  }) {
    try {
      return await this.stripe.refunds.create(params);
    } catch (error) {
      throw new Error(`Failed to create refund: ${error.message}`);
    }
  }

  // Create customer
  async createCustomer(params: {
    email: string;
    name: string;
    phone?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      return await this.stripe.customers.create(params);
    } catch (error) {
      throw new Error(`Failed to create customer: ${error.message}`);
    }
  }

  // Create subscription
  async createSubscription(params: {
    customer: string;
    items: Array<{ price: string }>;
    trial_period_days?: number;
    metadata?: Record<string, any>;
  }) {
    try {
      return await this.stripe.subscriptions.create(params);
    } catch (error) {
      throw new Error(`Failed to create subscription: ${error.message}`);
    }
  }

  // Cancel subscription
  async cancelSubscription(subscriptionId: string) {
    try {
      return await this.stripe.subscriptions.cancel(subscriptionId);
    } catch (error) {
      throw new Error(`Failed to cancel subscription: ${error.message}`);
    }
  }

  // Create checkout session
  async createCheckoutSession(params: {
    line_items: Array<{
      price_data: {
        currency: string;
        product_data: {
          name: string;
          description?: string;
        };
        unit_amount: number;
      };
      quantity: number;
    }>;
    mode: 'payment' | 'subscription';
    success_url: string;
    cancel_url: string;
    customer?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      return await this.stripe.checkout.sessions.create(params);
    } catch (error) {
      throw new Error(`Failed to create checkout session: ${error.message}`);
    }
  }

  // Construct webhook event
  constructWebhookEvent(payload: string | Buffer, signature: string) {
    try {
      return this.stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (error) {
      throw new Error(`Webhook signature verification failed: ${error.message}`);
    }
  }
}
```

### Step 5: Frontend Integration

```typescript
// frontend/src/services/stripe.ts
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

export const initiateStripePayment = async (clientSecret: string) => {
  const stripe = await stripePromise;
  
  const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
    payment_method: {
      card: elements.getElement(CardElement),
      billing_details: {
        name: 'User Name',
        email: 'user@example.com',
      },
    },
  });

  if (error) {
    console.error('Payment failed:', error);
    return { success: false, error };
  } else if (paymentIntent.status === 'succeeded') {
    console.log('Payment successful!');
    return { success: true, paymentIntent };
  }
};
```

---

## Payment Flow Implementation

### Deposit Flow

```typescript
// src/payments/payments.controller.ts
import { Controller, Post, Body, Headers, RawBodyRequest, Req } from '@nestjs/common';
import { RazorpayService } from './razorpay/razorpay.service';
import { StripeService } from './stripe/stripe.service';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly razorpayService: RazorpayService,
    private readonly stripeService: StripeService,
  ) {}

  // Create Razorpay order
  @Post('razorpay/create-order')
  async createRazorpayOrder(@Body() body: { amount: number; userId: string }) {
    const order = await this.razorpayService.createOrder({
      amount: body.amount * 100, // Convert to paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId: body.userId,
        type: 'deposit',
      },
    });

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    };
  }

  // Verify Razorpay payment
  @Post('razorpay/verify')
  async verifyRazorpayPayment(@Body() body: {
    order_id: string;
    payment_id: string;
    signature: string;
    userId: string;
  }) {
    const isValid = this.razorpayService.verifyPaymentSignature({
      order_id: body.order_id,
      payment_id: body.payment_id,
      signature: body.signature,
    });

    if (isValid) {
      // Update user balance
      // Create transaction record
      return { success: true, message: 'Payment verified successfully' };
    } else {
      return { success: false, message: 'Payment verification failed' };
    }
  }

  // Create Stripe payment intent
  @Post('stripe/create-payment-intent')
  async createStripePaymentIntent(@Body() body: { amount: number; userId: string }) {
    const paymentIntent = await this.stripeService.createPaymentIntent({
      amount: body.amount * 100, // Convert to cents
      currency: 'usd',
      description: 'Account deposit',
      metadata: {
        userId: body.userId,
        type: 'deposit',
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
    };
  }

  // Stripe webhook
  @Post('stripe/webhook')
  async handleStripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    const event = this.stripeService.constructWebhookEvent(
      req.rawBody,
      signature,
    );

    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        // Update user balance
        // Create transaction record
        break;
      case 'payment_intent.payment_failed':
        // Handle failed payment
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return { received: true };
  }
}
```

---

## Webhook Configuration

### Razorpay Webhooks

1. Log in to Razorpay Dashboard
2. Navigate to Settings → Webhooks
3. Add webhook URL: `https://api.protrader5.com/payments/razorpay/webhook`
4. Select events:
   - `payment.authorized`
   - `payment.captured`
   - `payment.failed`
   - `refund.created`
5. Save webhook secret

### Stripe Webhooks

1. Log in to Stripe Dashboard
2. Navigate to Developers → Webhooks
3. Add endpoint: `https://api.protrader5.com/payments/stripe/webhook`
4. Select events:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copy webhook signing secret

---

## Testing

### Razorpay Test Cards

| Card Number | CVV | Expiry | Result |
|-------------|-----|--------|--------|
| 4111 1111 1111 1111 | 123 | Any future date | Success |
| 4012 0010 3714 1112 | 123 | Any future date | Failure |

### Stripe Test Cards

| Card Number | CVV | Expiry | Result |
|-------------|-----|--------|--------|
| 4242 4242 4242 4242 | Any | Any future date | Success |
| 4000 0000 0000 0002 | Any | Any future date | Declined |
| 4000 0000 0000 9995 | Any | Any future date | Insufficient funds |

---

## Security Best Practices

1. **Never expose secret keys** in frontend code
2. **Verify webhook signatures** to prevent tampering
3. **Use HTTPS** for all payment endpoints
4. **Implement rate limiting** to prevent abuse
5. **Log all transactions** for audit trail
6. **Store sensitive data encrypted**
7. **Comply with PCI DSS** requirements
8. **Implement 3D Secure** for card payments
9. **Monitor for fraudulent transactions**
10. **Set up alerts** for suspicious activity

---

## Cost Summary

| Gateway | Setup Fee | Transaction Fee | Settlement Time |
|---------|-----------|-----------------|-----------------|
| Razorpay | Free | 2% + GST | T+3 days |
| Stripe | Free | 2.9% + $0.30 | 7 days |

---

## Next Steps

1. Create accounts on Razorpay and Stripe
2. Complete KYC verification
3. Obtain API credentials
4. Implement payment flows
5. Test with test cards
6. Configure webhooks
7. Go live!

---

## Support

For issues or questions:
- Razorpay: https://razorpay.com/support
- Stripe: https://support.stripe.com
- GitHub: https://github.com/AMITTHAKKAR3/protrader5-v2

## License

MIT License - See LICENSE file for details
