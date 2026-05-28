import React from 'react';
import type { Visit } from '../../types/models';

interface Props {
  visit: Visit;
  onClose: () => void;
  onEdit: (visit: Visit) => void;
  onCheckOut: (visit: Visit) => void;
  onDelete: (visit: Visit) => void;
}

export function VisitDetailDialog({ visit, onClose, onEdit, onCheckOut, onDelete }: Props) {
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true,
      });
    } catch { return dateStr; }
  };

  const DetailField = ({ label, value }: { label: string; value: string }) => (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ fontSize: '13px', fontWeight: 700, color: 'grey', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '16px', fontWeight: 500 }}>{value}</div>
    </div>
  );

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" style={{ width: '700px', position: 'relative' }} onClick={e => e.stopPropagation()}>
        <button
          className="btn-icon"
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px' }}
        >✕</button>

        <h3 className="dialog-title">Visitor Details</h3>

        {/* Two-column detail view */}
        <div style={{ display: 'flex', gap: '32px' }}>
          <div style={{ flex: 1 }}>
            <DetailField label="Visitor Name" value={visit.visitorName} />
            <DetailField label="Phone Number" value={visit.visitorPhone} />
            <DetailField label="Company" value={visit.visitorCompany || '--'} />
            <DetailField label="Badge Tag #" value={visit.badgeTagNumber || '--'} />
            {visit.notes && <DetailField label="Notes" value={visit.notes} />}
          </div>
          <div style={{ flex: 1 }}>
            <DetailField label="Host Name" value={visit.hostName} />
            <DetailField label="Purpose of Visit" value={visit.purpose} />
            <DetailField label="Check-In Time" value={formatDate(visit.checkInTime)} />
            <DetailField label="Check-Out Time" value={visit.checkOutTime ? formatDate(visit.checkOutTime) : '--'} />
            <DetailField label="Station ID" value={visit.stationId} />
          </div>
        </div>

        {/* Signature & ID */}
        <div style={{ display: 'flex', gap: '24px', marginTop: '16px' }}>
          {visit.signatureB64 && (
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'grey', marginBottom: '8px' }}>
                Visitor Signature {visit.acceptedTerms && <span style={{ color: '#4CAF50', fontSize: '11px', marginLeft: '6px', fontWeight: 'bold' }}>✓ Terms Accepted</span>}
              </div>
              <div style={{
                padding: '8px',
                border: '1px solid #eee',
                borderRadius: 'var(--radius-sm)',
                background: '#fafafa',
                textAlign: 'center',
                width: '100%',
              }}>
                <img src={`data:image/png;base64,${visit.signatureB64}`} alt="Signature" style={{ height: '80px', objectFit: 'contain' }} />
              </div>
            </div>
          )}

          {visit.idPhotoB64 && (
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'grey', marginBottom: '8px' }}>Visitor ID Card</div>
              <div style={{
                padding: '8px',
                border: '1px solid #eee',
                borderRadius: 'var(--radius-sm)',
                background: '#fafafa',
                textAlign: 'center',
                width: '100%',
              }}>
                <img src={visit.idPhotoB64} alt="Visitor ID" style={{ height: '80px', objectFit: 'contain' }} />
              </div>
            </div>
          )}
        </div>

        <hr style={{ margin: '24px 0 16px', border: 'none', borderTop: '1px solid #eee' }} />

        {/* Actions */}
        <div className="dialog-actions">
          <button className="btn-outlined" onClick={onClose}>Close</button>
          <button className="btn-outlined" onClick={() => onEdit(visit)} style={{ color: '#2196F3', borderColor: '#2196F3' }}>
            ✏️ Edit
          </button>
          {visit.status === 'active' ? (
            <button className="btn-gradient" onClick={() => onCheckOut(visit)} style={{ background: '#FF9800' }}>
              🚪 Check Out
            </button>
          ) : (
            <button className="btn-gradient" style={{ background: '#4CAF50' }}>
              🔄 Check In Again
            </button>
          )}
          <button className="btn-gradient" onClick={() => onDelete(visit)} style={{ background: '#f44336' }}>
            🗑️ Delete
          </button>
        </div>
      </div>
    </div>
  );
}
