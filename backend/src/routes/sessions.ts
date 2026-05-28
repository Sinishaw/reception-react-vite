import { Router } from 'express';
import type { Request, Response } from 'express';
import {
  getSession,
  updateSession,
  clearSession,
  subscribe,
  unsubscribe,
  registerTabletConnection,
  unregisterTabletConnection,
  type ActiveSession,
} from '../services/session.service.js';

const router = Router();

// GET /api/sessions/:stationId/stream — SSE endpoint for real-time session updates
router.get('/:stationId/stream', (req: Request<{ stationId: string }>, res: Response) => {
  const { stationId } = req.params;
  const { role } = req.query;

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
  res.flushHeaders();

  // Register this client for SSE
  subscribe(stationId, res);

  // If role is tablet, track connection status
  if (role === 'tablet') {
    registerTabletConnection(stationId, res).catch(console.error);
  }

  // Keep-alive ping every 30 seconds
  const keepAlive = setInterval(() => {
    try {
      res.write(': keepalive\n\n');
    } catch {
      clearInterval(keepAlive);
    }
  }, 30000);

  // Clean up on disconnect
  req.on('close', () => {
    clearInterval(keepAlive);
    unsubscribe(stationId, res);
    if (role === 'tablet') {
      unregisterTabletConnection(stationId, res).catch(console.error);
    }
  });
});

// GET /api/sessions/:stationId — Get current session state
router.get('/:stationId', async (req: Request<{ stationId: string }>, res: Response) => {
  try {
    const session = await getSession(req.params.stationId);
    res.json(session);
  } catch (err) {
    console.error('Error getting session:', err);
    res.status(500).json({ error: 'Failed to get session' });
  }
});

// PUT /api/sessions/:stationId — Update session (triggers SSE broadcast + Firestore write)
router.put('/:stationId', async (req: Request<{ stationId: string }>, res: Response) => {
  try {
    const session: ActiveSession = req.body;
    await updateSession(req.params.stationId, session);
    res.json({ success: true, session });
  } catch (err) {
    console.error('Error updating session:', err);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// DELETE /api/sessions/:stationId — Clear/terminate session
router.delete('/:stationId', async (req: Request<{ stationId: string }>, res: Response) => {
  try {
    await clearSession(req.params.stationId);
    res.json({ success: true });
  } catch (err) {
    console.error('Error clearing session:', err);
    res.status(500).json({ error: 'Failed to clear session' });
  }
});

export default router;
