import { useEffect, useState } from 'react'
import api from '../../api/client'

type Game = { id: number; title: string; price: number }

export default function CustomerHome() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    api
      .get('/api/customer/games')
      .then((res) => setGames(res.data.games || []))
      .finally(() => setLoading(false))
  }, [])
  if (loading) return <div>Loading...</div>
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
      {games.map((g) => (
        <div key={g.id} style={{ border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
          <div style={{ fontWeight: 600 }}>{g.title}</div>
          <div style={{ color: '#555' }}>${g.price.toFixed(2)}</div>
          <button style={{ marginTop: 8 }}>Thêm vào giỏ</button>
        </div>
      ))}
    </div>
  )
}

