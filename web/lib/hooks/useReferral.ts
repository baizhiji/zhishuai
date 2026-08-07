import { useState, useEffect } from 'react';
import request from '@/utils/request';

interface Referral {
  id: string;
  referredUser: string;
  status: string;
  commission: number;
  date: string;
}

export function useReferral() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    request.get('/api/referrals')
      .then((res: any) => {
        setReferrals(res.data || []);
      })
      .catch(() => {
        setReferrals([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return { referrals, loading };
}
