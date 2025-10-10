import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  ShoppingCart as CartIcon,
  FavoriteOutlined as WishlistIcon,
  Star as StarIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { trackGameViewDebounced, trackGameLike, trackGamePurchase } from '../../services/interactionTracking';
import PaymentModal from '../../components/PaymentModal';
import RatingModal from '../../components/RatingModal';

interface Game {
  game_id: number;
  name: string;
  price: number;
  image?: string;
  description?: string;
  release_date?: string;
  average_rating?: number;
  publisher_name?: string;
  genres?: string[];
  platforms?: string[];
  languages?: string[];
  multiplayer?: boolean;
  capacity?: number;
  mode?: string;
  age_rating?: string;
  screenshots?: string[];
  features?: string[];
  link_download?: string;
  min_specs?: {
    cpu: string | null;
    ram: string | null;
    gpu: string | null;
  } | null;
  rec_specs?: {
    cpu: string | null;
    ram: string | null;
    gpu: string | null;
  } | null;
}

interface Review {
  review_id: number;
  user_id: number;
  game_id: number;
  rating: number;
  comment: string;
  review_date: string;
  username: string;
  user_email?: string;
}

interface Purchase {
  purchase_id: number;
  user_id: number;
  game_id: number;
  purchase_date: string;
}

const GameDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, updateBalance } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);


  useEffect(() => {
    if (id) {
      fetchGameDetail(id);
      fetchReviews(id);
      if (currentUser) {
        checkPurchaseStatus(id);
        checkWishlistStatus(id);
        fetchUserReview(id);
      }
    }
  }, [id, currentUser]);

  useEffect(() => {
    // 👀 Track view when user logs in and game is loaded (after 2 seconds)
    if (currentUser && game) {
      trackGameViewDebounced(currentUser.user_id, game.game_id, 2000);
    }
  }, [currentUser, game]);

  const fetchGameDetail = async (gameId: string) => {
    try {
      const response = await axios.get(`http://localhost:3001/api/customer/games/${gameId}`);
      setGame(response.data.game);
    } catch (error) {
      console.error('Error fetching game detail:', error);
      setGame(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (gameId: string) => {
    try {
      const response = await axios.get(`http://localhost:3001/api/customer/games/${gameId}/reviews`);
      setReviews(response.data.reviews || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    }
  };

  const checkPurchaseStatus = async (gameId: string) => {
    if (!currentUser) return;
    
    try {
      const response = await axios.get(`http://localhost:3001/api/customer/purchases`);
      const purchases = response.data.purchases || [];
      const hasBought = purchases.some((purchase: Purchase) => purchase.game_id === parseInt(gameId));
      setHasPurchased(hasBought);
    } catch (error) {
      console.error('Error checking purchase status:', error);
    }
  };

  const checkWishlistStatus = async (gameId: string) => {
    if (!currentUser) return;
    
    try {
      const response = await axios.get(`http://localhost:3001/api/customer/wishlist`);
      const wishlist = response.data.wishlist || [];
      const inWishlist = wishlist.some((item: any) => item.game_id === parseInt(gameId));
      setIsInWishlist(inWishlist);
    } catch (error) {
      console.error('Error checking wishlist status:', error);
    }
  };

  const fetchUserReview = async (gameId: string) => {
    if (!currentUser) return;
    
    try {
      const response = await axios.get(`http://localhost:3001/api/customer/ratings/${gameId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setUserReview(response.data.rating || null);
    } catch (error) {
      console.error('Error fetching user review:', error);
      setUserReview(null);
    }
  };

  const handleToggleWishlist = async () => {
    if (!currentUser || !game) return;
    
    try {
      if (isInWishlist) {
        // Remove from wishlist
        await axios.delete(`http://localhost:3001/api/customer/wishlist/${game.game_id}`);
        setIsInWishlist(false);
        enqueueSnackbar('Đã xóa khỏi wishlist', { variant: 'info' });
      } else {
        // Add to wishlist
        await axios.post(`http://localhost:3001/api/customer/wishlist`, {
          game_id: game.game_id
        });
        setIsInWishlist(true);
        enqueueSnackbar(`Đã thêm ${game.name} vào wishlist`, { variant: 'success' });
        
        // ❤️ Track like interaction
        await trackGameLike(currentUser.user_id, game.game_id);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      enqueueSnackbar('Có lỗi xảy ra khi cập nhật wishlist', { variant: 'error' });
    }
  };

  const handlePurchase = () => {
    if (!currentUser || !game || hasPurchased) return;
    setShowPaymentModal(true);
  };

  const handleConfirmPurchase = async () => {
    if (!currentUser || !game || hasPurchased) return;
    
    setPurchaseLoading(true);
    try {
      // Call purchase API
      const response = await axios.post(`http://localhost:3001/api/customer/purchases`, {
        game_id: game.game_id
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Update state
      setHasPurchased(true);
      setShowPaymentModal(false);
      
      // Update user balance in context
      if (response.data.new_balance !== undefined) {
        // You might want to update the user context here
        // currentUser.balance = response.data.new_balance;
      }
      
      // 🛒 Track purchase interaction
      await trackGamePurchase(currentUser.user_id, game.game_id);
      
      enqueueSnackbar(`Mua game ${game.name} thành công! Bạn có thể tải xuống ngay bây giờ.`, { variant: 'success' });
    } catch (error: any) {
      console.error('Error purchasing game:', error);
      const errorCode = error.response?.data?.error;
      const errorMsg = errorCode === 'INSUFFICIENT_BALANCE'
        ? 'Số dư không đủ để mua game này'
        : errorCode === 'ALREADY_PURCHASED'
        ? 'Bạn đã mua game này rồi'
        : errorCode === 'LOGIN_REQUIRED'
        ? 'Vui lòng đăng nhập để mua game'
        : 'Có lỗi xảy ra khi mua game';
      enqueueSnackbar(errorMsg, { variant: 'error' });
    } finally {
      setPurchaseLoading(false);
    }
  };


  const handleRatingSubmitted = async () => {
    // Refresh reviews and user review after rating is submitted
    if (game) {
      await fetchReviews(game.game_id.toString());
      await fetchUserReview(game.game_id.toString());
    }
  };

  const handleOpenRatingModal = () => {
    setRatingModalOpen(true);
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

  if (!game) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h5">Game không tồn tại</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>

        {/* Game Header */}
        <Card sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            {/* Game Image */}
            <Box sx={{ flex: '0 0 300px' }}>
            <Box
              sx={{
                width: '100%',
                height: 400,
                backgroundImage: game.image ? `url(${game.image})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              }}
            >
              {!game.image && 'No Image Available'}
            </Box>
                  </Box>

            {/* Game Info */}
            <Box sx={{ flex: 1, p: 3 }}>
              <Typography variant="h3" gutterBottom sx={{ fontWeight: 800, mb: 2 }}>
                {game.name}
              </Typography>

              {/* Rating and Release Year */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <StarIcon sx={{ color: '#ffc107', mr: 0.5, fontSize: '1.5rem' }} />
                <Typography variant="h5" sx={{ mr: 2 }}>
                  {game.average_rating ? Number(game.average_rating).toFixed(1) : 'N/A'}
                </Typography>
                <Typography variant="h6" color="text.secondary">
                  ({game.release_date ? new Date(game.release_date).getFullYear() : 'N/A'})
                </Typography>
              </Box>

              {/* Genres and Publisher Row */}
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, 
                gap: 3, 
                mb: 3 
              }}>
                {/* Genres */}
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Thể loại:
                  </Typography>
                  <Box>
                    {(game.genres || []).map((genre, index) => {
                      const colors = [
                        { bg: '#e3f2fd', color: '#1976d2', border: '#bbdefb' },
                        { bg: '#f3e5f5', color: '#7b1fa2', border: '#ce93d8' },
                        { bg: '#e8f5e8', color: '#388e3c', border: '#a5d6a7' },
                        { bg: '#fff3e0', color: '#f57c00', border: '#ffcc02' },
                        { bg: '#fce4ec', color: '#c2185b', border: '#f8bbd9' },
                        { bg: '#e0f2f1', color: '#00796b', border: '#80cbc4' },
                        { bg: '#f1f8e9', color: '#689f38', border: '#c5e1a5' },
                        { bg: '#fff8e1', color: '#ffa000', border: '#ffecb3' }
                      ]
                      const colorScheme = colors[index % colors.length]
                      
                      return (
                        <Chip
                          key={genre}
                          label={genre}
                          sx={{ 
                            mr: 1, 
                            mb: 1,
                            backgroundColor: colorScheme.bg,
                            color: colorScheme.color,
                            border: `1px solid ${colorScheme.border}`,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              backgroundColor: colorScheme.color,
                              color: 'white',
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                            }
                          }}
                          onClick={() => navigate(`/games?genre=${encodeURIComponent(genre)}`)}
                        />
                      )
                    })}
                  </Box>
                </Box>

                {/* Publisher */}
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Nhà phát hành:
                  </Typography>
                  <Chip
                    label={game.publisher_name || 'Unknown'}
                    sx={{
                      backgroundColor: '#e8eaf6',
                      color: '#3f51b5',
                      border: '1px solid #c5cae9',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontSize: '0.9rem',
                      py: 2,
                      px: 1,
                      '&:hover': {
                        backgroundColor: '#3f51b5',
                        color: 'white',
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                      }
                    }}
                    onClick={() => navigate(`/games?publisher=${encodeURIComponent(game.publisher_name || '')}`)}
                  />
                </Box>
              </Box>

              {/* Platforms */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Nền tảng:
                </Typography>
                <Box>
                  {(game.platforms || []).map((platform, index) => {
                    const platformColors = [
                      { bg: '#e1f5fe', color: '#0277bd', border: '#81d4fa' },
                      { bg: '#f3e5f5', color: '#7b1fa2', border: '#ce93d8' },
                      { bg: '#e8f5e8', color: '#2e7d32', border: '#a5d6a7' },
                      { bg: '#fff3e0', color: '#ef6c00', border: '#ffcc02' },
                      { bg: '#fce4ec', color: '#ad1457', border: '#f8bbd9' },
                      { bg: '#e0f2f1', color: '#00695c', border: '#80cbc4' },
                      { bg: '#f1f8e9', color: '#558b2f', border: '#c5e1a5' },
                      { bg: '#fff8e1', color: '#f57f17', border: '#ffecb3' }
                    ]
                    const colorScheme = platformColors[index % platformColors.length]
                    
                    return (
                      <Chip
                        key={platform}
                        label={platform}
                        sx={{ 
                          mr: 1, 
                          mb: 1,
                          backgroundColor: colorScheme.bg,
                          color: colorScheme.color,
                          border: `1px solid ${colorScheme.border}`,
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: colorScheme.color,
                            color: 'white',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
                          }
                        }}
                        onClick={() => navigate(`/games?platform=${encodeURIComponent(platform)}`)}
                      />
                    )
                  })}
                </Box>
              </Box>

              {/* Languages */}
              <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Ngôn ngữ:
                    </Typography>
                    <Box>
                  {(game.languages || []).map((language, index) => {
                    const languageColors = [
                      { bg: '#e8f5e8', color: '#2e7d32', border: '#a5d6a7' },
                      { bg: '#e3f2fd', color: '#1976d2', border: '#bbdefb' },
                      { bg: '#fff3e0', color: '#f57c00', border: '#ffcc02' },
                      { bg: '#fce4ec', color: '#c2185b', border: '#f8bbd9' },
                      { bg: '#e0f2f1', color: '#00695c', border: '#80cbc4' },
                      { bg: '#f1f8e9', color: '#558b2f', border: '#c5e1a5' }
                    ]
                    const colorScheme = languageColors[index % languageColors.length]
                    
                    return (
                      <Chip
                        key={language}
                        label={language}
                        size="small"
                        sx={{ 
                          mr: 1, 
                          mb: 1,
                          backgroundColor: colorScheme.bg,
                          color: colorScheme.color,
                          border: `1px solid ${colorScheme.border}`,
                          fontWeight: 500,
                          fontSize: '0.75rem'
                        }}
                      />
                    )
                  })}
                </Box>
          </Box>

              {/* Game Info Grid */}
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, 
                gap: 2, 
                mb: 3 
              }}>
                {/* Multiplayer */}
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, fontSize: '1rem' }}>
                    Chế độ chơi:
                </Typography>
                  <Chip
                    label={game.mode || 'N/A'}
                    color={game.multiplayer ? 'success' : 'default'}
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>

                {/* Capacity */}
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, fontSize: '1rem' }}>
                    Dung lượng:
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: 'primary.main' }}>
                    {game.capacity ? `${game.capacity} GB` : 'N/A'}
                  </Typography>
                </Box>

                {/* Age Rating */}
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, fontSize: '1rem' }}>
                    Độ tuổi:
                  </Typography>
                    <Chip
                    label={game.age_rating || 'N/A'}
                    color="warning"
                    variant="filled"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>

                {/* Multiplayer Status */}
                <Box>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, fontSize: '1rem' }}>
                    Multiplayer:
                </Typography>
                  <Chip
                    label={game.multiplayer ? 'Có' : 'Không'}
                    color={game.multiplayer ? 'success' : 'default'}
                    variant="filled"
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
              </Box>

              {/* Price and Actions */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                <Typography variant="h2" sx={{ color: 'primary.main', fontWeight: 800 }}>
                  ${game.price}
                </Typography>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  {!hasPurchased ? (
                    <Button
                      variant="contained"
                      size="large"
                      color="primary"
                      startIcon={<CartIcon />}
                      onClick={handlePurchase}
                      disabled={purchaseLoading || !currentUser}
                      sx={{ 
                        py: 1.5, 
                        px: 3,
                        fontWeight: 600
                      }}
                    >
                      {purchaseLoading ? 'Đang xử lý...' : 'Mua ngay'}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      size="large"
                      color="success"
                      startIcon={<DownloadIcon />}
                      onClick={() => {
                        if (game?.link_download) {
                          window.open(game.link_download, '_blank');
                        } else {
                          alert('Link tải xuống không khả dụng');
                        }
                      }}
                      sx={{ 
                        py: 1.5, 
                        px: 3,
                        fontWeight: 600
                      }}
                    >
                      Tải xuống
                    </Button>
                  )}
                  
                  {currentUser && (
                  <Button
                    variant={isInWishlist ? "contained" : "outlined"}
                    size="large"
                    startIcon={<WishlistIcon />}
                    onClick={handleToggleWishlist}
                    sx={{ 
                      py: 1.5, 
                      px: 3,
                      ...(isInWishlist && {
                        backgroundColor: '#e91e63',
                      color: 'white',
                        '&:hover': {
                          backgroundColor: '#c2185b'
                        }
                      })
                    }}
                  >
                      {isInWishlist ? 'Unwishlist' : 'Wishlist'}
                  </Button>
                  )}
                  </Box>
              </Box>

              {!currentUser && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Đăng nhập để thêm vào Wishlist và xem lịch sử
                </Typography>
            )}
            </Box>
          </Box>
        </Card>

            {/* Description */}
            <Card sx={{ mb: 4 }}>
              <CardContent>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
                  Mô tả
                </Typography>
            <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem', lineHeight: 1.7 }}>
                  {game.description}
                </Typography>
              </CardContent>
            </Card>

            {/* System Requirements */}
            <Card>
              <CardContent>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
                  Yêu cầu hệ thống
                </Typography>
                
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 4 }}>
                  <Box sx={{ flex: 1 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'primary.main' }}>
                      Tối thiểu
                    </Typography>
                <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 1 }}>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>CPU:</strong> {game.min_specs?.cpu || 'N/A'}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>RAM:</strong> {game.min_specs?.ram || 'N/A'}
                  </Typography>
                  <Typography variant="body1">
                    <strong>GPU:</strong> {game.min_specs?.gpu || 'N/A'}
                  </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ flex: 1 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'success.main' }}>
                      Khuyến nghị
                    </Typography>
                <Box sx={{ bgcolor: '#f0f8ff', p: 2, borderRadius: 1 }}>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>CPU:</strong> {game.rec_specs?.cpu || 'N/A'}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>RAM:</strong> {game.rec_specs?.ram || 'N/A'}
                  </Typography>
                  <Typography variant="body1">
                    <strong>GPU:</strong> {game.rec_specs?.gpu || 'N/A'}
                  </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>

        {/* Reviews Section */}
        <Card sx={{ mt: 4 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                Đánh giá ({reviews.length})
              </Typography>
              {currentUser && hasPurchased && (
                <Button
                  variant={userReview ? "contained" : "outlined"}
                  onClick={handleOpenRatingModal}
                  startIcon={<StarIcon />}
                  sx={{
                    ...(userReview && {
                      backgroundColor: '#ff9800',
                      '&:hover': {
                        backgroundColor: '#f57c00'
                      }
                    })
                  }}
                >
                  {userReview ? `Đã đánh giá (${userReview.rating}⭐)` : 'Viết đánh giá'}
                </Button>
              )}
          </Box>

            {!currentUser && (
              <Alert severity="info" sx={{ mb: 3 }}>
                Đăng nhập để xem và viết đánh giá
              </Alert>
            )}

            {currentUser && !hasPurchased && (
              <Alert severity="warning" sx={{ mb: 3 }}>
                Bạn cần mua game này để có thể đánh giá
              </Alert>
            )}

            {/* User's Review Display */}
            {currentUser && hasPurchased && userReview && (
              <Box sx={{ mb: 4, p: 3, bgcolor: '#e8f5e8', borderRadius: 2, border: '2px solid #4caf50' }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#2e7d32', fontWeight: 600 }}>
                  Đánh giá của bạn
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarIcon
                        key={star}
                        sx={{
                          color: star <= userReview.rating ? '#ffd700' : '#e0e0e0',
                          fontSize: '1.5rem'
                        }}
                      />
                    ))}
                  </Box>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                    {userReview.rating}/5
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(userReview.review_date).toLocaleDateString('vi-VN')}
                  </Typography>
                </Box>
                
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {userReview.comment}
                </Typography>
                
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleOpenRatingModal}
                  sx={{ 
                    borderColor: '#4caf50',
                    color: '#4caf50',
                    '&:hover': {
                      borderColor: '#2e7d32',
                      backgroundColor: '#e8f5e8'
                    }
                  }}
                >
                  Chỉnh sửa đánh giá
                </Button>
              </Box>
            )}

            {/* Reviews List */}
            {reviews.filter(review => !userReview || review.review_id !== userReview.review_id).length === 0 ? (
              <Box sx={{ 
                textAlign: 'center', 
                py: 6,
                bgcolor: '#f8f9fa',
                borderRadius: 2,
                border: '2px dashed #e0e0e0'
              }}>
                <StarIcon sx={{ fontSize: 48, color: '#ddd', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                  {userReview ? 'Chưa có đánh giá từ người dùng khác' : 'Chưa có đánh giá nào'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {userReview ? 'Bạn đã đánh giá game này rồi!' : 'Hãy là người đầu tiên đánh giá game này!'}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {reviews
                  .filter(review => !userReview || review.review_id !== userReview.review_id)
                  .map((review) => (
                  <Card
                    key={review.review_id}
                    sx={{
                      p: 0,
                      borderRadius: 3,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                        transform: 'translateY(-2px)'
                      }
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      {/* Header with user info and rating */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          {/* Avatar */}
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: '50%',
                              bgcolor: 'primary.main',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 700,
                              fontSize: '1.2rem'
                            }}
                          >
                            {review.username.charAt(0).toUpperCase()}
                          </Box>
                          
                          {/* User info */}
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                              {review.username}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(review.review_date).toLocaleDateString('vi-VN', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </Typography>
                          </Box>
                        </Box>
                        
                        {/* Rating */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <StarIcon
                                key={star}
                                sx={{
                                  color: star <= review.rating ? '#ffd700' : '#e0e0e0',
                                  fontSize: '1.4rem',
                                  filter: star <= review.rating ? 'drop-shadow(0 1px 2px rgba(255,215,0,0.3))' : 'none'
                                }}
                              />
                            ))}
                          </Box>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 600, 
                              color: 'primary.main',
                              ml: 1
                            }}
                          >
                            {review.rating}/5
                          </Typography>
                        </Box>
                      </Box>
                      
                      {/* Review content */}
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          lineHeight: 1.7,
                          color: 'text.primary',
                          fontSize: '1rem'
                        }}
                      >
                        {review.comment}
                      </Typography>
              </CardContent>
            </Card>
                ))}
          </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      {/* Payment Modal */}
      {game && currentUser && (
        <PaymentModal
          open={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onConfirm={handleConfirmPurchase}
          game={{
            game_id: game.game_id,
            name: game.name,
            price: game.price,
            image: game.image,
            publisher_name: game.publisher_name
          }}
          user={{
            username: currentUser.username,
            email: currentUser.email,
            balance: currentUser.balance
          }}
          loading={purchaseLoading}
        />
      )}

      {/* Rating Modal */}
      {game && currentUser && (
        <RatingModal
          open={ratingModalOpen}
          onClose={() => setRatingModalOpen(false)}
          gameId={game.game_id}
          gameName={game.name}
          onRatingSubmitted={handleRatingSubmitted}
        />
      )}
    </Container>
  );
};

export default GameDetailPage;
