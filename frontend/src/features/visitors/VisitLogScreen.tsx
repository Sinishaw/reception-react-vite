import React, { useState, useMemo } from 'react';
import { useVisits } from '../../hooks/useVisits';
import { VisitDetailDialog } from './VisitDetailDialog';
import { VisitEditDialog } from './VisitEditDialog';
import { CheckInForm } from '../check-in/CheckInForm';
import type { Visit } from '../../types/models';

export function VisitLogScreen() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [detailVisit, setDetailVisit] = useState<Visit | null>(null);
  const [editVisit, setEditVisit] = useState<Visit | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { visits, loading, error, refetch, checkOut, removeVisit } = useVisits();

  // Client-side filtering (same as Flutter)
  const filtered = useMemo(() => {
    return visits.filter(v => {
      if (statusFilter !== 'All') {
        const status = statusFilter === 'Active' ? 'active' : 'checked_out';
        if (v.status !== status) return false;
      }
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const fields = [v.visitorName, v.visitorPhone, v.visitorCompany || '', v.hostName, v.purpose].map(f => f.toLowerCase());
        if (!fields.some(f => f.includes(q))) return false;
      }
      return true;
    });
  }, [visits, statusFilter, search]);

  const total = filtered.length;
  const startIndex = currentPage * pageSize;
  const endIndex = Math.min(startIndex + pageSize, total);
  const paginated = filtered.slice(startIndex, endIndex);
  const pageCount = Math.ceil(total / pageSize);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleCheckOut = async (visit: Visit) => {
    if (!confirm(`Check out ${visit.visitorName}?`)) return;
    try {
      await checkOut(visit.id);
      showFeedback('success', `${visit.visitorName} checked out successfully`);
    } catch (err) {
      showFeedback('error', `Failed: ${(err as Error).message}`);
    }
  };

  const handleDelete = async (visit: Visit) => {
    if (!confirm(`Delete visit record for ${visit.visitorName}? This action cannot be undone.`)) return;
    try {
      await removeVisit(visit.id);
      showFeedback('success', 'Visit record deleted');
    } catch (err) {
      showFeedback('error', `Failed: ${(err as Error).message}`);
    }
  };

  const handleCheckIn = async (visit: Visit) => {
    if (!confirm(`Re-check in ${visit.visitorName}?`)) return;
    try {
      const { updateVisit } = await import('../../api/visits');
      await updateVisit(visit.id, { status: 'active', checkOutTime: undefined as any });
      await refetch();
      showFeedback('success', `${visit.visitorName} checked in again`);
    } catch (err) {
      showFeedback('error', `Failed: ${(err as Error).message}`);
    }
  };

  const statusChip = (status: string) => {
    const cls = status === 'active' ? 'chip-active' : 'chip-checked-out';
    return <span className={`chip ${cls}`}>{status.replace('_', ' ').toUpperCase()}</span>;
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' +
             d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch { return dateStr; }
  };

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.5px' }}>Visitors</h2>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn-gradient" onClick={() => setShowAddDialog(true)}>
            <span>+</span> Add Visitor
          </button>
          <button className="btn-outlined">
            <span>📥</span> Export to CSV
          </button>
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
          <select
            className="select-soft"
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setCurrentPage(0); }}
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active Only</option>
            <option value="Checked Out">Checked Out Only</option>
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
                    <th>Badge Tag #</th>
                    <th>Check-in</th>
                    <th>Check-out</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--secondary-50)' }}>
                        No visitors found
                      </td>
                    </tr>
                  ) : paginated.map(visit => (
                    <tr key={visit.id}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{visit.visitorName}</div>
                        <div style={{ fontSize: '12px', color: 'grey' }}>{visit.visitorPhone}</div>
                      </td>
                      <td>{visit.visitorCompany || '--'}</td>
                      <td>{visit.hostName}</td>
                      <td style={{ fontWeight: 600 }}>{visit.badgeTagNumber || '--'}</td>
                      <td>{formatDate(visit.checkInTime)}</td>
                      <td>{visit.checkOutTime ? formatDate(visit.checkOutTime) : '--'}</td>
                      <td>{statusChip(visit.status)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button className="btn-icon" title="View Details" onClick={() => setDetailVisit(visit)}>👁️</button>
                          <button className="btn-icon" title="Edit" onClick={() => setEditVisit(visit)} style={{ color: '#2196F3' }}>✏️</button>
                          {visit.status === 'active' ? (
                            <button className="btn-icon" title="Check Out" onClick={() => handleCheckOut(visit)} style={{ color: '#FF9800' }}>🚪</button>
                          ) : (
                            <button className="btn-icon" title="Check In Again" onClick={() => handleCheckIn(visit)} style={{ color: '#4CAF50' }}>🔄</button>
                          )}
                          <button className="btn-icon" title="Delete" onClick={() => handleDelete(visit)} style={{ color: '#f44336' }}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(0); }}
                  style={{ border: 'none', background: 'transparent', fontFamily: 'var(--font-family)', cursor: 'pointer' }}
                >
                  {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <span>{total === 0 ? '0-0 of 0' : `${startIndex + 1}-${endIndex} of ${total}`}</span>
              <div className="pagination-nav">
                <button disabled={currentPage === 0} onClick={() => setCurrentPage(0)} title="First">⏮</button>
                <button disabled={currentPage === 0} onClick={() => setCurrentPage(p => p - 1)} title="Previous">◀</button>
                <button disabled={endIndex >= total} onClick={() => setCurrentPage(p => p + 1)} title="Next">▶</button>
                <button disabled={endIndex >= total} onClick={() => setCurrentPage(pageCount - 1)} title="Last">⏭</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Detail Dialog */}
      {detailVisit && (
        <VisitDetailDialog
          visit={detailVisit}
          onClose={() => setDetailVisit(null)}
          onEdit={(v) => { setDetailVisit(null); setEditVisit(v); }}
          onCheckOut={async (v) => { setDetailVisit(null); await handleCheckOut(v); }}
          onDelete={async (v) => { setDetailVisit(null); await handleDelete(v); }}
        />
      )}

      {/* Edit Dialog */}
      {editVisit && (
        <VisitEditDialog
          visit={editVisit}
          onClose={() => setEditVisit(null)}
          onSave={async () => {
            setEditVisit(null);
            await refetch();
            showFeedback('success', 'Visit updated');
          }}
        />
      )}

      {/* Add Dialog */}
      {showAddDialog && (
        <CheckInForm
          onClose={() => setShowAddDialog(false)}
          onSuccess={async () => {
            setShowAddDialog(false);
            await refetch();
            showFeedback('success', 'Visit created and checked in successfully');
          }}
        />
      )}

      {/* Snackbar */}
      {feedback && (
        <div className={`snackbar snackbar-${feedback.type}`}>
          {feedback.type === 'success' ? '✅' : '❌'} {feedback.message}
        </div>
      )}
    </div>
  );
}
