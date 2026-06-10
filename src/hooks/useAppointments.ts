import { useState, useEffect, useCallback } from 'react';
import { getAppointments, createAppointment, updateAppointment, deleteAppointment } from '../api/appointments';
import type { Appointment } from '../types/models';

export function useAppointments(params?: { status?: string; search?: string }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAppointments(params);
      setAppointments(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [params?.status, params?.search]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const addAppointment = async (data: Partial<Appointment>) => {
    const apt = await createAppointment(data);
    await fetchAppointments();
    return apt;
  };

  const editAppointment = async (id: string, data: Partial<Appointment>) => {
    const apt = await updateAppointment(id, data);
    await fetchAppointments();
    return apt;
  };

  const removeAppointment = async (id: string) => {
    await deleteAppointment(id);
    await fetchAppointments();
  };

  return { appointments, loading, error, refetch: fetchAppointments, addAppointment, editAppointment, removeAppointment };
}
