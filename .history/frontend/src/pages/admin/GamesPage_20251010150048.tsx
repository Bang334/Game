import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Button,
  TextField,
  Container,
  CircularProgress,
  Chip,
  IconButton,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  FormControlLabel,
  Checkbox,
  Divider,
  Card,
  CardContent,
  Stack,
  Tabs,
  Tab,
  Autocomplete,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  SportsEsports as GameIcon,
  Search as SearchIcon,
  Info as InfoIcon,
  Settings as SettingsIcon,
  Computer as ComputerIcon,
} from '@mui/icons-material';

interface Game {
  game_id: number;
  name: string;
  description: string;
  price: number;
  release_date: string;
  publisher_name: string;
  publisher_id?: number;
  image?: string;
  genres?: string[];
  platforms?: string[];
  languages?: string[];
  multiplayer?: boolean;
  average_rating?: number;
  downloads?: number;
  mode?: string;
  capacity?: number;
  age_rating?: string;
  link_download?: string;
  min_specs?: {
    cpu: string;
    ram: string;
    gpu: string;
  } | null;
  rec_specs?: {
    cpu: string;
    ram: string;
    gpu: string;
  } | null;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

// CPU Options
const CPU_OPTIONS = [
  // Intel High-End
  'Intel Core i9-13900K',
  'Intel Core i9-12900K',
  'Intel Core i9-11900K',
  'Intel Core i7-13700K',
  'Intel Core i7-12700K',
  'Intel Core i7-11700K',
  'Intel Core i7-10700K',
  // Intel Mid-Range
  'Intel Core i5-13600K',
  'Intel Core i5-12600K',
  'Intel Core i5-12400F',
  'Intel Core i5-11600K',
  'Intel Core i5-10600K',
  'Intel Core i5-10400F',
  'Intel Core i3-12100F',
  'Intel Core i3-10100F',
  'Intel Core i3-9100F',
  // Intel Budget
  'Intel Pentium Gold G7400',
  'Intel Pentium G6400',
  'Intel Pentium G4560',
  'Intel Celeron G5905',
  'Intel Celeron G4930',
  // AMD High-End
  'AMD Ryzen 9 7950X',
  'AMD Ryzen 9 5950X',
  'AMD Ryzen 9 5900X',
  'AMD Ryzen 7 7700X',
  'AMD Ryzen 7 5800X',
  'AMD Ryzen 7 5700X',
  'AMD Ryzen 7 3700X',
  // AMD Mid-Range
  'AMD Ryzen 5 7600X',
  'AMD Ryzen 5 5600X',
  'AMD Ryzen 5 5600',
  'AMD Ryzen 5 3600',
  'AMD Ryzen 5 2600',
  'AMD Ryzen 3 5300G',
  'AMD Ryzen 3 3300X',
  'AMD Ryzen 3 3100',
];

// GPU Options
const GPU_OPTIONS = [
  // NVIDIA RTX 40 Series
  'NVIDIA GeForce RTX 4090',
  'NVIDIA GeForce RTX 4080',
  'NVIDIA GeForce RTX 4070 Ti',
  'NVIDIA GeForce RTX 4070',
  'NVIDIA GeForce RTX 4060 Ti',
  'NVIDIA GeForce RTX 4060',
  // NVIDIA RTX 30 Series
  'NVIDIA GeForce RTX 3090',
  'NVIDIA GeForce RTX 3080',
  'NVIDIA GeForce RTX 3070',
  'NVIDIA GeForce RTX 3060 Ti',
  'NVIDIA GeForce RTX 3060',
  'NVIDIA GeForce RTX 3050',
  // NVIDIA RTX 20 Series
  'NVIDIA GeForce RTX 2080 Ti',
  'NVIDIA GeForce RTX 2080',
  'NVIDIA GeForce RTX 2070',
  'NVIDIA GeForce RTX 2060',
  // NVIDIA GTX 16 Series
  'NVIDIA GeForce GTX 1660 Ti',
  'NVIDIA GeForce GTX 1660',
  'NVIDIA GeForce GTX 1650',
  // NVIDIA GTX 10 Series
  'NVIDIA GeForce GTX 1080 Ti',
  'NVIDIA GeForce GTX 1080',
  'NVIDIA GeForce GTX 1070',
  'NVIDIA GeForce GTX 1060',
  'NVIDIA GeForce GTX 1050 Ti',
  'NVIDIA GeForce GTX 1050',
  // NVIDIA GTX Older
  'NVIDIA GeForce GTX 980',
  'NVIDIA GeForce GTX 970',
  'NVIDIA GeForce GTX 960',
  'NVIDIA GeForce GTX 950',
  'NVIDIA GeForce GTX 750 Ti',
  'NVIDIA GeForce GTX 750',
  'NVIDIA GeForce GTX 650',
  // AMD RX 7000 Series
  'AMD Radeon RX 7900 XTX',
  'AMD Radeon RX 7900 XT',
  'AMD Radeon RX 7800 XT',
  'AMD Radeon RX 7700 XT',
  'AMD Radeon RX 7600',
  // AMD RX 6000 Series
  'AMD Radeon RX 6950 XT',
  'AMD Radeon RX 6900 XT',
  'AMD Radeon RX 6800 XT',
  'AMD Radeon RX 6800',
  'AMD Radeon RX 6700 XT',
  'AMD Radeon RX 6600 XT',
  'AMD Radeon RX 6600',
  'AMD Radeon RX 6500 XT',
  // AMD RX 5000 Series
  'AMD Radeon RX 5700 XT',
  'AMD Radeon RX 5700',
  'AMD Radeon RX 5600 XT',
  'AMD Radeon RX 5500 XT',
  // Integrated Graphics
  'Intel UHD Graphics 770',
  'Intel UHD Graphics 730',
  'Intel UHD Graphics 630',
  'Intel HD Graphics 530',
  'AMD Radeon Vega 8',
  'AMD Radeon Vega 7',
];

// RAM Options
const RAM_OPTIONS = [
  '4 GB',
  '6 GB',
  '8 GB',
  '12 GB',
  '16 GB',
  '24 GB',
  '32 GB',
  '64 GB',
  '128 GB',
];

const AdminGamesPage = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [gameToDelete, setGameToDelete] = useState<Game | null>(null);
  const [gameToEdit, setGameToEdit] = useState<Game | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [tabValue, setTabValue] = useState(0);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    release_date: '',
    image: '',
    multiplayer: false,
    mode: '',
    capacity: 0,
    age_rating: '',
    link_download: '',
    average_rating: 0,
    downloads: 0,
    min_cpu: '',
    min_ram: '',
    min_gpu: '',
    rec_cpu: '',
    rec_ram: '',
    rec_gpu: '',
  });

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/admin/games', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('📊 Games loaded:', response.data.games);
      setGames(response.data.games || []);
    } catch (error) {
      console.error('❌ Error fetching games:', error);
      setSnackbar({
        open: true,
        message: 'Lỗi khi tải danh sách games',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredGames = games.filter(game =>
    game.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    game.publisher_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    game.genres?.some(genre => genre?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddGame = () => {
    // Reset form data
    setFormData({
      name: '',
      description: '',
      price: 0,
      release_date: '',
      image: '',
      multiplayer: false,
      mode: '',
      capacity: 0,
      age_rating: '',
      link_download: '',
      average_rating: 0,
      downloads: 0,
      min_cpu: '',
      min_ram: '',
      min_gpu: '',
      rec_cpu: '',
      rec_ram: '',
      rec_gpu: '',
    });
    setTabValue(0);
    setAddDialogOpen(true);
  };

  const handleEditClick = (game: Game) => {
    setGameToEdit(game);
    setFormData({
      name: game.name || '',
      description: game.description || '',
      price: game.price || 0,
      release_date: game.release_date ? new Date(game.release_date).toISOString().split('T')[0] : '',
      image: game.image || '',
      multiplayer: game.multiplayer || false,
      mode: game.mode || '',
      capacity: game.capacity || 0,
      age_rating: game.age_rating || '',
      link_download: game.link_download || '',
      average_rating: game.average_rating || 0,
      downloads: game.downloads || 0,
      min_cpu: game.min_specs?.cpu || '',
      min_ram: game.min_specs?.ram || '',
      min_gpu: game.min_specs?.gpu || '',
      rec_cpu: game.rec_specs?.cpu || '',
      rec_ram: game.rec_specs?.ram || '',
      rec_gpu: game.rec_specs?.gpu || '',
    });
    setTabValue(0);
    setEditDialogOpen(true);
  };

  const handleAddSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Prepare add data
      const addData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price.toString()),
        release_date: formData.release_date,
        image: formData.image,
        multiplayer: formData.multiplayer,
        mode: formData.mode || null,
        capacity: formData.capacity ? parseInt(formData.capacity.toString()) : null,
        age_rating: formData.age_rating || null,
        link_download: formData.link_download || null,
        average_rating: parseFloat(formData.average_rating.toString()) || 0,
        downloads: parseInt(formData.downloads.toString()) || 0,
      };

      await axios.post(
        'http://localhost:3001/api/admin/games',
        addData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setSnackbar({
        open: true,
        message: `Đã thêm game "${formData.name}" thành công`,
        severity: 'success'
      });

      setAddDialogOpen(false);
      fetchGames();
    } catch (error: any) {
      console.error('Error adding game:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Lỗi khi thêm game',
        severity: 'error'
      });
    }
  };

  const handleEditSubmit = async () => {
    if (!gameToEdit) return;

    try {
      const token = localStorage.getItem('token');
      
      // Prepare update data
      const updateData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price.toString()),
        release_date: formData.release_date,
        image: formData.image,
        multiplayer: formData.multiplayer,
        mode: formData.mode || null,
        capacity: formData.capacity ? parseInt(formData.capacity.toString()) : null,
        age_rating: formData.age_rating || null,
        link_download: formData.link_download || null,
        average_rating: parseFloat(formData.average_rating.toString()) || 0,
        downloads: parseInt(formData.downloads.toString()) || 0,
      };

      await axios.put(
        `http://localhost:3001/api/admin/games/${gameToEdit.game_id}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setSnackbar({
        open: true,
        message: `Đã cập nhật game "${formData.name}" thành công`,
        severity: 'success'
      });

      setEditDialogOpen(false);
      setGameToEdit(null);
      fetchGames();
    } catch (error: any) {
      console.error('Error updating game:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Lỗi khi cập nhật game',
        severity: 'error'
      });
    }
  };

  const handleDeleteClick = (game: Game) => {
    setGameToDelete(game);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!gameToDelete) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3001/api/admin/games/${gameToDelete.game_id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

        setSnackbar({
          open: true,
        message: `Đã xóa game "${gameToDelete.name}" thành công`,
          severity: 'success'
        });

        fetchGames();
      } catch (error) {
        console.error('Error deleting game:', error);
        setSnackbar({
          open: true,
          message: 'Lỗi khi xóa game',
          severity: 'error'
        });
    } finally {
      setDeleteDialogOpen(false);
      setGameToDelete(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 4,
          p: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: 3,
          color: 'white'
        }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
              Quản lý Games
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9 }}>
              Quản lý thư viện game và thông tin chi tiết
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddGame}
            sx={{ 
              borderRadius: 2,
              bgcolor: 'rgba(255,255,255,0.2)',
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.3)',
              }
            }}
          >
            Thêm Game
          </Button>
        </Box>

        {/* Search and Filters */}
        <Card sx={{ mb: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
          <CardContent>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                fullWidth
                placeholder="Tìm kiếm games theo tên, publisher, hoặc genre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
                sx={{ 
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
              <Button
                variant="outlined"
                startIcon={<SettingsIcon />}
                onClick={() => setShowFilters(!showFilters)}
                sx={{ borderRadius: 2, minWidth: 120 }}
              >
                Bộ lọc
              </Button>
            </Box>
          </CardContent>
        </Card>

        {/* Games Table */}
        <TableContainer component={Paper} sx={{ boxShadow: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.50' }}>
                <TableCell>Game</TableCell>
                <TableCell>Publisher</TableCell>
                <TableCell>Genres</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Release Date</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredGames.length > 0 ? (
                filteredGames.map((game) => (
                <TableRow key={game.game_id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar
                          src={game.image}
                        sx={{ width: 48, height: 48, mr: 2 }}
                      >
                        <GameIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {game.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300 }}>
                            {game.description?.substring(0, 100)}{game.description?.length > 100 ? '...' : ''}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                        {game.publisher_name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {game.genres && game.genres.length > 0 ? (
                          <>
                      {game.genres.slice(0, 2).map((genre, index) => (
                        <Chip
                          key={index}
                          label={genre}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      ))}
                      {game.genres.length > 2 && (
                        <Chip
                          label={`+${game.genres.length - 2}`}
                          size="small"
                          variant="outlined"
                        />
                            )}
                          </>
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Chưa có
                          </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {formatPrice(game.price)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(game.release_date)}
                    </Typography>
                  </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <IconButton
                          onClick={() => handleEditClick(game)}
                          color="primary"
                      size="small"
                          sx={{ 
                            '&:hover': { 
                              backgroundColor: 'primary.lighter' 
                            } 
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                    <IconButton
                          onClick={() => handleDeleteClick(game)}
                          color="error"
                      size="small"
                          sx={{ 
                            '&:hover': { 
                              backgroundColor: 'error.lighter' 
                            } 
                          }}
                    >
                          <DeleteIcon fontSize="small" />
                    </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Box sx={{ textAlign: 'center', py: 8 }}>
                      <GameIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        Không tìm thấy games nào
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Edit Game Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            minHeight: '80vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 0, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <EditIcon />
          <Box>
            <Typography variant="h6">Chỉnh sửa Game</Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {gameToEdit?.name}
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0 }}>
          <Tabs 
            value={tabValue} 
            onChange={(_, newValue) => setTabValue(newValue)}
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider',
              backgroundColor: 'grey.50',
              px: 2
            }}
          >
            <Tab icon={<InfoIcon />} label="Thông tin chính" iconPosition="start" />
            <Tab icon={<SettingsIcon />} label="Cài đặt game" iconPosition="start" />
            <Tab icon={<ComputerIcon />} label="Cấu hình" iconPosition="start" />
          </Tabs>

          {/* Tab 1: Thông tin chính */}
          <TabPanel value={tabValue} index={0}>
            <Stack spacing={3}>
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary" sx={{ mb: 2 }}>
                    📝 Thông tin cơ bản
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                        <TextField
                          fullWidth
                          label="Tên Game *"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          variant="outlined"
                        />
                    </Box>
                    
                    <Box>
                      <TextField
                          fullWidth
                          label="Mô tả"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          multiline
                          rows={4}
                          variant="outlined"
                        />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Box sx={{ flex: '1 1 300px' }}>
                        <TextField
                          fullWidth
                          label="Giá (VNĐ) *"
                          type="number"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                          required
                          InputProps={{
                            startAdornment: <Typography sx={{ mr: 1 }}>₫</Typography>
                          }}
                        />
                      </Box>

                      <Box sx={{ flex: '1 1 300px' }}>
                        <TextField
                          fullWidth
                          label="Ngày phát hành"
                          type="date"
                          value={formData.release_date}
                          onChange={(e) => setFormData({ ...formData, release_date: e.target.value })}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Box>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary" sx={{ mb: 2 }}>
                    🖼️ Media & Downloads
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                        <TextField
                          fullWidth
                          label="URL Hình ảnh"
                          value={formData.image}
                          onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                          placeholder="https://example.com/image.jpg"
                        />
                    </Box>

                    <Box>
                      <TextField
                          fullWidth
                          label="Link Download"
                          value={formData.link_download}
                          onChange={(e) => setFormData({ ...formData, link_download: e.target.value })}
                          placeholder="https://example.com/download"
                        />
                    </Box>

                    {formData.image && (
                      <Box sx={{ 
                        textAlign: 'center', 
                        p: 2, 
                        backgroundColor: 'grey.100',
                        borderRadius: 2
                      }}>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                          Preview:
                        </Typography>
                        <Avatar
                          src={formData.image}
                          sx={{ width: 150, height: 150, mx: 'auto' }}
                          variant="rounded"
                        >
                          <GameIcon sx={{ fontSize: 80 }} />
                        </Avatar>
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </TabPanel>

          {/* Tab 2: Cài đặt game */}
          <TabPanel value={tabValue} index={1}>
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary" sx={{ mb: 2 }}>
                  ⚙️ Thông tin game
                </Typography>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: '1 1 300px' }}>
                        <TextField
                          fullWidth
                          label="Chế độ chơi"
                          value={formData.mode}
                          onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                          placeholder="VD: Single-player, Co-op, Online"
                        />
                    </Box>

                    <Box sx={{ flex: '1 1 300px' }}>
                      <TextField
                          fullWidth
                          label="Độ tuổi"
                          value={formData.age_rating}
                          onChange={(e) => setFormData({ ...formData, age_rating: e.target.value })}
                          placeholder="VD: 18+, 13+, Everyone"
                        />
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: '1 1 250px' }}>
                      <TextField
                          fullWidth
                          label="Số người chơi tối đa"
                          type="number"
                          value={formData.capacity}
                          onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                        />
                    </Box>

                    <Box sx={{ flex: '1 1 250px' }}>
                      <TextField
                          fullWidth
                          label="Đánh giá trung bình"
                          type="number"
                          value={formData.average_rating}
                          onChange={(e) => setFormData({ ...formData, average_rating: parseFloat(e.target.value) || 0 })}
                          inputProps={{ min: 0, max: 5, step: 0.1 }}
                          InputProps={{
                            endAdornment: <Typography sx={{ ml: 1 }}>⭐</Typography>
                          }}
                        />
                    </Box>

                    <Box sx={{ flex: '1 1 250px' }}>
                      <TextField
                          fullWidth
                          label="Lượt tải"
                          type="number"
                          value={formData.downloads}
                          onChange={(e) => setFormData({ ...formData, downloads: parseInt(e.target.value) || 0 })}
                          InputProps={{
                            endAdornment: <Typography sx={{ ml: 1 }}>📥</Typography>
                          }}
                        />
                    </Box>
                  </Box>

                  <Box>
                    <FormControlLabel
                          control={
                            <Checkbox
                              checked={formData.multiplayer}
                              onChange={(e) => setFormData({ ...formData, multiplayer: e.target.checked })}
                              color="primary"
                            />
                          }
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography>Hỗ trợ Multiplayer</Typography>
                              <Chip 
                                label={formData.multiplayer ? 'Có' : 'Không'} 
                                size="small" 
                                color={formData.multiplayer ? 'success' : 'default'}
                              />
                            </Box>
                          }
                        />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </TabPanel>

          {/* Tab 3: Cấu hình */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 400px' }}>
                <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="warning.main" sx={{ mb: 2 }}>
                      ⚠️ Cấu hình tối thiểu
                    </Typography>
                    <Stack spacing={2}>
                      <Autocomplete
                        freeSolo
                        options={CPU_OPTIONS}
                        value={formData.min_cpu}
                        onChange={(_, newValue) => setFormData({ ...formData, min_cpu: newValue || '' })}
                        onInputChange={(_, newInputValue) => setFormData({ ...formData, min_cpu: newInputValue })}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="CPU"
                            placeholder="Chọn hoặc nhập CPU..."
                          />
                        )}
                      />
                      <Autocomplete
                        freeSolo
                        options={RAM_OPTIONS}
                        value={formData.min_ram}
                        onChange={(_, newValue) => setFormData({ ...formData, min_ram: newValue || '' })}
                        onInputChange={(_, newInputValue) => setFormData({ ...formData, min_ram: newInputValue })}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="RAM"
                            placeholder="Chọn hoặc nhập RAM..."
                          />
                        )}
                      />
                      <Autocomplete
                        freeSolo
                        options={GPU_OPTIONS}
                        value={formData.min_gpu}
                        onChange={(_, newValue) => setFormData({ ...formData, min_gpu: newValue || '' })}
                        onInputChange={(_, newInputValue) => setFormData({ ...formData, min_gpu: newInputValue })}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="GPU"
                            placeholder="Chọn hoặc nhập GPU..."
                          />
                        )}
                      />
                    </Stack>
                  </CardContent>
                </Card>
              </Box>

              <Box sx={{ flex: '1 1 400px' }}>
                <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="success.main" sx={{ mb: 2 }}>
                      ✅ Cấu hình đề xuất
                    </Typography>
                    <Stack spacing={2}>
                      <Autocomplete
                        freeSolo
                        options={CPU_OPTIONS}
                        value={formData.rec_cpu}
                        onChange={(_, newValue) => setFormData({ ...formData, rec_cpu: newValue || '' })}
                        onInputChange={(_, newInputValue) => setFormData({ ...formData, rec_cpu: newInputValue })}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="CPU"
                            placeholder="Chọn hoặc nhập CPU..."
                          />
                        )}
                      />
                      <Autocomplete
                        freeSolo
                        options={RAM_OPTIONS}
                        value={formData.rec_ram}
                        onChange={(_, newValue) => setFormData({ ...formData, rec_ram: newValue || '' })}
                        onInputChange={(_, newInputValue) => setFormData({ ...formData, rec_ram: newInputValue })}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="RAM"
                            placeholder="Chọn hoặc nhập RAM..."
                          />
                        )}
                      />
                      <Autocomplete
                        freeSolo
                        options={GPU_OPTIONS}
                        value={formData.rec_gpu}
                        onChange={(_, newValue) => setFormData({ ...formData, rec_gpu: newValue || '' })}
                        onInputChange={(_, newInputValue) => setFormData({ ...formData, rec_gpu: newInputValue })}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="GPU"
                            placeholder="Chọn hoặc nhập GPU..."
                          />
                        )}
                      />
                    </Stack>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          </TabPanel>
        </DialogContent>
        
        <Divider />
        
        <DialogActions sx={{ px: 3, py: 2, backgroundColor: 'grey.50' }}>
          <Button onClick={() => setEditDialogOpen(false)} variant="outlined">
            Hủy
          </Button>
          <Button 
            onClick={handleEditSubmit} 
            variant="contained" 
            color="primary"
            disabled={!formData.name || formData.price < 0}
            startIcon={<EditIcon />}
          >
            Lưu thay đổi
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Game Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            minHeight: '80vh'
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 0, 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <AddIcon />
          <Box>
            <Typography variant="h6">Thêm Game Mới</Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Điền thông tin game bên dưới
            </Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0 }}>
          <Tabs 
            value={tabValue} 
            onChange={(_, newValue) => setTabValue(newValue)}
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider',
              backgroundColor: 'grey.50',
              px: 2
            }}
          >
            <Tab icon={<InfoIcon />} label="Thông tin chính" iconPosition="start" />
            <Tab icon={<SettingsIcon />} label="Cài đặt game" iconPosition="start" />
            <Tab icon={<ComputerIcon />} label="Cấu hình" iconPosition="start" />
          </Tabs>

          {/* Tab 1: Thông tin chính */}
          <TabPanel value={tabValue} index={0}>
            <Stack spacing={3}>
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary" sx={{ mb: 2 }}>
                    📝 Thông tin cơ bản
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                        <TextField
                          fullWidth
                          label="Tên Game *"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          variant="outlined"
                        />
                    </Box>
                    
                    <Box>
                      <TextField
                          fullWidth
                          label="Mô tả"
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          multiline
                          rows={4}
                          variant="outlined"
                        />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      <Box sx={{ flex: '1 1 300px' }}>
                        <TextField
                          fullWidth
                          label="Giá (VNĐ) *"
                          type="number"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                          required
                          InputProps={{
                            startAdornment: <Typography sx={{ mr: 1 }}>₫</Typography>
                          }}
                        />
                      </Box>

                      <Box sx={{ flex: '1 1 300px' }}>
                        <TextField
                          fullWidth
                          label="Ngày phát hành"
                          type="date"
                          value={formData.release_date}
                          onChange={(e) => setFormData({ ...formData, release_date: e.target.value })}
                          InputLabelProps={{ shrink: true }}
                        />
                      </Box>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom color="primary" sx={{ mb: 2 }}>
                    🖼️ Media & Downloads
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                        <TextField
                          fullWidth
                          label="URL Hình ảnh"
                          value={formData.image}
                          onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                          placeholder="https://example.com/image.jpg"
                        />
                    </Box>

                    <Box>
                      <TextField
                          fullWidth
                          label="Link Download"
                          value={formData.link_download}
                          onChange={(e) => setFormData({ ...formData, link_download: e.target.value })}
                          placeholder="https://example.com/download"
                        />
                    </Box>

                    {formData.image && (
                      <Box sx={{ 
                        textAlign: 'center', 
                        p: 2, 
                        backgroundColor: 'grey.100',
                        borderRadius: 2
                      }}>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                          Preview:
                        </Typography>
                        <Avatar
                          src={formData.image}
                          sx={{ width: 150, height: 150, mx: 'auto' }}
                          variant="rounded"
                        >
                          <GameIcon sx={{ fontSize: 80 }} />
                        </Avatar>
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </TabPanel>

          {/* Tab 2: Cài đặt game */}
          <TabPanel value={tabValue} index={1}>
            <Card variant="outlined" sx={{ borderRadius: 2 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary" sx={{ mb: 2 }}>
                  ⚙️ Thông tin game
                </Typography>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: '1 1 300px' }}>
                        <TextField
                          fullWidth
                          label="Chế độ chơi"
                          value={formData.mode}
                          onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                          placeholder="VD: Single-player, Co-op, Online"
                        />
                    </Box>

                    <Box sx={{ flex: '1 1 300px' }}>
                      <TextField
                          fullWidth
                          label="Độ tuổi"
                          value={formData.age_rating}
                          onChange={(e) => setFormData({ ...formData, age_rating: e.target.value })}
                          placeholder="VD: 18+, 13+, Everyone"
                        />
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Box sx={{ flex: '1 1 250px' }}>
                      <TextField
                          fullWidth
                          label="Số người chơi tối đa"
                          type="number"
                          value={formData.capacity}
                          onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                        />
                    </Box>

                    <Box sx={{ flex: '1 1 250px' }}>
                      <TextField
                          fullWidth
                          label="Đánh giá trung bình"
                          type="number"
                          value={formData.average_rating}
                          onChange={(e) => setFormData({ ...formData, average_rating: parseFloat(e.target.value) || 0 })}
                          inputProps={{ min: 0, max: 5, step: 0.1 }}
                          InputProps={{
                            endAdornment: <Typography sx={{ ml: 1 }}>⭐</Typography>
                          }}
                        />
                    </Box>

                    <Box sx={{ flex: '1 1 250px' }}>
                      <TextField
                          fullWidth
                          label="Lượt tải"
                          type="number"
                          value={formData.downloads}
                          onChange={(e) => setFormData({ ...formData, downloads: parseInt(e.target.value) || 0 })}
                          InputProps={{
                            endAdornment: <Typography sx={{ ml: 1 }}>📥</Typography>
                          }}
                        />
                    </Box>
                  </Box>

                  <Box>
                    <FormControlLabel
                          control={
                            <Checkbox
                              checked={formData.multiplayer}
                              onChange={(e) => setFormData({ ...formData, multiplayer: e.target.checked })}
                              color="primary"
                            />
                          }
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography>Hỗ trợ Multiplayer</Typography>
                              <Chip 
                                label={formData.multiplayer ? 'Có' : 'Không'} 
                                size="small" 
                                color={formData.multiplayer ? 'success' : 'default'}
                              />
                            </Box>
                          }
                        />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </TabPanel>

          {/* Tab 3: Cấu hình */}
          <TabPanel value={tabValue} index={2}>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
              <Box sx={{ flex: '1 1 400px' }}>
                <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="warning.main" sx={{ mb: 2 }}>
                      ⚠️ Cấu hình tối thiểu
                    </Typography>
                    <Stack spacing={2}>
                      <Autocomplete
                        freeSolo
                        options={CPU_OPTIONS}
                        value={formData.min_cpu}
                        onChange={(_, newValue) => setFormData({ ...formData, min_cpu: newValue || '' })}
                        onInputChange={(_, newInputValue) => setFormData({ ...formData, min_cpu: newInputValue })}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="CPU"
                            placeholder="Chọn hoặc nhập CPU..."
                          />
                        )}
                      />
                      <Autocomplete
                        freeSolo
                        options={RAM_OPTIONS}
                        value={formData.min_ram}
                        onChange={(_, newValue) => setFormData({ ...formData, min_ram: newValue || '' })}
                        onInputChange={(_, newInputValue) => setFormData({ ...formData, min_ram: newInputValue })}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="RAM"
                            placeholder="Chọn hoặc nhập RAM..."
                          />
                        )}
                      />
                      <Autocomplete
                        freeSolo
                        options={GPU_OPTIONS}
                        value={formData.min_gpu}
                        onChange={(_, newValue) => setFormData({ ...formData, min_gpu: newValue || '' })}
                        onInputChange={(_, newInputValue) => setFormData({ ...formData, min_gpu: newInputValue })}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="GPU"
                            placeholder="Chọn hoặc nhập GPU..."
                          />
                        )}
                      />
                    </Stack>
                  </CardContent>
                </Card>
              </Box>

              <Box sx={{ flex: '1 1 400px' }}>
                <Card variant="outlined" sx={{ borderRadius: 2, height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="success.main" sx={{ mb: 2 }}>
                      ✅ Cấu hình đề xuất
                    </Typography>
                    <Stack spacing={2}>
                      <Autocomplete
                        freeSolo
                        options={CPU_OPTIONS}
                        value={formData.rec_cpu}
                        onChange={(_, newValue) => setFormData({ ...formData, rec_cpu: newValue || '' })}
                        onInputChange={(_, newInputValue) => setFormData({ ...formData, rec_cpu: newInputValue })}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="CPU"
                            placeholder="Chọn hoặc nhập CPU..."
                          />
                        )}
                      />
                      <Autocomplete
                        freeSolo
                        options={RAM_OPTIONS}
                        value={formData.rec_ram}
                        onChange={(_, newValue) => setFormData({ ...formData, rec_ram: newValue || '' })}
                        onInputChange={(_, newInputValue) => setFormData({ ...formData, rec_ram: newInputValue })}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="RAM"
                            placeholder="Chọn hoặc nhập RAM..."
                          />
                        )}
                      />
                      <Autocomplete
                        freeSolo
                        options={GPU_OPTIONS}
                        value={formData.rec_gpu}
                        onChange={(_, newValue) => setFormData({ ...formData, rec_gpu: newValue || '' })}
                        onInputChange={(_, newInputValue) => setFormData({ ...formData, rec_gpu: newInputValue })}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="GPU"
                            placeholder="Chọn hoặc nhập GPU..."
                          />
                        )}
                      />
                    </Stack>
                  </CardContent>
                </Card>
              </Box>
            </Box>
          </TabPanel>
        </DialogContent>
        
        <Divider />
        
        <DialogActions sx={{ px: 3, py: 2, backgroundColor: 'grey.50' }}>
          <Button onClick={() => setAddDialogOpen(false)} variant="outlined">
            Hủy
          </Button>
          <Button 
            onClick={handleAddSubmit} 
            variant="contained" 
            color="primary"
            disabled={!formData.name || formData.price < 0}
            startIcon={<AddIcon />}
          >
            Thêm Game
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Xác nhận xóa game</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn xóa game <strong>"{gameToDelete?.name}"</strong>?
            <br />
            Hành động này không thể hoàn tác.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>
            Hủy
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Xóa
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

export default AdminGamesPage;
