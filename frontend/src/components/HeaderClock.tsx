import { useState, useEffect } from 'react';

export function HeaderClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours().toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');

  return (
    <div style={{
      fontFamily: 'var(--font-mono)',
      fontSize: '14px',
      fontWeight: 600,
      color: 'var(--secondary)',
      background: 'var(--surface-container-highest)',
      padding: '6px 16px',
      borderRadius: 'var(--radius-sm)',
      letterSpacing: '1px',
    }}>
      {hours}:{minutes}:{seconds}
    </div>
  );
}
