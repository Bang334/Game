import { Outlet } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useState } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  alpha,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Gamepad as GamepadIcon,
  Home as HomeIcon,
  SportsEsports as GamesIcon,
  Notifications as NotificationsIcon,
  LocalOffer as PromotionIcon,
  ArrowRightAlt as ArrowRightAltIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Close as CloseIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';


type CustomerLayoutProps = {
  children?: ReactNode;
};

const CustomerLayout = ({ children }: CustomerLayoutProps) => {
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
      background: '#f8f9fa',
      backgroundAttachment: 'fixed',
    }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          backgroundColor: '#ffffff',
          color: '#333333',
          borderBottom: '1px solid #e0e0e0',
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
              color: '#555',
              bgcolor: 'transparent',
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.05)',
              },
              transition: 'all 0.2s ease',
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
              color: '#333',
              fontSize: { xs: '1.2rem', sm: '1.4rem' },
              letterSpacing: '0.5px'
            }}
          >
            {getPageTitle()}
          </Box>


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
            background: '#ffffff',
            boxShadow: '4px 0 20px rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {/* Sidebar Header with Gradient */}
        <Box
          sx={{
            p: '1.38rem 1.5rem',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '200%',
              height: '200%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
              transform: 'translate(-50%, -50%)',
              animation: 'pulse 4s ease-in-out infinite',
            },
            '@keyframes pulse': {
              '0%, 100%': { transform: 'translate(-50%, -50%) scale(1)', opacity: 0.5 },
              '50%': { transform: 'translate(-50%, -50%) scale(1.1)', opacity: 0.3 },
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <GamepadIcon sx={{ fontSize: 32 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.35rem' }}>
                GameStore
              </Typography>
            </Box>
            <IconButton
              onClick={handleDrawerToggle}
              sx={{
                color: 'white',
                display: { xs: 'block', md: 'none' },
                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* User Info Card */}
        {currentUser && (
          <Box
            sx={{
              m: 2,
              p: 3,
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
              border: '1px solid #86efac',
              boxShadow: '0 2px 8px rgba(34, 197, 94, 0.1)',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 12px rgba(34, 197, 94, 0.2)',
              }
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: '3px solid white',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                }}
              >
                {currentUser.username?.charAt(0).toUpperCase() || currentUser.email?.charAt(0).toUpperCase() || 'U'}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 700,
                    color: '#166534',
                    mb: 0.5,
                  }}
                >
                  {currentUser.username || currentUser.email}
                </Typography>
                <Chip
                  label="Customer"
                  size="small"
                  sx={{
                    bgcolor: 'white',
                    color: '#15803d',
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    height: '20px',
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    color: '#22c55e',
                    fontFamily: 'monospace',
                    mt: 0.5,
                  }}
                >
                  ID: {currentUser.user_id}
                </Typography>
              </Box>
            </Box>
          </Box>
        )}

        {/* Navigation Menu */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: '0.5rem 1rem 1rem',
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f5f9',
              borderRadius: '10px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#cbd5e1',
              borderRadius: '10px',
              '&:hover': {
                background: '#94a3b8',
              },
            },
          }}
        >
          <List sx={{ p: 0 }}>
            {menuItems.map((item) => {
              const isSelected = location.pathname === item.path;
              return (
                <ListItemButton
                  key={item.text}
                  component={RouterLink}
                  to={item.path}
                  onClick={handleDrawerToggle}
                  sx={{
                    mb: '0.375rem',
                    p: '0.875rem 1rem',
                    borderRadius: '12px',
                    color: isSelected ? '#1e40af' : '#64748b',
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: '0.9rem',
                    position: 'relative',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    background: isSelected
                      ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'
                      : 'transparent',
                    boxShadow: isSelected ? '0 2px 8px rgba(59, 130, 246, 0.15)' : 'none',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: '15%',
                      height: '70%',
                      width: isSelected ? '4px' : 0,
                      background: 'linear-gradient(180deg, #3b82f6 0%, #1e40af 100%)',
                      borderRadius: '0 4px 4px 0',
                      transition: 'width 0.3s ease',
                    },
                    '&:hover': {
                      background: isSelected
                        ? 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)'
                        : 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
                      color: isSelected ? '#1e40af' : '#1e293b',
                      transform: 'translateX(4px)',
                      pl: '1.25rem',
                      '&::before': {
                        width: '4px',
                        background: isSelected
                          ? 'linear-gradient(180deg, #3b82f6 0%, #1e40af 100%)'
                          : 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
                      },
                      '& .MuiListItemIcon-root': {
                        transform: 'scale(1.1)',
                      },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: 'inherit',
                      transition: 'transform 0.3s ease',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      sx: {
                        fontWeight: 'inherit',
                        fontSize: 'inherit',
                      }
                    }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        </Box>

        {/* Logout Button */}
        {currentUser && (
          <Box sx={{ p: 2 }}>
            <ListItemButton
              onClick={handleLogout}
              sx={{
                p: '0.95rem 1rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
                border: '2px solid #fee2e2',
                color: '#dc2626',
                fontWeight: 600,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                  transition: 'left 0.5s ease',
                },
                '&:hover': {
                  background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                  color: 'white',
                  transform: 'translateY(-3px)',
                  boxShadow: '0 6px 20px rgba(220, 38, 38, 0.4)',
                  '&::before': {
                    left: '100%',
                  },
                  '& .MuiListItemIcon-root': {
                    transform: 'rotate(-10deg) scale(1.1)',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: 'inherit',
                  transition: 'transform 0.3s ease',
                }}
              >
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText
                primary="Đăng xuất"
                primaryTypographyProps={{
                  sx: {
                    fontWeight: 600,
                  }
                }}
              />
            </ListItemButton>
          </Box>
        )}

        {/* Login Button for guests */}
        {!currentUser && (
          <Box sx={{ p: 2 }}>
            <ListItemButton
              component={RouterLink}
              to="/login"
              onClick={handleDrawerToggle}
              sx={{
                p: '0.95rem 1rem',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                border: '2px solid #86efac',
                color: '#15803d',
                fontWeight: 600,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                  color: 'white',
                  transform: 'translateY(-3px)',
                  boxShadow: '0 6px 20px rgba(34, 197, 94, 0.4)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: 'inherit',
                }}
              >
                <LoginIcon />
              </ListItemIcon>
              <ListItemText
                primary="Đăng nhập"
                primaryTypographyProps={{
                  sx: {
                    fontWeight: 600,
                  }
                }}
              />
            </ListItemButton>
          </Box>
        )}
      </Drawer>

      <Box
        sx={{
          marginTop: '68px',
          padding: '16px',
          flex: 1,
          width: '100%',
          maxWidth: '100vw',
          overflowX: 'hidden',
          background: 'transparent',
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
          background: '#ffffff',
          textAlign: 'center',
          borderTop: '1px solid #e0e0e0',
          color: '#666',
        }}
      >
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          © {new Date().getFullYear()} GameStore. Nền tảng game hàng đầu Việt Nam.
        </Typography>
      </Box>
    </Box>
  );
};

export default CustomerLayout;
