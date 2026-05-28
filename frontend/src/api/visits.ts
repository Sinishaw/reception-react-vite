import { db, cleanData } from '../lib/firebase';
import { 
  collection, getDocs, doc, getDoc, setDoc, 
  updateDoc, deleteDoc, query, orderBy 
} from 'firebase/firestore';
import type { Visit } from '../types/models';

export async function getVisits(params?: { status?: string; search?: string }): Promise<Visit[]> {
  const colRef = collection(db, 'visits');
  const q = query(colRef, orderBy('checkInTime', 'desc'));
  const snapshot = await getDocs(q);
  
  let visits = snapshot.docs.map(doc => doc.data() as Visit);

  // In-memory filter status
  if (params?.status && params.status !== 'All') {
    const statusVal = params.status === 'Active' ? 'active' : params.status === 'Checked Out' ? 'checked_out' : params.status.toLowerCase();
    visits = visits.filter(v => v.status === statusVal);
  }

  // In-memory search filter
  if (params?.search && params.search.trim()) {
    const queryStr = params.search.trim().toLowerCase();
    visits = visits.filter(v => {
      const name = (v.visitorName || '').toLowerCase();
      const phone = (v.visitorPhone || '').toLowerCase();
      const company = (v.visitorCompany || '').toLowerCase();
      const host = (v.hostName || '').toLowerCase();
      const purpose = (v.purpose || '').toLowerCase();
      return name.includes(queryStr) || phone.includes(queryStr) || company.includes(queryStr) || host.includes(queryStr) || purpose.includes(queryStr);
    });
  }

  return visits;
}

export async function getVisitById(id: string): Promise<Visit> {
  const docRef = doc(db, 'visits', id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    throw new Error('Visit not found');
  }
  return snap.data() as Visit;
}

export async function createVisit(data: Partial<Visit>): Promise<Visit> {
  const id = data.id || Date.now().toString();
  const visitData = cleanData({ ...data, id });
  const docRef = doc(db, 'visits', id);
  await setDoc(docRef, visitData);
  return visitData as Visit;
}

export async function updateVisit(id: string, data: Partial<Visit>): Promise<Visit> {
  const docRef = doc(db, 'visits', id);
  const cleanedData = cleanData(data);
  await updateDoc(docRef, cleanedData as any);
  const snap = await getDoc(docRef);
  return snap.data() as Visit;
}

export async function checkOutVisit(id: string): Promise<Visit> {
  const docRef = doc(db, 'visits', id);
  await updateDoc(docRef, {
    status: 'checked_out',
    checkOutTime: new Date().toISOString(),
  });
  const snap = await getDoc(docRef);
  return snap.data() as Visit;
}

export async function deleteVisit(id: string): Promise<{ success: boolean }> {
  const visit = await getVisitById(id);
  if (visit?.appointmentId) {
    try {
      const aptRef = doc(db, 'appointments', visit.appointmentId);
      await updateDoc(aptRef, { status: 'scheduled' });
    } catch (e) {
      console.error('Failed to revert appointment status:', e);
    }
  }

  const docRef = doc(db, 'visits', id);
  await deleteDoc(docRef);
  return { success: true };
}
