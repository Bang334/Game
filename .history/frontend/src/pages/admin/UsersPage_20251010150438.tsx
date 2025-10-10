import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Container,
  CircularProgress,
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

interface User {
  user_id: number;
  username: string;
  email: string;
  role_name: string;
  balance: number;
  age?: number;
  gender?: string;
  role_id: number;
}

const AdminUsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/admin/users', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setSnackbar({
        open: true,
        message: 'Lỗi khi tải danh sách users',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setOpenDialog(true);
  };

  const handleDeleteUser = async (userId: number) => {
    if (window.confirm('Bạn có chắc muốn xóa user này?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:3001/api/admin/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setUsers(users.filter(user => user.user_id !== userId));
        setSnackbar({
          open: true,
          message: 'Xóa user thành công',
          severity: 'success'
        });
      } catch (error) {
        console.error('Error deleting user:', error);
        setSnackbar({
          open: true,
          message: 'Lỗi khi xóa user',
          severity: 'error'
        });
      }
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'error';
      case 'customer':
        return 'primary';
      default:
        return 'default';
    }
  };

  const handleSaveUser = async (userData: any) => {
    try {
      const token = localStorage.getItem('token');
      if (selectedUser) {
        // Update existing user
        await axios.put(`http://localhost:3001/api/admin/users/${selectedUser.user_id}`, userData, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setSnackbar({
          open: true,
          message: 'Cập nhật user thành công',
          severity: 'success'
        });
      } else {
        // Create new user - you might need to implement this endpoint
        setSnackbar({
          open: true,
          message: 'Chức năng tạo user mới chưa được implement',
          severity: 'error'
        });
      }
      setOpenDialog(false);
      fetchUsers(); // Refresh the list
    } catch (error: any) {
      console.error('Error saving user:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Lỗi khi lưu user',
        severity: 'error'
      });
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 4,
          p: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 3,
          color: 'white'
        }}>
          <Box>
            <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 800 }}>
              Quản lý Users
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Tổng cộng {users.length} users trong hệ thống
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            size="large"
            onClick={() => {
              setSelectedUser(null);
              setOpenDialog(true);
            }}
            sx={{ 
              bgcolor: 'rgba(255,255,255,0.2)',
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.3)',
              }
            }}
          >
            Thêm User
          </Button>
        </Box>

        {/* Search */}
        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            placeholder="Tìm kiếm users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ maxWidth: 400 }}
          />
        </Box>

        {/* Stats Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3, mb: 4 }}>
          <Card sx={{ 
            borderRadius: 3, 
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
            }
          }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <PersonIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 700, mb: 1 }}>
                {users.length}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                Tổng Users
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ 
            borderRadius: 3, 
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
            }
          }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <PersonIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" sx={{ color: 'success.main', fontWeight: 700, mb: 1 }}>
                {users.filter(u => u.role_name.toLowerCase() === 'customer').length}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                Customers
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ 
            borderRadius: 3, 
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
            }
          }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <PersonIcon sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
              <Typography variant="h4" sx={{ color: 'error.main', fontWeight: 700, mb: 1 }}>
                {users.filter(u => u.role_name.toLowerCase() === 'admin').length}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                Admins
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ 
            borderRadius: 3, 
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-4px)',
              boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
            }
          }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <PersonIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" sx={{ color: 'info.main', fontWeight: 700, mb: 1 }}>
                ${users.reduce((sum, user) => sum + user.balance, 0).toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                Tổng Balance
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Users Grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
          {filteredUsers.map((user) => (
            <Card
              key={user.user_id}
              sx={{
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                }
              }}
            >
              <CardContent>
                {/* User Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar sx={{ 
                    bgcolor: 'primary.main', 
                    mr: 2,
                    width: 50,
                    height: 50,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    border: '2px solid #f0f0f0'
                  }}>
                    {user.username.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {user.username}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {user.email}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleEditUser(user)}
                      sx={{ 
                        color: 'primary.main',
                        '&:hover': { 
                          backgroundColor: 'rgba(102, 126, 234, 0.1)',
                          transform: 'scale(1.1)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteUser(user.user_id)}
                      sx={{ 
                        color: 'error.main',
                        '&:hover': { 
                          backgroundColor: 'rgba(244, 67, 54, 0.1)',
                          transform: 'scale(1.1)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>

                {/* User Info */}
                <Box sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Số dư:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      ${user.balance.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Tuổi:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {user.age || 'N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Giới tính:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {user.gender || 'N/A'}
                    </Typography>
                  </Box>
                </Box>

                {/* Role */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip
                    label={user.role_name}
                    color={getRoleColor(user.role_name)}
                    size="small"
                  />
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>

        {filteredUsers.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              Không tìm thấy user nào phù hợp với từ khóa "{searchTerm}"
            </Typography>
          </Box>
        )}

        {/* Add/Edit User Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            {selectedUser ? 'Chỉnh sửa User' : 'Thêm User mới'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Username"
                defaultValue={selectedUser?.username || ''}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                defaultValue={selectedUser?.email || ''}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Số dư"
                type="number"
                defaultValue={selectedUser?.balance || 0}
                sx={{ mb: 2 }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>
              Hủy
            </Button>
            <Button variant="contained" onClick={() => setOpenDialog(false)}>
              {selectedUser ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default AdminUsersPage;
