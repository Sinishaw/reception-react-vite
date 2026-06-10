import { useState, useEffect } from 'react';
import { getStaff } from '../api/staff';
import type { Staff } from '../types/models';

export function useStaff() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const data = await getStaff();
        setStaff(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return { staff, loading, error };
}
