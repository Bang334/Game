import { useEffect, useState } from 'react'
import api from '../../api/client'

export default function CustomerHome() {
  const [data, setData] = useState<any>(null)
  useEffect(() => {
    api.get('/api/customer/games').then((res) => setData(res.data)).catch(() => setData({ error: true }))
  }, [])
  return <div>Customer Storefront: {data ? JSON.stringify(data) : 'Loading...'}</div>
}

