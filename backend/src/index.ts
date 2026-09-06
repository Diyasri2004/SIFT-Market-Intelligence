import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

import express from 'express';
import cors from 'cors';
import { initDatabase } from './db/database.js';
import { watchlistRouter } from './routes/watchlistRoutes.js';
import { marketRouter } from './routes/marketRoutes.js';
import { startMarketPollingService } from './services/marketService.js';
import { seedData } from './db/seed.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Initialize Database and seed demo data if needed
initDatabase();
seedData();

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'GROW Smart Market Watchlist API'
  });
});

// Routes
app.use('/api/watchlist', watchlistRouter);
app.use('/api/market', marketRouter);

// Start polling service (every 15s)
startMarketPollingService(15000);

const server = app.listen(PORT, () => {
  console.log(`🚀 Smart Market Watchlist Backend running at http://localhost:${PORT}`);
});

process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close(() => {
    process.exit(0);
  });
});
