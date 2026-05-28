import React, { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { updateSession, clearSession } from '../../api/sessions';
import { searchFloors, searchStations } from '../../api/lookups';
import type { ActiveSession } from '../../types/models';

export function SettingsScreen() {
  const [stationId, setStationId, removeStationId] = useLocalStorage<string | null>('stationId', null);
  const [assignedFloor, setAssignedFloor, removeFloor] = useLocalStorage<string | null>('assignedFloor', null);
  const [sessionId, setSessionId, removeSessionId] = useLocalStorage<string | null>('sessionId', null);
  const [pairingTime, setPairingTime, removePairingTime] = useLocalStorage<string | null>('pairingTime', null);

  const [selectedStation, setSelectedStation] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');
  const [stationSuggestions, setStationSuggestions] = useState<string[]>([]);
  const [floorSuggestions, setFloorSuggestions] = useState<string[]>([]);
  const [showStationSuggestions, setShowStationSuggestions] = useState(false);
  const [showFloorSuggestions, setShowFloorSuggestions] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Session duration timer
  const [elapsed, setElapsed] = useState('--:--:--');

  useEffect(() => {
    if (!pairingTime) return;
    const timer = setInterval(() => {
      const diff = Date.now() - new Date(pairingTime).getTime();
      const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      setElapsed(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [pairingTime]);

  const fetchStationSuggestions = useCallback(async (q: string) => {
    const results = await searchStations(q);
    setStationSuggestions(results);
  }, []);

  const fetchFloorSuggestions = useCallback(async (q: string) => {
    const results = await searchFloors(q);
    setFloorSuggestions(results);
  }, []);

  const handleCreateSession = async () => {
    if (!selectedStation || !selectedFloor) return;
    const now = new Date().toISOString();
    const sid = `${Date.now()}_${selectedStation.replace(/\s/g, '')}`;

    setStationId(selectedStation);
    setAssignedFloor(selectedFloor);
    setPairingTime(now);
    setSessionId(sid);

    try {
      const session: ActiveSession = {
        screen: 'idle',
        sessionId: sid,
        assignedFloor: selectedFloor,
      };
      await updateSession(selectedStation, session);
      showFeedback('success', `Session created for ${selectedStation} on ${selectedFloor}`);
    } catch (e) {
      console.error('Failed to create session:', e);
    }
  };

  const handleTerminate = async () => {
    if (!stationId) return;
    try {
      await updateSession(stationId, { screen: 'terminated' });
      removeStationId();
      removeFloor();
      removeSessionId();
      removePairingTime();
      setSelectedStation('');
      setSelectedFloor('');
      showFeedback('success', 'Session terminated and device pairing cleared');
    } catch (e) {
      showFeedback('error', `Failed: ${(e as Error).message}`);
    }
  };

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3000);
  };

  const isFormValid = selectedStation && selectedFloor;
  const qrData = stationId ? `${window.location.origin}/?mode=tablet&stationId=${stationId}&floor=${assignedFloor || ''}&sessionId=${sessionId || ''}` : '';

  return (
    <div style={{ padding: '32px', maxWidth: '800px' }}>
      <h2 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.5px', marginBottom: '32px' }}>Settings</h2>

      <div className="card" style={{ padding: '24px' }}>
        {stationId ? (
          /* ── Active Session ── */
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#4CAF50' }} />
              <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--secondary)' }}>Active Reception Session</span>
            </div>

            <div style={{ display: 'flex', gap: '32px', marginBottom: '24px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'grey' }}>Station ID</div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--secondary)', marginTop: '4px' }}>{stationId}</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'grey', marginTop: '16px' }}>Assigned Floor</div>
                <div style={{ fontSize: '16px', fontWeight: 600, color: 'var(--secondary)', marginTop: '4px' }}>{assignedFloor || 'Not Assigned'}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'grey' }}>Session Active Duration</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                  <span style={{ color: '#4CAF50', fontSize: '14px' }}>⏱️</span>
                  <span style={{ color: '#4CAF50', fontWeight: 700, fontSize: '16px', fontFamily: 'var(--font-mono)' }}>{elapsed}</span>
                </div>
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '16px 0' }} />

            <p style={{ fontWeight: 700, color: 'var(--secondary)', marginBottom: '16px' }}>
              Scan this QR code from your tablet device camera to open and pair automatically:
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
              <div style={{
                background: 'white',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--secondary-08)',
                padding: '24px',
              }}>
                <QRCodeSVG value={qrData} size={200} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                className="btn-gradient"
                onClick={handleTerminate}
                style={{ background: '#f44336', boxShadow: '0 4px 12px rgba(244,67,54,0.2)' }}
              >
                ❌ Terminate Active Session
              </button>
            </div>
          </>
        ) : (
          /* ── Create Session ── */
          <>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--secondary)', marginBottom: '8px' }}>
              Create New Reception Session
            </h3>
            <p style={{ color: 'grey', marginBottom: '24px', fontSize: '14px' }}>
              To initialize a reception session, select a Station ID and Floor Assignment from the corporate directory.
            </p>

            {/* Station ID Autocomplete */}
            <div className="form-group" style={{ position: 'relative' }}>
              <label className="input-label">1. Station ID</label>
              <input
                className="input-soft"
                placeholder="Type to search station directory..."
                value={selectedStation}
                onChange={e => {
                  setSelectedStation(e.target.value);
                  fetchStationSuggestions(e.target.value);
                  setShowStationSuggestions(true);
                }}
                onFocus={() => { fetchStationSuggestions(selectedStation); setShowStationSuggestions(true); }}
                onBlur={() => setTimeout(() => setShowStationSuggestions(false), 200)}
              />
              {showStationSuggestions && stationSuggestions.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                  background: 'white', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-soft)',
                  maxHeight: '200px', overflowY: 'auto', border: '1px solid #eee',
                }}>
                  {stationSuggestions.map(s => (
                    <div key={s} onMouseDown={() => { setSelectedStation(s); setShowStationSuggestions(false); }}
                      style={{ padding: '10px 16px', cursor: 'pointer', fontSize: '14px', transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--secondary-04)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Floor Autocomplete */}
            <div className="form-group" style={{ position: 'relative' }}>
              <label className="input-label">2. Floor Assignment</label>
              <input
                className="input-soft"
                placeholder="Type to search floor directory..."
                value={selectedFloor}
                onChange={e => {
                  setSelectedFloor(e.target.value);
                  fetchFloorSuggestions(e.target.value);
                  setShowFloorSuggestions(true);
                }}
                onFocus={() => { fetchFloorSuggestions(selectedFloor); setShowFloorSuggestions(true); }}
                onBlur={() => setTimeout(() => setShowFloorSuggestions(false), 200)}
              />
              {showFloorSuggestions && floorSuggestions.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                  background: 'white', borderRadius: 'var(--radius-sm)', boxShadow: 'var(--shadow-soft)',
                  maxHeight: '200px', overflowY: 'auto', border: '1px solid #eee',
                }}>
                  {floorSuggestions.map(f => (
                    <div key={f} onMouseDown={() => { setSelectedFloor(f); setShowFloorSuggestions(false); }}
                      style={{ padding: '10px 16px', cursor: 'pointer', fontSize: '14px', transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--secondary-04)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      {f}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
              <button className="btn-gradient" disabled={!isFormValid} onClick={handleCreateSession} style={{ padding: '16px 40px' }}>
                ✅ Create Session
              </button>
            </div>
          </>
        )}
      </div>

      {/* System Config Card */}
      <div className="card" style={{ padding: '24px', marginTop: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>System Configuration</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>☁️</span>
          <div>
            <div style={{ fontWeight: 500 }}>Database Connection</div>
            <div style={{ fontSize: '13px', color: 'grey' }}>Live Firebase Mode</div>
          </div>
        </div>
      </div>

      {feedback && <div className={`snackbar snackbar-${feedback.type}`}>{feedback.type === 'success' ? '✅' : '❌'} {feedback.message}</div>}
    </div>
  );
}
