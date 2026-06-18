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
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    setLoading(true);
    try {
      const res = await request.get('/api/referral/users');
      if (res.data?.list) {
        setReferrals(res.data.list);
      }
    } catch (error) {
      console.error('Failed to fetch referrals:', error);
    }
    setLoading(false);
  };

  return { referrals, loading };
}
