import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { SnackbarProvider } from 'notistack';

// Layouts
import CustomerLayout from './layouts/CustomerLayout';
import AdminLayout from './layouts/AdminLayout';

// Customer Pages
import HomePage from './pages/customer/HomePage';
import GamesPage from './pages/customer/GamesPage';
import GameDetailPage from './pages/customer/GameDetailPage';
import ProfilePage from './pages/customer/ProfilePage';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Admin Pages
import AdminDashboardPage from './pages/admin/DashboardPage';
import AdminUsersPage from './pages/admin/UsersPage';
import AdminGamesPage from './pages/admin/GamesPage';
import AddGamePage from './pages/admin/AddGamePage';
import AdminReviewsPage from './pages/admin/ReviewsPage';
import AdminPurchasesPage from './pages/admin/PurchasesPage';

// Context
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Create comprehensive theme like QuanAn
const theme = createTheme({
  palette: {
    primary: {
      main: '#8E3200',
      light: '#A64B2A',
      dark: '#662500',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#D7A86E',
      light: '#E6C69F',
      dark: '#BF8D4A',
      contrastText: '#000000',
    },
    background: {
      default: '#FAFAFA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2D2D2D',
      secondary: '#616161',
    },
    error: {
      main: '#CF000F',
    },
    success: {
      main: '#009944',
    },
    warning: {
      main: '#F5A623',
    },
  },
  typography: {
    fontFamily: '"Montserrat", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 800,
      fontSize: '2.5rem',
      lineHeight: 1.2,
    },
    h2: {
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.3,
    },
    h3: {
      fontWeight: 700,
      fontSize: '1.75rem',
      lineHeight: 1.3,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.4,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1.5,
    },
    subtitle1: {
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      fontWeight: 500,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    button: {
      fontWeight: 600,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 16px',
          boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0px 6px 12px rgba(0, 0, 0, 0.15)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(45deg, #8E3200, #A64B2A)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          overflow: 'hidden',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 12,
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SnackbarProvider 
        maxSnack={3} 
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        autoHideDuration={3000}
      >
        <AuthProvider>
          <Router>
            <Routes>
              {/* Auth Routes */}
              <Route path="/auth/login" element={<LoginPage />} />
              <Route path="/auth/register" element={<RegisterPage />} />
              <Route path="/login" element={<LoginPage />} />

              {/* Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute requiredRole="ADMIN">
                  <AdminLayout />
                </ProtectedRoute>
              }>
                <Route index element={<AdminDashboardPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="games" element={<AdminGamesPage />} />
                <Route path="games/add" element={<AddGamePage />} />
                <Route path="reviews" element={<AdminReviewsPage />} />
                <Route path="purchases" element={<AdminPurchasesPage />} />
              </Route>

              {/* Customer Routes */}
              <Route path="/" element={<CustomerLayout />}>
                <Route index element={<HomePage />} />
                <Route path="games" element={<GamesPage />} />
                <Route path="games/:id" element={<GameDetailPage />} />
                <Route path="wishlist" element={<WishlistPage />} />
                <Route path="purchases" element={<PurchasesPage />} />
                <Route path="viewed" element={<ViewedGamesPage />} />
              </Route>
            </Routes>
          </Router>
        </AuthProvider>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;
