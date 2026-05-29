import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import type { ActiveSession } from '../types/models';

const getTabletDeviceId = (): string => {
  let id = localStorage.getItem('tabletDeviceId');
  if (!id) {
    id = 'tablet_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('tabletDeviceId', id);
  }
  return id;
};

/**
 * Real-time session listener using Firestore onSnapshot.
 * Bypasses the local Express SSE backend server and handles graceful reconnects natively.
 */
export function useSSE(stationId: string | null, role: 'receptionist' | 'tablet' = 'receptionist') {
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);

  useEffect(() => {
    if (!stationId) {
      setSession(null);
      setConnected(false);
      setConflict(false);
      return;
    }

    const docRef = doc(db, 'stations', stationId);

    // Subscribe to real-time changes
    console.log(`[useSSE] Subscribing to Firestore updates for ${stationId} (role: ${role})`);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        setConnected(true);
        setError(null);
        if (snapshot.exists()) {
          const data = snapshot.data();
          const currentSession = data?.activeSession as ActiveSession | undefined;
          
          if (role === 'tablet') {
            const devId = getTabletDeviceId();
            const existingPairedId = currentSession?.pairedTabletId;
            
            if (existingPairedId && existingPairedId !== devId) {
              // Conflict: another tablet is already paired to this session
              setConflict(true);
              setSession(currentSession || null);
              return;
            } else {
              setConflict(false);
              // Pair/maintain pairing
              if (!existingPairedId || !currentSession?.tabletConnected || !data?.isOnline) {
                // Perform pairing update
                updateDoc(docRef, {
                  isOnline: true,
                  'activeSession.tabletConnected': true,
                  'activeSession.pairedTabletId': devId,
                }).then(() => {
                  // Only log activity if this is a brand new pairing transition
                  if (!existingPairedId) {
                    import('../api/activityLogs').then(({ logActivity }) => {
                      logActivity('link_tablet', 'session', stationId, `Linked tablet '${devId}' to station '${stationId}'`);
                    }).catch(console.error);
                  }
                }).catch(console.error);
              }
            }
          }
          
          setSession(currentSession || null);
        } else {
          // If station doesn't exist and we are tablet, create it
          if (role === 'tablet') {
            setConflict(false);
            const devId = getTabletDeviceId();
            setDoc(docRef, {
              isOnline: true,
              activeSession: {
                screen: 'idle',
                tabletConnected: true,
                pairedTabletId: devId,
              }
            }, { merge: true }).then(() => {
              import('../api/activityLogs').then(({ logActivity }) => {
                logActivity('link_tablet', 'session', stationId, `Linked tablet '${devId}' to station '${stationId}'`);
              }).catch(console.error);
            }).catch(console.error);
          } else {
            setSession(null);
          }
        }
      },
      (err) => {
        console.error(`[useSSE] Firestore snapshot error for ${stationId}:`, err);
        setConnected(false);
        setError('Connection lost. Reconnecting...');
      }
    );

    // Mark offline on window close or tab navigation
    const handleUnload = () => {
      if (role === 'tablet') {
        updateDoc(docRef, {
          isOnline: false,
          'activeSession.tabletConnected': false,
        }).catch(() => {});
      }
    };
    window.addEventListener('beforeunload', handleUnload);

    // Clean up subscription only (avoid rapid online/offline toggling on re-renders)
    return () => {
      console.log(`[useSSE] Unsubscribing from Firestore updates for ${stationId} (role: ${role})`);
      unsubscribe();
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [stationId, role]);

  return { session, connected, error, conflict };
}
