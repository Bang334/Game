import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
  CircularProgress,
  Link,
} from '@mui/material';
import {
  Login as LoginIcon,
} from '@mui/icons-material';

const LoginPage = () => {
  const [email, setEmail] = useState('mobile_gamer@example.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const { login, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await login(email, password);
      
      
      // Redirect based on role
      if (user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Card sx={{ width: '100%', maxWidth: 400 }}>
          <CardContent sx={{ p: 4 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 800 }}>
                Đăng nhập
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Đăng nhập vào GameStore
              </Typography>
            </Box>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {/* Login Form */}
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                sx={{ mb: 3 }}
              />
              
              <TextField
                fullWidth
                label="Mật khẩu"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                sx={{ mb: 3 }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <LoginIcon />}
                sx={{ py: 1.5, mb: 2 }}
              >
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </Button>

              {/* Register Link */}
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Chưa có tài khoản?{' '}
                  <Link 
                    component={RouterLink} 
                    to="/auth/register"
                    sx={{ fontWeight: 600 }}
                  >
                    Đăng ký ngay
                  </Link>
                </Typography>
              </Box>

              {/* Demo accounts */}
              <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Tài khoản demo:
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  Admin: admin@gamestore.com / admin123
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  Customer: john@example.com / password123
                </Typography>
                <Typography variant="body2">
                  Customer: jane@example.com / password123
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default LoginPage;
