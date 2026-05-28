import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDJuWH5WAEpM85VUGIO8vo66tmoNGY23q8",
  appId: "1:892317828832:web:f7c100f12e75ee4de0b285",
  messagingSenderId: "892317828832",
  projectId: "reception-desk-1c9d0",
  authDomain: "reception-desk-1c9d0.firebaseapp.com",
  storageBucket: "reception-desk-1c9d0.firebasestorage.app",
  measurementId: "G-6X3VTZPDKG",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export function cleanData(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(cleanData);
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val !== undefined) {
        cleaned[key] = cleanData(val);
      }
    }
    return cleaned;
  }
  return obj;
}
