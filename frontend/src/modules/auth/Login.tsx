import { useState } from 'react'
import api from '../../api/client'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('adminpass')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await api.post('/api/auth/login', { email, password })
      localStorage.setItem('token', res.data.token)
      const role = (res.data.role || '').toUpperCase()
      localStorage.setItem('role', role)
      navigate(role === 'ADMIN' ? '/admin' : '/')
    } catch (err) {
      setError('Đăng nhập thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="d-flex align-items-center justify-content-center vh-100" style={{
      background: 'linear-gradient(135deg, #1f2937 0%, #0ea5e9 50%, #22c55e 100%)'
    }}>
      <div className="card shadow-lg border-0" style={{ width: 380, backdropFilter: 'blur(8px)' }}>
        <div className="card-body p-4">
          <h3 className="text-center mb-3 fw-bold" style={{
            background: 'linear-gradient(90deg, #06b6d4, #22c55e)', WebkitBackgroundClip: 'text', color: 'transparent'
          }}>Đăng nhập</h3>
          <form onSubmit={onSubmit}>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="mb-2">
              <label className="form-label">Mật khẩu</label>
              <input className="form-control" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && <div className="text-danger small mb-2">{error}</div>}
            <button type="submit" disabled={loading} className="btn w-100 fw-semibold"
              style={{
                background: 'linear-gradient(90deg, #06b6d4, #22c55e)',
                color: 'white',
                transition: 'transform .15s ease, box-shadow .15s ease'
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 10px 20px rgba(34,197,94,.25)'
                ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
                ;(e.currentTarget as HTMLButtonElement).style.transform = 'none'
              }}
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

