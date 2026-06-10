import { db, cleanData } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, deleteField, serverTimestamp } from 'firebase/firestore';
import type { ActiveSession } from '../types/models';

export async function getSession(stationId: string): Promise<ActiveSession | null> {
  const docRef = doc(db, 'stations', stationId);
  const snap = await getDoc(docRef);
  if (snap.exists() && snap.data()?.activeSession) {
    return snap.data().activeSession as ActiveSession;
  }
  return null;
}

export async function updateSession(stationId: string, data: ActiveSession): Promise<{ success: boolean; session: ActiveSession }> {
  const docRef = doc(db, 'stations', stationId);
  const cleanedSession = cleanData(data);
  await setDoc(
    docRef,
    {
      activeSession: cleanedSession,
      lastUpdated: serverTimestamp(),
    },
    { merge: true }
  );
  return { success: true, session: data };
}

export async function clearSession(stationId: string): Promise<{ success: boolean }> {
  const docRef = doc(db, 'stations', stationId);
  await updateDoc(docRef, {
    activeSession: deleteField(),
    lastUpdated: serverTimestamp(),
  });
  return { success: true };
}
