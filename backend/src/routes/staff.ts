import { Router } from 'express';
import type { Request, Response } from 'express';
import { db } from '../lib/firebase.js';

const router = Router();
const collection = 'staff';

// Default fallback staff (matches Flutter's FirestoreStaffRepository)
const FALLBACK_STAFF = [
  { id: 's1', name: 'John Doe', department: 'Engineering', isActive: true },
  { id: 's2', name: 'Jane Smith', department: 'HR', isActive: true },
];

// GET /api/staff — List all active staff
router.get('/', async (_req: Request, res: Response) => {
  try {
    const snapshot = await db.collection(collection).get();

    if (snapshot.empty) {
      // Fallback for empty database during initial testing
      res.json(FALLBACK_STAFF);
      return;
    }

    const staff = snapshot.docs.map(doc => doc.data());
    res.json(staff);
  } catch (err) {
    console.error('Error listing staff:', err);
    res.status(500).json({ error: 'Failed to list staff' });
  }
});

// GET /api/staff/:id — Get staff by ID
router.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const doc = await db.collection(collection).doc(req.params.id).get();
    if (!doc.exists) {
      // Check fallback
      const fallback = FALLBACK_STAFF.find(s => s.id === req.params.id);
      if (fallback) {
        res.json(fallback);
        return;
      }
      res.status(404).json({ error: 'Staff not found' });
      return;
    }
    res.json(doc.data());
  } catch (err) {
    console.error('Error getting staff:', err);
    res.status(500).json({ error: 'Failed to get staff' });
  }
});

export default router;
