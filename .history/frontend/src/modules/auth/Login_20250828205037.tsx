import { useState } from 'react'
import api from '../../api/client'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('admin123')
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
      navigate(role === 'ADMIN' ? '/admin' : '/')
    } catch (err) {
      setError('Đăng nhập thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ maxWidth: 360, margin: '40px auto' }}>
      <h2>Đăng nhập</h2>
      <div style={{ marginTop: 12 }}>
        <label>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%' }} />
      </div>
      <div style={{ marginTop: 12 }}>
        <label>Mật khẩu</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: '100%' }} />
      </div>
      {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      <button type="submit" disabled={loading} style={{ marginTop: 16 }}>
        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
      </button>
    </form>
  )
}

