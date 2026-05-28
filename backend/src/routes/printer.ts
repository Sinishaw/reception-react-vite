import { Router, Request, Response } from 'express';
import { printBadge, isPrinterConnected, BadgePrintData } from '../services/printer.service.js';

const router = Router();

// POST /api/print/badge — Print a visitor badge (manual trigger)
router.post('/badge', async (req: Request, res: Response) => {
  try {
    const data: BadgePrintData = req.body;

    if (!data.tagNumber || !data.visitorName) {
      res.status(400).json({ error: 'tagNumber and visitorName are required' });
      return;
    }

    await printBadge(data);
    res.json({ success: true, message: 'Badge printed successfully' });
  } catch (err) {
    console.error('Error printing badge:', err);
    res.status(500).json({ error: 'Failed to print badge' });
  }
});

// GET /api/print/status — Check printer connection
router.get('/status', async (_req: Request, res: Response) => {
  try {
    const connected = await isPrinterConnected();
    res.json({ connected });
  } catch (err) {
    res.json({ connected: false, error: (err as Error).message });
  }
});

export default router;
