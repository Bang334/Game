import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Divider,
  Card,
  CardContent,
  Avatar,
  Chip
} from '@mui/material';
import {
  AccountBalance,
  CreditCard,
  Gamepad
} from '@mui/icons-material';

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  game: {
    game_id: number;
    name: string;
    price: number;
    image?: string;
    publisher_name?: string;
  };
  user: {
    username: string;
    email: string;
    balance?: number;
  };
  loading?: boolean;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  open,
  onClose,
  onConfirm,
  game,
  user,
  loading = false
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const userBalance = user.balance || 0;
  const canAfford = userBalance >= game.price;
  const remainingBalance = userBalance - game.price;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
        }
      }}
    >
      <DialogTitle sx={{ 
        pb: 1,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        textAlign: 'center'
      }}>
        <Box display="flex" alignItems="center" justifyContent="center" gap={1}>
          <CreditCard />
          <Typography variant="h6" fontWeight="bold">
            Thanh Toán Game
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Box display="flex" gap={3} flexDirection={{ xs: 'column', md: 'row' }}>
          {/* Game Information */}
          <Box flex={1}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Gamepad color="primary" />
                  <Typography variant="h6" fontWeight="bold">
                    Thông Tin Game
                  </Typography>
                </Box>
                
                <Box display="flex" gap={2} mb={2}>
                  {game.image && (
                    <Avatar
                      src={game.image}
                      variant="rounded"
                      sx={{ width: 60, height: 60 }}
                    />
                  )}
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {game.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {game.publisher_name || 'Unknown Publisher'}
                    </Typography>
                    <Chip 
                      label={formatPrice(game.price)}
                      color="primary"
                      size="small"
                      sx={{ mt: 1 }}
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Balance Information */}
          <Box flex={1}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <AccountBalance color="primary" />
                  <Typography variant="h6" fontWeight="bold">
                    Thông Tin Thanh Toán
                  </Typography>
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Phương thức thanh toán:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" color="primary">
                    Trừ từ số dư tài khoản
                  </Typography>
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Số dư hiện tại:
                  </Typography>
                  <Typography variant="h6" color="primary" fontWeight="bold">
                    {formatPrice(userBalance)}
                  </Typography>
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Số tiền cần trừ:
                  </Typography>
                  <Typography variant="h6" color="error.main" fontWeight="bold">
                    -{formatPrice(game.price)}
                  </Typography>
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Số dư sau khi mua:
                  </Typography>
                  <Typography 
                    variant="h6" 
                    color={canAfford ? "success.main" : "error.main"}
                    fontWeight="bold"
                  >
                    {canAfford ? formatPrice(remainingBalance) : "Không đủ tiền"}
                  </Typography>
                </Box>

                {!canAfford && (
                  <Box mt={2} p={2} bgcolor="error.light" borderRadius={1}>
                    <Typography variant="body2" color="error.contrastText" fontWeight="bold">
                      ⚠️ Số dư không đủ! Cần thêm {formatPrice(game.price - userBalance)} để mua game này.
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Payment Instructions */}
        <Box mt={2} p={2} bgcolor="info.light" borderRadius={1}>
          <Typography variant="body2" color="info.contrastText">
            <strong>Hướng dẫn thanh toán:</strong>
            <br />
            1. Số tiền sẽ được trừ trực tiếp từ số dư tài khoản của bạn
            <br />
            2. Nếu không đủ tiền, vui lòng nạp tiền vào tài khoản trước
            <br />
            3. Nhấn "Xác nhận mua" để hoàn tất giao dịch
            <br />
            4. Game sẽ được thêm vào thư viện của bạn ngay lập tức
          </Typography>
        </Box>

        {/* Warning for insufficient balance */}
        {!canAfford && (
          <Box mt={2} p={2} bgcolor="error.light" borderRadius={1}>
            <Typography variant="body2" color="error.contrastText" fontWeight="bold">
              ⚠️ Số dư tài khoản không đủ để mua game này. 
              Vui lòng nạp tiền vào tài khoản trước khi mua.
            </Typography>
          </Box>
        )}

        {/* Warning for sufficient balance */}
        {canAfford && (
          <Box mt={2} p={2} bgcolor="warning.light" borderRadius={1}>
            <Typography variant="body2" color="warning.contrastText" fontWeight="bold">
              ⚠️ CẢNH BÁO: Bạn có chắc chắn muốn sử dụng {formatPrice(game.price)} để mua game "{game.name}" không?
              <br />
              <br />
              Giao dịch này KHÔNG THỂ HOÀN TÁC sau khi xác nhận!
              <br />
              Số dư sẽ bị trừ ngay lập tức và game sẽ được thêm vào thư viện của bạn.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          disabled={loading}
        >
          Hủy
        </Button>
        
        {!canAfford ? (
          <Button 
            onClick={() => {
              // Navigate to deposit page
              window.location.href = '/profile';
            }}
            variant="contained"
            color="primary"
            startIcon={<AccountBalance />}
            sx={{
              background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #45a049 0%, #3d8b40 100%)'
              }
            }}
          >
            Nạp tiền vào tài khoản
          </Button>
        ) : (
          <Button 
            onClick={onConfirm}
            variant="contained"
            disabled={loading}
            startIcon={<CreditCard />}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
              }
            }}
          >
            {loading ? 'Đang xử lý...' : 'Xác nhận mua'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default PaymentModal;
