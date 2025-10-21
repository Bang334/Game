import { Outlet } from 'react-router-dom';
import { useState } from 'react';
import { 
  AppBar, 
  Box, 
  Toolbar, 
  Typography, 
  IconButton, 
  Badge, 
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  alpha,
  Avatar,
} from '@mui/material';
import { 
  Menu as MenuIcon, 
  ShoppingCart as ShoppingCartIcon,
  Gamepad as GamepadIcon,
  Home as HomeIcon,
  SportsEsports as GamesIcon,
  Notifications as NotificationsIcon,
  LocalOffer as PromotionIcon,
  ArrowRightAlt as ArrowRightAltIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const CustomerLayout = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const location = useLocation();
  const { currentUser, logout } = useAuth();

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  // Define colors for each menu item
  const menuItemColors = {
    home: '#3f51b5',        // Indigo
    games: '#f44336',       // Red
    profile: '#9c27b0',     // Purple
    login: '#4caf50',       // Green
    logout: '#f44336',      // Red
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    handleDrawerToggle();
  };

  const menuItems = [
    { text: 'Trang chủ', icon: <HomeIcon />, path: '/', color: menuItemColors.home },
    { text: 'Games', icon: <GamesIcon />, path: '/games', color: menuItemColors.games },
    ...(currentUser ? [
      { text: 'Trang cá nhân', icon: <Avatar sx={{ width: 24, height: 24, fontSize: '0.875rem' }}>{currentUser.username?.charAt(0).toUpperCase() || currentUser.email?.charAt(0).toUpperCase() || 'U'}</Avatar>, path: '/profile', color: menuItemColors.profile },
    ] : []),
  ];

  const authMenuItems = currentUser ? [
    { text: 'Đăng xuất', icon: <LogoutIcon />, action: handleLogout, color: menuItemColors.logout },
  ] : [
    { text: 'Đăng nhập', icon: <LoginIcon />, path: '/login', color: menuItemColors.login },
  ];

  // Xác định tiêu đề trang dựa trên đường dẫn
  const getPageTitle = () => {
    if (location.pathname === '/') return 'GameStore';
    if (location.pathname.includes('/games')) return 'Games';
    if (location.pathname.includes('/profile')) return 'Trang cá nhân';
    return 'GameStore';
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh', 
      width: '100%',
      maxWidth: '100vw',
      overflowX: 'hidden',
      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.8) 0%, rgba(118, 75, 162, 0.8) 100%)',
      backgroundAttachment: 'fixed',
    }}>
      <AppBar 
        position="fixed"
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          color: 'white',
          boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        
        <Toolbar
          sx={{
            minHeight: { xs: 60, sm: 68 },
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Nút menu */}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{
              p: 1.2,
              color: 'white',
              bgcolor: 'rgba(255,255,255,0.1)',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.2)',
                transform: 'scale(1.05)'
              },
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
            }}
          >
            <MenuIcon fontSize="large" />
          </IconButton>

          {/* Tiêu đề */}
          <Box
            sx={{
              flexGrow: 1,
              textAlign: 'center',
              fontWeight: 'bold',
              color: 'white',
              fontSize: { xs: '1.2rem', sm: '1.4rem' },
              textShadow: '0 2px 4px rgba(0,0,0,0.2)',
              letterSpacing: '0.5px'
            }}
          >
            {getPageTitle()}
          </Box>

          {/* Nút giỏ hàng */}
          <IconButton 
            color="inherit" 
            onClick={() => navigate('/cart')}
            sx={{
              p: 1.2,
              color: 'white',
              bgcolor: 'rgba(255,255,255,0.1)',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.2)',
                transform: 'scale(1.05)',
              },
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
            }}
          >
            <Badge 
              badgeContent={0} 
              color="error"
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  minWidth: '20px',
                  height: '20px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                }
              }}
            >
              <ShoppingCartIcon fontSize="large" />
            </Badge>
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          '& .MuiDrawer-paper': { 
            width: 280, 
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            borderRight: '1px solid rgba(255, 255, 255, 0.2)',
          },
        }}
      >
        {/* Logo section */}
        <Box 
          sx={{ 
            py: 3,
            px: 2,
            background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
            color: 'white',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Avatar 
              sx={{ 
                width: 60, 
                height: 60, 
                bgcolor: 'white', 
                color: '#FF6B6B',
                mr: 2,
                boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
              }}
            >
              <GamepadIcon sx={{ fontSize: 36 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                GameStore
              </Typography>
            </Box>
          </Box>
        </Box>
        
        {/* Menu Items */}
        <List sx={{ pt: 2, px: 1.5 }}>
          {menuItems.map((item) => {
            const isSelected = location.pathname === item.path;
            return (
              <ListItemButton
                key={item.text}
                component={RouterLink}
                to={item.path}
                onClick={handleDrawerToggle}
                selected={isSelected}
                sx={{
                  my: 0.5,
                  borderRadius: 2,
                  transition: 'all 0.2s ease-in-out',
                  bgcolor: isSelected ? alpha(item.color, 0.1) : 'transparent',
                  '&:hover': {
                    bgcolor: isSelected ? alpha(item.color, 0.15) : alpha(item.color, 0.05),
                    transform: 'translateX(5px)',
                    '& .MuiListItemIcon-root': {
                      color: item.color,
                    }
                  },
                  ...(isSelected && {
                    borderLeft: `4px solid ${item.color}`,
                    '& .MuiListItemIcon-root': {
                      color: item.color,
                    },
                  }),
                }}
              >
                <ListItemIcon sx={{ 
                  minWidth: 45,
                  color: isSelected ? item.color : alpha(item.color, 0.7),
                  transition: 'color 0.2s ease-in-out',
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  sx={{ 
                    '& .MuiTypography-root': {
                      fontWeight: isSelected ? 600 : 500,
                      transition: 'all 0.2s ease-in-out',
                    }
                  }}
                />
                {isSelected && (
                  <ArrowRightAltIcon sx={{ color: item.color, opacity: 0.7 }} />
                )}
              </ListItemButton>
            );
          })}
        </List>

        {/* Auth Menu Items */}
        <List sx={{ px: 1.5 }}>
          <Divider sx={{ my: 1 }} />
          {authMenuItems.map((item) => (
            <ListItemButton
              key={item.text}
              component={item.action ? 'div' : RouterLink}
              to={item.action ? undefined : item.path}
              onClick={item.action || handleDrawerToggle}
              sx={{
                my: 0.5,
                borderRadius: 2,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  bgcolor: alpha(item.color, 0.05),
                  transform: 'translateX(5px)',
                  '& .MuiListItemIcon-root': {
                    color: item.color,
                  }
                },
              }}
            >
              <ListItemIcon sx={{ 
                minWidth: 45,
                color: alpha(item.color, 0.7),
                transition: 'color 0.2s ease-in-out',
              }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                sx={{ 
                  '& .MuiTypography-root': {
                    fontWeight: 500,
                    transition: 'all 0.2s ease-in-out',
                  }
                }}
              />
            </ListItemButton>
          ))}
        </List>
        
        {/* Footer section in drawer */}
        <Box sx={{ 
          mt: 'auto', 
          p: 2, 
          textAlign: 'center',
          bgcolor: alpha(theme.palette.primary.main, 0.05),
          borderTop: '1px solid',
          borderTopColor: alpha(theme.palette.primary.main, 0.1),
        }}>
          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block', 
              color: theme.palette.text.secondary,
              fontWeight: 500
            }}
          >
            © {new Date().getFullYear()} GameStore
          </Typography>
          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block', 
              color: theme.palette.text.secondary,
              mt: 0.5
            }}
          >
            Nền tảng game số 1
          </Typography>
        </Box>
      </Drawer>

      <Box 
        sx={{ 
          marginTop: '68px',
          padding: '16px',
          flex: 1,
          width: '100%',
          maxWidth: '100vw',
          overflowX: 'hidden',
          background: 'rgba(255, 255, 255, 0.02)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px 16px 0 0',
          margin: '68px 8px 0 8px',
          minHeight: 'calc(100vh - 68px)',
        }}
      >
        {children || <Outlet />}
      </Box>

      <Box 
        component="footer" 
        sx={{ 
          py: 3, 
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          textAlign: 'center',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          color: 'white',
        }}
      >
        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
          © {new Date().getFullYear()} GameStore. Nền tảng game hàng đầu Việt Nam.
        </Typography>
      </Box>
    </Box>
  );
};

export default CustomerLayout;
