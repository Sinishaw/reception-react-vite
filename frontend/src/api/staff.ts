import { db } from '../lib/firebase';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import type { Staff } from '../types/models';

const MOCK_STAFF: Staff[] = [
  { id: 'staff-1', name: 'John Doe', department: 'Engineering', email: 'john.doe@company.com' },
  { id: 'staff-2', name: 'Jane Smith', department: 'Human Resources', email: 'jane.smith@company.com' },
  { id: 'staff-3', name: 'Robert Johnson', department: 'Operations', email: 'robert.j@company.com' },
];

export async function getStaff(): Promise<Staff[]> {
  const colRef = collection(db, 'staff');
  const snapshot = await getDocs(colRef);
  if (snapshot.empty) {
    return MOCK_STAFF;
  }
  return snapshot.docs.map(doc => doc.data() as Staff);
}

export async function getStaffById(id: string): Promise<Staff> {
  const docRef = doc(db, 'staff', id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) {
    const mock = MOCK_STAFF.find(s => s.id === id);
    if (mock) return mock;
    throw new Error('Staff member not found');
  }
  return snap.data() as Staff;
}
