import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/authMiddleware';
import Redis from 'ioredis';

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

export const getChatroomDetails = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented' });
}; 