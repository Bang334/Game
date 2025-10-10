import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Rating,
  Box,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import axios from 'axios';
import { useSnackbar } from 'notistack';

interface RatingModalProps {
  open: boolean;
  onClose: () => void;
  gameId: number;
  gameName: string;
  onRatingSubmitted?: () => void;
}

interface GameRating {
  rating: number;
  comment: string;
}

const RatingModal: React.FC<RatingModalProps> = ({
  open,
  onClose,
  gameId,
  gameName,
  onRatingSubmitted
}) => {
  const { enqueueSnackbar } = useSnackbar();
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [existingRating, setExistingRating] = useState<GameRating | null>(null);

  useEffect(() => {
    if (open && gameId) {
      fetchExistingRating();
    }
  }, [open, gameId]);

  const fetchExistingRating = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:3001/api/customer/ratings/${gameId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.rating) {
        setExistingRating(response.data.rating);
        setRating(response.data.rating.rating);
        setComment(response.data.rating.comment || '');
      } else {
        // Reset form if no existing rating
        setExistingRating(null);
        setRating(0);
        setComment('');
      }
    } catch (error) {
      console.error('Error fetching existing rating:', error);
      // Reset form if error (no rating exists)
      setExistingRating(null);
      setRating(0);
      setComment('');
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Vui lòng chọn điểm đánh giá');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const ratingData = {
        game_id: gameId,
        rating: rating,
        comment: comment.trim()
      };

      const response = await axios.post('http://localhost:3001/api/customer/ratings', ratingData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        onRatingSubmitted?.();
        onClose();
        // Reset form
        setRating(0);
        setComment('');
        setExistingRating(null);
        
        // Show success message
        const message = existingRating ? 'Đánh giá đã được cập nhật thành công!' : 'Đánh giá đã được gửi thành công!';
        // You can add a toast notification here if you have a toast system
        console.log(message);
      } else {
        setError(response.data.message || 'Có lỗi xảy ra khi lưu đánh giá');
      }
    } catch (error: any) {
      console.error('Error submitting rating:', error);
      setError(error.response?.data?.message || 'Có lỗi xảy ra khi lưu đánh giá');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
      setError('');
      // Reset form when closing
      setRating(0);
      setComment('');
      setExistingRating(null);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle>
        <Typography variant="h6" component="div">
          {existingRating ? 'Cập nhật đánh giá' : 'Đánh giá game'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {gameName}
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Điểm đánh giá *
          </Typography>
          <Rating
            value={rating}
            onChange={(event, newValue) => {
              setRating(newValue || 0);
            }}
            size="large"
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            multiline
            rows={4}
            label="Bình luận (tùy chọn)"
            placeholder="Chia sẻ trải nghiệm của bạn về game này..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            variant="outlined"
            sx={{ mt: 2 }}
          />

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {existingRating && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Bạn đã đánh giá game này trước đó. Đánh giá mới sẽ thay thế đánh giá cũ.
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button 
          onClick={handleClose} 
          disabled={loading}
          variant="outlined"
        >
          Hủy
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={loading || rating === 0}
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Đang lưu...' : (existingRating ? 'Cập nhật' : 'Gửi đánh giá')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RatingModal;
