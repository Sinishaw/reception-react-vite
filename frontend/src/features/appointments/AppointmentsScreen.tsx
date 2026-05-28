import React, { useState, useMemo } from 'react';
import { useAppointments } from '../../hooks/useAppointments';
import { AppointmentFormDialog } from './AppointmentFormDialog';
import { CheckInForm } from '../check-in/CheckInForm';
import type { Appointment } from '../../types/models';

export function AppointmentsScreen() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [editApt, setEditApt] = useState<Appointment | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [checkInApt, setCheckInApt] = useState<Appointment | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { appointments, loading, error, refetch, removeAppointment } = useAppointments();

  const filtered = useMemo(() => {
    return appointments.filter(a => {
      if (statusFilter !== 'All' && a.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const fields = [a.visitorName, a.visitorPhone, a.visitorCompany || '', a.hostName, a.purpose].map(f => f.toLowerCase());
        if (!fields.some(f => f.includes(q))) return false;
      }
      return true;
    });
  }, [appointments, statusFilter, search]);

  const total = filtered.length;
  const startIndex = currentPage * pageSize;
  const endIndex = Math.min(startIndex + pageSize, total);
  const paginated = filtered.slice(startIndex, endIndex);
  const pageCount = Math.ceil(total / pageSize);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleDelete = async (apt: Appointment) => {
    if (!confirm(`Delete appointment for ${apt.visitorName}?`)) return;
    try {
      await removeAppointment(apt.id);
      showFeedback('success', 'Appointment deleted');
    } catch (err) {
      showFeedback('error', `Failed: ${(err as Error).message}`);
    }
  };

  const statusChip = (status: string) => {
    const cls = status === 'scheduled' ? 'chip-scheduled' : status === 'checked_in' ? 'chip-checked-in' : 'chip-cancelled';
    return <span className={`chip ${cls}`}>{status.replace('_', ' ').toUpperCase()}</span>;
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
      });
    } catch { return dateStr; }
  };

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.5px' }}>Appointments</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-gradient" onClick={() => setShowAdd(true)}>
            <span>+</span> Add Appointment
          </button>
          <button className="btn-outlined"><span>📤</span> Import expected</button>
          <button className="btn-outlined"><span>📥</span> Export to CSV</button>
        </div>
      </div>

      {/* Search & Filter */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <div style={{ flex: 3, position: 'relative' }}>
          <input
            className="input-soft"
            placeholder="Search visitor name, host name, or company..."
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(0); }}
            style={{ paddingLeft: '44px' }}
          />
          <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '16px', opacity: 0.5 }}>🔍</span>
        </div>
        <div style={{ flex: 1 }}>
          <select className="select-soft" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(0); }}>
            <option value="All">All Statuses</option>
            <option value="scheduled">Scheduled Only</option>
            <option value="checked_in">Checked In Only</option>
            <option value="cancelled">Cancelled Only</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card-elevated" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '80px', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto', width: 32, height: 32, borderWidth: 3, color: 'var(--primary)' }} />
          </div>
        ) : error ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--error)' }}>Error: {error}</div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Visitor</th>
                    <th>Company</th>
                    <th>Host</th>
                    <th>Scheduled At</th>
                    <th>Purpose</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--secondary-50)' }}>No appointments found</td></tr>
                  ) : paginated.map(apt => (
                    <tr key={apt.id}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{apt.visitorName}</div>
                        <div style={{ fontSize: '12px', color: 'grey' }}>{apt.visitorPhone}</div>
                      </td>
                      <td>{apt.visitorCompany || '--'}</td>
                      <td>{apt.hostName}</td>
                      <td>{formatDate(apt.scheduledAt)}</td>
                      <td>{apt.purpose}</td>
                      <td>{statusChip(apt.status)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button className="btn-icon" title="Edit" onClick={() => setEditApt(apt)} style={{ color: '#2196F3' }}>✏️</button>
                          {apt.status === 'scheduled' && (
                            <button className="btn-icon" title="Check In" onClick={() => setCheckInApt(apt)} style={{ color: '#4CAF50' }}>✅</button>
                          )}
                          <button className="btn-icon" title="Delete" onClick={() => handleDelete(apt)} style={{ color: '#f44336' }}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Rows per page:</span>
                <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(0); }} style={{ border: 'none', background: 'transparent', fontFamily: 'var(--font-family)', cursor: 'pointer' }}>
                  {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <span>{total === 0 ? '0-0 of 0' : `${startIndex + 1}-${endIndex} of ${total}`}</span>
              <div className="pagination-nav">
                <button disabled={currentPage === 0} onClick={() => setCurrentPage(0)}>⏮</button>
                <button disabled={currentPage === 0} onClick={() => setCurrentPage(p => p - 1)}>◀</button>
                <button disabled={endIndex >= total} onClick={() => setCurrentPage(p => p + 1)}>▶</button>
                <button disabled={endIndex >= total} onClick={() => setCurrentPage(pageCount - 1)}>⏭</button>
              </div>
            </div>
          </>
        )}
      </div>

      {(editApt || showAdd) && (
        <AppointmentFormDialog
          appointment={editApt || undefined}
          onClose={() => { setEditApt(null); setShowAdd(false); }}
          onSave={async () => {
            setEditApt(null); setShowAdd(false);
            await refetch();
            showFeedback('success', editApt ? 'Appointment updated' : 'Appointment created');
          }}
        />
      )}

      {checkInApt && (
        <CheckInForm
          prefill={{
            visitorName: checkInApt.visitorName,
            visitorPhone: checkInApt.visitorPhone,
            visitorCompany: checkInApt.visitorCompany,
            hostId: checkInApt.hostId,
            hostName: checkInApt.hostName,
            purpose: checkInApt.purpose,
            appointmentId: checkInApt.id,
          }}
          onClose={() => setCheckInApt(null)}
          onSuccess={async () => {
            setCheckInApt(null);
            await refetch();
            showFeedback('success', `${checkInApt.visitorName} checked in successfully`);
          }}
        />
      )}

      {feedback && <div className={`snackbar snackbar-${feedback.type}`}>{feedback.type === 'success' ? '✅' : '❌'} {feedback.message}</div>}
    </div>
  );
}
