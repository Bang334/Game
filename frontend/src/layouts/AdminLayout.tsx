import { useState, useEffect, createContext } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  SportsEsports as GamesIcon,
  ShoppingCart as ShoppingCartIcon,
  Star as ReviewIcon,
  ExitToApp as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Storefront as StorefrontIcon,
  AccountBalance as AccountBalanceIcon,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

const drawerWidth = 260;
const collapsedDrawerWidth = 70;

export const SidebarContext = createContext({
  collapsed: false,
  drawerWidth: 260,
  collapsedDrawerWidth: 70,
});

interface AdminLayoutProps {
  children?: React.ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const theme = useTheme();


  useEffect(() => {
    // Redirect if not logged in or not admin
    if (!currentUser) {
      navigate('/login');
    } else if (currentUser.role !== 'ADMIN') {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleProfileMenuClose();
    navigate('/login');
  };

  const menuItems = [
    {
      title: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/admin',
      exact: true,
      color: '#667eea',
      bgColor: 'rgba(102, 126, 234, 0.1)',
      borderColor: 'rgba(102, 126, 234, 0.3)'
    },
    {
      title: 'Quản lý Games',
      icon: <GamesIcon />,
      path: '/admin/games',
      color: '#4caf50',
      bgColor: 'rgba(76, 175, 80, 0.1)',
      borderColor: 'rgba(76, 175, 80, 0.3)'
    },
    {
      title: 'Quản lý Users',
      icon: <PeopleIcon />,
      path: '/admin/users',
      color: '#ff9800',
      bgColor: 'rgba(255, 152, 0, 0.1)',
      borderColor: 'rgba(255, 152, 0, 0.3)'
    },
    {
      title: 'Purchases',
      icon: <ShoppingCartIcon />,
      path: '/admin/purchases',
      color: '#9c27b0',
      bgColor: 'rgba(156, 39, 176, 0.1)',
      borderColor: 'rgba(156, 39, 176, 0.3)'
    },
    {
      title: 'Reviews',
      icon: <ReviewIcon />,
      path: '/admin/reviews',
      color: '#f44336',
      bgColor: 'rgba(244, 67, 54, 0.1)',
      borderColor: 'rgba(244, 67, 54, 0.3)'
    },
    {
      title: 'Yêu cầu nạp tiền',
      icon: <AccountBalanceIcon />,
      path: '/admin/deposits',
      color: '#2196f3',
      bgColor: 'rgba(33, 150, 243, 0.1)',
      borderColor: 'rgba(33, 150, 243, 0.3)'
    },
  ];

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <Box
        sx={{
          p: collapsed ? 1 : 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          minHeight: 64,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
        }}
      >
        <Avatar
          sx={{
            bgcolor: theme.palette.primary.main,
            width: collapsed ? 40 : 48,
            height: collapsed ? 40 : 48,
          }}
        >
          <StorefrontIcon />
        </Avatar>
        {!collapsed && (
          <Typography variant="h6" sx={{ ml: 2, fontWeight: 700 }}>
            GameStore Admin
          </Typography>
        )}
      </Box>

      {/* Menu Items */}
      <List sx={{ flexGrow: 1, py: 1 }}>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.title}
            component={RouterLink}
            to={item.path}
            sx={{
              minHeight: 56,
              justifyContent: collapsed ? 'center' : 'initial',
              px: 2.5,
              my: 0.5,
              mx: 1,
              borderRadius: 2,
              backgroundColor: isActive(item.path, item.exact) ? item.bgColor : 'transparent',
              border: isActive(item.path, item.exact) ? `2px solid ${item.borderColor}` : '2px solid transparent',
              boxShadow: isActive(item.path, item.exact) ? `0 4px 12px ${item.borderColor}` : 'none',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: item.bgColor,
                border: `2px solid ${item.borderColor}`,
                boxShadow: `0 4px 12px ${item.borderColor}`,
                transform: 'translateX(4px)',
              }
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: collapsed ? 'auto' : 3,
                justifyContent: 'center',
                color: isActive(item.path, item.exact) ? item.color : 'inherit',
                transition: 'all 0.3s ease',
              }}
            >
              {item.icon}
            </ListItemIcon>
            {!collapsed && (
              <ListItemText 
                primary={item.title}
                sx={{
                  color: isActive(item.path, item.exact) ? item.color : 'inherit',
                  '& .MuiListItemText-primary': {
                    fontWeight: isActive(item.path, item.exact) ? 700 : 500,
                    fontSize: '0.95rem',
                    transition: 'all 0.3s ease',
                  }
                }}
              />
            )}
          </ListItemButton>
        ))}
      </List>

      {/* Collapse Toggle */}
      <Box sx={{ p: 1, borderTop: `1px solid ${alpha(theme.palette.divider, 0.12)}` }}>
        <IconButton
          onClick={() => setCollapsed(!collapsed)}
          sx={{
            width: '100%',
            justifyContent: collapsed ? 'center' : 'flex-end',
          }}
        >
          {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>
    </Box>
  );

  return (
    <SidebarContext.Provider value={{ collapsed, drawerWidth, collapsedDrawerWidth }}>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        
        {/* AppBar */}
        <AppBar
          position="fixed"
          sx={{
            width: { sm: `calc(100% - ${collapsed ? collapsedDrawerWidth : drawerWidth}px)` },
            ml: { sm: `${collapsed ? collapsedDrawerWidth : drawerWidth}px` },
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: 'white',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Toolbar sx={{ minHeight: 64 }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ 
                mr: 2, 
                display: { sm: 'none' },
                bgcolor: 'rgba(255,255,255,0.1)',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.2)',
                }
              }}
            >
              <MenuIcon />
            </IconButton>
            
            <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 3 }}>
                <Avatar 
                  sx={{ 
                    width: 40, 
                    height: 40, 
                    bgcolor: 'rgba(255,255,255,0.2)',
                    mr: 2,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                  }}
                >
                  <StorefrontIcon />
                </Avatar>
                <Typography variant="h6" sx={{ 
                  fontWeight: 700,
                  textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  letterSpacing: '0.5px'
                }}>
                  Admin Dashboard
                </Typography>
              </Box>
              
              <Typography variant="body2" sx={{ 
                opacity: 0.9,
                fontSize: '0.9rem',
                fontWeight: 500
              }}>
                Chào mừng, {currentUser?.username}
              </Typography>
            </Box>

            {/* User Menu */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <IconButton
                size="large"
                edge="end"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleProfileMenuOpen}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.1)',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.2)',
                    transform: 'scale(1.05)'
                  },
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                }}
              >
                <Avatar sx={{ 
                  width: 36, 
                  height: 36, 
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  fontWeight: 700
                }}>
                  {currentUser?.username?.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorEl}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                open={Boolean(anchorEl)}
                onClose={handleProfileMenuClose}
                PaperProps={{
                  sx: {
                    mt: 1,
                    minWidth: 180,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    borderRadius: 2,
                    border: '1px solid rgba(0,0,0,0.05)',
                  }
                }}
              >
                <MenuItem 
                  onClick={handleProfileMenuClose}
                  sx={{ 
                    py: 1.5,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.1)
                    }
                  }}
                >
                  <Avatar sx={{ width: 24, height: 24, mr: 2, bgcolor: theme.palette.primary.main }}>
                    {currentUser?.username?.charAt(0).toUpperCase()}
                  </Avatar>
                  Profile
                </MenuItem>
                <MenuItem 
                  onClick={handleLogout}
                  sx={{ 
                    py: 1.5,
                    color: theme.palette.error.main,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.error.main, 0.1)
                    }
                  }}
                >
                  <LogoutIcon sx={{ mr: 2, fontSize: 20 }} />
                  Logout
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Drawer */}
        <Box
          component="nav"
          sx={{ width: { sm: collapsed ? collapsedDrawerWidth : drawerWidth }, flexShrink: { sm: 0 } }}
        >
          {/* Mobile drawer */}
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{
              keepMounted: true,
            }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
            }}
          >
            {drawer}
          </Drawer>
          
          {/* Desktop drawer */}
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: collapsed ? collapsedDrawerWidth : drawerWidth,
                transition: theme.transitions.create('width', {
                  easing: theme.transitions.easing.sharp,
                  duration: theme.transitions.duration.enteringScreen,
                }),
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>

        {/* Main content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 3,
            width: { sm: `calc(100% - ${collapsed ? collapsedDrawerWidth : drawerWidth}px)` },
          }}
        >
          <Toolbar />
          {children || <Outlet />}
        </Box>
      </Box>
    </SidebarContext.Provider>
  );
};

export default AdminLayout;
