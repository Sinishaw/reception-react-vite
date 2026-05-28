import cors from 'cors';

export function createCorsMiddleware() {
  const origin = process.env.CORS_ORIGIN || 'http://localhost:5173';

  return cors({
    origin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });
}
