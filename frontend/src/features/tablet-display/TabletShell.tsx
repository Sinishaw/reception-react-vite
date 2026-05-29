import React from 'react';
import { useSSE } from '../../hooks/useSSE';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { IdleScreen } from './IdleScreen';
import { SummaryScreen } from './SummaryScreen';
import { BadgeScreen } from './BadgeScreen';

export function TabletShell() {
  const [stationId, setStationId] = useLocalStorage<string | null>('stationId', null);
  const [, , removeStationId] = useLocalStorage<string | null>('stationId', null);
  const [, , removeFloor] = useLocalStorage<string | null>('assignedFloor', null);
  const [, , removeSessionId] = useLocalStorage<string | null>('sessionId', null);
  const [, , removePairingTime] = useLocalStorage<string | null>('pairingTime', null);

  // Automatically pair using URL query parameters on mount
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const qStationId = params.get('stationId');
    const qFloor = params.get('floor');
    const qSessionId = params.get('sessionId');
    if (qStationId) {
      setStationId(qStationId);
      if (qFloor) window.localStorage.setItem('assignedFloor', JSON.stringify(qFloor));
      if (qSessionId) window.localStorage.setItem('sessionId', JSON.stringify(qSessionId));
      
      // Clean up URL query parameters to avoid bookmarking pairing state
      const newUrl = window.location.pathname + '?mode=tablet';
      window.history.replaceState({}, '', newUrl);
    }
  }, [setStationId]);

  const { session, connected, conflict, unlinked } = useSSE(stationId, 'tablet');

  // Handle termination
  React.useEffect(() => {
    if (session?.screen === 'terminated') {
      removeStationId();
      removeFloor();
      removeSessionId();
      removePairingTime();
    }
  }, [session?.screen]);

  // Render based on session screen
  const renderScreen = () => {
    if (unlinked) {
      return (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FFF1EB',
          padding: '24px',
          boxSizing: 'border-box',
          fontFamily: 'var(--font-family, sans-serif)',
        }}>
          <div className="card-elevated" style={{
            maxWidth: '520px',
            width: '100%',
            padding: '40px',
            textAlign: 'center',
            background: '#FFF8F6',
            border: '1.5px solid var(--outline-variant, #E0C0B2)',
            borderRadius: 'var(--radius-lg, 16px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            boxShadow: 'var(--shadow-lg)',
          }}>
            <span style={{ fontSize: '56px' }}>🔗</span>
            <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--secondary, #0D1B3D)', margin: 0, letterSpacing: '-0.5px' }}>
              Device Unlinked
            </h3>
            <p style={{ fontSize: '15px', color: 'var(--secondary-70, #0D1B3D)', lineHeight: 1.6, margin: 0 }}>
              This tablet device has been unlinked by the receptionist. 
            </p>
            <div style={{
              background: 'rgba(244, 123, 32, 0.05)',
              padding: '16px',
              borderRadius: 'var(--radius-md, 12px)',
              border: '1px solid rgba(244, 123, 32, 0.15)',
              fontSize: '13px',
              color: 'var(--primary, #f47b20)',
              fontWeight: 600,
              lineHeight: 1.5,
              textAlign: 'left',
            }}>
              💡 <strong>To reconnect:</strong> Ask the receptionist to scan the pairing QR code from Settings, or manually pair this station from the setup screen.
            </div>
            <button
              className="btn-soft"
              onClick={() => {
                removeStationId();
                removeFloor();
                removeSessionId();
                removePairingTime();
                window.location.reload();
              }}
              style={{ padding: '12px 24px', fontWeight: 700 }}
            >
              Configure Device
            </button>
          </div>
        </div>
      );
    }
    if (conflict) {
      return (
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FFF1EB',
          padding: '24px',
          boxSizing: 'border-box',
          fontFamily: 'var(--font-family, sans-serif)',
        }}>
          <div className="card-elevated" style={{
            maxWidth: '520px',
            width: '100%',
            padding: '40px',
            textAlign: 'center',
            background: '#FFF8F6',
            border: '1.5px solid var(--outline-variant, #E0C0B2)',
            borderRadius: 'var(--radius-lg, 16px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
            boxShadow: 'var(--shadow-lg)',
          }}>
            <span style={{ fontSize: '56px' }}>⚠️</span>
            <h3 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--secondary, #0D1B3D)', margin: 0, letterSpacing: '-0.5px' }}>
              Connection Limit Reached
            </h3>
            <p style={{ fontSize: '15px', color: 'var(--secondary-70, #0D1B3D)', lineHeight: 1.6, margin: 0 }}>
              This station is already paired with another tablet device. 
              Only one tablet can connect to this receptionist station session at a time.
            </p>
            <div style={{
              background: 'rgba(244, 123, 32, 0.05)',
              padding: '16px',
              borderRadius: 'var(--radius-md, 12px)',
              border: '1px solid rgba(244, 123, 32, 0.15)',
              fontSize: '13px',
              color: 'var(--primary, #f47b20)',
              fontWeight: 600,
              lineHeight: 1.5,
              textAlign: 'left',
            }}>
              💡 <strong>Next Steps:</strong> Have the receptionist disconnect the existing tablet using the <strong>"Unlink"</strong> button in the header. Alternatively, they can terminate and recreate the session to allow a new connection.
            </div>
          </div>
        </div>
      );
    }
    if (!stationId) {
      return <IdleScreen stationId={null} connected={false} />;
    }
    switch (session?.screen) {
      case 'summary':
        return <SummaryScreen session={session} stationId={stationId} />;
      case 'badge':
        return <BadgeScreen session={session} stationId={stationId} />;
      case 'idle':
      default:
        return <IdleScreen stationId={stationId} connected={connected} />;
    }
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <div style={{
        width: '100%',
        height: '100%',
      }}>
        {renderScreen()}
      </div>

      {/* Centered Bottom Kiosk Connection Indicator */}
      <div style={{
        position: 'absolute',
        bottom: '32px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '8px 20px',
        background: stationId ? (connected ? 'rgba(76, 175, 80, 0.08)' : 'rgba(255, 152, 0, 0.08)') : 'rgba(158, 158, 158, 0.08)',
        borderRadius: 'var(--radius-pill)',
        fontSize: '13px',
        fontWeight: 600,
        color: stationId ? (connected ? '#4CAF50' : '#FF9800') : '#9E9E9E',
        border: `1px solid ${stationId ? (connected ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255, 152, 0, 0.2)') : 'rgba(158, 158, 158, 0.2)'}`,
        pointerEvents: 'none',
        zIndex: 9999,
      }}>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: stationId ? (connected ? '#4CAF50' : '#FF9800') : '#9E9E9E',
        }} />
        <span>🖥️ {stationId || 'Unlinked Kiosk'}</span>
      </div>
    </div>
  );
}
