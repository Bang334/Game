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
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
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

  const handleOpenApproveDialog = (deposit: DepositRequest) => {
    setSelectedDeposit(deposit);
    setApproveDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedDeposit) return;

    setActionLoading(selectedDeposit.transaction_id);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:3001/api/admin/deposit-requests/${selectedDeposit.transaction_id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      enqueueSnackbar(`Đã duyệt yêu cầu nạp tiền cho ${selectedDeposit.username}`, { variant: 'success' });
      setApproveDialogOpen(false);
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
                          onClick={() => handleOpenApproveDialog(deposit)}
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

      {/* Approve Dialog */}
      <Dialog 
        open={approveDialogOpen} 
        onClose={() => setApproveDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 2,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <ApproveIcon />
          <Typography variant="h6" component="span" fontWeight="bold">
            Xác nhận duyệt yêu cầu nạp tiền
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedDeposit && (
            <Box>
              <Alert severity="success" sx={{ mb: 3 }}>
                <Typography variant="body1" fontWeight="bold">
                  Bạn đang duyệt yêu cầu nạp tiền
                </Typography>
              </Alert>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Người dùng:</Typography>
                  <Typography variant="body1" fontWeight="600">{selectedDeposit.username}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Email:</Typography>
                  <Typography variant="body2">{selectedDeposit.user_email}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Số tiền nạp:</Typography>
                  <Typography variant="h6" color="success.main" fontWeight="700">
                    +{formatPrice(selectedDeposit.amount)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Số dư hiện tại:</Typography>
                  <Typography variant="body1" fontWeight="600">{formatPrice(selectedDeposit.balance_before)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Số dư sau khi duyệt:</Typography>
                  <Typography variant="body1" fontWeight="700" color="primary.main">
                    {formatPrice(selectedDeposit.balance_after)}
                  </Typography>
                </Box>
                {selectedDeposit.description && (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">Ghi chú:</Typography>
                    <Typography variant="body2" sx={{ fontStyle: 'italic' }}>{selectedDeposit.description}</Typography>
                  </Box>
                )}
              </Box>

              <Alert severity="info" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  Sau khi duyệt, số dư của <strong>{selectedDeposit.username}</strong> sẽ được cập nhật ngay lập tức.
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button 
            onClick={() => setApproveDialogOpen(false)}
            variant="outlined"
            disabled={actionLoading !== null}
          >
            Hủy
          </Button>
          <Button 
            onClick={handleApprove} 
            variant="contained" 
            color="success"
            startIcon={actionLoading !== null ? <CircularProgress size={20} /> : <ApproveIcon />}
            disabled={actionLoading !== null}
            sx={{
              minWidth: 120,
              background: 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #388e3c 0%, #4caf50 100%)'
              }
            }}
          >
            {actionLoading !== null ? 'Đang xử lý...' : 'Xác nhận duyệt'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog 
        open={rejectDialogOpen} 
        onClose={() => setRejectDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 2,
          background: 'linear-gradient(135deg, #f44336 0%, #e91e63 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <RejectIcon />
          <Typography variant="h6" component="span" fontWeight="bold">
            Từ chối yêu cầu nạp tiền
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedDeposit && (
            <Box>
              <Alert severity="warning" sx={{ mb: 3 }}>
                <Typography variant="body1" fontWeight="bold">
                  Bạn đang từ chối yêu cầu nạp {formatPrice(selectedDeposit.amount)} của <strong>{selectedDeposit.username}</strong>
                </Typography>
              </Alert>

              <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Người dùng:</Typography>
                  <Typography variant="body1" fontWeight="600">{selectedDeposit.username}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Số tiền:</Typography>
                  <Typography variant="body1" fontWeight="600" color="error.main">{formatPrice(selectedDeposit.amount)}</Typography>
                </Box>
              </Box>

              <TextField
                autoFocus
                fullWidth
                label="Lý do từ chối *"
                multiline
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Nhập lý do từ chối (ví dụ: Không nhận được tiền, sai số tiền,...)"
                error={!rejectReason.trim() && rejectReason.length > 0}
                helperText={!rejectReason.trim() && rejectReason.length > 0 ? 'Vui lòng nhập lý do từ chối' : ''}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button 
            onClick={() => setRejectDialogOpen(false)}
            variant="outlined"
            disabled={actionLoading !== null}
          >
            Hủy
          </Button>
          <Button 
            onClick={handleReject} 
            variant="contained" 
            color="error"
            startIcon={actionLoading !== null ? <CircularProgress size={20} /> : <RejectIcon />}
            disabled={!rejectReason.trim() || actionLoading !== null}
            sx={{ minWidth: 120 }}
          >
            {actionLoading !== null ? 'Đang xử lý...' : 'Xác nhận từ chối'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DepositsPage;

