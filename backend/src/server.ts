import dotenv from 'dotenv';
dotenv.config();

import app from './app';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Start the BullMQ worker in the same process
import { chatMessageWorker } from './workers/geminiWorker';
console.log('BullMQ worker started in web service process'); 