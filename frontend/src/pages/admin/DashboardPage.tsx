import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Container,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  People as PeopleIcon,
  SportsEsports as GamesIcon,
  ShoppingCart as ShoppingCartIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingIcon,
  Star as StarIcon,
} from '@mui/icons-material';

const AdminDashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock data - replace with API call
  const mockStats = {
    totalUsers: 15420,
    totalGames: 2850,
    totalPurchases: 8960,
    totalRevenue: 425600,
    recentPurchases: [
      { id: 1, user: 'John Doe', game: 'Cyberpunk 2077', amount: 59.99, date: '2024-01-15' },
      { id: 2, user: 'Jane Smith', game: 'The Witcher 3', amount: 39.99, date: '2024-01-15' },
      { id: 3, user: 'Mike Johnson', game: 'GTA V', amount: 29.99, date: '2024-01-14' },
    ],
    topGames: [
      { id: 1, name: 'Cyberpunk 2077', sales: 1250, revenue: 74950 },
      { id: 2, name: 'The Witcher 3', sales: 980, revenue: 39200 },
      { id: 3, name: 'GTA V', sales: 850, revenue: 25490 },
    ]
  };

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setStats(mockStats);
      setLoading(false);
    }, 1000);
  }, []);

  const statCards = [
    {
      title: 'Tổng Users',
      value: stats?.totalUsers?.toLocaleString() || '0',
      icon: <PeopleIcon sx={{ fontSize: 40 }} />,
      color: '#2196f3',
      change: '+12%'
    },
    {
      title: 'Tổng Games',
      value: stats?.totalGames?.toLocaleString() || '0',
      icon: <GamesIcon sx={{ fontSize: 40 }} />,
      color: '#4caf50',
      change: '+8%'
    },
    {
      title: 'Tổng Purchases',
      value: stats?.totalPurchases?.toLocaleString() || '0',
      icon: <ShoppingCartIcon sx={{ fontSize: 40 }} />,
      color: '#ff9800',
      change: '+15%'
    },
    {
      title: 'Tổng Revenue',
      value: `$${stats?.totalRevenue?.toLocaleString() || '0'}`,
      icon: <MoneyIcon sx={{ fontSize: 40 }} />,
      color: '#9c27b0',
      change: '+23%'
    },
  ];

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
        {/* Welcome Section */}
        <Paper
          sx={{
            p: 4,
            mb: 4,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
          }}
        >
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 800 }}>
            Chào mừng, Admin!
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9 }}>
            Tổng quan hệ thống GameStore
          </Typography>
        </Paper>

        {/* Stats Cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
          {statCards.map((stat) => (
            <Card
              key={stat.title}
              sx={{
                p: 3,
                textAlign: 'center',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                }
              }}
            >
              <Box sx={{ color: stat.color, mb: 2 }}>
                {stat.icon}
              </Box>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
                {stat.value}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {stat.title}
              </Typography>
              <Typography variant="body2" sx={{ color: '#4caf50', fontWeight: 600 }}>
                {stat.change} từ tháng trước
              </Typography>
            </Card>
          ))}
        </Box>

        {/* Content Grid */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
          {/* Recent Purchases */}
          <Box sx={{ flex: 1 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                  Giao dịch gần đây
                </Typography>
                <Box>
                  {stats?.recentPurchases?.map((purchase) => (
                    <Box
                      key={purchase.id}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        py: 2,
                        borderBottom: '1px solid #f0f0f0',
                        '&:last-child': { borderBottom: 'none' }
                      }}
                    >
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {purchase.game}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {purchase.user} • {purchase.date}
                        </Typography>
                      </Box>
                      <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 700 }}>
                        ${purchase.amount}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Top Games */}
          <Box sx={{ flex: 1 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                  Top Games
                </Typography>
                <Box>
                  {stats?.topGames?.map((game, index) => (
                    <Box
                      key={game.id}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        py: 2,
                        borderBottom: '1px solid #f0f0f0',
                        '&:last-child': { borderBottom: 'none' }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography
                          variant="h6"
                          sx={{
                            mr: 2,
                            width: 30,
                            height: 30,
                            borderRadius: '50%',
                            bgcolor: 'primary.main',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.875rem',
                            fontWeight: 700
                          }}
                        >
                          {index + 1}
                        </Typography>
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>
                            {game.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {game.sales} lượt bán
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 700 }}>
                        ${game.revenue.toLocaleString()}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>
    </Container>
  );
};

export default AdminDashboardPage;
