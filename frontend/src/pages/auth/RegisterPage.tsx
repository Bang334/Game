import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Box,
  CardContent,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
  CircularProgress,
  MenuItem,
  Link,
  Paper,
  Divider,
  InputAdornment,
} from '@mui/material';
import {
  PersonAdd as RegisterIcon,
  Email,
  Lock,
  Person,
  Cake,
  Wc,
  Visibility,
  VisibilityOff,
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

    // Validate age
    if (!formData.age) {
      setLocalError('Vui lòng nhập tuổi');
      return;
    }

    const age = parseInt(formData.age);
    if (isNaN(age) || age < 1 || age > 120) {
      setLocalError('Tuổi phải từ 1 đến 120');
      return;
    }

    // Validate gender
    if (!formData.gender) {
      setLocalError('Vui lòng chọn giới tính');
      return;
    }

    if (formData.gender !== 'male' && formData.gender !== 'female') {
      setLocalError('Giới tính chỉ được chọn Nam hoặc Nữ');
      return;
    }

    setLoading(true);

    try {
      const registerData: any = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        age: age,
        gender: formData.gender,
      };

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
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Paper
          elevation={24}
          sx={{
            borderRadius: 4,
            overflow: 'hidden',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <CardContent sx={{ p: 6 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 5 }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 3,
                }}
              >
                <RegisterIcon sx={{ fontSize: 40, color: 'white' }} />
              </Box>
              <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 800, color: '#2C3E50' }}>
                Đăng ký tài khoản
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 400 }}>
                Tạo tài khoản GameStore của bạn ngay hôm nay
              </Typography>
            </Box>

            {/* Error Alert */}
            {(error || localError) && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3, 
                  borderRadius: 2,
                  '& .MuiAlert-message': {
                    fontWeight: 500,
                  }
                }}
              >
                {localError || error}
              </Alert>
            )}

            {/* Register Form */}
            <Box component="form" onSubmit={handleSubmit}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
                <TextField
                  fullWidth
                  label="Tên đăng nhập"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      fontSize: '1.1rem',
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '1rem',
                    }
                  }}
                  InputProps={{
                    startAdornment: <Person sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
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
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      fontSize: '1.1rem',
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '1rem',
                    }
                  }}
                  InputProps={{
                    startAdornment: <Email sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 3 }}>
                <TextField
                  fullWidth
                  label="Mật khẩu"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  required
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      fontSize: '1.1rem',
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '1rem',
                    }
                  }}
                  InputProps={{
                    startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary' }} />,
                    endAdornment: (
                      <Button
                        onClick={() => setShowPassword(!showPassword)}
                        sx={{ minWidth: 'auto', p: 1 }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </Button>
                    ),
                  }}
                  helperText="Tối thiểu 6 ký tự"
                />

                <TextField
                  fullWidth
                  label="Xác nhận mật khẩu"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      fontSize: '1.1rem',
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '1rem',
                    }
                  }}
                  InputProps={{
                    startAdornment: <Lock sx={{ mr: 1, color: 'text.secondary' }} />,
                    endAdornment: (
                      <Button
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        sx={{ minWidth: 'auto', p: 1 }}
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </Button>
                    ),
                  }}
                />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mb: 4 }}>
                <TextField
                  fullWidth
                  label="Tuổi"
                  name="age"
                  type="number"
                  value={formData.age}
                  onChange={handleChange}
                  required
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      fontSize: '1.1rem',
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '1rem',
                    }
                  }}
                  InputProps={{
                    startAdornment: <Cake sx={{ mr: 1, color: 'text.secondary' }} />,
                    inputProps: { min: 1, max: 120 }
                  }}
                  helperText="Tuổi của bạn (từ 1 đến 120)"
                />

                <TextField
                  fullWidth
                  label="Giới tính"
                  name="gender"
                  select
                  value={formData.gender}
                  onChange={handleChange}
                  required
                  sx={{ 
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      fontSize: '1.1rem',
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '1rem',
                    }
                  }}
                  InputProps={{
                    startAdornment: <Wc sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                  helperText="Chọn giới tính của bạn"
                >
                  <MenuItem value="male">Nam</MenuItem>
                  <MenuItem value="female">Nữ</MenuItem>
                </TextField>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <RegisterIcon />}
                sx={{ 
                  py: 2, 
                  mb: 3,
                  borderRadius: 2,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                {loading ? 'Đang đăng ký...' : 'Tạo tài khoản'}
              </Button>

              <Divider sx={{ my: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  hoặc
                </Typography>
              </Divider>

              {/* Login Link */}
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                  Đã có tài khoản?
                </Typography>
                <Link 
                  component={RouterLink} 
                  to="/auth/login"
                  sx={{ 
                    fontWeight: 600,
                    fontSize: '1.1rem',
                    textDecoration: 'none',
                    color: '#667eea',
                    '&:hover': {
                      color: '#5a6fd8',
                      textDecoration: 'underline',
                    }
                  }}
                >
                  Đăng nhập ngay
                </Link>
              </Box>
            </Box>
          </CardContent>
        </Paper>
      </Container>
    </Box>
  );
};

export default RegisterPage;

