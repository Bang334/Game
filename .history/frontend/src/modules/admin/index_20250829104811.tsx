import { useEffect, useState } from 'react'
import api from '../../api/client'

type Game = { game_id: number; name: string; price: number; release_year: number | null; publisher_name: string; average_rating: number; total_sales: number }
type User = { user_id: number; username: string; email: string; age: number; balance: number; role_name: string }
type Publisher = { publisher_id: number; name: string }
type Genre = { genre_id: number; name: string }
type Platform = { platform_id: number; name: string }
type Review = { review_id: number; user_id: number; game_id: number; rating: number; comment: string; review_date: string; username: string; game_name: string }
type Purchase = { purchase_id: number; user_id: number; game_id: number; purchase_date: string; price: number; username: string; game_name: string }
type Wishlist = { wishlist_id: number; user_id: number; game_id: number; username: string; game_name: string }

export default function AdminHome() {
  const [games, setGames] = useState<Game[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [publishers, setPublishers] = useState<Publisher[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [wishlists, setWishlists] = useState<Wishlist[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/api/admin/games'),
      api.get('/api/admin/users'),
      api.get('/api/admin/publishers'),
      api.get('/api/admin/genres'),
      api.get('/api/admin/platforms'),
      api.get('/api/admin/reviews'),
      api.get('/api/admin/purchases'),
      api.get('/api/admin/wishlists'),
    ])
      .then(([g, u, p, gen, plat, r, pur, w]) => {
        setGames(g.data.games || [])
        setUsers(u.data.users || [])
        setPublishers(p.data.publishers || [])
        setGenres(gen.data.genres || [])
        setPlatforms(plat.data.platforms || [])
        setReviews(r.data.reviews || [])
        setPurchases(pur.data.purchases || [])
        setWishlists(w.data.wishlists || [])
      })
      .finally(() => setLoading(false))
  }, [])



  if (loading) return <div>Loading...</div>

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <section>
        <h3>Thêm game</h3>
        <form onSubmit={addGame} style={{ display: 'flex', gap: 8 }}>
          <input placeholder="Tên game" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input placeholder="Giá" value={price} onChange={(e) => setPrice(e.target.value)} />
          <select value={publisherId} onChange={(e) => setPublisherId(e.target.value)}>
            <option value="">Chọn publisher</option>
            {publishers.map(p => (
              <option key={p.publisher_id} value={p.publisher_id}>{p.name}</option>
            ))}
          </select>
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
                <td>{u.role_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}

