import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Container,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  Alert,
  Snackbar,
  CircularProgress,
  Paper,
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

interface Publisher {
  publisher_id: number;
  name: string;
}

interface Genre {
  genre_id: number;
  name: string;
}

interface Platform {
  platform_id: number;
  name: string;
}

const AddGamePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    release_date: '',
    publisher_id: '',
    image_url: '',
    selectedGenres: [] as number[],
    selectedPlatforms: [] as number[],
  });

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const fetchDropdownData = async () => {
    try {
      const [publishersRes, genresRes, platformsRes] = await Promise.all([
        axios.get('http://localhost:3001/api/admin/publishers'),
        axios.get('http://localhost:3001/api/admin/genres'),
        axios.get('http://localhost:3001/api/admin/platforms'),
      ]);

      setPublishers(publishersRes.data.publishers || []);
      setGenres(genresRes.data.genres || []);
      setPlatforms(platformsRes.data.platforms || []);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      setSnackbar({
        open: true,
        message: 'Lỗi khi tải dữ liệu dropdown',
        severity: 'error'
      });
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleGenreChange = (event: any) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      selectedGenres: typeof value === 'string' ? value.split(',').map(Number) : value
    }));
  };

  const handlePlatformChange = (event: any) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      selectedPlatforms: typeof value === 'string' ? value.split(',').map(Number) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.price || !formData.publisher_id) {
      setSnackbar({
        open: true,
        message: 'Vui lòng điền đầy đủ thông tin bắt buộc',
        severity: 'error'
      });
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const gameData = {
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        release_date: formData.release_date || new Date().toISOString().split('T')[0],
        publisher_id: parseInt(formData.publisher_id),
        image_url: formData.image_url,
        genres: formData.selectedGenres,
        platforms: formData.selectedPlatforms,
      };

      await axios.post('http://localhost:3001/api/admin/games', gameData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setSnackbar({
        open: true,
        message: 'Thêm game thành công!',
        severity: 'success'
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        price: '',
        release_date: '',
        publisher_id: '',
        image_url: '',
        selectedGenres: [],
        selectedPlatforms: [],
      });

      // Navigate back to games list after 2 seconds
      setTimeout(() => {
        navigate('/admin/games');
      }, 2000);

    } catch (error) {
      console.error('Error creating game:', error);
      setSnackbar({
        open: true,
        message: 'Lỗi khi thêm game',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/admin/games')}
            sx={{ mr: 2 }}
          >
            Quay lại
          </Button>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
            Thêm Game mới
          </Typography>
        </Box>

        <Paper sx={{ p: 4 }}>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Basic Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  Thông tin cơ bản
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Tên game *"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Giá (VNĐ) *"
                  type="number"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  required
                  inputProps={{ min: 0 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Publisher *</InputLabel>
                  <Select
                    value={formData.publisher_id}
                    label="Publisher *"
                    onChange={(e) => handleInputChange('publisher_id', e.target.value)}
                  >
                    {publishers.map((publisher) => (
                      <MenuItem key={publisher.publisher_id} value={publisher.publisher_id}>
                        {publisher.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Ngày phát hành"
                  type="date"
                  value={formData.release_date}
                  onChange={(e) => handleInputChange('release_date', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Mô tả *"
                  multiline
                  rows={4}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="URL hình ảnh"
                  value={formData.image_url}
                  onChange={(e) => handleInputChange('image_url', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </Grid>

              {/* Genres */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>
                  Genres
                </Typography>
                <FormControl fullWidth>
                  <InputLabel>Chọn genres</InputLabel>
                  <Select
                    multiple
                    value={formData.selectedGenres}
                    onChange={handleGenreChange}
                    input={<OutlinedInput label="Chọn genres" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                          const genre = genres.find(g => g.genre_id === value);
                          return (
                            <Chip key={value} label={genre?.name} size="small" />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {genres.map((genre) => (
                      <MenuItem key={genre.genre_id} value={genre.genre_id}>
                        {genre.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Platforms */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>
                  Platforms
                </Typography>
                <FormControl fullWidth>
                  <InputLabel>Chọn platforms</InputLabel>
                  <Select
                    multiple
                    value={formData.selectedPlatforms}
                    onChange={handlePlatformChange}
                    input={<OutlinedInput label="Chọn platforms" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => {
                          const platform = platforms.find(p => p.platform_id === value);
                          return (
                            <Chip key={value} label={platform?.name} size="small" />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {platforms.map((platform) => (
                      <MenuItem key={platform.platform_id} value={platform.platform_id}>
                        {platform.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Submit Buttons */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 3 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/admin/games')}
                    disabled={loading}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                    disabled={loading}
                  >
                    {loading ? 'Đang lưu...' : 'Lưu Game'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Box>

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

export default AddGamePage;
