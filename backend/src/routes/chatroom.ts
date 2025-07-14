import { Router } from 'express';
import { authenticateJWT } from '../middlewares/authMiddleware';
import {
  createChatroom,
  listChatrooms,
  getChatroomDetails,
  sendMessage
} from '../controllers/chatroomController';

const router = Router();

router.post('/', authenticateJWT, createChatroom);
router.get('/', authenticateJWT, listChatrooms);
router.get('/:id', authenticateJWT, getChatroomDetails);
router.post('/:id/message', authenticateJWT, sendMessage);

export default router; 