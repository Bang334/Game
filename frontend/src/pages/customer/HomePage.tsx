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
  Chip,
  Avatar,
  Divider,
} from '@mui/material';
import { Grid } from '@mui/material';
import {
  SportsEsports as GamesIcon,
  FavoriteOutlined as WishlistIcon,
  ShoppingBag as PurchasesIcon,
  TrendingUp as TrendingIcon,
  Whatshot as HotIcon,
  Star as StarIcon,
  AccountBalanceWallet as WalletIcon,
  LibraryBooks as LibraryIcon,
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

interface UserStats {
  totalPurchases: number;
  totalWishlist: number;
  totalViewed: number;
  balance: number;
}

const HomePage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [featuredGames, setFeaturedGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserStats>({
    totalPurchases: 0,
    totalWishlist: 0,
    totalViewed: 0,
    balance: 0,
  });

  const quickActions = [
    {
      title: 'Duyệt Games',
      description: 'Khám phá hàng nghìn game hay',
      icon: <GamesIcon sx={{ fontSize: 48 }} />,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      path: '/games'
    },
    ...(currentUser ? [
      {
        title: 'Wishlist',
        description: 'Games yêu thích của bạn',
        icon: <WishlistIcon sx={{ fontSize: 48 }} />,
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        path: '/wishlist'
      },
      {
        title: 'Thư viện',
        description: 'Games bạn đã mua',
        icon: <LibraryIcon sx={{ fontSize: 48 }} />,
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        path: '/purchases'
      },
      {
        title: 'Đã xem',
        description: 'Lịch sử xem gần đây',
        icon: <TrendingIcon sx={{ fontSize: 48 }} />,
        gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        path: '/viewed'
      },
    ] : []),
  ];

  useEffect(() => {
    fetchFeaturedGames();
    if (currentUser) {
      fetchUserStats();
    }
  }, [currentUser]);

  const fetchFeaturedGames = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/customer/games');
      const games = response.data.games || [];
      // Lấy 6 game đầu tiên làm featured games
      setFeaturedGames(games.slice(0, 6));
    } catch (error) {
      console.error('Error fetching featured games:', error);
      setFeaturedGames([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    if (!currentUser) return;

    try {
      const [purchasesRes, wishlistRes, viewedRes, profileRes] = await Promise.all([
        axios.get('http://localhost:3001/api/customer/purchases'),
        axios.get('http://localhost:3001/api/customer/wishlist'),
        axios.get('http://localhost:3001/api/customer/viewed'),
        axios.get('http://localhost:3001/api/customer/profile'),
      ]);

      setUserStats({
        totalPurchases: purchasesRes.data.purchases?.length || 0,
        totalWishlist: wishlistRes.data.wishlist?.length || 0,
        totalViewed: viewedRes.data.viewedGames?.length || 0,
        balance: profileRes.data.user?.balance || 0,
      });
    } catch (error) {
      console.error('Error fetching user stats:', error);
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
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            textAlign: 'center',
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
        <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 700 }}>
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
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                  }
                }}
                onClick={() => navigate(action.path)}
              >
                <Box sx={{ color: action.color, mb: 2 }}>
                  {action.icon}
                </Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  {action.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {action.description}
                </Typography>
              </Card>
            </Box>
          ))}
        </Box>

        {/* Featured Games */}
        <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 700 }}>
          Games nổi bật
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={60} />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
            {featuredGames.map((game) => (
              <Box key={game.game_id} sx={{ flex: 1 }}>
                <Card
                  sx={{
                    maxWidth: 260,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
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
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                      {game.name}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 700 }}>
                        ${game.price}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ mr: 0.5 }}>
                          ⭐ {game.average_rating ? Number(game.average_rating).toFixed(1) : 'N/A'}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default HomePage;
