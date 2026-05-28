import React, { useState, useEffect } from 'react';
import { createAppointment, updateAppointment } from '../../api/appointments';
import { useStaff } from '../../hooks/useStaff';
import type { Appointment } from '../../types/models';

interface Props {
  appointment?: Appointment;
  onClose: () => void;
  onSave: () => void;
}

export function AppointmentFormDialog({ appointment, onClose, onSave }: Props) {
  const isEdit = !!appointment;
  const { staff } = useStaff();

  const [form, setForm] = useState({
    visitorName: appointment?.visitorName || '',
    visitorPhone: appointment?.visitorPhone || '',
    visitorCompany: appointment?.visitorCompany || '',
    hostId: appointment?.hostId || '',
    hostName: appointment?.hostName || '',
    purpose: appointment?.purpose || 'Meeting',
    notes: appointment?.notes || '',
    scheduledAt: appointment?.scheduledAt
      ? new Date(appointment.scheduledAt).toISOString().slice(0, 16)
      : new Date(Date.now() + 3600000).toISOString().slice(0, 16),
    status: appointment?.status || 'scheduled',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const payload = { ...form, scheduledAt: new Date(form.scheduledAt).toISOString() };
      if (isEdit) {
        await updateAppointment(appointment.id, payload);
      } else {
        await createAppointment({
          ...payload,
          id: `apt_${Date.now()}`,
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
        <h3 className="dialog-title">{isEdit ? `Edit Appointment` : 'Add New Appointment'}</h3>
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
            <label className="input-label">Scheduled Time</label>
            <input className="input-soft" type="datetime-local" value={form.scheduledAt} onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))} />
          </div>
          {isEdit && (
            <div className="form-group">
              <label className="input-label">Status</label>
              <select className="select-soft" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}>
                <option value="scheduled">Scheduled</option>
                <option value="checked_in">Checked In</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          )}
          <div className="form-group">
            <label className="input-label">Notes</label>
            <textarea className="input-soft" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} style={{ resize: 'vertical' }} />
          </div>

          {error && <div style={{ color: 'var(--error)', fontSize: '13px', marginBottom: '16px' }}>⚠️ {error}</div>}

          <div className="dialog-actions">
            <button type="button" className="btn-outlined" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-gradient" disabled={saving}>
              {saving && <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />}
              {isEdit ? 'Save Changes' : 'Add Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
