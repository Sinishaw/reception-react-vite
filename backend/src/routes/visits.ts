import { Router } from 'express';
import type { Request, Response } from 'express';
import { db } from '../lib/firebase.js';
import { FieldValue } from 'firebase-admin/firestore';

const router = Router();
const collection = 'visits';

// GET /api/visits — List visits ordered by checkInTime desc
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, search } = req.query;

    let query: FirebaseFirestore.Query = db.collection(collection)
      .orderBy('checkInTime', 'desc');

    // Firestore doesn't support full-text search — filter status server-side,
    // and do text search in memory after fetch
    if (status && status !== 'All') {
      const statusValue = status === 'Active' ? 'active' : status === 'Checked Out' ? 'checked_out' : String(status);
      query = query.where('status', '==', statusValue);
    }

    const snapshot = await query.get();
    let visits = snapshot.docs.map(doc => doc.data());

    // In-memory search filter (same approach as Flutter client)
    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim().toLowerCase();
      visits = visits.filter(v => {
        const name = (v.visitorName || '').toLowerCase();
        const phone = (v.visitorPhone || '').toLowerCase();
        const company = (v.visitorCompany || '').toLowerCase();
        const host = (v.hostName || '').toLowerCase();
        const purpose = (v.purpose || '').toLowerCase();
        return name.includes(q) || phone.includes(q) || company.includes(q) || host.includes(q) || purpose.includes(q);
      });
    }

    res.json(visits);
  } catch (err) {
    console.error('Error listing visits:', err);
    res.status(500).json({ error: 'Failed to list visits' });
  }
});

// GET /api/visits/:id — Get visit by ID
router.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const doc = await db.collection(collection).doc(req.params.id).get();
    if (!doc.exists) {
      res.status(404).json({ error: 'Visit not found' });
      return;
    }
    res.json(doc.data());
  } catch (err) {
    console.error('Error getting visit:', err);
    res.status(500).json({ error: 'Failed to get visit' });
  }
});

// POST /api/visits — Create visit
router.post('/', async (req: Request, res: Response) => {
  try {
    const visit = req.body;
    if (!visit.id) {
      visit.id = Date.now().toString();
    }
    await db.collection(collection).doc(visit.id).set(visit);
    res.status(201).json(visit);
  } catch (err) {
    console.error('Error creating visit:', err);
    res.status(500).json({ error: 'Failed to create visit' });
  }
});

// PUT /api/visits/:id — Update visit
router.put('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const docRef = db.collection(collection).doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) {
      res.status(404).json({ error: 'Visit not found' });
      return;
    }
    await docRef.update(req.body);
    const updated = await docRef.get();
    res.json(updated.data());
  } catch (err) {
    console.error('Error updating visit:', err);
    res.status(500).json({ error: 'Failed to update visit' });
  }
});

// POST /api/visits/:id/checkout — Check out a visitor
router.post('/:id/checkout', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const docRef = db.collection(collection).doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) {
      res.status(404).json({ error: 'Visit not found' });
      return;
    }
    await docRef.update({
      status: 'checked_out',
      checkOutTime: FieldValue.serverTimestamp(),
    });
    const updated = await docRef.get();
    res.json(updated.data());
  } catch (err) {
    console.error('Error checking out visit:', err);
    res.status(500).json({ error: 'Failed to check out visit' });
  }
});

// DELETE /api/visits/:id — Delete visit
router.delete('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const docRef = db.collection(collection).doc(req.params.id);
    const doc = await docRef.get();
    if (!doc.exists) {
      res.status(404).json({ error: 'Visit not found' });
      return;
    }

    const visitData = doc.data();

    // Revert linked appointment back to 'scheduled' if applicable
    if (visitData?.appointmentId) {
      try {
        const aptRef = db.collection('appointments').doc(visitData.appointmentId);
        const apt = await aptRef.get();
        if (apt.exists) {
          await aptRef.update({ status: 'scheduled' });
        }
      } catch (e) {
        console.error('Failed to revert appointment:', e);
      }
    }

    await docRef.delete();
    res.json({ success: true });
  } catch (err) {
    console.error('Error deleting visit:', err);
    res.status(500).json({ error: 'Failed to delete visit' });
  }
});

export default router;
