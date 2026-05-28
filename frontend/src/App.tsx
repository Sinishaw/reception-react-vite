import { useEffect } from 'react';
import { ReceptionistShell } from './components/ReceptionistShell';
import { TabletShell } from './features/tablet-display/TabletShell';

function App() {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode');
  const stationId = params.get('stationId');
  const floor = params.get('floor');
  const sessionId = params.get('sessionId');

  // Handle tablet auto-pairing via URL params (from QR code scan)
  useEffect(() => {
    if (mode === 'tablet' && stationId) {
      localStorage.setItem('stationId', JSON.stringify(stationId));
      if (floor) localStorage.setItem('assignedFloor', JSON.stringify(floor));
      if (sessionId) localStorage.setItem('sessionId', JSON.stringify(sessionId));
      localStorage.setItem('pairingTime', JSON.stringify(new Date().toISOString()));

      // Clean URL to just /?mode=tablet
      const cleanUrl = `${window.location.origin}/?mode=tablet`;
      window.history.replaceState({}, '', cleanUrl);
    }
  }, [mode, stationId, floor, sessionId]);

  // Render based on mode
  if (mode === 'tablet') {
    return <TabletShell />;
  }

  return <ReceptionistShell />;
}

export default App;
