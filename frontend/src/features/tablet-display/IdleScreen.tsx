import React from 'react';

interface Props {
  stationId: string | null;
  connected: boolean;
}

export function IdleScreen({ stationId, connected }: Props) {
  const isPaired = !!stationId;

  // Retrieve assigned floor from localStorage
  const [assignedFloor] = React.useState<string | null>(() => {
    try {
      const floor = window.localStorage.getItem('assignedFloor');
      return floor ? JSON.parse(floor) : null;
    } catch {
      return null;
    }
  });

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'radial-gradient(ellipse at 50% 30%, var(--surface-container-low) 0%, var(--background) 70%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
    }}>

      {/* Breathing Logo */}
      <div style={{
        width: '120px',
        height: '120px',
        borderRadius: '24px',
        background: 'linear-gradient(135deg, var(--primary), var(--primary-container))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'breathe 2.5s ease-in-out infinite',
        boxShadow: 'var(--shadow-glow)',
        marginBottom: '40px',
      }}>
        <img
          src="/logo.png"
          alt="MMCY"
          style={{ width: '80px', height: '80px', borderRadius: '16px', objectFit: 'cover' }}
          onError={(e) => {
            (e.target as HTMLImageElement).style.display = 'none';
            (e.target as HTMLImageElement).parentElement!.innerHTML = '<span style="color:white;font-size:36px;font-weight:800">M</span>';
          }}
        />
      </div>

      <h1 style={{
        fontSize: '36px',
        fontWeight: 800,
        color: 'var(--secondary)',
        letterSpacing: '-1px',
        marginBottom: '8px',
      }}>
        Welcome to MMCY
      </h1>

      <p style={{
        fontSize: '16px',
        color: 'var(--secondary-50)',
        fontWeight: 500,
        animation: 'fadeInOut 3s ease-in-out infinite',
        textAlign: 'center',
        maxWidth: '400px',
        lineHeight: '1.5',
      }}>
        {isPaired
          ? 'Please wait for the receptionist to begin your check-in'
          : 'Tablet unlinked. Please scan the pairing QR code from the receptionist settings to pair this device.'}
      </p>



      <style>{`
        @keyframes breathe {
          0%, 100% { transform: scale(0.97); box-shadow: 0 4px 8px rgba(244,123,32,0.2); }
          50% { transform: scale(1.03); box-shadow: 0 8px 24px rgba(244,123,32,0.4); }
        }
        @keyframes fadeInOut {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
