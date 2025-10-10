import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Container,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewedIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface Game {
  game_id: number;
  name: string;
  price: number;
  image?: string;
  description?: string;
  average_rating?: number;
  genres?: string[];
  publisher_name?: string;
  viewed_at?: string;
}

const ViewedGamesPage = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      fetchViewedGames();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const fetchViewedGames = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/customer/viewed-games');
      setGames(response.data.games || []);
    } catch (error) {
      console.error('Error fetching viewed games:', error);
      setGames([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredGames = games.filter(game =>
    game.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!currentUser) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ py: 4, textAlign: 'center' }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            Vui lòng đăng nhập để xem danh sách game đã xem
          </Alert>
          <Button 
            variant="contained" 
            onClick={() => navigate('/login')}
            size="large"
          >
            Đăng nhập
          </Button>
        </Box>
      </Container>
    );
  }

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
            <ViewedIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
            <Box>
              <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 800 }}>
                Game đã xem
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Danh sách các game bạn đã xem gần đây
              </Typography>
            </Box>
          </Box>

          {/* Search */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              fullWidth
              placeholder="Tìm kiếm trong game đã xem..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ maxWidth: 400 }}
            />
          </Box>
        </Box>

        {/* Games Grid */}
        {filteredGames.length > 0 ? (
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
            {filteredGames.map((game) => (
              <Card
                key={game.game_id}
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
                onClick={() => navigate(`/games/${game.game_id}`)}
              >
                <Box
                  sx={{
                    height: 180,
                    backgroundImage: game.image ? `url(${game.image})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
                      {game.name}
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
                        ${game.price}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                        }}
                      >
                        ⭐ {game.average_rating ? Number(game.average_rating).toFixed(1) : 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                <CardContent sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* Genres */}
                  <Box sx={{ mb: 2, minHeight: 24 }}>
                    {game.genres && game.genres.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {game.genres.slice(0, 2).map((genre, index) => {
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
                        {game.genres.length > 2 && (
                          <Chip
                            label={`+${game.genres.length - 2}`}
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
                    sx={{ mb: 2, fontSize: '0.85rem' }}
                  >
                    {game.publisher_name || 'Unknown Publisher'}
                  </Typography>
                  
                  {/* Viewed date */}
                  <Box sx={{ mt: 'auto' }}>
                    <Typography 
                      variant="caption" 
                      color="text.secondary"
                      sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.5,
                        fontSize: '0.75rem'
                      }}
                    >
                      <ViewedIcon sx={{ fontSize: 14 }} />
                      Đã xem: {game.viewed_at ? new Date(game.viewed_at).toLocaleDateString('vi-VN') : 'N/A'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : (
          <Box sx={{ 
            textAlign: 'center', 
            py: 8,
            bgcolor: '#f8f9fa',
            borderRadius: 3,
            border: '2px dashed #e0e0e0'
          }}>
            <ViewedIcon sx={{ fontSize: 80, color: '#ddd', mb: 3 }} />
            <Typography variant="h5" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
              {searchTerm ? `Không tìm thấy game nào phù hợp với "${searchTerm}"` : 'Bạn chưa xem game nào'}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}>
              {searchTerm ? 'Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc để xem tất cả' : 'Hãy khám phá các game thú vị trong thư viện của chúng tôi và bắt đầu xây dựng danh sách game đã xem của bạn'}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              {searchTerm && (
                <Button 
                  variant="outlined" 
                  onClick={() => setSearchTerm('')}
                  size="large"
                >
                  Xóa bộ lọc
                </Button>
              )}
              <Button 
                variant="contained" 
                onClick={() => navigate('/games')}
                size="large"
                sx={{ px: 4 }}
              >
                Khám phá Games
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default ViewedGamesPage;
