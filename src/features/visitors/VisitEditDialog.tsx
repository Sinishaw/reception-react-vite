import React, { useState, useEffect } from 'react';
import { createVisit, updateVisit } from '../../api/visits';
import { useStaff } from '../../hooks/useStaff';
import type { Visit } from '../../types/models';

interface Props {
  visit?: Visit;
  onClose: () => void;
  onSave: () => void;
}

export function VisitEditDialog({ visit, onClose, onSave }: Props) {
  const isEdit = !!visit;
  const { staff } = useStaff();

  const [form, setForm] = useState({
    visitorName: visit?.visitorName || '',
    visitorPhone: visit?.visitorPhone || '',
    visitorCompany: visit?.visitorCompany || '',
    hostId: visit?.hostId || '',
    hostName: visit?.hostName || '',
    purpose: visit?.purpose || 'Meeting',
    notes: visit?.notes || '',
    badgeTagNumber: visit?.badgeTagNumber || '',
    status: visit?.status || 'active',
  });
  const [idPhotoB64, setIdPhotoB64] = useState<string | null>(visit?.idPhotoB64 || null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set default host
  useEffect(() => {
    if (!form.hostId && staff.length > 0) {
      setForm(f => ({ ...f, hostId: staff[0].id, hostName: staff[0].name }));
    }
  }, [staff]);

  const handleHostChange = (staffId: string) => {
    const s = staff.find(s => s.id === staffId);
    if (s) setForm(f => ({ ...f, hostId: s.id, hostName: s.name }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.visitorName.trim() || !form.visitorPhone.trim()) {
      setError('Visitor name and phone are required');
      return;
    }
    setSaving(true);
    setError(null);

    try {
      if (isEdit) {
        await updateVisit(visit.id, { ...form, idPhotoB64: idPhotoB64 || undefined });
      } else {
        await createVisit({
          ...form,
          idPhotoB64: idPhotoB64 || undefined,
          id: Date.now().toString(),
          stationId: localStorage.getItem('stationId')?.replace(/"/g, '') || 'unknown',
          checkInTime: new Date().toISOString(),
          createdBy: 'receptionist-1',
          createdAt: new Date().toISOString(),
        });
      }
      onSave();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog" style={{ width: '520px' }} onClick={e => e.stopPropagation()}>
        <h3 className="dialog-title">{isEdit ? `Edit Visit — ${visit.visitorName}` : 'Add New Visitor'}</h3>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="input-label">Visitor Full Name *</label>
            <input className="input-soft" value={form.visitorName} onChange={e => setForm(f => ({ ...f, visitorName: e.target.value }))} />
          </div>

          <div className="form-group">
            <label className="input-label">Phone Number *</label>
            <input className="input-soft" value={form.visitorPhone} onChange={e => setForm(f => ({ ...f, visitorPhone: e.target.value }))} />
          </div>

          <div className="form-group">
            <label className="input-label">Company</label>
            <input className="input-soft" value={form.visitorCompany} onChange={e => setForm(f => ({ ...f, visitorCompany: e.target.value }))} />
          </div>

          <div className="form-group">
            <label className="input-label">Host</label>
            <select className="select-soft" value={form.hostId} onChange={e => handleHostChange(e.target.value)}>
              {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="input-label">Purpose</label>
            <select className="select-soft" value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}>
              {['Meeting', 'Delivery', 'Interview', 'Other'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="input-label">Badge Tag #</label>
            <input className="input-soft" value={form.badgeTagNumber} onChange={e => setForm(f => ({ ...f, badgeTagNumber: e.target.value }))} placeholder="Enter pre-printed badge number" />
          </div>

          <div className="form-group">
            <label className="input-label">Attach ID / Passport Photo</label>
            {idPhotoB64 ? (
              <div style={{ position: 'relative', display: 'inline-flex', border: '1px solid #eee', borderRadius: 'var(--radius-md)', padding: '6px', background: 'white' }}>
                <img src={idPhotoB64} alt="ID Preview" style={{ height: '56px', maxWidth: '160px', objectFit: 'contain' }} />
                <button
                  type="button"
                  onClick={() => setIdPhotoB64(null)}
                  style={{
                    position: 'absolute', top: '-6px', right: '-6px',
                    background: '#f44336', color: 'white', border: 'none',
                    borderRadius: '50%', width: '16px', height: '16px',
                    cursor: 'pointer', fontSize: '10px', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                  }}
                >
                  ×
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label className="btn-outlined" style={{ cursor: 'pointer', padding: '10px 14px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  📎 Upload ID
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setIdPhotoB64(reader.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="input-label">Notes</label>
            <textarea className="input-soft" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} style={{ resize: 'vertical' }} />
          </div>

          {isEdit && (
            <div className="form-group">
              <label className="input-label">Status</label>
              <select className="select-soft" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}>
                <option value="active">Active</option>
                <option value="checked_out">Checked Out</option>
              </select>
            </div>
          )}

          {error && <div style={{ color: 'var(--error)', fontSize: '13px', marginBottom: '16px' }}>⚠️ {error}</div>}

          <div className="dialog-actions">
            <button type="button" className="btn-outlined" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-gradient" disabled={saving}>
              {saving && <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />}
              {isEdit ? 'Save Changes' : 'Add Visitor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
