import { db, cleanData } from '../lib/firebase';
import { 
  collection, getDocs, doc, getDoc, setDoc, 
  updateDoc, deleteDoc, query, orderBy 
} from 'firebase/firestore';
import type { Appointment } from '../types/models';
import { logActivity, getRecordDiff } from './activityLogs';

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
  await logActivity(
    'create', 
    'appointment', 
    id, 
    `Created appointment for ${aptData.visitorName} (Company: ${aptData.visitorCompany || 'None'}, Host: ${aptData.hostName}, Scheduled: ${aptData.scheduledAt})`
  );
  return aptData as Appointment;
}

export async function updateAppointment(id: string, data: Partial<Appointment>): Promise<Appointment> {
  const oldApt = await getAppointmentById(id);
  const docRef = doc(db, 'appointments', id);
  const cleanedData = cleanData(data);
  await updateDoc(docRef, cleanedData as any);
  const snap = await getDoc(docRef);
  const updatedApt = snap.data() as Appointment;
  
  const diff = getRecordDiff(oldApt, updatedApt);
  await logActivity('update', 'appointment', id, `Updated appointment for ${updatedApt.visitorName}: ${diff}`);
  
  return updatedApt;
}

export async function deleteAppointment(id: string): Promise<{ success: boolean }> {
  const apt = await getAppointmentById(id);
  const docRef = doc(db, 'appointments', id);
  await deleteDoc(docRef);
  await logActivity(
    'delete', 
    'appointment', 
    id, 
    `Deleted appointment for ${apt.visitorName} (Phone: ${apt.visitorPhone}, Company: ${apt.visitorCompany || 'None'}, Host: ${apt.hostName})`
  );
  return { success: true };
}
