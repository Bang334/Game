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
  IconButton,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  ShoppingCart as CartIcon,
  Download as DownloadIcon,
  Favorite as WishlistIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface WishlistItem {
  wishlist_id: number;
  game_id: number;
  name: string;
  price: number;
  image?: string;
  description?: string;
  average_rating?: number;
  genres: string[];
  publisher_name?: string;
  added_date: string;
  link_download?: string;
}

const WishlistPage = () => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [purchasedGames, setPurchasedGames] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchWishlist();
    fetchPurchasedGames();
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/customer/wishlist', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setWishlistItems(response.data.wishlist || []);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      setWishlistItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchasedGames = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/customer/purchases', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const purchases = response.data.purchases || [];
      const gameIds = purchases.map((purchase: any) => purchase.game_id);
      setPurchasedGames(gameIds);
    } catch (error) {
      console.error('Error fetching purchased games:', error);
    }
  };

  const handleRemoveFromWishlist = async (wishlistId: number) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3001/api/customer/wishlist/${wishlistId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setWishlistItems(wishlistItems.filter(item => item.wishlist_id !== wishlistId));
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    }
  };

  const handleAddToCart = (gameId: number) => {
    // TODO: Implement add to cart functionality
    console.log('Add to cart:', gameId);
  };

  const handleDownload = (gameId: number) => {
    const item = wishlistItems.find(w => w.game_id === gameId);
    if (item?.link_download) {
      window.open(item.link_download, '_blank');
    } else {
      console.log('No download link available for game:', gameId);
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
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <WishlistIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
            <Box>
              <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 800 }}>
                Wishlist của bạn
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {wishlistItems.length} game trong danh sách yêu thích
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Wishlist Items */}
        {wishlistItems.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              Wishlist trống
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Hãy thêm những game bạn yêu thích vào wishlist
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/games')}
              startIcon={<CartIcon />}
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
              md: 'repeat(3, 1fr)', 
              lg: 'repeat(4, 1fr)',
              xl: 'repeat(5, 1fr)'
            }, 
            gap: 3 
          }}>
            {wishlistItems.map((item) => {
              const isPurchased = purchasedGames.includes(item.game_id);
              return (
                <Card
                  key={item.wishlist_id}
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
                  onClick={() => navigate(`/games/${item.game_id}`)}
                >
                  <Box
                    sx={{
                      height: 180,
                      backgroundImage: item.image ? `url(${item.image})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                        {item.name}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            color: '#ffd700', 
                            fontWeight: 700,
                            textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                          }}
                        >
                          ${item.price}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                          }}
                        >
                          ⭐ {item.average_rating ? Number(item.average_rating).toFixed(1) : 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                    
                    {/* Purchase status badge */}
                    {isPurchased && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          backgroundColor: '#4caf50',
                          color: 'white',
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 2,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          zIndex: 2,
                        }}
                      >
                        Đã mua
                      </Box>
                    )}
                  </Box>
                  
                  <CardContent sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    {/* Genres */}
                    <Box sx={{ mb: 2, minHeight: 24 }}>
                      {item.genres && item.genres.length > 0 ? (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {item.genres.slice(0, 2).map((genre, index) => {
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
                                  fontSize: '0.7rem',
                                  height: 20,
                                }}
                              />
                            )
                          })}
                          {item.genres.length > 2 && (
                            <Chip
                              label={`+${item.genres.length - 2}`}
                              size="small"
                              sx={{ 
                                backgroundColor: '#f5f5f5',
                                color: '#666',
                                fontWeight: 600,
                                fontSize: '0.7rem',
                                height: 20,
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
                    
                    {/* Publisher */}
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ mb: 2, fontSize: '0.85rem', fontWeight: 600 }}
                    >
                      {item.publisher_name || 'Unknown Publisher'}
                    </Typography>
                    
                    {/* Action Buttons */}
                    <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                      {!isPurchased ? (
                        <Button
                          variant="contained"
                          size="medium"
                          startIcon={<CartIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(item.game_id);
                          }}
                          sx={{ 
                            flex: 1,
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            py: 1.5
                          }}
                        >
                          Mua ngay
                        </Button>
                      ) : (
                        <Button
                          variant="outlined"
                          size="medium"
                          startIcon={<DownloadIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(item.game_id);
                          }}
                          disabled={!item.link_download}
                          sx={{ 
                            flex: 1,
                            borderRadius: 2,
                            textTransform: 'none',
                            fontWeight: 600,
                            py: 1.5,
                            color: '#4caf50',
                            borderColor: '#4caf50',
                            '&:hover': {
                              borderColor: '#4caf50',
                              backgroundColor: 'rgba(76, 175, 80, 0.04)'
                            }
                          }}
                        >
                          {item.link_download ? 'Tải xuống' : 'Chưa có link'}
                        </Button>
                      )}
                      <IconButton
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFromWishlist(item.wishlist_id);
                        }}
                        sx={{ 
                          borderRadius: 2,
                          '&:hover': {
                            backgroundColor: 'rgba(244, 67, 54, 0.04)'
                          }
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default WishlistPage;
