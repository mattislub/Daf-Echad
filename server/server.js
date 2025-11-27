import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { getServerTime, testConnection } from './db.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/db-health', async (_req, res) => {
  try {
    await testConnection();
    const serverTime = await getServerTime();

    res.json({ status: 'ok', serverTime });
  } catch (error) {
    console.error('Database health check failed:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

const port = Number(process.env.PORT) || 5174;

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});
