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
  Gamepad,
  Person
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
                      {game.publisher_name}
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

          {/* Payment Information */}
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
                    Chủ tài khoản:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    Nguyễn Sỹ Kim Bằng
                  </Typography>
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Số tài khoản:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" fontFamily="monospace">
                    1029727303
                  </Typography>
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Ngân hàng:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    Vietcombank
                  </Typography>
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Phương thức thanh toán:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    Chuyển khoản ngân hàng
                  </Typography>
                </Box>

                <Box mb={2}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Nội dung chuyển khoản:
                  </Typography>
                  <Typography variant="body1" fontWeight="bold" fontFamily="monospace">
                    MUA GAME {game.game_id} - {user.username}
                  </Typography>
                </Box>

                {/* QR Code */}
                <Box textAlign="center" mt={2}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Quét mã QR để chuyển khoản:
                  </Typography>
                  <Box 
                    component="img"
                    src="/qr.png"
                    alt="QR Code"
                    sx={{
                      width: 120,
                      height: 120,
                      border: '1px solid #e0e0e0',
                      borderRadius: 1
                    }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* User Balance Information */}
        <Card variant="outlined">
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Person color="primary" />
              <Typography variant="h6" fontWeight="bold">
                Thông Tin Tài Khoản
              </Typography>
            </Box>
            
            <Box display="flex" gap={4}>
              <Box flex={1}>
                <Typography variant="body2" color="text.secondary">
                  Tài khoản hiện tại:
                </Typography>
                <Typography variant="h6" color="primary">
                  {formatPrice(user.balance)}
                </Typography>
              </Box>
              <Box flex={1}>
                <Typography variant="body2" color="text.secondary">
                  Số dư sau khi mua:
                </Typography>
                <Typography 
                  variant="h6" 
                  color={canAfford ? "success.main" : "error.main"}
                >
                  {canAfford ? formatPrice(remainingBalance) : "Không đủ tiền"}
                </Typography>
              </Box>
            </Box>

            {!canAfford && (
              <Box mt={2} p={2} bgcolor="error.light" borderRadius={1}>
                <Typography variant="body2" color="error.contrastText">
                  ⚠️ Số dư tài khoản không đủ để mua game này. 
                  Vui lòng nạp tiền vào tài khoản trước khi mua.
                </Typography>
              </Box>
            )}

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
          </CardContent>
        </Card>

        {/* Payment Instructions */}
        <Box mt={2} p={2} bgcolor="info.light" borderRadius={1}>
          <Typography variant="body2" color="info.contrastText">
            <strong>Hướng dẫn thanh toán:</strong>
            <br />
            1. Chuyển khoản đúng số tiền {formatPrice(game.price)} vào tài khoản trên
            <br />
            2. Nội dung chuyển khoản: MUA GAME {game.game_id} - {user.username}
            <br />
            3. Sau khi chuyển khoản, nhấn "Xác nhận mua" để hoàn tất giao dịch
            <br />
            4. Game sẽ được thêm vào thư viện của bạn ngay lập tức
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button 
          onClick={onClose}
          variant="outlined"
          disabled={loading}
        >
          Hủy
        </Button>
        <Button 
          onClick={onConfirm}
          variant="contained"
          disabled={!canAfford || loading}
          startIcon={<CreditCard />}
          sx={{
            background: canAfford 
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : undefined,
            '&:hover': {
              background: canAfford 
                ? 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)'
                : undefined
            }
          }}
        >
          {loading ? 'Đang xử lý...' : 'Xác nhận mua'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentModal;
