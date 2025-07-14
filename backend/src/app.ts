import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import chatroomRoutes from './routes/chatroom';
import subscriptionRoutes from './routes/subscription';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/chatroom', chatroomRoutes);
app.use('/', subscriptionRoutes);
app.use(errorHandler);

export default app; 