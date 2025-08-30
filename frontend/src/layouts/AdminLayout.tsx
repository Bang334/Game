import { Link, Outlet } from 'react-router-dom'

export default function AdminLayout() {
  return (
    <div>
      <nav style={{ padding: 12, borderBottom: '1px solid #eee' }}>
        <Link to="/">Store</Link>
        <span style={{ margin: '0 8px' }}>|</span>
        <Link to="/admin">Admin</Link>
      </nav>
      <main style={{ padding: 16 }}>
        <Outlet />
      </main>
    </div>
  )
}

