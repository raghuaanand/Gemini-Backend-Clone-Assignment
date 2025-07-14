import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middlewares/authMiddleware';

const prisma = new PrismaClient();

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

export const listChatrooms = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented' });
};

export const getChatroomDetails = async (req: Request, res: Response) => {
  res.status(501).json({ message: 'Not implemented' });
}; 