import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useSnackbar } from 'notistack';

interface DepositRequest {
  transaction_id: number;
  user_id: number;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: number;
  rejection_reason?: string | null;
  user: {
    username: string;
    email: string;
  };
  reviewer?: string;
}

const DepositRequestsPage = () => {
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Dialog states
  const [selectedDeposit, setSelectedDeposit] = useState<DepositRequest | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchDeposits();
  }, [statusFilter, searchTerm, startDate, endDate]);

  const fetchDeposits = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm }),
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate })
      });

      const response = await axios.get(`http://localhost:3001/api/admin/deposit-requests?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setDeposits(response.data.deposits);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Error fetching deposits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (transactionId: number) => {
    try {
      const response = await axios.post(`http://localhost:3001/api/admin/deposit-requests/${transactionId}/approve`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      enqueueSnackbar(`Đã duyệt yêu cầu nạp tiền. Số dư mới: ${new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
      }).format(response.data.new_balance)}`, { 
        variant: 'success',
        autoHideDuration: 5000 
      });
      
      fetchDeposits(); // Refresh data
    } catch (error) {
      console.error('Error approving deposit:', error);
      enqueueSnackbar('Có lỗi xảy ra khi duyệt yêu cầu nạp tiền', { variant: 'error' });
    }
  };

  const handleReject = async () => {
    if (!selectedDeposit || !rejectionReason.trim()) return;
    
    try {
      await axios.post(`http://localhost:3001/api/admin/deposit-requests/${selectedDeposit.transaction_id}/reject`, {
        reason: rejectionReason
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      enqueueSnackbar('Đã từ chối yêu cầu nạp tiền', { variant: 'success' });
      
      setRejectDialogOpen(false);
      setRejectionReason('');
      setSelectedDeposit(null);
      fetchDeposits(); // Refresh data
    } catch (error) {
      console.error('Error rejecting deposit:', error);
      enqueueSnackbar('Có lỗi xảy ra khi từ chối yêu cầu nạp tiền', { variant: 'error' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'APPROVED': return 'success';
      case 'REJECTED': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Chờ duyệt';
      case 'APPROVED': return 'Đã duyệt';
      case 'REJECTED': return 'Từ chối';
      default: return status;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const clearFilters = () => {
    setStatusFilter('ALL');
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Quản lý yêu cầu nạp tiền
          </Typography>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchDeposits}
        >
          Làm mới
        </Button>
      </Box>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
              <TextField
                fullWidth
                label="Tìm kiếm user"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Box>
            
            <Box sx={{ flex: '1 1 200px', minWidth: '150px' }}>
              <FormControl fullWidth>
                <InputLabel>Trạng thái</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Trạng thái"
                >
                  <MenuItem value="ALL">Tất cả</MenuItem>
                  <MenuItem value="PENDING">Chờ duyệt</MenuItem>
                  <MenuItem value="APPROVED">Đã duyệt</MenuItem>
                  <MenuItem value="REJECTED">Từ chối</MenuItem>
                </Select>
              </FormControl>
            </Box>
            
            <Box sx={{ flex: '1 1 200px', minWidth: '150px' }}>
              <TextField
                fullWidth
                label="Từ ngày"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            
            <Box sx={{ flex: '1 1 200px', minWidth: '150px' }}>
              <TextField
                fullWidth
                label="Đến ngày"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                variant="outlined"
                onClick={clearFilters}
              >
                Xóa bộ lọc
              </Button>
              <Chip 
                label={`${total} yêu cầu`}
                color="primary"
                variant="outlined"
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Deposits Table */}
        <Card>
        <TableContainer>
            <Table>
              <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Số tiền</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Ngày tạo</TableCell>
                <TableCell>Người duyệt</TableCell>
                <TableCell>Thao tác</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : deposits.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                    Không có yêu cầu nào
                    </TableCell>
                </TableRow>
              ) : (
                deposits.map((deposit) => (
                  <TableRow key={deposit.transaction_id}>
                    <TableCell>#{deposit.transaction_id}</TableCell>
                    <TableCell>
                        <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {deposit.user.username}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                          {deposit.user.email}
                          </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold" color="primary">
                        {formatCurrency(deposit.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusText(deposit.status)}
                        color={getStatusColor(deposit.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(deposit.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {deposit.reviewer ? (
                        <Typography variant="body2">
                          {deposit.reviewer}
                      </Typography>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Chưa duyệt
                      </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Xem chi tiết">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedDeposit(deposit);
                              setViewDialogOpen(true);
                            }}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        
                        {deposit.status === 'PENDING' && (
                          <>
                            <Tooltip title="Duyệt">
                              <IconButton
                          size="small"
                          color="success"
                                onClick={() => handleApprove(deposit.transaction_id)}
                              >
                                <ApproveIcon />
                              </IconButton>
                            </Tooltip>
                            
                            <Tooltip title="Từ chối">
                              <IconButton
                          size="small"
                          color="error"
                                onClick={() => {
                                  setSelectedDeposit(deposit);
                                  setRejectDialogOpen(true);
                                }}
                              >
                                <RejectIcon />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
              </TableBody>
            </Table>
        </TableContainer>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Chi tiết yêu cầu nạp tiền</DialogTitle>
        <DialogContent>
          {selectedDeposit && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                  <Typography variant="body2" color="text.secondary">ID giao dịch:</Typography>
                  <Typography variant="body1" fontWeight="bold">#{selectedDeposit.transaction_id}</Typography>
                </Box>
                <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                  <Typography variant="body2" color="text.secondary">Số tiền:</Typography>
                  <Typography variant="body1" fontWeight="bold" color="primary">
                    {formatCurrency(selectedDeposit.amount)}
                  </Typography>
                </Box>
                <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                  <Typography variant="body2" color="text.secondary">User:</Typography>
                  <Typography variant="body1" fontWeight="bold">{selectedDeposit.user.username}</Typography>
                  <Typography variant="body2" color="text.secondary">{selectedDeposit.user.email}</Typography>
                </Box>
                <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                  <Typography variant="body2" color="text.secondary">Trạng thái:</Typography>
                  <Chip
                    label={getStatusText(selectedDeposit.status)}
                    color={getStatusColor(selectedDeposit.status) as any}
                  />
                </Box>
                <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                  <Typography variant="body2" color="text.secondary">Ngày tạo:</Typography>
                  <Typography variant="body1">{formatDate(selectedDeposit.created_at)}</Typography>
                </Box>
                {selectedDeposit.reviewed_at && (
                  <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
                    <Typography variant="body2" color="text.secondary">Ngày duyệt:</Typography>
                    <Typography variant="body1">{formatDate(selectedDeposit.reviewed_at)}</Typography>
                  </Box>
                )}
                {selectedDeposit.rejection_reason && (
                  <Box sx={{ flex: '1 1 100%', minWidth: '100%' }}>
                    <Typography variant="body2" color="text.secondary">Lý do từ chối:</Typography>
                    <Typography variant="body1" color="error">
                      {selectedDeposit.rejection_reason}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Đóng</Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Từ chối yêu cầu nạp tiền</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Bạn có chắc chắn muốn từ chối yêu cầu này?
              </Alert>
              <TextField
                fullWidth
                multiline
            rows={3}
            label="Lý do từ chối"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Hủy</Button>
          <Button 
            onClick={handleReject} 
            color="error"
            variant="contained"
            disabled={!rejectionReason.trim()}
          >
            Từ chối
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DepositRequestsPage;
