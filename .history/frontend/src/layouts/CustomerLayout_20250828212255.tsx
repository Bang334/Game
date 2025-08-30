import { Link, Outlet, useNavigate } from 'react-router-dom'

export default function CustomerLayout() {
  const navigate = useNavigate()
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null
  const role = typeof localStorage !== 'undefined' ? localStorage.getItem('role') : null
  const onLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    navigate('/')
  }
  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom sticky-top">
        <div className="container">
          <Link className="navbar-brand fw-bold" to="/">GameStore</Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#nav">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div id="nav" className="collapse navbar-collapse">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0"></ul>
            <div className="d-flex align-items-center gap-3">
              {role && <span className="badge text-bg-secondary">{role}</span>}
              {token ? (
                <button className="btn btn-outline-dark btn-sm" onClick={onLogout}>Logout</button>
              ) : (
                <Link className="btn btn-dark btn-sm" to="/login">Login</Link>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="container py-4">
        <Outlet />
      </main>
    </div>
  )
}

