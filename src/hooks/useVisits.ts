import { useState, useEffect, useCallback } from 'react';
import { getVisits, createVisit, updateVisit, checkOutVisit, deleteVisit } from '../api/visits';
import type { Visit } from '../types/models';

export function useVisits(params?: { status?: string; search?: string }) {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVisits = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getVisits(params);
      setVisits(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [params?.status, params?.search]);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  const addVisit = async (data: Partial<Visit>) => {
    const visit = await createVisit(data);
    await fetchVisits();
    return visit;
  };

  const editVisit = async (id: string, data: Partial<Visit>) => {
    const visit = await updateVisit(id, data);
    await fetchVisits();
    return visit;
  };

  const checkOut = async (id: string) => {
    await checkOutVisit(id);
    await fetchVisits();
  };

  const removeVisit = async (id: string) => {
    await deleteVisit(id);
    await fetchVisits();
  };

  return { visits, loading, error, refetch: fetchVisits, addVisit, editVisit, checkOut, removeVisit };
}
