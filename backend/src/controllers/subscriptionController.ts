import { Request, Response } from 'express';
import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/authMiddleware';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2025-06-30.basil' });
const prisma = new PrismaClient();

const PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID || 'your_stripe_price_id'; // Set this in .env
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

export const subscribePro = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Create Stripe customer if not exists
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { userId },
        phone: user.mobile,
      });
      customerId = customer.id;
      await prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } });
    }
    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: PRO_PRICE_ID,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/subscription/cancel`,
    });
    return res.status(200).json({ url: session.url });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create Stripe session', error });
  }
};

export const stripeWebhook = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented' });
};

export const subscriptionStatus = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { subscriptionTier: true } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.status(200).json({ subscriptionTier: user.subscriptionTier });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch subscription status', error });
  }
}; 