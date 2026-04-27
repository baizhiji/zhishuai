import { useState, useEffect } from 'react'

interface Referral {
  id: string
  referredUser: string
  status: string
  commission: number
  date: string
}

export function useReferral() {
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // 模拟数据加载
    setLoading(true)
    setTimeout(() => {
      setReferrals([
        { id: '1', referredUser: '用户A', status: 'registered', commission: 100, date: '2024-03-15' },
        { id: '2', referredUser: '用户B', status: 'active', commission: 200, date: '2024-03-14' },
        { id: '3', referredUser: '用户C', status: 'pending', commission: 0, date: '2024-03-13' },
      ])
      setLoading(false)
    }, 1000)
  }, [])

  return { referrals, loading }
}
