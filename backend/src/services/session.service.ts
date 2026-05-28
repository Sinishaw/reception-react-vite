import { Response } from 'express';
import { db } from '../lib/firebase.js';
import { FieldValue } from 'firebase-admin/firestore';

// Types matching Flutter's station.dart ActiveSession & BadgePayload
export interface BadgePayload {
  visitId: string;
  visitorName: string;
  hostName: string;
  purpose: string;
  checkInTime: string;
  qrData: string;
}

export interface ActiveSession {
  screen: 'idle' | 'summary' | 'badge' | 'terminated';
  status?: string; // 'pending_signature' | 'signed' | 'complete'
  visitorName?: string;
  hostName?: string;
  hostId?: string;
  purpose?: string;
  notes?: string;
  timestamp?: string;
  signatureB64?: string;
  idPhotoB64?: string;
  acceptedTerms?: boolean;
  tabletConnected?: boolean;
  badgePayload?: BadgePayload;
  receptionistUid?: string;
  sessionId?: string;
  assignedFloor?: string;
}

// In-memory state
const sessions = new Map<string, ActiveSession>();
const sseClients = new Map<string, Set<Response>>();
const tabletConnections = new Map<string, Set<Response>>();

/**
 * Get the current session state for a station (from memory or Firestore).
 */
export async function getSession(stationId: string): Promise<ActiveSession | null> {
  // Check in-memory cache first
  if (sessions.has(stationId)) {
    return sessions.get(stationId)!;
  }

  // Fall back to Firestore
  try {
    const doc = await db.collection('stations').doc(stationId).get();
    if (doc.exists && doc.data()?.activeSession) {
      const session = doc.data()!.activeSession as ActiveSession;
      sessions.set(stationId, session);
      return session;
    }
  } catch (e) {
    console.error('Error reading session from Firestore:', e);
  }

  return null;
}

/**
 * Update session state: writes to memory, Firestore, and broadcasts to SSE clients.
 */
export async function updateSession(stationId: string, session: ActiveSession): Promise<void> {
  // 1. Update in-memory cache
  sessions.set(stationId, session);

  // 2. Write to Firestore (same structure Flutter reads/writes)
  try {
    await db.collection('stations').doc(stationId).set(
      {
        activeSession: session,
        lastUpdated: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  } catch (e) {
    console.error('Error writing session to Firestore:', e);
  }

  // 3. Broadcast to all SSE clients for this station
  broadcastToStation(stationId, session);
}

/**
 * Clear/terminate session.
 */
export async function clearSession(stationId: string): Promise<void> {
  sessions.delete(stationId);

  try {
    await db.collection('stations').doc(stationId).update({
      activeSession: FieldValue.delete(),
      lastUpdated: FieldValue.serverTimestamp(),
    });
  } catch (e) {
    console.error('Error clearing session in Firestore:', e);
  }

  broadcastToStation(stationId, null);
}

/**
 * Subscribe an SSE client to session updates for a station.
 */
export function subscribe(stationId: string, res: Response): void {
  if (!sseClients.has(stationId)) {
    sseClients.set(stationId, new Set());
  }
  sseClients.get(stationId)!.add(res);

  // Send current state immediately
  const current = sessions.get(stationId) || null;
  sendSSE(res, current);
}

/**
 * Unsubscribe an SSE client.
 */
export function unsubscribe(stationId: string, res: Response): void {
  const clients = sseClients.get(stationId);
  if (clients) {
    clients.delete(res);
    if (clients.size === 0) {
      sseClients.delete(stationId);
    }
  }
}

/**
 * Broadcast session state to all SSE clients for a station.
 */
function broadcastToStation(stationId: string, session: ActiveSession | null): void {
  const clients = sseClients.get(stationId);
  if (!clients) return;

  for (const client of clients) {
    sendSSE(client, session);
  }
}

/**
 * Send a single SSE event.
 */
function sendSSE(res: Response, data: ActiveSession | null): void {
  try {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  } catch {
    // Client disconnected — will be cleaned up
  }
}

/**
 * Register a tablet connection for a station.
 */
export async function registerTabletConnection(stationId: string, res: Response): Promise<void> {
  if (!tabletConnections.has(stationId)) {
    tabletConnections.set(stationId, new Set());
  }
  tabletConnections.get(stationId)!.add(res);

  const session = await getSession(stationId);
  if (session && !session.tabletConnected) {
    session.tabletConnected = true;
    await updateSession(stationId, session);
  }

  try {
    await db.collection('stations').doc(stationId).set(
      { isOnline: true },
      { merge: true }
    );
  } catch (e) {
    console.error('Error marking station online:', e);
  }
}

/**
 * Unregister a tablet connection.
 */
export async function unregisterTabletConnection(stationId: string, res: Response): Promise<void> {
  const connections = tabletConnections.get(stationId);
  if (connections) {
    connections.delete(res);
    if (connections.size === 0) {
      tabletConnections.delete(stationId);

      const session = await getSession(stationId);
      if (session && session.tabletConnected) {
        session.tabletConnected = false;
        await updateSession(stationId, session);
      }

      try {
        await db.collection('stations').doc(stationId).set(
          { isOnline: false },
          { merge: true }
        );
      } catch (e) {
        console.error('Error marking station offline:', e);
      }
    }
  }
}
