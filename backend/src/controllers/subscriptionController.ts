import { Request, Response } from 'express';

export const subscribePro = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented' });
};

export const stripeWebhook = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented' });
};

export const subscriptionStatus = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented' });
}; 