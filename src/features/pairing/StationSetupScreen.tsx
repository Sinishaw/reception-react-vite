import React, { useState } from 'react';

interface Props {
  onPaired: (stationId: string) => void;
}

export function StationSetupScreen({ onPaired }: Props) {
  const [stationId, setStationId] = useState('');

  const handleSave = () => {
    if (!stationId.trim()) {
      alert('Please enter a Station ID');
      return;
    }
    localStorage.setItem('stationId', JSON.stringify(stationId.trim()));
    onPaired(stationId.trim());
  };

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
      <div style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <span style={{ fontSize: '48px', marginBottom: '24px', display: 'block' }}>⚙️</span>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--secondary)', marginBottom: '8px' }}>
          Station Configuration
        </h2>
        <p style={{ color: 'var(--secondary-50)', marginBottom: '32px', fontSize: '14px' }}>
          Enter your Station ID to pair this device
        </p>

        <div className="form-group" style={{ textAlign: 'left' }}>
          <label className="input-label">Station ID</label>
          <input
            className="input-soft"
            placeholder="e.g. Lobby A - Main Entrance"
            value={stationId}
            onChange={e => setStationId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
        </div>

        <button className="btn-gradient" onClick={handleSave} style={{ marginTop: '24px', padding: '14px 40px', width: '100%' }}>
          Save Configuration
        </button>
      </div>
    </div>
  );
}
