import { Router } from 'express';
import type { Request, Response } from 'express';
import { db } from '../lib/firebase.js';

const router = Router();
const collection = 'appointments';

// GET /api/appointments — List appointments ordered by scheduledAt asc
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, search } = req.query;

    let query: FirebaseFirestore.Query = db.collection(collection)
      .orderBy('scheduledAt', 'asc');

    if (status && status !== 'All') {
      query = query.where('status', '==', String(status));
    }

    const snapshot = await query.get();
    let appointments = snapshot.docs.map(doc => doc.data());

    // In-memory search filter
    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim().toLowerCase();
      appointments = appointments.filter(a => {
        const name = (a.visitorName || '').toLowerCase();
        const phone = (a.visitorPhone || '').toLowerCase();
        const company = (a.visitorCompany || '').toLowerCase();
        const host = (a.hostName || '').toLowerCase();
        const purpose = (a.purpose || '').toLowerCase();
        return name.includes(q) || phone.includes(q) || company.includes(q) || host.includes(q) || purpose.includes(q);
      });
    }

    res.json(appointments);
  } catch (err) {
    console.error('Error listing appointments:', err);
    res.status(500).json({ error: 'Failed to list appointments' });
  }
});

// GET /api/appointments/:id
router.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const doc = await db.collection(collection).doc(req.params.id).get();
    if (!doc.exists) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }
    res.json(doc.data());
  } catch (err) {
    console.error('Error getting appointment:', err);
    res.status(500).json({ error: 'Failed to get appointment' });
  }
});

// POST /api/appointments
router.post('/', async (req: Request, res: Response) => {
  try {
    const appointment = req.body;
    if (!appointment.id) {
      appointment.id = `apt_${Date.now()}`;
    }
    await db.collection(collection).doc(appointment.id).set(appointment);
    res.status(201).json(appointment);
  } catch (err) {
    console.error('Error creating appointment:', err);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// PUT /api/appointments/:id
router.put('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const docRef = db.collection(collection).doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }
    await docRef.update(req.body);
    const updated = await docRef.get();
    res.json(updated.data());
  } catch (err) {
    console.error('Error updating appointment:', err);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
});

// DELETE /api/appointments/:id
router.delete('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const docRef = db.collection(collection).doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) {
      res.status(404).json({ error: 'Appointment not found' });
      return;
    }
    await docRef.delete();
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting appointment:', err);
    res.status(500).json({ error: 'Failed to delete appointment' });
  }
});

export default router;
