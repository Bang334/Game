import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Button,
  Container,
  CircularProgress,
  Chip,
  Divider,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import RatingModal from '../../components/RatingModal';

interface PurchaseItem {
  purchase_id: number;
  game_id: number;
  name: string;
  price: number;
  image?: string;
  description?: string;
  average_rating?: number;
  genres?: string[];
  purchase_date: string;
  download_count?: number;
  link_download?: string;
  user_rating?: number;
}

const PurchasesPage = () => {
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<{id: number, name: string} | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/customer/purchases', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const purchases = response.data.purchases || [];
      
      // Fetch user ratings for each game
      const purchasesWithRatings = await Promise.all(
        purchases.map(async (purchase: PurchaseItem) => {
          try {
            const ratingResponse = await axios.get(`http://localhost:3001/api/customer/ratings/${purchase.game_id}`, {
              headers: {
                Authorization: `Bearer ${token}`
              }
            });
            return {
              ...purchase,
              user_rating: ratingResponse.data.rating?.rating || null
            };
          } catch (error) {
            // If no rating exists, user_rating will be null
            return {
              ...purchase,
              user_rating: null
            };
          }
        })
      );
      
      setPurchases(purchasesWithRatings);
    } catch (error) {
      console.error('Error fetching purchases:', error);
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (gameId: number) => {
    const purchase = purchases.find(p => p.game_id === gameId);
    if (purchase?.link_download) {
      window.open(purchase.link_download, '_blank');
    } else {
      console.log('No download link available for game:', gameId);
    }
  };

  const handleRateGame = (gameId: number) => {
    const purchase = purchases.find(p => p.game_id === gameId);
    if (purchase) {
      setSelectedGame({ id: gameId, name: purchase.name });
      setRatingModalOpen(true);
    }
  };

  const handleRatingSubmitted = () => {
    // Refresh purchases data to show updated ratings
    fetchPurchases();
    console.log('Rating submitted successfully');
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
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <DownloadIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
            <Box>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 800 }}>
            Thư viện Game của bạn
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {purchases.length} game đã mua
          </Typography>
            </Box>
          </Box>
        </Box>

        {/* Purchases */}
        {purchases.length === 0 ? (
          <Box sx={{ 
            textAlign: 'center', 
            py: 8,
            bgcolor: '#f8f9fa',
            borderRadius: 3,
            border: '2px dashed #e0e0e0'
          }}>
            <DownloadIcon sx={{ fontSize: 80, color: '#ddd', mb: 3 }} />
            <Typography variant="h5" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
              Thư viện trống
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}>
              Bạn chưa mua game nào. Hãy khám phá thư viện game phong phú của chúng tôi và bắt đầu xây dựng bộ sưu tập game của riêng bạn!
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/games')}
              startIcon={<DownloadIcon />}
              size="large"
              sx={{ px: 4 }}
            >
              Khám phá Games
            </Button>
          </Box>
        ) : (
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { 
              xs: '1fr', 
              sm: 'repeat(2, 1fr)', 
              md: 'repeat(2, 1fr)', 
              lg: 'repeat(3, 1fr)',
              xl: 'repeat(3, 1fr)'
            }, 
            gap: 4 
          }}>
            {purchases.map((purchase) => (
              <Card
                key={purchase.purchase_id}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  borderRadius: 3,
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 12px 32px rgba(0,0,0,0.2)',
                  }
                }}
                onClick={() => navigate(`/games/${purchase.game_id}`)}
              >
                <Box
                  sx={{
                    height: 180,
                    backgroundImage: purchase.image ? `url(${purchase.image})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    overflow: 'hidden',
                  }}
                >
                  {/* Overlay gradient */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%)',
                    }}
                  />
                  
                  {/* Game info overlay */}
                  <Box sx={{ position: 'relative', zIndex: 1, p: 2, color: 'white' }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 700, 
                        mb: 1,
                        textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                        lineHeight: 1.2,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                    {purchase.name}
                  </Typography>
                  
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          color: '#4caf50', 
                          fontWeight: 700,
                          textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                        }}
                      >
                        Đã mua
                      </Typography>
                  <Typography 
                    variant="body2" 
                        sx={{ 
                          textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                        }}
                  >
                        ⭐ {purchase.average_rating ? Number(purchase.average_rating).toFixed(1) : 'N/A'}
                  </Typography>
                    </Box>
                  </Box>
                </Box>
                <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* Genres */}
                  <Box sx={{ mb: 3, minHeight: 32 }}>
                    {purchase.genres && purchase.genres.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {purchase.genres.slice(0, 3).map((genre, index) => {
                          const colors = [
                            { bg: '#e3f2fd', color: '#1976d2' },
                            { bg: '#f3e5f5', color: '#7b1fa2' },
                            { bg: '#e8f5e8', color: '#388e3c' },
                            { bg: '#fff3e0', color: '#f57c00' }
                          ]
                          const colorScheme = colors[index % colors.length]
                          
                          return (
                      <Chip
                        key={genre}
                        label={genre}
                        size="small"
                              sx={{ 
                                backgroundColor: colorScheme.bg,
                                color: colorScheme.color,
                                fontWeight: 600,
                                fontSize: '0.8rem',
                                height: 24,
                              }}
                            />
                          )
                        })}
                        {purchase.genres.length > 3 && (
                          <Chip
                            label={`+${purchase.genres.length - 3}`}
                            size="small"
                            sx={{ 
                              backgroundColor: '#f5f5f5',
                              color: '#666',
                              fontWeight: 600,
                              fontSize: '0.8rem',
                              height: 24,
                            }}
                          />
                        )}
                      </Box>
                    ) : (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: 'text.secondary',
                          fontStyle: 'italic',
                        }}
                      >
                        Chưa có thể loại
                      </Typography>
                    )}
                  </Box>

                  {/* Purchase Info - Highlighted */}
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      mb: 2,
                      p: 2,
                      bgcolor: '#f8f9fa',
                      borderRadius: 2,
                      border: '1px solid #e0e0e0'
                    }}>
                      <Box>
                        <Typography 
                          variant="caption" 
                          color="text.secondary" 
                          sx={{ display: 'block', mb: 0.5 }}
                        >
                          Mua ngày
                        </Typography>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontWeight: 700,
                            color: 'text.primary',
                            fontSize: '1rem'
                          }}
                        >
                          {new Date(purchase.purchase_date).toLocaleDateString('vi-VN')}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography 
                          variant="caption" 
                          color="text.secondary" 
                          sx={{ display: 'block', mb: 0.5 }}
                        >
                          Giá
                    </Typography>
                        <Typography 
                          variant="h5" 
                          sx={{ 
                            fontWeight: 800,
                            color: purchase.price === 0 ? '#4caf50' : '#f44336',
                            fontSize: '1.5rem'
                          }}
                        >
                          {purchase.price === 0 ? 'Miễn phí' : `$${purchase.price}`}
                    </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Action Buttons */}
                  <Box sx={{ display: 'flex', gap: 2, mt: 'auto' }}>
                    <Button
                      variant="contained"
                      size="medium"
                      startIcon={<DownloadIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(purchase.game_id);
                      }}
                      sx={{ 
                        flex: 1,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        py: 1.5
                      }}
                    >
                      Tải xuống
                    </Button>
                    <Button
                      variant={purchase.user_rating ? "contained" : "outlined"}
                      size="medium"
                      startIcon={<StarIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRateGame(purchase.game_id);
                      }}
                      sx={{ 
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        py: 1.5,
                        backgroundColor: purchase.user_rating ? '#ff9800' : undefined,
                        '&:hover': {
                          backgroundColor: purchase.user_rating ? '#f57c00' : undefined,
                        }
                      }}
                    >
                      {purchase.user_rating ? `Đã đánh giá (${purchase.user_rating}⭐)` : 'Đánh giá'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>

      {/* Rating Modal */}
      {selectedGame && (
        <RatingModal
          open={ratingModalOpen}
          onClose={() => {
            setRatingModalOpen(false);
            setSelectedGame(null);
          }}
          gameId={selectedGame.id}
          gameName={selectedGame.name}
          onRatingSubmitted={handleRatingSubmitted}
        />
      )}
    </Container>
  );
};

export default PurchasesPage;
