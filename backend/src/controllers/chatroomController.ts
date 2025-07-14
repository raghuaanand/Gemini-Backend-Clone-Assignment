import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/authMiddleware';
import Redis from 'ioredis';
import { chatMessageQueue } from '../services/queueService';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export const createChatroom = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Chatroom name is required' });
  }
  try {
    const chatroom = await prisma.chatroom.create({
      data: {
        name,
        userId,
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return res.status(201).json({ message: 'Chatroom created', chatroom });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error });
  }
};

export const listChatrooms = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const cacheKey = `chatrooms:${userId}`;
  try {
    // Try to get from cache
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.status(200).json({ chatrooms: JSON.parse(cached), cached: true });
    }
    // Fetch from DB
    const chatrooms = await prisma.chatroom.findMany({
      where: { userId },
      select: { id: true, name: true, createdAt: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });
    // Cache result for 5 minutes
    await redis.set(cacheKey, JSON.stringify(chatrooms), 'EX', 300);
    return res.status(200).json({ chatrooms, cached: false });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error });
  }
};

export const getChatroomDetails = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const chatroomId = req.params.id;
  try {
    const chatroom = await prisma.chatroom.findFirst({
      where: { id: chatroomId, userId },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        messages: {
          select: {
            id: true,
            content: true,
            userId: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!chatroom) {
      return res.status(404).json({ message: 'Chatroom not found' });
    }
    return res.status(200).json({ chatroom });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  const userId = req.user?.userId;
  const chatroomId = req.params.id;
  const { content } = req.body;
  if (!content) {
    return res.status(400).json({ message: 'Message content is required' });
  }
  try {
    // Get user subscription tier
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.subscriptionTier === 'BASIC') {
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
      const rateKey = `rate:${userId}:${today}`;
      const count = await redis.incr(rateKey);
      if (count === 1) {
        await redis.expire(rateKey, 86400); // Set expiry to 1 day
      }
      if (count > 5) {
        return res.status(429).json({ message: 'Daily message limit reached for Basic tier. Upgrade to Pro for more usage.' });
      }
    }
    // Store user message
    const userMessage = await prisma.message.create({
      data: {
        content,
        chatroomId,
        userId,
      },
    });
    // Add job to queue for Gemini response
    const job = await chatMessageQueue.add('gemini-response', {
      chatroomId,
      userId,
      content,
    });
    return res.status(202).json({ message: 'Message sent, Gemini response pending', jobId: job.id, userMessage });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error });
  }
}; 