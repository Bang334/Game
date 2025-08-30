import { Link, Outlet, useNavigate } from 'react-router-dom'

export default function CustomerLayout() {
  const navigate = useNavigate()
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null
  const onLogout = () => {
    localStorage.removeItem('token')
    navigate('/')
  }
  return (
    <div>
      <nav style={{ padding: 12, borderBottom: '1px solid #eee' }}>
        <Link to="/">Store</Link>
        <span style={{ margin: '0 8px' }}>|</span>
        <Link to="/admin">Admin</Link>
        <span style={{ float: 'right' }}>
          {token ? (
            <button onClick={onLogout}>Logout</button>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </span>
      </nav>
      <main style={{ padding: 16 }}>
        <Outlet />
      </main>
    </div>
  )
}

