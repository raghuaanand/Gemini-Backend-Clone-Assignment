import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export const signup = async (req: Request, res: Response) => {
  const { mobile, password } = req.body;
  if (!mobile || !password) {
    return res.status(400).json({ message: 'Mobile and password are required' });
  }
  try {
    const existing = await prisma.user.findUnique({ where: { mobile } });
    if (existing) {
      return res.status(409).json({ message: 'User already exists' });
    }
    const user = await prisma.user.create({
      data: { mobile, password },
    });
    return res.status(201).json({ message: 'User created', user: { id: user.id, mobile: user.mobile } });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error });
  }
};

export const sendOtp = async (req: Request, res: Response) => {
  const { mobile } = req.body;
  if (!mobile) {
    return res.status(400).json({ message: 'Mobile is required' });
  }
  try {
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // Store OTP in Redis with 5 min expiry
    await redis.set(`otp:${mobile}`, otp, 'EX', 300);
    // Return OTP in response (mocked)
    return res.status(200).json({ message: 'OTP sent (mocked)', otp });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error });
  }
};

export const verifyOtp = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented' });
};

export const forgotPassword = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented' });
};

export const changePassword = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented' });
}; 