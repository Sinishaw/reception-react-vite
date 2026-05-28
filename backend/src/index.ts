import 'dotenv/config';
import express from 'express';
import { createCorsMiddleware } from './middleware/cors.js';
import { errorHandler } from './middleware/errorHandler.js';

// Import routes
import visitsRouter from './routes/visits.js';
import appointmentsRouter from './routes/appointments.js';
import staffRouter from './routes/staff.js';
import sessionsRouter from './routes/sessions.js';
import lookupsRouter from './routes/lookups.js';
import printerRouter from './routes/printer.js';

// Ensure Firebase is initialized (side-effect import)
import './lib/firebase.js';

const app = express();
const PORT = parseInt(process.env.PORT || '8080', 10);

// Middleware
app.use(createCorsMiddleware());
app.use(express.json({ limit: '10mb' })); // Large limit for signature base64 data

// API Routes
app.use('/api/visits', visitsRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/staff', staffRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api', lookupsRouter); // /api/floors, /api/stations
app.use('/api/print', printerRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`
  ┌──────────────────────────────────────────┐
  │                                          │
  │   MMCY Reception Desk — API Server       │
  │                                          │
  │   Local:  http://localhost:${PORT}          │
  │   Status: Running                        │
  │                                          │
  └──────────────────────────────────────────┘
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down...');
  process.exit(0);
});
