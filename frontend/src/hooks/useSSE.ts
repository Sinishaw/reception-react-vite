import { useEffect, useState, useRef } from 'react';
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
  const [unlinked, setUnlinked] = useState(false);

  const unlinkedRef = useRef(false);
  const wasConnectedRef = useRef(false);
  const currentSessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!stationId) {
      setSession(null);
      setConnected(false);
      setConflict(false);
      setUnlinked(false);
      unlinkedRef.current = false;
      wasConnectedRef.current = false;
      currentSessionIdRef.current = null;
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
          const sessionId = currentSession?.sessionId || null;

          // Reset unlinked state if the session changes (new session created)
          if (sessionId !== currentSessionIdRef.current) {
            currentSessionIdRef.current = sessionId;
            setUnlinked(false);
            unlinkedRef.current = false;
            wasConnectedRef.current = false;
          }
          
          if (role === 'tablet') {
            const devId = getTabletDeviceId();
            const existingPairedId = currentSession?.pairedTabletId;
            
            // If we have been unlinked in this session, do not attempt to auto-re-pair
            if (unlinkedRef.current) {
              setConflict(false);
              setSession(currentSession || null);
              return;
            }

            if (existingPairedId && existingPairedId !== devId) {
              // Conflict: another tablet is already paired to this session
              setConflict(true);
              setSession(currentSession || null);
              return;
            } else if (existingPairedId === devId) {
              setConflict(false);
              wasConnectedRef.current = true; // We successfully connected
              // Maintain tabletConnected = true if needed
              if (!currentSession?.tabletConnected || !data?.isOnline) {
                updateDoc(docRef, {
                  isOnline: true,
                  'activeSession.tabletConnected': true,
                }).catch(console.error);
              }
            } else {
              // pairedTabletId is null/empty
              if (wasConnectedRef.current) {
                // We were connected, but now pairedTabletId is null -> receptionist unlinked us!
                setUnlinked(true);
                unlinkedRef.current = true;
                setConflict(false);
                setSession(currentSession || null);
                return;
              } else {
                // Spot is open, pair ourselves!
                setConflict(false);
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
            if (unlinkedRef.current) return;
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

  return { session, connected, error, conflict, unlinked };
}
