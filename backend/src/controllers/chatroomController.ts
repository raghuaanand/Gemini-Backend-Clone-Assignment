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