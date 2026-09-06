import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

import express from 'express';
import path from 'path';
import cors from 'cors';
import { initDatabase } from './db/database.js';
import { watchlistRouter } from './routes/watchlistRoutes.js';
import { marketRouter } from './routes/marketRoutes.js';
import { startMarketPollingService } from './services/marketService.js';
import { seedData } from './db/seed.js';

const app = express();
const port = Number(process.env.PORT) || 4000;

// Initialize Database and seed demo data if needed
initDatabase();
seedData();

// Middleware
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

// Serve frontend static files — process.cwd() is the repo root on Render
const frontendDist = path.join(process.cwd(), 'frontend', 'dist');
app.use(express.static(frontendDist));

// SPA fallback: all non-API routes serve index.html
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// Start polling service (every 15s)
startMarketPollingService(15000);

// Start server on 0.0.0.0 for container / cloud hosting
const server = app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Smart Market Watchlist Backend running at http://0.0.0.0:${port}`);
});

// Graceful shutdown handlers
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('Shutting down server...');
  server.close(() => {
    process.exit(0);
  });
});
