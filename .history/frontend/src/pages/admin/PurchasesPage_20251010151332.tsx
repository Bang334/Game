import React, { useState, useEffect } from 'react';
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
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  TablePagination,
  Stack,
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  FilterList as FilterListIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';

interface Purchase {
  purchase_id: number;
  user_id: number;
  game_id: number;
  purchase_date: string;
  amount: number;
  payment_method: string;
  status: string;
  user: {
    username: string;
    email: string;
  };
  game: {
    title: string;
    image_url?: string;
    price: number;
  };
}

const AdminPurchasesPage = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<number | null>(null);

  useEffect(() => {
    fetchPurchases();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [searchTerm, statusFilter, startDate, endDate]);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/admin/purchases', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setPurchases(response.data.purchases || []);
    } catch (error) {
      console.error('Error fetching purchases:', error);
      setSnackbar({
        open: true,
        message: 'Lỗi khi tải danh sách purchases',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPurchases = purchases.filter(purchase => {
    const matchesSearch = 
      purchase.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.payment_method.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || purchase.status === statusFilter;
    
    // Date filter
    const purchaseDate = new Date(purchase.purchase_date);
    const matchesStartDate = !startDate || purchaseDate >= new Date(startDate);
    const matchesEndDate = !endDate || purchaseDate <= new Date(endDate + 'T23:59:59');
    
    return matchesSearch && matchesStatus && matchesStartDate && matchesEndDate;
  });

  // Paginated purchases
  const paginatedPurchases = filteredPurchases.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setStartDate('');
    setEndDate('');
    setPage(0);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, purchaseId: number) => {
    setAnchorEl(event.currentTarget);
    setSelectedPurchaseId(purchaseId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedPurchaseId(null);
  };

  const handleViewPurchase = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setOpenDialog(true);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      case 'refunded':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'Hoàn thành';
      case 'pending':
        return 'Đang xử lý';
      case 'failed':
        return 'Thất bại';
      case 'refunded':
        return 'Đã hoàn tiền';
      default:
        return status;
    }
  };

  // Calculate statistics
  const totalRevenue = purchases
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + (p.amount || p.game?.price || 0), 0);
  
  const totalPurchases = purchases.length;
  const completedPurchases = purchases.filter(p => p.status === 'completed').length;
  const pendingPurchases = purchases.filter(p => p.status === 'pending').length;

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
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
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
              Quản lý Purchases
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Tổng cộng: {purchases.length} purchases
            </Typography>
          </Box>
        </Box>

        {/* Statistics Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
          <Card sx={{ 
            borderRadius: 3, 
            background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
            color: 'white',
            boxShadow: '0 8px 32px rgba(76, 175, 80, 0.3)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-8px) scale(1.02)',
              boxShadow: '0 16px 40px rgba(76, 175, 80, 0.4)',
            }
          }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <MoneyIcon sx={{ fontSize: 48, mb: 2, opacity: 0.9 }} />
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                {formatPrice(totalRevenue)}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 600 }}>
                Tổng doanh thu
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ 
            borderRadius: 3, 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-8px) scale(1.02)',
              boxShadow: '0 16px 40px rgba(102, 126, 234, 0.4)',
            }
          }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <ShoppingCartIcon sx={{ fontSize: 48, mb: 2, opacity: 0.9 }} />
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                {totalPurchases}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 600 }}>
                Tổng purchases
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ 
            borderRadius: 3, 
            background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
            color: 'white',
            boxShadow: '0 8px 32px rgba(156, 39, 176, 0.3)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-8px) scale(1.02)',
              boxShadow: '0 16px 40px rgba(156, 39, 176, 0.4)',
            }
          }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <TrendingUpIcon sx={{ fontSize: 48, mb: 2, opacity: 0.9 }} />
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                {completedPurchases}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 600 }}>
                Hoàn thành
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ 
            borderRadius: 3, 
            background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
            color: 'white',
            boxShadow: '0 8px 32px rgba(255, 152, 0, 0.3)',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-8px) scale(1.02)',
              boxShadow: '0 16px 40px rgba(255, 152, 0, 0.4)',
            }
          }}>
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <ShoppingCartIcon sx={{ fontSize: 48, mb: 2, opacity: 0.9 }} />
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
                {pendingPurchases}
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 600 }}>
                Đang xử lý
              </Typography>
            </CardContent>
          </Card>
        </Box>

        {/* Filters */}
        <Card sx={{ 
          mb: 3, 
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <CardContent>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1, 
              mb: 2,
              p: 2,
              background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
              borderRadius: 2
            }}>
              <FilterListIcon sx={{ color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'primary.main' }}>
                Bộ lọc
              </Typography>
            </Box>
            
            <Stack spacing={2}>
              <TextField
                placeholder="Tìm kiếm theo user, game, payment method..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                fullWidth
                size="small"
              />
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <FormControl sx={{ minWidth: 150, flex: '1 1 150px' }} size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="all">Tất cả</MenuItem>
                    <MenuItem value="completed">Hoàn thành</MenuItem>
                    <MenuItem value="pending">Đang xử lý</MenuItem>
                    <MenuItem value="failed">Thất bại</MenuItem>
                    <MenuItem value="refunded">Đã hoàn tiền</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Từ ngày"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: <CalendarIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                  }}
                  sx={{ minWidth: 180, flex: '1 1 180px' }}
                  size="small"
                />

                <TextField
                  label="Đến ngày"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: <CalendarIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                  }}
                  sx={{ minWidth: 180, flex: '1 1 180px' }}
                  size="small"
                />

                <Button 
                  variant="outlined" 
                  onClick={handleClearFilters}
                  sx={{ minWidth: 100 }}
                >
                  Xóa bộ lọc
                </Button>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', pt: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  Tìm thấy <strong>{filteredPurchases.length}</strong> kết quả
                  {filteredPurchases.length !== purchases.length && ` trong tổng số ${purchases.length} purchases`}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* Purchases Table */}
        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  '& .MuiTableCell-head': {
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.95rem'
                  }
                }}>
                  <TableCell>User</TableCell>
                  <TableCell>Game</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Payment Method</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
            <TableBody>
              {paginatedPurchases.map((purchase) => (
                <TableRow 
                  key={purchase.purchase_id} 
                  hover
                  sx={{ 
                    '&:hover': {
                      backgroundColor: 'rgba(102, 126, 234, 0.04)',
                    }
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ width: 40, height: 40, mr: 2, bgcolor: 'primary.main' }}>
                        {purchase.user.username.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                          {purchase.user.username}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {purchase.user.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar
                        src={purchase.game.image_url}
                        sx={{ width: 40, height: 40, mr: 2 }}
                      >
                        🎮
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {purchase.game.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatPrice(purchase.game.price)}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
                      {formatPrice(purchase.amount || purchase.game?.price || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={purchase.payment_method}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusLabel(purchase.status)}
                      color={getStatusColor(purchase.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(purchase.purchase_date)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      onClick={(e) => handleMenuOpen(e, purchase.purchase_id)}
                      size="small"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredPurchases.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <ShoppingCartIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Không tìm thấy purchases nào
              </Typography>
            </Box>
          )}

          {filteredPurchases.length > 0 && (
            <TablePagination
              component="div"
              count={filteredPurchases.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50, 100]}
              labelRowsPerPage="Số hàng mỗi trang:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} trong ${count}`}
            />
          )}
        </TableContainer>
      </Box>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            const purchase = purchases.find(p => p.purchase_id === selectedPurchaseId);
            if (purchase) {
              handleViewPurchase(purchase);
            }
            handleMenuClose();
          }}
        >
          <VisibilityIcon sx={{ mr: 1 }} />
          Xem chi tiết
        </MenuItem>
      </Menu>

      {/* Purchase Detail Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Chi tiết Purchase
        </DialogTitle>
        <DialogContent>
          {selectedPurchase && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    User
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ width: 48, height: 48, mr: 2, bgcolor: 'primary.main' }}>
                      {selectedPurchase.user.username.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">
                        {selectedPurchase.user.username}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedPurchase.user.email}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Game
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      src={selectedPurchase.game.image_url}
                      sx={{ width: 48, height: 48, mr: 2 }}
                    >
                      🎮
                    </Avatar>
                    <Box>
                      <Typography variant="h6">
                        {selectedPurchase.game.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Giá gốc: {formatPrice(selectedPurchase.game.price)}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Amount
                  </Typography>
                  <Typography variant="h5" sx={{ color: 'success.main', fontWeight: 700 }}>
                    {formatPrice(selectedPurchase.amount || selectedPurchase.game?.price || 0)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Payment Method
                  </Typography>
                  <Chip
                    label={selectedPurchase.payment_method}
                    variant="outlined"
                    size="large"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Status
                  </Typography>
                  <Chip
                    label={getStatusLabel(selectedPurchase.status)}
                    color={getStatusColor(selectedPurchase.status) as any}
                    size="large"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Purchase Date
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedPurchase.purchase_date)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminPurchasesPage;
