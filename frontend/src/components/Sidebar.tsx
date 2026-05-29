import React from 'react';

interface SidebarProps {
  activeTab: number;
  onTabChange: (index: number) => void;
  stationId: string | null;
  floor: string | null;
}

const NAV_ITEMS = [
  { icon: '📊', label: 'Dashboard' },
  { icon: '👥', label: 'Visitors' },
  { icon: '📅', label: 'Appointments' },
  { icon: '⚙️', label: 'Settings' },
  { icon: '📋', label: 'Activities' },
];

export function Sidebar({ activeTab, onTabChange, stationId, floor }: SidebarProps) {
  return (
    <div style={{
      width: 'var(--sidebar-width)',
      height: '100vh',
      background: 'var(--surface-container-low)',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid var(--outline-variant)',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
      }}>
        <img
          src="/logo.png"
          alt="MMCY Logo"
          style={{ width: '140px', height: '56px', objectFit: 'contain' }}
        />
        <div style={{ fontSize: '11px', color: 'var(--secondary-50)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px' }}>
          Reception Desk
        </div>
      </div>

      {/* Nav Items */}
      <nav style={{ flex: 1, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {NAV_ITEMS.map((item, index) => {
          const isActive = activeTab === index;
          return (
            <button
              key={item.label}
              onClick={() => onTabChange(index)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                fontFamily: 'var(--font-family)',
                fontSize: '14px',
                fontWeight: isActive ? 700 : 500,
                background: isActive ? 'var(--primary)' : 'transparent',
                color: isActive ? 'var(--on-primary)' : 'var(--secondary-70)',
                boxShadow: isActive ? 'var(--shadow-glow)' : 'none',
                transition: 'all var(--transition-fast)',
                textAlign: 'left',
                width: '100%',
              }}
            >
              <span style={{ fontSize: '18px' }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Station Info Footer */}
      {stationId && (
        <div style={{
          margin: '12px',
          padding: '16px',
          background: 'var(--surface-container)',
          borderRadius: 'var(--radius-md)',
        }}>
          {/* Active status header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#4CAF50',
              boxShadow: '0 0 6px #4CAF50',
            }} />
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#4CAF50', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Active
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {/* Station ID with Emoji */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: 'var(--secondary)' }}>
              <span style={{ fontSize: '16px' }}>🖥️</span>
              <span>{stationId}</span>
            </div>

            {/* Floor with Emoji */}
            {floor && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--secondary-50)' }}>
                <span style={{ fontSize: '16px' }}>🏢</span>
                <span>{floor}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
