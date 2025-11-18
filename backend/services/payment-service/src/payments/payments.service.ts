import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Transaction, TransactionDocument } from '../database/schemas/transaction.schema';
import Razorpay from 'razorpay';
import Stripe from 'stripe';
import * as crypto from 'crypto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);
  private razorpay: Razorpay;
  private stripe: Stripe;

  constructor(
    @InjectModel(Transaction.name) private transactionModel: Model<TransactionDocument>,
  ) {
    // Initialize Razorpay
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_key',
      key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret',
    });

    // Initialize Stripe
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_key', {
      apiVersion: '2024-11-20.acacia',
    });
  }

  async createDeposit(
    userId: string,
    amount: number,
    currency: string,
    paymentMethod: string,
  ): Promise<any> {
    const transaction = new this.transactionModel({
      userId: new Types.ObjectId(userId),
      type: 'Deposit',
      amount,
      currency,
      paymentMethod,
      status: 'Pending',
      netAmount: amount,
      description: `Deposit of ${amount} ${currency}`,
    });

    await transaction.save();

    if (paymentMethod === 'Razorpay') {
      return this.createRazorpayOrder(transaction);
    } else if (paymentMethod === 'Stripe') {
      return this.createStripePaymentIntent(transaction);
    }

    throw new BadRequestException('Unsupported payment method');
  }

  private async createRazorpayOrder(transaction: TransactionDocument): Promise<any> {
    const order = await this.razorpay.orders.create({
      amount: transaction.amount * 100, // Convert to paise
      currency: transaction.currency,
      receipt: transaction._id.toString(),
      notes: {
        userId: transaction.userId.toString(),
        transactionId: transaction._id.toString(),
      },
    });

    transaction.orderId = order.id;
    await transaction.save();

    return {
      orderId: order.id,
      amount: transaction.amount,
      currency: transaction.currency,
      key: process.env.RAZORPAY_KEY_ID,
      transactionId: transaction._id,
    };
  }

  private async createStripePaymentIntent(transaction: TransactionDocument): Promise<any> {
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: transaction.amount * 100, // Convert to cents
      currency: transaction.currency.toLowerCase(),
      metadata: {
        userId: transaction.userId.toString(),
        transactionId: transaction._id.toString(),
      },
    });

    transaction.paymentId = paymentIntent.id;
    await transaction.save();

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: transaction.amount,
      currency: transaction.currency,
      transactionId: transaction._id,
    };
  }

  async verifyRazorpayPayment(
    orderId: string,
    paymentId: string,
    signature: string,
  ): Promise<Transaction> {
    const transaction = await this.transactionModel.findOne({ orderId });

    if (!transaction) {
      throw new BadRequestException('Transaction not found');
    }

    // Verify signature
    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret')
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      transaction.status = 'Failed';
      transaction.failureReason = 'Invalid signature';
      await transaction.save();
      throw new BadRequestException('Invalid payment signature');
    }

    transaction.paymentId = paymentId;
    transaction.signature = signature;
    transaction.status = 'Completed';
    transaction.completedAt = new Date();
    await transaction.save();

    return transaction;
  }

  async verifyStripePayment(paymentIntentId: string): Promise<Transaction> {
    const transaction = await this.transactionModel.findOne({ paymentId: paymentIntentId });

    if (!transaction) {
      throw new BadRequestException('Transaction not found');
    }

    const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      transaction.status = 'Completed';
      transaction.completedAt = new Date();
      await transaction.save();
    } else {
      transaction.status = 'Failed';
      transaction.failureReason = `Payment status: ${paymentIntent.status}`;
      await transaction.save();
    }

    return transaction;
  }

  async createWithdrawal(
    userId: string,
    amount: number,
    currency: string,
    bankDetails: any,
  ): Promise<Transaction> {
    // Verify user has sufficient balance (would call wallet service in production)
    
    const transaction = new this.transactionModel({
      userId: new Types.ObjectId(userId),
      type: 'Withdrawal',
      amount,
      currency,
      paymentMethod: 'BankTransfer',
      status: 'Processing',
      netAmount: amount,
      description: `Withdrawal of ${amount} ${currency}`,
      metadata: { bankDetails },
    });

    await transaction.save();

    // Process withdrawal (would integrate with banking API in production)
    this.processWithdrawal(transaction);

    return transaction;
  }

  private async processWithdrawal(transaction: TransactionDocument): Promise<void> {
    try {
      // Simulate withdrawal processing
      await new Promise((resolve) => setTimeout(resolve, 5000));

      transaction.status = 'Completed';
      transaction.completedAt = new Date();
      transaction.bankReference = `BANK${Date.now()}`;
      await transaction.save();

      this.logger.log(`Withdrawal completed: ${transaction._id}`);
    } catch (error) {
      transaction.status = 'Failed';
      transaction.failureReason = error.message;
      await transaction.save();

      this.logger.error(`Withdrawal failed: ${transaction._id}`, error);
    }
  }

  async getTransactions(userId: string, filters?: any): Promise<Transaction[]> {
    const query: any = { userId: new Types.ObjectId(userId) };

    if (filters?.type) {
      query.type = filters.type;
    }

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      query.createdAt = {};
      if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
      if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
    }

    return this.transactionModel
      .find(query)
      .sort({ createdAt: -1 })
      .limit(filters?.limit || 100)
      .exec();
  }

  async getTransaction(userId: string, transactionId: string): Promise<Transaction> {
    return this.transactionModel.findOne({
      _id: transactionId,
      userId: new Types.ObjectId(userId),
    });
  }

  async getTransactionStats(userId: string): Promise<any> {
    const transactions = await this.transactionModel.find({
      userId: new Types.ObjectId(userId),
      status: 'Completed',
    });

    const totalDeposits = transactions
      .filter((t) => t.type === 'Deposit')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalWithdrawals = transactions
      .filter((t) => t.type === 'Withdrawal')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalCommissions = transactions
      .filter((t) => t.type === 'Commission')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalSubscriptions = transactions
      .filter((t) => t.type === 'Subscription')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalDeposits,
      totalWithdrawals,
      totalCommissions,
      totalSubscriptions,
      netBalance: totalDeposits - totalWithdrawals - totalCommissions - totalSubscriptions,
      transactionCount: transactions.length,
    };
  }

  async createRefund(transactionId: string, amount?: number): Promise<Transaction> {
    const originalTransaction = await this.transactionModel.findById(transactionId);

    if (!originalTransaction) {
      throw new BadRequestException('Transaction not found');
    }

    if (originalTransaction.status !== 'Completed') {
      throw new BadRequestException('Can only refund completed transactions');
    }

    const refundAmount = amount || originalTransaction.amount;

    if (refundAmount > originalTransaction.amount) {
      throw new BadRequestException('Refund amount cannot exceed original amount');
    }

    // Process refund with payment gateway
    if (originalTransaction.paymentMethod === 'Razorpay') {
      await this.razorpay.payments.refund(originalTransaction.paymentId, {
        amount: refundAmount * 100,
      });
    } else if (originalTransaction.paymentMethod === 'Stripe') {
      await this.stripe.refunds.create({
        payment_intent: originalTransaction.paymentId,
        amount: refundAmount * 100,
      });
    }

    // Create refund transaction
    const refundTransaction = new this.transactionModel({
      userId: originalTransaction.userId,
      type: 'Refund',
      amount: refundAmount,
      currency: originalTransaction.currency,
      paymentMethod: originalTransaction.paymentMethod,
      status: 'Completed',
      netAmount: refundAmount,
      description: `Refund for transaction ${originalTransaction._id}`,
      metadata: { originalTransactionId: originalTransaction._id },
      completedAt: new Date(),
    });

    await refundTransaction.save();

    // Update original transaction
    originalTransaction.status = 'Refunded';
    await originalTransaction.save();

    return refundTransaction;
  }

  async handleWebhook(gateway: string, payload: any, signature: string): Promise<void> {
    if (gateway === 'razorpay') {
      await this.handleRazorpayWebhook(payload, signature);
    } else if (gateway === 'stripe') {
      await this.handleStripeWebhook(payload, signature);
    }
  }

  private async handleRazorpayWebhook(payload: any, signature: string): Promise<void> {
    // Verify webhook signature
    const isValid = Razorpay.validateWebhookSignature(
      JSON.stringify(payload),
      signature,
      process.env.RAZORPAY_WEBHOOK_SECRET || 'webhook_secret',
    );

    if (!isValid) {
      throw new BadRequestException('Invalid webhook signature');
    }

    // Handle different events
    const event = payload.event;
    
    if (event === 'payment.captured') {
      const paymentId = payload.payload.payment.entity.id;
      const orderId = payload.payload.payment.entity.order_id;
      
      const transaction = await this.transactionModel.findOne({ orderId });
      if (transaction) {
        transaction.paymentId = paymentId;
        transaction.status = 'Completed';
        transaction.completedAt = new Date();
        await transaction.save();
      }
    }
  }

  private async handleStripeWebhook(payload: any, signature: string): Promise<void> {
    let event;

    try {
      event = this.stripe.webhooks.constructEvent(
        JSON.stringify(payload),
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test',
      );
    } catch (err) {
      throw new BadRequestException('Invalid webhook signature');
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const transaction = await this.transactionModel.findOne({ paymentId: paymentIntent.id });
      
      if (transaction) {
        transaction.status = 'Completed';
        transaction.completedAt = new Date();
        await transaction.save();
      }
    }
  }
}
