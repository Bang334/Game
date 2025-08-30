import { useEffect, useState } from 'react'
import api from '../../api/client'

type Game = { game_id: number; name: string; price: number }
type User = { user_id: number; username: string; email: string; age: number; balance: number; role_name: string }

export default function AdminHome() {
  const [games, setGames] = useState<Game[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/api/admin/games'),
      api.get('/api/admin/users'),
    ])
      .then(([g, u]) => {
        setGames(g.data.games || [])
        setUsers(u.data.users || [])
      })
      .finally(() => setLoading(false))
  }, [])

  const addGame = async (e: React.FormEvent) => {
    e.preventDefault()
    const p = Number(price)
    if (!title || isNaN(p)) return
    await api.post('/api/admin/games', { name: title, price: p })
    const g = await api.get('/api/admin/games')
    setGames(g.data.games || [])
    setTitle('')
    setPrice('')
  }

  if (loading) return <div>Loading...</div>

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <section>
        <h3>Thêm game</h3>
        <form onSubmit={addGame} style={{ display: 'flex', gap: 8 }}>
          <input placeholder="Tên game" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input placeholder="Giá" value={price} onChange={(e) => setPrice(e.target.value)} />
          <button type="submit">Thêm</button>
        </form>
      </section>

      <section>
        <h3>Danh sách game</h3>
        <table width="100%" cellPadding={8} style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
              <th>ID</th>
              <th>Tên</th>
              <th>Giá</th>
            </tr>
          </thead>
          <tbody>
            {games.map((g) => (
              <tr key={g.game_id} style={{ borderBottom: '1px solid #f2f2f2' }}>
                <td>{g.game_id}</td>
                <td>{g.name}</td>
                <td>${g.price.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h3>Người dùng</h3>
        <table width="100%" cellPadding={8} style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Tuổi</th>
              <th>Số dư</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.user_id} style={{ borderBottom: '1px solid #f2f2f2' }}>
                <td>{u.user_id}</td>
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td>{u.age}</td>
                <td>${u.balance?.toFixed ? u.balance.toFixed(2) : u.balance}</td>
                <td>{u.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}

