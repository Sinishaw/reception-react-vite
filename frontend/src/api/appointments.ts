import { db, cleanData } from '../lib/firebase';
import { 
  collection, getDocs, doc, getDoc, setDoc, 
  updateDoc, deleteDoc, query, orderBy 
} from 'firebase/firestore';
import type { Appointment } from '../types/models';

export async function getAppointments(params?: { status?: string; search?: string }): Promise<Appointment[]> {
  const colRef = collection(db, 'appointments');
  const q = query(colRef, orderBy('scheduledAt', 'asc'));
  const snapshot = await getDocs(q);
  
  let appointments = snapshot.docs.map(doc => doc.data() as Appointment);

  if (params?.status && params.status !== 'All') {
    appointments = appointments.filter(a => a.status === params.status);
  }

  if (params?.search && params.search.trim()) {
    const queryStr = params.search.trim().toLowerCase();
    appointments = appointments.filter(a => {
      const name = (a.visitorName || '').toLowerCase();
      const phone = (a.visitorPhone || '').toLowerCase();
      const company = (a.visitorCompany || '').toLowerCase();
      const host = (a.hostName || '').toLowerCase();
      const purpose = (a.purpose || '').toLowerCase();
      return name.includes(queryStr) || phone.includes(queryStr) || company.includes(queryStr) || host.includes(queryStr) || purpose.includes(queryStr);
    });
  }

  return appointments;
}

export async function getAppointmentById(id: string): Promise<Appointment> {
  const docRef = doc(db, 'appointments', id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    throw new Error('Appointment not found');
  }
  return snap.data() as Appointment;
}

export async function createAppointment(data: Partial<Appointment>): Promise<Appointment> {
  const id = data.id || Date.now().toString();
  const aptData = cleanData({ ...data, id });
  const docRef = doc(db, 'appointments', id);
  await setDoc(docRef, aptData);
  return aptData as Appointment;
}

export async function updateAppointment(id: string, data: Partial<Appointment>): Promise<Appointment> {
  const docRef = doc(db, 'appointments', id);
  const cleanedData = cleanData(data);
  await updateDoc(docRef, cleanedData as any);
  const snap = await getDoc(docRef);
  return snap.data() as Appointment;
}

export async function deleteAppointment(id: string): Promise<{ success: boolean }> {
  const docRef = doc(db, 'appointments', id);
  await deleteDoc(docRef);
  return { success: true };
}
