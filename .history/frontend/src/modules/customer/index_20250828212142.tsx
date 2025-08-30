import { useEffect, useMemo, useState } from 'react'
import api from '../../api/client'

type Game = { id: number; title: string; price: number }

export default function CustomerHome() {
  const [games, setGames] = useState<Game[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  useEffect(() => {
    api
      .get('/api/customer/games')
      .then((res) => setGames(res.data.games || []))
      .finally(() => setLoading(false))
  }, [])
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return games
    return games.filter((g) => g.title.toLowerCase().includes(s))
  }, [games, q])
  if (loading) return <div>Loading...</div>
  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="m-0">Cửa hàng</h3>
        <input className="form-control" style={{ maxWidth: 320 }} placeholder="Tìm game..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="row g-3">
        {filtered.map((g) => (
          <div key={g.id} className="col-12 col-sm-6 col-md-4 col-lg-3">
            <div className="card h-100 shadow-sm">
              <div className="card-body d-flex flex-column">
                <div className="fw-bold mb-1">{g.title}</div>
                <div className="text-muted mb-2">${Number(g.price).toFixed(2)}</div>
                <button className="btn btn-dark mt-auto">Thêm vào giỏ</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

