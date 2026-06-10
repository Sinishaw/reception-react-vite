import React, { useState, useEffect } from 'react';
import { useStaff } from '../../hooks/useStaff';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { searchFloors } from '../../api/lookups';
import { createVisit } from '../../api/visits';
import { updateSession } from '../../api/sessions';
import { useSSE } from '../../hooks/useSSE';
import type { ActiveSession, Visit } from '../../types/models';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  prefill?: {
    visitorName?: string;
    visitorPhone?: string;
    visitorCompany?: string;
    hostId?: string;
    hostName?: string;
    purpose?: string;
    appointmentId?: string;
  };
}

export function CheckInForm({ onClose, onSuccess, prefill }: Props) {
  const { staff } = useStaff();
  const [stationId] = useLocalStorage<string | null>('stationId', null);
  const [assignedFloor] = useLocalStorage<string | null>('assignedFloor', null);

  const { session } = useSSE(stationId);

  const [form, setForm] = useState({
    visitorName: prefill?.visitorName || '',
    visitorPhone: prefill?.visitorPhone || '',
    visitorCompany: prefill?.visitorCompany || '',
    hostId: prefill?.hostId || '',
    hostName: prefill?.hostName || '',
    purpose: prefill?.purpose || 'Meeting',
    notes: '',
    expectedDuration: '',
    badgeTagNumber: '',
    floor: assignedFloor || '',
  });

  const [idPhotoB64, setIdPhotoB64] = useState<string | null>(null);
  const [step, setStep] = useState<'form' | 'waiting' | 'signed'>('form');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [floorSuggestions, setFloorSuggestions] = useState<string[]>([]);
  const [showFloorSuggestions, setShowFloorSuggestions] = useState(false);

  useEffect(() => {
    if (!form.hostId && staff.length > 0) {
      setForm(f => ({ ...f, hostId: staff[0].id, hostName: staff[0].name }));
    }
  }, [staff]);

  // Watch for signature from tablet
  useEffect(() => {
    if (step === 'waiting' && session?.status === 'signed' && session?.signatureB64) {
      setStep('signed');
    }
  }, [session?.status, session?.signatureB64, step]);

  const handleHostChange = (staffId: string) => {
    const s = staff.find(s => s.id === staffId);
    if (s) setForm(f => ({ ...f, hostId: s.id, hostName: s.name }));
  };

  const handleSendToTablet = async () => {
    if (!form.visitorName || !form.visitorPhone) {
      setError('Name and phone are required');
      return;
    }
    if (!stationId) {
      setError('No active station. Please create a session in Settings first.');
      return;
    }

    setError(null);
    setStep('waiting');

    // Send check-in data to tablet via session
    const sessionData: ActiveSession = {
      screen: 'summary',
      status: 'pending_signature',
      visitorName: form.visitorName,
      hostName: form.hostName,
      hostId: form.hostId,
      purpose: form.purpose,
      notes: form.notes,
      idPhotoB64: idPhotoB64 || undefined,
      timestamp: new Date().toISOString(),
    };

    try {
      await updateSession(stationId, sessionData);
    } catch (err) {
      setError(`Failed to send to tablet: ${(err as Error).message}`);
      setStep('form');
    }
  };

  const handleCancel = async () => {
    if (stationId) {
      await updateSession(stationId, { screen: 'idle' }).catch(() => {});
    }
    setStep('form');
  };

  const handleResendSignature = async () => {
    if (!stationId || !session) return;
    setError(null);
    try {
      await updateSession(stationId, {
        ...session,
        status: 'pending_signature',
        signatureB64: null,
        acceptedTerms: false,
      });
      setStep('waiting');
    } catch (err) {
      setError(`Failed to reset: ${(err as Error).message}`);
    }
  };

  const handleConfirmCheckIn = async () => {
    if (!stationId) return;
    setSaving(true);
    setError(null);

    try {
      const visitId = Date.now().toString();
      const visit: Partial<Visit> = {
        id: visitId,
        visitorName: form.visitorName,
        visitorPhone: form.visitorPhone,
        visitorCompany: form.visitorCompany || undefined,
        hostId: form.hostId,
        hostName: form.hostName,
        purpose: form.purpose,
        notes: form.notes || undefined,
        expectedDuration: form.expectedDuration || undefined,
        stationId,
        badgeTagNumber: form.badgeTagNumber || undefined,
        checkInTime: new Date().toISOString(),
        status: 'active',
        signatureB64: session?.signatureB64 || undefined,
        idPhotoB64: idPhotoB64 || undefined,
        acceptedTerms: session?.acceptedTerms || false,
        appointmentId: prefill?.appointmentId || undefined,
        createdBy: 'receptionist-1',
        createdAt: new Date().toISOString(),
      };

      await createVisit(visit);

      // Send badge to tablet
      await updateSession(stationId, {
        screen: 'badge',
        status: 'complete',
        badgePayload: {
          visitId,
          visitorName: form.visitorName,
          hostName: form.hostName,
          purpose: form.purpose,
          checkInTime: new Date().toISOString(),
          qrData: form.badgeTagNumber || visitId,
        },
      });

      // Update linked appointment status
      if (prefill?.appointmentId) {
        const { updateAppointment } = await import('../../api/appointments');
        await updateAppointment(prefill.appointmentId, { status: 'checked_in' }).catch(() => {});
      }

      onSuccess();
    } catch (err) {
      setError(`Failed: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" style={{ width: '900px', maxWidth: '95vw' }} onClick={e => e.stopPropagation()}>
        <h3 className="dialog-title">Visitor Check-In</h3>

        <div style={{ display: 'flex', gap: '32px' }}>
          {/* Left: Form */}
          <div style={{ flex: 1, position: 'relative' }}>
            {step === 'waiting' && (
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(3px)',
                borderRadius: 'var(--radius-lg)',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                border: '2px dashed var(--primary)',
                animation: 'pulse-border 2s infinite',
              }}>
                <div className="spinner" style={{ width: 48, height: 48, borderWidth: 4, color: 'var(--primary)', marginBottom: '16px' }} />
                <h4 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--secondary)', margin: 0, marginBottom: '8px' }}>
                  Awaiting Visitor Signature
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--secondary-70)', margin: 0, textAlign: 'center', maxWidth: '320px', lineHeight: '1.5' }}>
                  Form details have been sent to the tablet. The visitor must sign and accept the MMCY entry terms to proceed.
                </p>
                <button type="button" className="btn-outlined" onClick={handleCancel} style={{ marginTop: '24px', color: '#f44336', borderColor: '#f44336' }}>
                  ❌ Cancel & Edit Form
                </button>
              </div>
            )}

            <div className="form-group">
              <label className="input-label">Visitor Name *</label>
              <input className="input-soft" value={form.visitorName} onChange={e => setForm(f => ({ ...f, visitorName: e.target.value }))} disabled={step !== 'form'} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="input-label">Phone *</label>
                <input className="input-soft" value={form.visitorPhone} onChange={e => setForm(f => ({ ...f, visitorPhone: e.target.value }))} disabled={step !== 'form'} />
              </div>
              <div className="form-group">
                <label className="input-label">Company</label>
                <input className="input-soft" value={form.visitorCompany} onChange={e => setForm(f => ({ ...f, visitorCompany: e.target.value }))} disabled={step !== 'form'} />
              </div>
            </div>
            <div className="form-group">
              <label className="input-label">Host</label>
              <select className="select-soft" value={form.hostId} onChange={e => handleHostChange(e.target.value)} disabled={step !== 'form'}>
                {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="input-label">Purpose</label>
                <select className="select-soft" value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))} disabled={step !== 'form'}>
                  {['Meeting', 'Delivery', 'Interview', 'Other'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="input-label">Expected Duration</label>
                <input className="input-soft" placeholder="e.g. 1 hour" value={form.expectedDuration} onChange={e => setForm(f => ({ ...f, expectedDuration: e.target.value }))} disabled={step !== 'form'} />
              </div>
            </div>
            <div className="form-group" style={{ position: 'relative' }}>
              <label className="input-label">Floor</label>
              <input
                className="input-soft"
                value={form.floor}
                onChange={e => {
                  setForm(f => ({ ...f, floor: e.target.value }));
                  searchFloors(e.target.value).then(setFloorSuggestions);
                  setShowFloorSuggestions(true);
                }}
                onFocus={() => { searchFloors(form.floor).then(setFloorSuggestions); setShowFloorSuggestions(true); }}
                onBlur={() => setTimeout(() => setShowFloorSuggestions(false), 200)}
                disabled={step !== 'form'}
              />
              {showFloorSuggestions && floorSuggestions.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: 'white', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-soft)', maxHeight: '150px', overflowY: 'auto', border: '1px solid #eee' }}>
                  {floorSuggestions.map(f => (
                    <div key={f} onMouseDown={() => { setForm(fm => ({ ...fm, floor: f })); setShowFloorSuggestions(false); }}
                      style={{ padding: '8px 16px', cursor: 'pointer', fontSize: '13px' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--secondary-04)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      {f}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="input-label">Badge Tag #</label>
                <input className="input-soft" value={form.badgeTagNumber} onChange={e => setForm(f => ({ ...f, badgeTagNumber: e.target.value }))} placeholder="Enter pre-printed badge number" disabled={step !== 'form'} />
              </div>
              <div className="form-group">
                <label className="input-label">Attach ID / Passport Photo</label>
                {idPhotoB64 ? (
                  <div style={{ position: 'relative', display: 'inline-flex', border: '1px solid #eee', borderRadius: 'var(--radius-md)', padding: '6px', background: 'white', alignSelf: 'flex-start' }}>
                    <img src={idPhotoB64} alt="ID Preview" style={{ height: '46px', maxWidth: '120px', objectFit: 'contain' }} />
                    <button
                      type="button"
                      onClick={() => setIdPhotoB64(null)}
                      style={{
                        position: 'absolute', top: '-6px', right: '-6px',
                        background: '#f44336', color: 'white', border: 'none',
                        borderRadius: '50%', width: '16px', height: '16px',
                        cursor: 'pointer', fontSize: '10px', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                      }}
                      disabled={step !== 'form'}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <label className="btn-outlined" style={{ cursor: step === 'form' ? 'pointer' : 'not-allowed', padding: '10px 14px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px', opacity: step === 'form' ? 1 : 0.6 }}>
                      📎 Upload ID
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        disabled={step !== 'form'}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setIdPhotoB64(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right: Tablet Status */}
          <div style={{ width: '280px', background: 'var(--surface-container-highest)', borderRadius: 'var(--radius-lg)', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {step === 'form' && (
              <>
                <span style={{ fontSize: '48px', marginBottom: '16px' }}>📱</span>
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--secondary)', textAlign: 'center' }}>
                  {stationId ? 'Tablet Connected' : 'No Tablet Connected'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--secondary-50)', textAlign: 'center', marginTop: '4px' }}>
                  Fill the form and send to the visitor's tablet for signature
                </div>
              </>
            )}
            {step === 'waiting' && (
              <>
                <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3, color: 'var(--primary)', marginBottom: '16px' }} />
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--secondary)', textAlign: 'center' }}>
                  Waiting for visitor to sign on tablet...
                </div>
              </>
            )}
            {step === 'signed' && (
              <>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#4CAF50', textAlign: 'center', marginBottom: '8px' }}>
                  Signature Received!
                </div>
                {session?.acceptedTerms && (
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#4CAF50', background: 'rgba(76,175,80,0.08)', padding: '4px 10px', borderRadius: 'var(--radius-pill)', marginBottom: '12px' }}>
                    ✓ TERMS ACCEPTED
                  </div>
                )}
                {session?.signatureB64 && (
                  <div style={{ border: '1px solid #eee', borderRadius: 'var(--radius-sm)', padding: '8px', background: 'white' }}>
                    <img src={`data:image/png;base64,${session.signatureB64}`} alt="Signature" style={{ height: '60px', objectFit: 'contain' }} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {error && <div style={{ color: 'var(--error)', fontSize: '13px', marginTop: '16px' }}>⚠️ {error}</div>}

        <div className="dialog-actions" style={{ marginTop: '24px' }}>
          {step === 'form' && (
            <>
              <button type="button" className="btn-outlined" onClick={onClose}>Cancel</button>
              <button type="button" className="btn-gradient" onClick={handleSendToTablet}>
                📱 Preview & Send to Visitor
              </button>
            </>
          )}
          {step === 'waiting' && (
            <button type="button" className="btn-outlined" onClick={handleCancel} style={{ color: '#f44336', borderColor: '#f44336' }}>
              ❌ Cancel
            </button>
          )}
          {step === 'signed' && (
            <>
              <button type="button" className="btn-outlined" onClick={handleCancel}>Cancel</button>
              <button type="button" className="btn-outlined" onClick={handleResendSignature} style={{ color: '#E65100', borderColor: '#E65100' }}>
                🔄 Request Resignature
              </button>
              <button type="button" className="btn-gradient" onClick={handleConfirmCheckIn} disabled={saving}>
                {saving ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Confirming...</> : '✅ Confirm & Check-in'}
              </button>
            </>
          )}
        </div>
      </div>
      <style>{`
        @keyframes pulse-border {
          0%, 100% { border-color: var(--primary); box-shadow: 0 0 8px rgba(244,123,32,0.15); }
          50% { border-color: var(--primary-container); box-shadow: 0 0 20px rgba(244,123,32,0.35); }
        }
      `}</style>
    </div>
  );
}
