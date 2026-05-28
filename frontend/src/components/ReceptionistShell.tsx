import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { HeaderClock } from './HeaderClock';
import { VisitLogScreen } from '../features/visitors/VisitLogScreen';
import { AppointmentsScreen } from '../features/appointments/AppointmentsScreen';
import { DashboardScreen } from '../features/dashboard/DashboardScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useSSE } from '../hooks/useSSE';

const TabletIcon = ({ color }: { color: string }) => (
  <svg width="14" height="20" viewBox="0 0 18 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transition: 'all 0.3s ease' }}>
    <rect x="1" y="1" width="16" height="22" rx="3" stroke={color} strokeWidth="2.5" fill="none" />
    <line x1="5" y1="19" x2="13" y2="19" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="9" cy="4" r="1.5" fill={color} />
  </svg>
);

const PAGE_TITLES = ['Dashboard', 'Visitors', 'Appointments', 'Settings'];

export function ReceptionistShell() {
  const [activeTab, setActiveTab] = useState(0);
  const [stationId] = useLocalStorage<string | null>('stationId', null);
  const [floor] = useLocalStorage<string | null>('assignedFloor', null);
  
  const { session } = useSSE(stationId);

  const renderScreen = () => {
    switch (activeTab) {
      case 0: return <DashboardScreen />;
      case 1: return <VisitLogScreen />;
      case 2: return <AppointmentsScreen />;
      case 3: return <SettingsScreen />;
      default: return <DashboardScreen />;
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        stationId={stationId}
        floor={floor}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Floating Header */}
        <header style={{
          height: 'var(--header-height)',
          padding: '0 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--background)',
          borderBottom: '1px solid var(--outline-variant)',
          flexShrink: 0,
        }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.5px' }}>
              {PAGE_TITLES[activeTab]}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--secondary-50)', marginTop: '2px' }}>
              Welcome back, administrator
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Tablet Sync Status */}
            {/* Tablet Sync Status */}
            {stationId ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                background: session?.tabletConnected ? 'rgba(76, 175, 80, 0.08)' : 'rgba(158, 158, 158, 0.08)',
                borderRadius: 'var(--radius-pill)',
                fontSize: '12px',
                fontWeight: 700,
                color: session?.tabletConnected ? '#4CAF50' : '#9E9E9E',
                border: `1px solid ${session?.tabletConnected ? 'rgba(76, 175, 80, 0.2)' : 'rgba(158, 158, 158, 0.2)'}`,
                transition: 'all 0.3s ease',
              }}>
                <TabletIcon color={session?.tabletConnected ? '#4CAF50' : '#9E9E9E'} />
                <span>{session?.tabletConnected ? 'Tablet Synced' : 'Tablet Offline'}</span>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                background: 'rgba(158, 158, 158, 0.05)',
                borderRadius: 'var(--radius-pill)',
                fontSize: '12px',
                fontWeight: 700,
                color: '#BDBDBD',
                border: '1px solid rgba(158, 158, 158, 0.1)',
              }}>
                <TabletIcon color="#BDBDBD" />
                <span>Unconfigured</span>
              </div>
            )}

            <HeaderClock />

            {/* Notification Bell */}
            <button
              className="btn-icon"
              title="Notifications"
              style={{ fontSize: '18px' }}
            >
              🔔
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main style={{ flex: 1, overflow: 'auto', background: 'var(--background)' }}>
          {renderScreen()}
        </main>
      </div>
    </div>
  );
}
