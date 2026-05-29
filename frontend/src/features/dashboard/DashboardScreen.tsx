import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useVisits } from '../../hooks/useVisits';
import { useAppointments } from '../../hooks/useAppointments';

const PIE_COLORS = ['#F47B20', '#005AB4', '#4CAF50', '#9C27B0', '#FF5722'];

export function DashboardScreen() {
  const { visits, loading: visitsLoading } = useVisits();
  const { appointments, loading: aptsLoading } = useAppointments();

  const loading = visitsLoading || aptsLoading;

  const metrics = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const todayVisits = visits.filter(v => new Date(v.checkInTime) >= today);
    const activeNow = visits.filter(v => v.status === 'active');
    const upcoming = appointments.filter(a => a.status === 'scheduled' && new Date(a.scheduledAt) >= now);

    // Average duration (checked out visits today)
    const checkedOutToday = todayVisits.filter(v => v.status === 'checked_out' && v.checkOutTime);
    let avgDuration = '--';
    if (checkedOutToday.length > 0) {
      const totalMs = checkedOutToday.reduce((sum, v) => {
        return sum + (new Date(v.checkOutTime!).getTime() - new Date(v.checkInTime).getTime());
      }, 0);
      const avgMs = totalMs / checkedOutToday.length;
      const mins = Math.round(avgMs / 60000);
      avgDuration = mins < 60 ? `${mins}m` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
    }

    return {
      todayVisits: todayVisits.length,
      activeNow: activeNow.length,
      upcoming: upcoming.length,
      avgDuration,
    };
  }, [visits, appointments]);

  // Bar chart: visits per day (last 7 days)
  const barData = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(dayStart.getTime() + 86400000);
      const count = visits.filter(v => {
        const t = new Date(v.checkInTime);
        return t >= dayStart && t < dayEnd;
      }).length;
      days.push({ day: dayStr, visits: count });
    }
    return days;
  }, [visits]);

  // Pie chart: purpose breakdown
  const pieData = useMemo(() => {
    const counts: Record<string, number> = {};
    visits.forEach(v => {
      counts[v.purpose] = (counts[v.purpose] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [visits]);

  const MetricCard = ({ title, value, color, icon }: { title: string; value: string | number; color: string; icon: string }) => (
    <div style={{
      flex: 1,
      background: `${color}10`,
      borderRadius: 'var(--radius-lg)',
      padding: 'clamp(18px, 2.5vh, 32px) 24px',
      border: `1px solid ${color}20`,
      minHeight: 'clamp(90px, 12vh, 140px)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      boxSizing: 'border-box',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexShrink: 0 }}>
        <span style={{ fontSize: '20px' }}>{icon}</span>
        <span style={{ fontSize: 'clamp(13px, 1.3vh, 15px)', fontWeight: 600, color: 'var(--secondary-70)' }}>{title}</span>
      </div>
      <div style={{ fontSize: 'clamp(32px, 3.5vh, 44px)', fontWeight: 800, color, letterSpacing: '-1px', lineHeight: 1.1 }}>{value}</div>
    </div>
  );

  if (loading) {
    return (
      <div style={{ padding: '32px', display: 'flex', justifyContent: 'center', paddingTop: '120px' }}>
        <div className="spinner" style={{ width: 40, height: 40, borderWidth: 3, color: 'var(--primary)' }} />
      </div>
    );
  }

  return (
    <div style={{ padding: '16px 24px', height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', overflow: 'hidden' }}>
      <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.5px', marginBottom: '16px', flexShrink: 0 }}>Dashboard</h2>

      {/* Metric Cards */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexShrink: 0 }}>
        <MetricCard title="Today's Visits" value={metrics.todayVisits} color="#005AB4" icon="📊" />
        <MetricCard title="Active Now" value={metrics.activeNow} color="#4CAF50" icon="🟢" />
        <MetricCard title="Upcoming" value={metrics.upcoming} color="#F47B20" icon="📅" />
        <MetricCard title="Avg Duration" value={metrics.avgDuration} color="#9C27B0" icon="⏱️" />
      </div>

      {/* Charts */}
      <div style={{ display: 'flex', gap: '20px', flex: 1, minHeight: 0 }}>
        {/* Visits per Day */}
        <div className="card-elevated" style={{ flex: 2, padding: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', flexShrink: 0 }}>Visits per Day</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#666' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#666' }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="visits" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Purpose Breakdown */}
        <div className="card-elevated" style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', flexShrink: 0 }}>Purpose Breakdown</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
