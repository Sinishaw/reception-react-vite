import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { VisitLogScreen } from '../features/visitors/VisitLogScreen';
import { AppointmentsScreen } from '../features/appointments/AppointmentsScreen';
import { DashboardScreen } from '../features/dashboard/DashboardScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useSSE } from '../hooks/useSSE';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { AuthModal } from './AuthModal';

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
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  
  const { session } = useSSE(stationId);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setShowUserDropdown(false);
    } catch (err) {
      console.error('Sign out failed', err);
    }
  };


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
          height: '64px',
          padding: '0 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--background)',
          borderBottom: '1px solid var(--outline-variant)',
          flexShrink: 0,
        }}>
          <div />

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

            {/* Notification Bell */}
            <button
              className="btn-icon"
              title="Notifications"
              style={{ fontSize: '18px' }}
            >
              🔔
            </button>

            {/* Auth State Button/Avatar */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              {user ? (
                <>
                  <div 
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: 'pointer',
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-pill)',
                      background: 'var(--surface-container)',
                      border: '1px solid var(--outline-variant)',
                      transition: 'all 0.2s',
                    }}
                  >
                    <img
                      src={user.photoURL || `https://api.dicebear.com/7.x/initials/svg?seed=${user.displayName || user.email || 'MMCY'}`}
                      alt={user.displayName || 'User'}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                      }}
                    />
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--on-surface)', marginRight: '4px' }}>
                      {user.displayName || user.email?.split('@')[0]}
                    </span>
                  </div>

                  {showUserDropdown && (
                    <div style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      background: 'var(--surface-container-high)',
                      border: '1px solid var(--outline-variant)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-md)',
                      minWidth: '180px',
                      zIndex: 100,
                      overflow: 'hidden',
                      animation: 'fadeIn 0.15s ease-out',
                    }}>
                      <div style={{ padding: '12px', borderBottom: '1px solid var(--outline-variant)' }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--on-surface)' }}>
                          {user.displayName || 'Receptionist'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--secondary-50)', marginTop: '2px', wordBreak: 'break-all' }}>
                          {user.email}
                        </div>
                      </div>
                      <button
                        onClick={handleSignOut}
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          border: 'none',
                          background: 'none',
                          color: '#ef5350',
                          textAlign: 'left',
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                        }}
                      >
                        🚪 Sign Out
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  style={{
                    background: 'none',
                    border: '1px solid var(--primary)',
                    borderRadius: 'var(--radius-md)',
                    padding: '8px 16px',
                    color: 'var(--primary)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontSize: '13px',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(244, 123, 32, 0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'none';
                  }}
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--background)' }}>
          {renderScreen()}
        </main>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </div>
  );
}
