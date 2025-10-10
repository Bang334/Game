import { useState, useEffect } from 'react';
import axios from 'axios';
import { useSnackbar } from 'notistack';
import {
  Box,
  Typography,
  Container,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardMedia,
  TextField,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Avatar,
  MenuItem,
} from '@mui/material';
import {
  Person as PersonIcon,
  FavoriteOutlined as WishlistIcon,
  ShoppingBag as PurchasesIcon,
  Visibility as ViewedIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Star as StarIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Email as EmailIcon,
  Cake as CakeIcon,
  Wc as GenderIcon,
  AccountBalance as DepositIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import RatingModal from '../../components/RatingModal';

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
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

interface UserProfile {
  user_id: number;
  username: string;
  email: string;
  age?: number;
  gender?: string;
  balance?: number;
  role: string;
}

interface WishlistItem {
  wishlist_id: number;
  game_id: number;
  name: string;
  price: number;
  image?: string;
  description?: string;
  average_rating?: number;
  genres: string[];
  publisher_name?: string;
  added_date: string;
}

interface PurchaseItem {
  purchase_id: number;
  game_id: number;
  name: string;
  price: number;
  image?: string;
  description?: string;
  average_rating?: number;
  genres?: string[];
  purchase_date: string;
  link_download?: string;
  user_rating?: number;
}

interface ViewedGame {
  game_id: number;
  name: string;
  price: number;
  image?: string;
  description?: string;
  average_rating?: number;
  genres?: string[];
  publisher_name?: string;
  viewed_at?: string;
}

const ProfilePage = () => {
  const [tabValue, setTabValue] = useState(0);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfile>>({});
  
  // Wishlist
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [purchasedGames, setPurchasedGames] = useState<number[]>([]);
  
  // Purchases
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<{id: number, name: string} | null>(null);
  
  // Viewed
  const [viewedGames, setViewedGames] = useState<ViewedGame[]>([]);
  
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (currentUser) {
      fetchProfile();
      fetchWishlist();
      fetchPurchases();
      fetchViewedGames();
      fetchPurchasedGames();
    }
  }, [currentUser]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/api/customer/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(response.data.user);
      setEditedProfile(response.data.user);
    } catch (error) {
      console.error('Error fetching profile:', error);
      enqueueSnackbar('Không thể tải thông tin cá nhân', { variant: 'error' });
    }
  };

  const fetchWishlist = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/customer/wishlist');
      setWishlistItems(response.data.wishlist || []);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    }
  };

  const fetchPurchases = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/customer/purchases');
      setPurchases(response.data.purchases || []);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchViewedGames = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/customer/viewed-games');
      setViewedGames(response.data.games || []);
    } catch (error) {
      console.error('Error fetching viewed games:', error);
    }
  };

  const fetchPurchasedGames = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/customer/purchases');
      const gameIds = (response.data.purchases || []).map((p: PurchaseItem) => p.game_id);
      setPurchasedGames(gameIds);
    } catch (error) {
      console.error('Error fetching purchased games:', error);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEditProfile = () => {
    setEditMode(true);
    setEditedProfile(profile || {});
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditedProfile(profile || {});
  };

  const handleSaveProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        'http://localhost:3001/api/customer/profile',
        {
          age: editedProfile.age,
          gender: editedProfile.gender,
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      setProfile(response.data.user);
      setEditMode(false);
      enqueueSnackbar('Cập nhật thông tin thành công', { variant: 'success' });
    } catch (error) {
      console.error('Error updating profile:', error);
      enqueueSnackbar('Không thể cập nhật thông tin', { variant: 'error' });
    }
  };

  const handleRemoveFromWishlist = async (gameId: number) => {
    try {
      await axios.delete(`http://localhost:3001/api/customer/wishlist/${gameId}`);
      setWishlistItems(prev => prev.filter(item => item.game_id !== gameId));
      enqueueSnackbar('Đã xóa khỏi wishlist', { variant: 'info' });
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      enqueueSnackbar('Không thể xóa khỏi wishlist', { variant: 'error' });
    }
  };

  const handlePurchaseFromWishlist = async (gameId: number) => {
    navigate(`/games/${gameId}`);
  };

  const handleRating = (gameId: number, gameName: string) => {
    setSelectedGame({ id: gameId, name: gameName });
    setRatingModalOpen(true);
  };

  const handleRatingSubmitted = () => {
    fetchPurchases();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!currentUser) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">
          Vui lòng đăng nhập để xem trang cá nhân
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header with Avatar */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar 
              sx={{ 
                width: 100, 
                height: 100, 
                bgcolor: 'primary.main',
                fontSize: '2.5rem'
              }}
            >
              {profile?.username?.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
                {profile?.username}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip 
                  icon={<EmailIcon />} 
                  label={profile?.email} 
                  variant="outlined" 
                />
                {profile?.age && (
                  <Chip 
                    icon={<CakeIcon />} 
                    label={`${profile.age} tuổi`} 
                    variant="outlined" 
                  />
                )}
                {profile?.gender && (
                  <Chip 
                    icon={<GenderIcon />} 
                    label={profile.gender === 'male' ? 'Nam' : profile.gender === 'female' ? 'Nữ' : 'Khác'} 
                    variant="outlined" 
                  />
                )}
                {profile?.balance !== undefined && (
                  <Chip 
                    label={`Số dư: ${formatPrice(profile.balance)}`}
                    color="success"
                    variant="filled"
                  />
                )}
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                minHeight: 64,
                fontSize: '1rem',
                fontWeight: 600,
              }
            }}
          >
            <Tab icon={<PersonIcon />} label="Thông tin" iconPosition="start" />
            <Tab icon={<WishlistIcon />} label="Wishlist" iconPosition="start" />
            <Tab icon={<PurchasesIcon />} label="Đã mua" iconPosition="start" />
            <Tab icon={<ViewedIcon />} label="Đã xem" iconPosition="start" />
          </Tabs>
        </Box>

        {/* Tab 0: Profile Info */}
        <TabPanel value={tabValue} index={0}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 600 }}>
                Thông tin cá nhân
              </Typography>
              {!editMode ? (
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  onClick={handleEditProfile}
                >
                  Chỉnh sửa
                </Button>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={handleCancelEdit}
                  >
                    Hủy
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveProfile}
                  >
                    Lưu
                  </Button>
                </Box>
              )}
            </Box>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
              <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
                <TextField
                  fullWidth
                  label="Tên đăng nhập"
                  value={profile?.username || ''}
                  disabled
                  variant="outlined"
                />
              </Box>
              <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
                <TextField
                  fullWidth
                  label="Email"
                  value={profile?.email || ''}
                  disabled
                  variant="outlined"
                />
              </Box>
              <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
                <TextField
                  fullWidth
                  label="Tuổi"
                  type="number"
                  value={editedProfile?.age || ''}
                  onChange={(e) => setEditedProfile(prev => ({ ...prev, age: parseInt(e.target.value) || undefined }))}
                  disabled={!editMode}
                  variant="outlined"
                  inputProps={{ min: 1, max: 120 }}
                />
              </Box>
              <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
                <TextField
                  fullWidth
                  label="Giới tính"
                  select
                  value={editedProfile?.gender || ''}
                  onChange={(e) => setEditedProfile(prev => ({ ...prev, gender: e.target.value }))}
                  disabled={!editMode}
                  variant="outlined"
                >
                  <MenuItem value="">Không chọn</MenuItem>
                  <MenuItem value="male">Nam</MenuItem>
                  <MenuItem value="female">Nữ</MenuItem>
                  <MenuItem value="other">Khác</MenuItem>
                </TextField>
              </Box>
              <Box sx={{ width: '100%' }}>
                <Alert severity="info">
                  Thông tin như tên đăng nhập và email không thể thay đổi. Chỉ có thể cập nhật tuổi và giới tính.
                </Alert>
              </Box>
            </Box>
          </CardContent>
        </TabPanel>

        {/* Tab 1: Wishlist */}
        <TabPanel value={tabValue} index={1}>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              Wishlist của tôi ({wishlistItems.length})
            </Typography>

            {wishlistItems.length === 0 ? (
              <Alert severity="info">
                Wishlist của bạn đang trống. Hãy thêm các game yêu thích!
              </Alert>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {wishlistItems.map((item) => (
                  <Box key={item.wishlist_id} sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.333% - 16px)' } }}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardMedia
                        component="img"
                        height="200"
                        image={item.image || 'https://via.placeholder.com/300x200'}
                        alt={item.name}
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/games/${item.game_id}`)}
                      />
                      <CardContent sx={{ flex: 1 }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                          {item.name}
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                          {item.genres?.slice(0, 2).map((genre, idx) => (
                            <Chip 
                              key={idx} 
                              label={genre} 
                              size="small" 
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))}
                        </Box>
                        <Typography variant="h6" color="primary" sx={{ fontWeight: 700, mb: 1 }}>
                          {formatPrice(item.price)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Đã thêm: {formatDate(item.added_date)}
                        </Typography>
                      </CardContent>
                      <Box sx={{ p: 2, pt: 0 }}>
                        <Button
                          fullWidth
                          variant="contained"
                          onClick={() => handlePurchaseFromWishlist(item.game_id)}
                          disabled={purchasedGames.includes(item.game_id)}
                          sx={{ mb: 1 }}
                        >
                          {purchasedGames.includes(item.game_id) ? 'Đã mua' : 'Mua ngay'}
                        </Button>
                        <Button
                          fullWidth
                          variant="outlined"
                          color="error"
                          startIcon={<DeleteIcon />}
                          onClick={() => handleRemoveFromWishlist(item.game_id)}
                        >
                          Xóa
                        </Button>
                      </Box>
                    </Card>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </TabPanel>

        {/* Tab 2: Purchases */}
        <TabPanel value={tabValue} index={2}>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              Game đã mua ({purchases.length})
            </Typography>

            {purchases.length === 0 ? (
              <Alert severity="info">
                Bạn chưa mua game nào. Khám phá thư viện game ngay!
              </Alert>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {purchases.map((item) => (
                  <Box key={item.purchase_id}>
                    <Card>
                      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' } }}>
                        <CardMedia
                          component="img"
                          sx={{ width: { xs: '100%', sm: 200 }, height: 200, objectFit: 'cover' }}
                          image={item.image || 'https://via.placeholder.com/200'}
                          alt={item.name}
                        />
                        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                          <CardContent sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                              {item.name}
                            </Typography>
                            <Box sx={{ mb: 2 }}>
                              {item.genres?.slice(0, 3).map((genre, idx) => (
                                <Chip key={idx} label={genre} size="small" sx={{ mr: 0.5 }} />
                              ))}
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {item.description?.substring(0, 150)}...
                            </Typography>
                            <Divider sx={{ my: 1 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="body2" color="text.secondary">
                                Đã mua: {formatDate(item.purchase_date)}
                              </Typography>
                              <Typography variant="h6" color="primary">
                                {formatPrice(item.price)}
                              </Typography>
                            </Box>
                          </CardContent>
                          <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
                            <Button
                              variant="contained"
                              startIcon={<DownloadIcon />}
                              {...(item.link_download && {
                                component: 'a',
                                href: item.link_download,
                                target: '_blank'
                              })}
                              disabled={!item.link_download}
                            >
                              Tải xuống
                            </Button>
                            <Button
                              variant="outlined"
                              startIcon={<StarIcon />}
                              onClick={() => handleRating(item.game_id, item.name)}
                            >
                              {item.user_rating ? 'Cập nhật đánh giá' : 'Đánh giá'}
                            </Button>
                          </Box>
                        </Box>
                      </Box>
                    </Card>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </TabPanel>

        {/* Tab 3: Viewed Games */}
        <TabPanel value={tabValue} index={3}>
          <CardContent>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              Game đã xem ({viewedGames.length})
            </Typography>

            {viewedGames.length === 0 ? (
              <Alert severity="info">
                Chưa có lịch sử xem game nào.
              </Alert>
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {viewedGames.map((game) => (
                  <Box key={game.game_id} sx={{ width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.333% - 16px)' } }}>
                    <Card 
                      sx={{ 
                        height: '100%', 
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                        '&:hover': { transform: 'translateY(-4px)' }
                      }}
                      onClick={() => navigate(`/games/${game.game_id}`)}
                    >
                      <CardMedia
                        component="img"
                        height="200"
                        image={game.image || 'https://via.placeholder.com/300x200'}
                        alt={game.name}
                      />
                      <CardContent>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                          {game.name}
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                          {game.genres?.slice(0, 2).map((genre, idx) => (
                            <Chip key={idx} label={genre} size="small" sx={{ mr: 0.5 }} />
                          ))}
                        </Box>
                        <Typography variant="h6" color="primary" sx={{ fontWeight: 700, mb: 1 }}>
                          {formatPrice(game.price)}
                        </Typography>
                        {game.viewed_at && (
                          <Typography variant="caption" color="text.secondary">
                            Đã xem: {formatDate(game.viewed_at)}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </TabPanel>
      </Card>

      {/* Rating Modal */}
      {selectedGame && (
        <RatingModal
          open={ratingModalOpen}
          onClose={() => setRatingModalOpen(false)}
          gameId={selectedGame.id}
          gameName={selectedGame.name}
          onRatingSubmitted={handleRatingSubmitted}
        />
      )}
    </Container>
  );
};

export default ProfilePage;

