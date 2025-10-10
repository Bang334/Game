import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Container,
  CircularProgress,
  Grid,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Rating,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Star as StarIcon,
  MoreVert as MoreVertIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

interface Review {
  review_id: number;
  user_id: number;
  game_id: number;
  rating: number;
  comment: string;
  created_at: string;
  user: {
    username: string;
    email: string;
  };
  game: {
    title: string;
    image_url?: string;
    game_id: number;
  };
}

const AdminReviewsPage = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedReviewId, setSelectedReviewId] = useState<number | null>(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/admin/reviews', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setReviews(response.data.reviews || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setSnackbar({
        open: true,
        message: 'Lỗi khi tải danh sách reviews',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredReviews = reviews.filter(review =>
    review.user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.game.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    review.comment.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteReview = async (reviewId: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa review này?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:3001/api/admin/reviews/${reviewId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setSnackbar({
          open: true,
          message: 'Xóa review thành công',
          severity: 'success'
        });
        fetchReviews();
      } catch (error) {
        console.error('Error deleting review:', error);
        setSnackbar({
          open: true,
          message: 'Lỗi khi xóa review',
          severity: 'error'
        });
      }
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, reviewId: number) => {
    setAnchorEl(event.currentTarget);
    setSelectedReviewId(reviewId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedReviewId(null);
  };

  const handleViewReview = (review: Review) => {
    setSelectedReview(review);
    setOpenDialog(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'success';
    if (rating >= 3) return 'warning';
    return 'error';
  };

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Quản lý Reviews
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tổng cộng: {reviews.length} reviews
          </Typography>
        </Box>

        {/* Search */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Tìm kiếm reviews theo user, game, hoặc nội dung..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            sx={{ maxWidth: 600 }}
          />
        </Box>

        {/* Reviews Table */}
        <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ 
                  background: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)',
                  '& .MuiTableCell-head': {
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.95rem'
                  }
                }}>
                  <TableCell>User</TableCell>
                  <TableCell>Game</TableCell>
                  <TableCell>Rating</TableCell>
                  <TableCell>Comment</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
            <TableBody>
              {filteredReviews.map((review) => (
                <TableRow 
                  key={review.review_id} 
                  hover
                  sx={{ 
                    '&:hover': {
                      backgroundColor: 'rgba(156, 39, 176, 0.04)',
                    }
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ 
                        width: 50, 
                        height: 50, 
                        mr: 2, 
                        bgcolor: 'primary.main',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        border: '2px solid #f0f0f0'
                      }}>
                        {review.user.username.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                          {review.user.username}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                          {review.user.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar
                        src={review.game.image_url}
                        sx={{ 
                          width: 50, 
                          height: 50, 
                          mr: 2,
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          border: '2px solid #f0f0f0'
                        }}
                      >
                        🎮
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
                          {review.game.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ID: {review.game.game_id}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Rating
                        value={review.rating}
                        readOnly
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <Chip
                        label={review.rating}
                        color={getRatingColor(review.rating) as any}
                        size="small"
                        variant="outlined"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        maxWidth: 300,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {review.comment}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(review.created_at)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      onClick={(e) => handleMenuOpen(e, review.review_id)}
                      size="small"
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {filteredReviews.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <StarIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Không tìm thấy reviews nào
            </Typography>
          </Box>
        )}
      </Box>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            const review = reviews.find(r => r.review_id === selectedReviewId);
            if (review) {
              handleViewReview(review);
            }
            handleMenuClose();
          }}
        >
          <VisibilityIcon sx={{ mr: 1 }} />
          Xem chi tiết
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedReviewId) {
              handleDeleteReview(selectedReviewId);
            }
            handleMenuClose();
          }}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon sx={{ mr: 1 }} />
          Xóa
        </MenuItem>
      </Menu>

      {/* Review Detail Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Chi tiết Review
        </DialogTitle>
        <DialogContent>
          {selectedReview && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    User
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ width: 48, height: 48, mr: 2, bgcolor: 'primary.main' }}>
                      {selectedReview.user.username.charAt(0).toUpperCase()}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">
                        {selectedReview.user.username}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedReview.user.email}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Game
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar
                      src={selectedReview.game.image_url}
                      sx={{ width: 48, height: 48, mr: 2 }}
                    >
                      🎮
                    </Avatar>
                    <Box>
                      <Typography variant="h6">
                        {selectedReview.game.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ID: {selectedReview.game.game_id}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Rating
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Rating
                      value={selectedReview.rating}
                      readOnly
                      size="large"
                      sx={{ mr: 2 }}
                    />
                    <Chip
                      label={`${selectedReview.rating}/5`}
                      color={getRatingColor(selectedReview.rating) as any}
                      variant="outlined"
                    />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Comment
                  </Typography>
                  <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
                    <Typography variant="body1">
                      {selectedReview.comment}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Date
                  </Typography>
                  <Typography variant="body2">
                    {formatDate(selectedReview.created_at)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminReviewsPage;
