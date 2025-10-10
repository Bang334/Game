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
  MenuItem,
  Link,
} from '@mui/material';
import {
  PersonAdd as RegisterIcon,
} from '@mui/icons-material';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    gender: '',
  });
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const { register, error } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setLocalError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setLocalError('Mật khẩu xác nhận không khớp');
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setLocalError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);

    try {
      const registerData: any = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
      };

      if (formData.age) {
        registerData.age = parseInt(formData.age);
      }

      if (formData.gender) {
        registerData.gender = formData.gender;
      }

      await register(registerData);
      
      // Redirect to home page after successful registration
      navigate('/');
    } catch (error) {
      console.error('Registration failed:', error);
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
          py: 4,
        }}
      >
        <Card sx={{ width: '100%', maxWidth: 500 }}>
          <CardContent sx={{ p: 4 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 800 }}>
                Đăng ký tài khoản
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Tạo tài khoản GameStore của bạn
              </Typography>
            </Box>

            {/* Error Alert */}
            {(error || localError) && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {localError || error}
              </Alert>
            )}

            {/* Register Form */}
            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Tên đăng nhập"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                sx={{ mb: 2.5 }}
                helperText="Tên hiển thị của bạn trên hệ thống"
              />

              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
                sx={{ mb: 2.5 }}
              />
              
              <TextField
                fullWidth
                label="Mật khẩu"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                sx={{ mb: 2.5 }}
                helperText="Tối thiểu 6 ký tự"
              />

              <TextField
                fullWidth
                label="Xác nhận mật khẩu"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                sx={{ mb: 2.5 }}
              />

              <TextField
                fullWidth
                label="Tuổi (không bắt buộc)"
                name="age"
                type="number"
                value={formData.age}
                onChange={handleChange}
                sx={{ mb: 2.5 }}
                inputProps={{ min: 1, max: 120 }}
              />

              <TextField
                fullWidth
                label="Giới tính (không bắt buộc)"
                name="gender"
                select
                value={formData.gender}
                onChange={handleChange}
                sx={{ mb: 3 }}
              >
                <MenuItem value="">Không chọn</MenuItem>
                <MenuItem value="male">Nam</MenuItem>
                <MenuItem value="female">Nữ</MenuItem>
                <MenuItem value="other">Khác</MenuItem>
              </TextField>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <RegisterIcon />}
                sx={{ py: 1.5, mb: 2 }}
              >
                {loading ? 'Đang đăng ký...' : 'Đăng ký'}
              </Button>

              {/* Login Link */}
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Đã có tài khoản?{' '}
                  <Link 
                    component={RouterLink} 
                    to="/auth/login"
                    sx={{ fontWeight: 600 }}
                  >
                    Đăng nhập ngay
                  </Link>
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default RegisterPage;

