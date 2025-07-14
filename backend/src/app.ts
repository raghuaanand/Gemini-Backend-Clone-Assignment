import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/auth', authRoutes);
app.use(errorHandler);

export default app; 