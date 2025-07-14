import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import jwt, { JwtPayload } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

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
  const { mobile, otp } = req.body;
  if (!mobile || !otp) {
    return res.status(400).json({ message: 'Mobile and OTP are required' });
  }
  try {
    const storedOtp = await redis.get(`otp:${mobile}`);
    if (!storedOtp || storedOtp !== otp) {
      return res.status(401).json({ message: 'Invalid or expired OTP' });
    }
    // OTP is valid, delete it from Redis
    await redis.del(`otp:${mobile}`);
    // Check if user exists
    const user = await prisma.user.findUnique({ where: { mobile } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Issue JWT
    const token = jwt.sign(
      { userId: user.id, mobile: user.mobile },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );
    return res.status(200).json({ message: 'OTP verified', token });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { mobile } = req.body;
  if (!mobile) {
    return res.status(400).json({ message: 'Mobile is required' });
  }
  try {
    const user = await prisma.user.findUnique({ where: { mobile } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // Store OTP in Redis with 5 min expiry
    await redis.set(`otp:reset:${mobile}`, otp, 'EX', 300);
    // Return OTP in response (mocked)
    return res.status(200).json({ message: 'OTP sent for password reset (mocked)', otp });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  // JWT should be in Authorization header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid token' });
  }
  const token = authHeader.split(' ')[1];
  let payload: JwtPayload | string;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
  // @ts-ignore
  const userId = payload.userId;
  const { oldPassword, newPassword, otp } = req.body;
  if (!newPassword) {
    return res.status(400).json({ message: 'New password is required' });
  }
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // If OTP is provided, verify it (for reset)
    if (otp) {
      const storedOtp = await redis.get(`otp:reset:${user.mobile}`);
      if (!storedOtp || storedOtp !== otp) {
        return res.status(401).json({ message: 'Invalid or expired OTP' });
      }
      await redis.del(`otp:reset:${user.mobile}`);
    } else {
      // Otherwise, check old password
      if (!oldPassword || user.password !== oldPassword) {
        return res.status(401).json({ message: 'Old password is incorrect' });
      }
    }
    // Update password
    await prisma.user.update({ where: { id: userId }, data: { password: newPassword } });
    return res.status(200).json({ message: 'Password changed successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error });
  }
}; 