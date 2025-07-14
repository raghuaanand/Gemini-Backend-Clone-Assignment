import { Worker, QueueEvents, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { getGeminiResponse } from '../services/geminiService';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const prisma = new PrismaClient();

export const chatMessageWorker = new Worker(
  'chat-messages',
  async (job: Job) => {
    const { chatroomId, userId, content } = job.data;
    // Call Gemini API
    const geminiResponse = await getGeminiResponse(content);
    // Store Gemini response as a message in the chatroom
    await prisma.message.create({
      data: {
        content: geminiResponse,
        chatroomId,
        userId, // Optionally, you can use a system userId or null for AI
      },
    });
    return { geminiResponse };
  },
  { connection }
);

export const chatMessageQueueEvents = new QueueEvents('chat-messages', { connection }); 