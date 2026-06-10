import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { updateSession } from '../../api/sessions';
import type { ActiveSession } from '../../types/models';

interface Props {
  session: ActiveSession;
  stationId: string;
}

export function BadgeScreen({ session, stationId }: Props) {
  const [countdown, setCountdown] = useState(5);

  const badge = session.badgePayload;

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Reset to idle
          updateSession(stationId, { screen: 'idle' }).catch(console.error);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [stationId]);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #E8F5E9, var(--background))',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px',
    }}>
      {/* Success icon */}
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: '#4CAF50',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '40px',
        marginBottom: '24px',
        boxShadow: '0 8px 24px rgba(76,175,80,0.3)',
      }}>
        ✓
      </div>

      <h2 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--secondary)', marginBottom: '8px' }}>
        Check-in Complete!
      </h2>
      <p style={{ color: 'var(--secondary-50)', fontSize: '16px', marginBottom: '32px' }}>
        Please take your visitor badge
      </p>

      {/* Badge Card */}
      {badge && (
        <div style={{
          background: 'white',
          borderRadius: 'var(--radius-xl)',
          padding: '32px',
          boxShadow: 'var(--shadow-soft)',
          textAlign: 'center',
          minWidth: '300px',
        }}>
          <QRCodeSVG value={badge.qrData || badge.visitId} size={160} />
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--secondary)' }}>{badge.visitorName}</div>
            <div style={{ fontSize: '14px', color: 'var(--secondary-70)', marginTop: '4px' }}>Host: {badge.hostName}</div>
            <div style={{
              display: 'inline-block',
              marginTop: '12px',
              padding: '4px 16px',
              background: 'var(--primary)',
              color: 'white',
              borderRadius: 'var(--radius-pill)',
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '1px',
            }}>
              VISITOR
            </div>
          </div>
        </div>
      )}

      {/* Countdown */}
      <div style={{
        marginTop: '32px',
        fontSize: '14px',
        color: 'var(--secondary-50)',
      }}>
        Returning to idle in {countdown}s...
      </div>
    </div>
  );
}
