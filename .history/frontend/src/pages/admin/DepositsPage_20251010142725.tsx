import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Avatar,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  HourglassEmpty as PendingIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

interface DepositRequest {
  transaction_id: number;
  user_id: number;
  username: string;
  user_email: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string | null;
  created_at: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

const DepositsPage = () => {
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState<DepositRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    fetchDeposits();
  }, []);

  const fetchDeposits = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/admin/deposit-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeposits(response.data.deposits || []);
    } catch (error) {
      console.error('Error fetching deposits:', error);
      enqueueSnackbar('Không thể tải danh sách yêu cầu nạp tiền', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (deposit: DepositRequest) => {
    if (!confirm(`Xác nhận duyệt yêu cầu nạp ${formatPrice(deposit.amount)} cho ${deposit.username}?`)) {
      return;
    }

    setActionLoading(deposit.transaction_id);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:3001/api/admin/deposit-requests/${deposit.transaction_id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      enqueueSnackbar(`Đã duyệt yêu cầu nạp tiền cho ${deposit.username}`, { variant: 'success' });
      fetchDeposits();
    } catch (error: any) {
      console.error('Error approving deposit:', error);
      const errorMsg = error.response?.data?.error || 'Có lỗi xảy ra khi duyệt yêu cầu';
      enqueueSnackbar(errorMsg, { variant: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenRejectDialog = (deposit: DepositRequest) => {
    setSelectedDeposit(deposit);
    setRejectReason('');
    setRejectDialogOpen(true);
  };

  const handleReject = async () => {
    if (!selectedDeposit) return;

    if (!rejectReason.trim()) {
      enqueueSnackbar('Vui lòng nhập lý do từ chối', { variant: 'warning' });
      return;
    }

    setActionLoading(selectedDeposit.transaction_id);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:3001/api/admin/deposit-requests/${selectedDeposit.transaction_id}/reject`,
        { reason: rejectReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      enqueueSnackbar(`Đã từ chối yêu cầu nạp tiền của ${selectedDeposit.username}`, { variant: 'info' });
      setRejectDialogOpen(false);
      fetchDeposits();
    } catch (error: any) {
      console.error('Error rejecting deposit:', error);
      const errorMsg = error.response?.data?.error || 'Có lỗi xảy ra khi từ chối yêu cầu';
      enqueueSnackbar(errorMsg, { variant: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Quản lý yêu cầu nạp tiền
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Duyệt hoặc từ chối yêu cầu nạp tiền từ người dùng
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchDeposits}
          disabled={loading}
        >
          Làm mới
        </Button>
      </Box>

      {deposits.length === 0 ? (
        <Alert severity="info">
          <Typography variant="h6">Không có yêu cầu nạp tiền nào đang chờ duyệt</Typography>
        </Alert>
      ) : (
        <Card>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.light' }}>
                  <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Người dùng</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Số tiền</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Số dư trước</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Số dư sau</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Mô tả</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Thời gian</TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Hành động</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {deposits.map((deposit) => (
                  <TableRow 
                    key={deposit.transaction_id}
                    sx={{ 
                      '&:hover': { bgcolor: 'action.hover' },
                      opacity: actionLoading === deposit.transaction_id ? 0.6 : 1
                    }}
                  >
                    <TableCell>
                      <Chip 
                        label={`#${deposit.transaction_id}`} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, fontSize: '0.875rem' }}>
                          {deposit.username.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {deposit.username}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {deposit.user_email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="h6" color="success.main" sx={{ fontWeight: 700 }}>
                        +{formatPrice(deposit.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatPrice(deposit.balance_before)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {formatPrice(deposit.balance_after)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200 }}>
                        {deposit.description || 'Không có mô tả'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {formatDate(deposit.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={actionLoading === deposit.transaction_id ? <CircularProgress size={16} /> : <ApproveIcon />}
                          onClick={() => handleApprove(deposit)}
                          disabled={actionLoading === deposit.transaction_id}
                        >
                          Duyệt
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<RejectIcon />}
                          onClick={() => handleOpenRejectDialog(deposit)}
                          disabled={actionLoading === deposit.transaction_id}
                        >
                          Từ chối
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Từ chối yêu cầu nạp tiền</DialogTitle>
        <DialogContent>
          {selectedDeposit && (
            <Box sx={{ mb: 2 }}>
              <Alert severity="warning" sx={{ mb: 2 }}>
                Bạn đang từ chối yêu cầu nạp {formatPrice(selectedDeposit.amount)} của <strong>{selectedDeposit.username}</strong>
              </Alert>
              <TextField
                autoFocus
                fullWidth
                label="Lý do từ chối"
                multiline
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do từ chối (ví dụ: Không nhận được tiền, sai số tiền,...)"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Hủy</Button>
          <Button 
            onClick={handleReject} 
            variant="contained" 
            color="error"
            disabled={!rejectReason.trim() || actionLoading !== null}
          >
            Xác nhận từ chối
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DepositsPage;

