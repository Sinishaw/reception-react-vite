/* TypeScript interfaces matching Firestore documents — same field names as Flutter models */

export interface Visit {
  id: string;
  visitorName: string;
  visitorPhone: string;
  visitorCompany?: string;
  hostId: string;
  hostName: string;
  purpose: string;
  notes?: string;
  expectedDuration?: string;
  stationId: string;
  checkInTime: string;
  checkOutTime?: string;
  status: 'active' | 'checked_out';
  signatureB64?: string;
  idPhotoB64?: string;
  acceptedTerms?: boolean;
  badgeQrData?: string;
  badgeTagNumber?: string;
  appointmentId?: string;
  createdBy: string;
  createdAt: string;
}

export interface Appointment {
  id: string;
  visitorName: string;
  visitorPhone: string;
  visitorCompany?: string;
  hostId: string;
  hostName: string;
  purpose: string;
  notes?: string;
  scheduledAt: string;
  status: 'scheduled' | 'checked_in' | 'cancelled' | 'no_show';
  stationId?: string;
  createdBy: string;
  createdAt: string;
}

export interface Staff {
  id: string;
  name: string;
  department?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
}

export interface Station {
  id: string;
  branchName?: string;
  floor?: string;
  position?: string;
  isOnline?: boolean;
  configuredAt?: string;
}

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
  status?: 'pending_signature' | 'signed' | 'complete';
  visitorName?: string;
  hostName?: string;
  hostId?: string;
  purpose?: string;
  notes?: string;
  timestamp?: string;
  signatureB64?: string | null;
  idPhotoB64?: string | null;
  acceptedTerms?: boolean;
  tabletConnected?: boolean;
  badgePayload?: BadgePayload;
  receptionistUid?: string;
  sessionId?: string;
  assignedFloor?: string;
  pairedTabletId?: string | null;
}
