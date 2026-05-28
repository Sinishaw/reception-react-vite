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

  const { session, connected } = useSSE(stationId, 'tablet');

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
