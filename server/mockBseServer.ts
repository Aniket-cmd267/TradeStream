import express from 'express';
import dotenv from 'dotenv';
import { mockBseRouter } from './routes/mockBse.js';

dotenv.config();

const app = express();
const PORT = process.env.MOCK_BSE_PORT || 4001;

app.use(express.json());
app.use(mockBseRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', service: 'Standalone Mock BSE Exchange API' });
});

app.listen(PORT, () => {
  console.log(`Mock BSE Exchange API running on port ${PORT}`);
});
