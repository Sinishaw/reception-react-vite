import { db, auth } from '../lib/firebase';
import { collection, doc, setDoc, getDocs, query, orderBy } from 'firebase/firestore';

export interface ActivityLog {
  id: string;
  timestamp: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  action: 'create' | 'update' | 'delete' | 'checkout' | 'create_session' | 'terminate_session' | 'login' | 'logout' | 'session_expiry';
  entityType: 'visit' | 'appointment' | 'session' | 'auth';
  entityId: string;
  details: string;
}

export async function logActivity(
  action: ActivityLog['action'],
  entityType: ActivityLog['entityType'],
  entityId: string,
  details: string
): Promise<void> {
  try {
    const user = auth.currentUser;
    const logId = Date.now().toString() + '_' + Math.random().toString(36).substring(2, 9);
    
    const log: ActivityLog = {
      id: logId,
      timestamp: new Date().toISOString(),
      userId: user ? user.uid : null,
      userName: user ? (user.displayName || null) : null,
      userEmail: user ? user.email : null,
      action,
      entityType,
      entityId,
      details,
    };
    
    await setDoc(doc(db, 'activityLogs', logId), log);
  } catch (err) {
    console.error('Failed to write activity audit log:', err);
  }
}

export async function getActivityLogs(): Promise<ActivityLog[]> {
  const colRef = collection(db, 'activityLogs');
  const q = query(colRef, orderBy('timestamp', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as ActivityLog);
}

export function getRecordDiff(oldRecord: any, newRecord: any): string {
  const changes: string[] = [];
  const keys = Array.from(new Set([...Object.keys(oldRecord || {}), ...Object.keys(newRecord || {})]));
  
  // Fields to ignore in diff comparison
  const ignoreKeys = ['id', 'checkInTime', 'checkOutTime', 'lastUpdated', 'scheduledAt', 'pairingTime', 'sessionId', 'status'];

  for (const key of keys) {
    if (ignoreKeys.includes(key)) continue;
    const oldVal = oldRecord?.[key];
    const newVal = newRecord?.[key];
    if (oldVal !== newVal) {
      const displayOld = oldVal === undefined || oldVal === null ? 'empty' : `'${oldVal}'`;
      const displayNew = newVal === undefined || newVal === null ? 'empty' : `'${newVal}'`;
      changes.push(`${key} from ${displayOld} to ${displayNew}`);
    }
  }
  
  return changes.length > 0 ? `Changed ${changes.join(', ')}` : 'No structural details changed';
}
