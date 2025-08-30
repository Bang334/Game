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
        <h3>Danh sách Game</h3>
        <table width="100%" cellPadding={8} style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
              <th>ID</th>
              <th>Tên</th>
              <th>Năm phát hành</th>
              <th>Publisher</th>
              <th>Giá</th>
              <th>Đánh giá</th>
              <th>Doanh số</th>
            </tr>
          </thead>
          <tbody>
            {games.map((g) => (
              <tr key={g.game_id} style={{ borderBottom: '1px solid #f2f2f2' }}>
                <td>{g.game_id}</td>
                <td>{g.name}</td>
                <td>{g.release_year || 'N/A'}</td>
                <td>{g.publisher_name}</td>
                <td>${g.price.toFixed(2)}</td>
                <td>{g.average_rating.toFixed(1)}/5</td>
                <td>{g.total_sales}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h3>Danh sách User</h3>
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
                <td>{u.age || 'N/A'}</td>
                <td>${u.balance?.toFixed ? u.balance.toFixed(2) : u.balance}</td>
                <td>{u.role_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h3>Danh sách Publisher</h3>
        <table width="100%" cellPadding={8} style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
              <th>ID</th>
              <th>Tên</th>
            </tr>
          </thead>
          <tbody>
            {publishers.map((p) => (
              <tr key={p.publisher_id} style={{ borderBottom: '1px solid #f2f2f2' }}>
                <td>{p.publisher_id}</td>
                <td>{p.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h3>Danh sách Genre</h3>
        <table width="100%" cellPadding={8} style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
              <th>ID</th>
              <th>Tên</th>
            </tr>
          </thead>
          <tbody>
            {genres.map((g) => (
              <tr key={g.genre_id} style={{ borderBottom: '1px solid #f2f2f2' }}>
                <td>{g.genre_id}</td>
                <td>{g.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h3>Danh sách Platform</h3>
        <table width="100%" cellPadding={8} style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
              <th>ID</th>
              <th>Tên</th>
            </tr>
          </thead>
          <tbody>
            {platforms.map((p) => (
              <tr key={p.platform_id} style={{ borderBottom: '1px solid #f2f2f2' }}>
                <td>{p.platform_id}</td>
                <td>{p.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h3>Danh sách Review</h3>
        <table width="100%" cellPadding={8} style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
              <th>ID</th>
              <th>User</th>
              <th>Game</th>
              <th>Rating</th>
              <th>Comment</th>
              <th>Ngày</th>
            </tr>
          </thead>
          <tbody>
            {reviews.map((r) => (
              <tr key={r.review_id} style={{ borderBottom: '1px solid #f2f2f2' }}>
                <td>{r.review_id}</td>
                <td>{r.username}</td>
                <td>{r.game_name}</td>
                <td>{r.rating}/5</td>
                <td>{r.comment}</td>
                <td>{new Date(r.review_date).toLocaleDateString('vi-VN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h3>Danh sách Purchase</h3>
        <table width="100%" cellPadding={8} style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
              <th>ID</th>
              <th>User</th>
              <th>Game</th>
              <th>Giá</th>
              <th>Ngày mua</th>
            </tr>
          </thead>
          <tbody>
            {purchases.map((p) => (
              <tr key={p.purchase_id} style={{ borderBottom: '1px solid #f2f2f2' }}>
                <td>{p.purchase_id}</td>
                <td>{p.username}</td>
                <td>{p.game_name}</td>
                <td>${p.price.toFixed(2)}</td>
                <td>{new Date(p.purchase_date).toLocaleDateString('vi-VN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h3>Danh sách Wishlist</h3>
        <table width="100%" cellPadding={8} style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #eee' }}>
              <th>ID</th>
              <th>User</th>
              <th>Game</th>
            </tr>
          </thead>
          <tbody>
            {wishlists.map((w) => (
              <tr key={w.wishlist_id} style={{ borderBottom: '1px solid #f2f2f2' }}>
                <td>{w.wishlist_id}</td>
                <td>{w.username}</td>
                <td>{w.game_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}

