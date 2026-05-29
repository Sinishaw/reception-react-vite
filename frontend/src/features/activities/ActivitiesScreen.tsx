import React, { useState, useEffect, useMemo } from 'react';
import { getActivityLogs } from '../../api/activityLogs';
import type { ActivityLog } from '../../api/activityLogs';

export function ActivitiesScreen() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('All');
  const [entityFilter, setEntityFilter] = useState('All');
  const [userFilter, setUserFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getActivityLogs();
      setLogs(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load activity logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Action type filter
      if (actionFilter !== 'All' && log.action !== actionFilter) {
        return false;
      }
      
      // Entity type filter
      if (entityFilter !== 'All' && log.entityType !== entityFilter) {
        return false;
      }

      // User email filter
      if (userFilter.trim()) {
        const email = (log.userEmail || 'anonymous').toLowerCase();
        if (!email.includes(userFilter.toLowerCase())) {
          return false;
        }
      }

      // General search filter (on details and user details)
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        const details = (log.details || '').toLowerCase();
        const userName = (log.userName || '').toLowerCase();
        const userEmail = (log.userEmail || '').toLowerCase();
        const entityId = (log.entityId || '').toLowerCase();
        
        if (!details.includes(query) && 
            !userName.includes(query) && 
            !userEmail.includes(query) && 
            !entityId.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [logs, actionFilter, entityFilter, userFilter, search]);

  const total = filteredLogs.length;
  const startIndex = currentPage * pageSize;
  const endIndex = Math.min(startIndex + pageSize, total);
  const paginatedLogs = filteredLogs.slice(startIndex, endIndex);
  const pageCount = Math.ceil(total / pageSize);

  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' +
             d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    } catch {
      return dateStr;
    }
  };

  const getActionChipColor = (action: ActivityLog['action']) => {
    switch (action) {
      case 'create':
      case 'create_session':
        return { bg: 'rgba(76, 175, 80, 0.08)', text: '#4CAF50', border: '1px solid rgba(76, 175, 80, 0.2)' };
      case 'update':
        return { bg: 'rgba(33, 150, 243, 0.08)', text: '#2196F3', border: '1px solid rgba(33, 150, 243, 0.2)' };
      case 'delete':
      case 'terminate_session':
        return { bg: 'rgba(244, 67, 54, 0.08)', text: '#f44336', border: '1px solid rgba(244, 67, 54, 0.2)' };
      case 'checkout':
        return { bg: 'rgba(255, 152, 0, 0.08)', text: '#FF9800', border: '1px solid rgba(255, 152, 0, 0.2)' };
      default:
        return { bg: 'rgba(158, 158, 158, 0.08)', text: '#9E9E9E', border: '1px solid rgba(158, 158, 158, 0.2)' };
    }
  };

  return (
    <div style={{ padding: '16px 24px', height: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.5px' }}>Activity Audit Logs</h2>
        <button className="btn-outlined" onClick={fetchLogs} disabled={loading}>
          🔄 Refresh Logs
        </button>
      </div>

      {/* Filters Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ flex: '2 1 200px', position: 'relative' }}>
          <input
            className="input-soft"
            placeholder="Search details or names..."
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(0); }}
            style={{ paddingLeft: '40px' }}
          />
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '15px', opacity: 0.5 }}>🔍</span>
        </div>

        {/* User filter */}
        <div style={{ flex: '1.2 1 150px', position: 'relative' }}>
          <input
            className="input-soft"
            placeholder="Filter by receptionist email..."
            value={userFilter}
            onChange={e => { setUserFilter(e.target.value); setCurrentPage(0); }}
            style={{ paddingLeft: '40px' }}
          />
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '15px', opacity: 0.5 }}>👤</span>
        </div>

        {/* Action Type */}
        <div style={{ flex: '1 1 120px' }}>
          <select
            className="select-soft"
            value={actionFilter}
            onChange={e => { setActionFilter(e.target.value); setCurrentPage(0); }}
          >
            <option value="All">All Actions</option>
            <option value="create">Creates</option>
            <option value="update">Updates</option>
            <option value="delete">Deletes</option>
            <option value="checkout">Checkouts</option>
            <option value="create_session">Session Starts</option>
            <option value="terminate_session">Session Ends</option>
          </select>
        </div>

        {/* Entity Type */}
        <div style={{ flex: '1 1 120px' }}>
          <select
            className="select-soft"
            value={entityFilter}
            onChange={e => { setEntityFilter(e.target.value); setCurrentPage(0); }}
          >
            <option value="All">All Entities</option>
            <option value="visit">Visits Only</option>
            <option value="appointment">Appointments Only</option>
            <option value="session">Sessions Only</option>
          </select>
        </div>
      </div>

      {/* Table Card */}
      <div className="card-elevated" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '80px', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto', width: 32, height: 32, borderWidth: 3, color: 'var(--primary)' }} />
          </div>
        ) : error ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--error)' }}>Error: {error}</div>
        ) : (
          <>
            <div style={{ overflowX: 'auto', overflowY: 'auto', flex: 1 }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '150px' }}>Timestamp</th>
                    <th style={{ width: '180px' }}>Receptionist</th>
                    <th style={{ width: '120px' }}>Action</th>
                    <th style={{ width: '100px' }}>Entity</th>
                    <th>Audit details / Changed fields</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--secondary-50)' }}>
                        No matching activity logs found
                      </td>
                    </tr>
                  ) : (
                    paginatedLogs.map(log => {
                      const chip = getActionChipColor(log.action);
                      return (
                        <tr key={log.id}>
                          <td>
                            <div style={{ fontWeight: 500, fontSize: '13px' }}>{formatTimestamp(log.timestamp)}</div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, fontSize: '13px' }}>{log.userName || 'Anonymous'}</div>
                            <div style={{ fontSize: '11px', color: 'var(--secondary-50)' }}>{log.userEmail || 'Unauthenticated'}</div>
                          </td>
                          <td>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '4px 8px',
                              borderRadius: 'var(--radius-pill)',
                              fontSize: '11px',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              background: chip.bg,
                              color: chip.text,
                              border: chip.border,
                            }}>
                              {log.action.replace('_', ' ')}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: '13px', fontWeight: 600, textTransform: 'capitalize' }}>{log.entityType}</span>
                          </td>
                          <td>
                            <div style={{ 
                              fontSize: '13px', 
                              lineHeight: 1.45, 
                              color: 'var(--on-surface)',
                              wordBreak: 'break-word',
                              fontFamily: log.details.startsWith('Changed') ? 'var(--font-mono)' : 'inherit',
                              background: log.details.startsWith('Changed') ? 'var(--secondary-03)' : 'transparent',
                              padding: log.details.startsWith('Changed') ? '4px 8px' : '0',
                              borderRadius: log.details.startsWith('Changed') ? 'var(--radius-sm)' : '0',
                              borderLeft: log.details.startsWith('Changed') ? '2.5px solid var(--primary)' : 'none',
                            }}>
                              {log.details}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="pagination" style={{ flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(0); }}
                  style={{ border: 'none', background: 'transparent', fontFamily: 'var(--font-family)', cursor: 'pointer' }}
                >
                  {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
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
    </div>
  );
}
