import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { updateSession } from '../../api/sessions';
import type { ActiveSession } from '../../types/models';

interface Props {
  session: ActiveSession;
  stationId: string;
}

export function SummaryScreen({ session, stationId }: Props) {
  const sigRef = useRef<SignatureCanvas>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [signing, setSigning] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [canvasWidth, setCanvasWidth] = useState(560);

  // Clear drawing canvas if receptionist requests resignature
  useEffect(() => {
    if (session.status === 'pending_signature' && !session.signatureB64) {
      sigRef.current?.clear();
      setAccepted(false);
    }
  }, [session.status, session.signatureB64]);

  // Resize canvas width based on parent element to prevent coordinate drawing offset
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setCanvasWidth(containerRef.current.clientWidth);
      }
    };
    
    // Initial size
    handleResize();

    // Listen to resize
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleClear = () => {
    sigRef.current?.clear();
  };

  const handleConfirm = async () => {
    if (sigRef.current?.isEmpty()) {
      alert('Please provide your signature before confirming.');
      return;
    }
    if (!accepted) {
      alert('Please accept the Terms of Entry before confirming.');
      return;
    }

    setSigning(true);
    try {
      // Get signature as base64 (strip data URL prefix)
      const dataUrl = sigRef.current!.toDataURL('image/png');
      const signatureB64 = dataUrl.replace('data:image/png;base64,', '');

      await updateSession(stationId, {
        ...session,
        status: 'signed',
        signatureB64,
        acceptedTerms: true,
      });
    } catch (err) {
      console.error('Error sending signature:', err);
      alert('Failed to submit signature. Please try again.');
    } finally {
      setSigning(false);
    }
  };

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ fontSize: '12px', fontWeight: 700, color: 'grey', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--secondary)' }}>{value}</div>
    </div>
  );

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'var(--background)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
    }}>
      <div style={{ maxWidth: '600px', width: '100%' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--secondary)', marginBottom: '32px', textAlign: 'center' }}>
          Confirm Your Details
        </h2>

        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <InfoRow label="Visitor" value={session.visitorName || 'N/A'} />
          <InfoRow label="Host" value={session.hostName || 'N/A'} />
          <InfoRow label="Purpose" value={session.purpose || 'N/A'} />
        </div>

        {/* Signature Pad */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--secondary)', marginBottom: '8px' }}>
            Your Signature
          </div>
          <div 
            ref={containerRef}
            style={{
              border: '2px solid var(--outline-variant)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
              background: 'white',
            }}
          >
            <SignatureCanvas
              ref={sigRef}
              penColor="#251913"
              backgroundColor="rgb(255, 255, 255)"
              canvasProps={{
                width: canvasWidth,
                height: 180,
                style: { display: 'block', width: `${canvasWidth}px`, height: '180px', cursor: 'crosshair' },
              }}
            />
          </div>
        </div>

        {/* Acceptance Checkbox */}
        <div style={{ marginBottom: '28px' }}>
          <label style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            cursor: 'pointer',
            fontSize: '14px',
            lineHeight: '1.4',
            color: 'var(--secondary-70)',
            userSelect: 'none',
          }}>
            <input
              type="checkbox"
              checked={accepted}
              onChange={e => setAccepted(e.target.checked)}
              style={{
                width: '18px',
                height: '18px',
                marginTop: '2px',
                accentColor: 'var(--primary)',
                cursor: 'pointer',
              }}
            />
            <span>
              I agree to the MMCY visitor terms of entry, privacy policy, and safety regulations.
            </span>
          </label>
        </div>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <button className="btn-outlined" onClick={handleClear} style={{ padding: '14px 32px' }}>
            Clear
          </button>
          <button
            className="btn-gradient"
            onClick={handleConfirm}
            disabled={signing || !accepted}
            style={{ padding: '14px 32px' }}
          >
            {signing ? (
              <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Submitting...</>
            ) : (
              '✅ Confirm & Sign'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
