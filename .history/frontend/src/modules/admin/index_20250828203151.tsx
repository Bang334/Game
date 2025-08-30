import { useEffect, useState } from 'react'
import api from '../../api/client'

export default function AdminHome() {
  const [data, setData] = useState<any>(null)
  useEffect(() => {
    api.get('/api/admin/games').then((res) => setData(res.data)).catch(() => setData({ error: true }))
  }, [])
  return <div>Admin Dashboard: {data ? JSON.stringify(data) : 'Loading...'}</div>
}

