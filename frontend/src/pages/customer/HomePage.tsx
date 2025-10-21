import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Button,
  Container,
  CircularProgress,
} from '@mui/material';
import {
  SportsEsports as GamesIcon,
  FavoriteOutlined as WishlistIcon,
  ShoppingBag as PurchasesIcon,
  TrendingUp as TrendingIcon,
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
}

const HomePage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [featuredGames, setFeaturedGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  const quickActions = [
    {
      title: 'Duyệt Games',
      description: 'Khám phá hàng nghìn game hay',
      icon: <GamesIcon sx={{ fontSize: 40 }} />,
      color: '#f44336',
      gradient: 'linear-gradient(135deg, #f44336 0%, #e91e63 100%)',
      path: '/games'
    },
    ...(currentUser ? [
      {
        title: 'Wishlist',
        description: 'Games yêu thích của bạn',
        icon: <WishlistIcon sx={{ fontSize: 40 }} />,
        color: '#ff9800',
        gradient: 'linear-gradient(135deg, #ff9800 0%, #ff5722 100%)',
        path: '/wishlist'
      },
      {
        title: 'Đã mua',
        description: 'Thư viện game của bạn',
        icon: <PurchasesIcon sx={{ fontSize: 40 }} />,
        color: '#2196f3',
        gradient: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
        path: '/purchases'
      },
      {
        title: 'Đã xem',
        description: 'Games bạn đã xem gần đây',
        icon: <TrendingIcon sx={{ fontSize: 40 }} />,
        color: '#9c27b0',
        gradient: 'linear-gradient(135deg, #9c27b0 0%, #673ab7 100%)',
        path: '/viewed'
      },
    ] : []),
  ];

  useEffect(() => {
    fetchFeaturedGames();
  }, []);

  const fetchFeaturedGames = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/customer/games');
      const games = response.data.games || [];
      // Lấy 8 game đầu tiên làm featured games
      setFeaturedGames(games.slice(0, 8));
    } catch (error) {
      console.error('Error fetching featured games:', error);
      setFeaturedGames([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGameClick = async (gameId: number) => {
    // Navigate to game detail first
    navigate(`/games/${gameId}`);
    
    // Track view if user is logged in (async, don't wait)
    if (currentUser) {
      trackView(gameId);
    }
  };

  const trackView = async (gameId: number) => {
    if (!currentUser) return;
    
    try {
      await axios.post(`http://localhost:3001/api/customer/games/${gameId}/view`);
      console.log('View tracked successfully');
    } catch (error) {
      console.error('Error tracking view:', error);
      // Don't prevent navigation if view tracking fails
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Hero Section */}
        <Paper
          sx={{
            p: 4,
            mb: 4,
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)',
            color: 'white',
            textAlign: 'center',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
          }}
        >
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 800 }}>
            Chào mừng đến GameStore
          </Typography>
          <Typography variant="h6" sx={{ mb: 3, opacity: 0.9 }}>
            Nền tảng game số 1 Việt Nam với hàng nghìn tựa game chất lượng cao
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/games')}
            sx={{
              bgcolor: 'rgba(255,255,255,0.2)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.3)',
              }
            }}
          >
            Khám phá ngay
          </Button>
        </Paper>

        {/* Quick Actions */}
        <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 700, color: 'white' }}>
          Thao tác nhanh
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 4 }}>
          {quickActions.map((action) => (
            <Box key={action.title} sx={{ flex: 1 }}>
              <Card
                sx={{
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(20px)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                    background: 'rgba(255, 255, 255, 0.08)',
                  }
                }}
                onClick={() => navigate(action.path)}
              >
                <Box sx={{ color: 'white', mb: 2 }}>
                  {action.icon}
                </Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'white' }}>
                  {action.title}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                  {action.description}
                </Typography>
              </Card>
            </Box>
          ))}
        </Box>

        {/* Featured Games */}
        <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 700, color: 'white' }}>
          Games nổi bật
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={60} sx={{ color: 'white' }} />
          </Box>
        ) : (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(4, 1fr)',
              },
              gap: 3,
            }}
          >
            {featuredGames.map((game) => (
              <Card
                key={game.game_id}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  cursor: 'pointer',
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                    background: 'rgba(255, 255, 255, 0.08)',
                  }
                }}
                onClick={() => handleGameClick(game.game_id)}
              >
                <Box
                  sx={{
                    height: 200,
                    backgroundImage: game.image ? `url(${game.image})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                  }}
                >
                  {!game.image && 'No Image'}
                </Box>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: 'white' }}>
                    {game.name}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ color: '#ffd700', fontWeight: 700 }}>
                      ${game.price}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ mr: 0.5, color: 'rgba(255,255,255,0.8)' }}>
                        ⭐ {game.average_rating ? Number(game.average_rating).toFixed(1) : 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default HomePage;
