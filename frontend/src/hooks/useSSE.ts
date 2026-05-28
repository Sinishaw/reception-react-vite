import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot, updateDoc, setDoc } from 'firebase/firestore';
import type { ActiveSession } from '../types/models';

/**
 * Real-time session listener using Firestore onSnapshot.
 * Bypasses the local Express SSE backend server and handles graceful reconnects natively.
 */
export function useSSE(stationId: string | null, role: 'receptionist' | 'tablet' = 'receptionist') {
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!stationId) {
      setSession(null);
      setConnected(false);
      return;
    }

    const docRef = doc(db, 'stations', stationId);

    // If we are a tablet connection, mark station as online and active session as tabletConnected
    if (role === 'tablet') {
      console.log(`[useSSE] Connecting tablet for station ${stationId}`);
      updateDoc(docRef, {
        isOnline: true,
        'activeSession.tabletConnected': true,
      }).catch(() => {
        // If document doesn't exist yet, create it
        setDoc(docRef, {
          isOnline: true,
          activeSession: { tabletConnected: true },
        }, { merge: true }).catch(console.error);
      });
    }

    // Subscribe to real-time changes
    console.log(`[useSSE] Subscribing to Firestore updates for ${stationId} (role: ${role})`);
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        setConnected(true);
        setError(null);
        if (snapshot.exists()) {
          const data = snapshot.data();
          console.log(`[useSSE] Received update for ${stationId}:`, data?.activeSession);
          setSession(data?.activeSession || null);
        } else {
          console.log(`[useSSE] Station document ${stationId} does not exist`);
          setSession(null);
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

  return { session, connected, error };
}
