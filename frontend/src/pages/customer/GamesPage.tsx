import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Container,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface Game {
  game_id: number;
  name: string;
  price: number;
  image?: string;
  description?: string;
  average_rating?: number;
  genres?: string[];
  platforms?: string[];
  publisher_name?: string;
  score?: number; // AI recommendation score
}

const GamesPage = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [allRecommendations, setAllRecommendations] = useState<Game[]>([]); // Store all recommendations
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [aiSearchQuery, setAiSearchQuery] = useState(''); // AI search query for recommendations
  const [cachedQuery, setCachedQuery] = useState(''); // Track the query used for current cache
  const [filterOpen, setFilterOpen] = useState(false);
  const [genres, setGenres] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<number[]>([0, 2000000]);
  const [ratingRange, setRatingRange] = useState<number[]>([0, 5]);
  const [sortBy, setSortBy] = useState('name');
  const [purchasedGames, setPurchasedGames] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalGames, setTotalGames] = useState(0);
  const ITEMS_PER_PAGE = 20; // Items per page for both guest and recommendations
  const navigate = useNavigate();
  const { currentUser, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Don't fetch anything while auth is still loading
    if (authLoading) {
      console.log('⏳ Auth still loading, waiting...');
      return;
    }
    
    console.log('🔄 Main Effect - currentUser:', currentUser ? 'LOGGED IN' : 'GUEST');
    
    // Clear ALL states immediately when user login status changes
    setGames([]);
    setAllRecommendations([]); // Clear all recommendations
    setLoading(true);
    setPage(1); // Reset to page 1
    setTotalPages(1);
    setTotalGames(0);
    
    if (currentUser) {
      // For logged-in users: fetch AI recommendations (no pagination)
      console.log('✅ Fetching AI recommendations...');
      fetchRecommendedGames();
      fetchPurchasedGames();
      fetchGenres();
      fetchPlatforms();
    } else {
      // For guests: fetch regular games with pagination
      console.log('📋 Fetching regular games...');
      fetchGames();
      fetchGenres();
      fetchPlatforms();
    }
  }, [currentUser, authLoading]); // Depend on both currentUser and authLoading

  // Effect for pagination changes
  useEffect(() => {
    if (currentUser) {
      // For logged-in users: paginate from allRecommendations (client-side)
      if (allRecommendations.length > 0) {
        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        setGames(allRecommendations.slice(startIndex, endIndex));
        console.log(`📄 Recommendations - Page ${page}: Showing items ${startIndex + 1}-${Math.min(endIndex, allRecommendations.length)} of ${allRecommendations.length}`);
      }
    } else if (page > 1) {
      // For guests: fetch from server (server-side pagination)
      setLoading(true);
      fetchGames();
    }
  }, [page]);

  // Handle URL parameters for filtering
  useEffect(() => {
    const genreParam = searchParams.get('genre');
    const publisherParam = searchParams.get('publisher');
    const platformParam = searchParams.get('platform');
    
    if (genreParam) {
      setSelectedGenres([genreParam]);
    }
    
    if (publisherParam) {
      setSearchTerm(publisherParam);
    }
    
    if (platformParam) {
      setSelectedPlatforms([platformParam]);
    }
  }, [searchParams]);

  const fetchGames = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/customer/games', {
        params: {
          page,
          limit: 20
        }
      });
      setGames(response.data.games || []);
      if (response.data.pagination) {
        setTotalPages(response.data.pagination.totalPages);
        setTotalGames(response.data.pagination.totalGames);
      }
    } catch (error) {
      console.error('Error fetching games:', error);
      setGames([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchGenres = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/customer/filters/genres');
      setGenres(response.data.genres.map((g: any) => g.name));
    } catch (error) {
      console.error('Error fetching genres:', error);
    }
  };

  const fetchPlatforms = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/customer/filters/platforms');
      setPlatforms(response.data.platforms.map((p: any) => p.name));
    } catch (error) {
      console.error('Error fetching platforms:', error);
    }
  };

  // 💾 Cache utility functions
  const getCacheKey = (userId: number, query: string = '') => {
    return `ai_reco_${userId}_${query.trim().toLowerCase()}`;
  };

  const loadFromCache = (userId: number, query: string = '') => {
    try {
      const cacheKey = getCacheKey(userId, query);
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const data = JSON.parse(cached);
        const cacheTime = data.timestamp || 0;
        const now = Date.now();
        // Cache valid for 1 hour (3600000 ms) - adjust as needed
        const CACHE_DURATION = 3600000; 
        if (now - cacheTime < CACHE_DURATION) {
          console.log(`💾 Loading from cache: ${cacheKey}`);
          return data.recommendations;
        } else {
          console.log(`🗑️  Cache expired: ${cacheKey}`);
          localStorage.removeItem(cacheKey);
        }
      }
    } catch (error) {
      console.error('Error loading from cache:', error);
    }
    return null;
  };

  const saveToCache = (userId: number, query: string = '', recommendations: Game[]) => {
    try {
      const cacheKey = getCacheKey(userId, query);
      const data = {
        recommendations,
        timestamp: Date.now(),
        query: query.trim()
      };
      localStorage.setItem(cacheKey, JSON.stringify(data));
      console.log(`💾 Saved to cache: ${cacheKey} (${recommendations.length} games)`);
    } catch (error) {
      console.error('Error saving to cache:', error);
    }
  };

  const clearUserCache = (userId: number) => {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`ai_reco_${userId}_`)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log(`🗑️  Cleared cache for user ${userId} (${keysToRemove.length} entries)`);
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };

  const fetchRecommendedGames = async (query?: string, forceRefresh: boolean = false) => {
    if (!currentUser) return;
    
    const searchQuery = query || '';
    
    // 💾 Check cache first (unless forceRefresh is true)
    if (!forceRefresh) {
      const cached = loadFromCache(currentUser.user_id, searchQuery);
      if (cached && cached.length > 0) {
        const allGames = cached;
        setAllRecommendations(allGames);
        setTotalGames(allGames.length);
        
        const totalPagesCount = Math.ceil(allGames.length / ITEMS_PER_PAGE);
        setTotalPages(totalPagesCount);
        
        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        setGames(allGames.slice(startIndex, endIndex));
        
        setCachedQuery(searchQuery);
        setLoading(false);
        
        console.log(`✅ Loaded ${allGames.length} recommendations from cache`);
        return;
      }
    }
    
    try {
      console.log('\n=== FRONTEND RECOMMENDATION REQUEST ===');
      console.log('User:', currentUser);
      console.log('User ID:', currentUser.user_id);
      console.log('Search Query:', searchQuery || '(none)');
      console.log('Force Refresh:', forceRefresh);
      console.log('Request URL: http://localhost:3001/api/reco/games');
      
      const params: any = {
        user_id: currentUser.user_id
      };
      
      if (searchQuery && searchQuery.trim()) {
        params.query = searchQuery.trim();
      }
      
      const response = await axios.get('http://localhost:3001/api/reco/games', {
        params
      });
      
      console.log('\n--- API RESPONSE RECEIVED ---');
      console.log('Response status:', response.status);
      console.log('Response data:', response.data);
      console.log('Games count:', response.data.games?.length || 0);
      console.log('Success:', response.data.success);
      console.log('Message:', response.data.message);
      
      if (response.data.games && response.data.games.length > 0) {
        console.log('\n--- FIRST 3 RECOMMENDED GAMES ---');
        response.data.games.slice(0, 3).forEach((game: any, index: number) => {
          const score = game.score;
          const scoreText = typeof score === 'number' ? score.toFixed(3) : 'N/A';
          console.log(`${index + 1}. ${game.name} (ID: ${game.id}) - Score: ${scoreText}`);
        });
      }
      
      const allGames = response.data.games || [];
      
      // 💾 Save to cache
      saveToCache(currentUser.user_id, searchQuery, allGames);
      setCachedQuery(searchQuery);
      
      setAllRecommendations(allGames); // Store all recommendations
      setTotalGames(allGames.length);
      
      // Calculate pagination for recommendations
      const totalPagesCount = Math.ceil(allGames.length / ITEMS_PER_PAGE);
      setTotalPages(totalPagesCount);
      
      // Slice games for current page
      const startIndex = (page - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      setGames(allGames.slice(startIndex, endIndex));
      
      console.log(`\n✅ Total recommendations: ${allGames.length}, Pages: ${totalPagesCount}, Current page: ${page}`);
      console.log('\n=== FRONTEND RECOMMENDATION COMPLETED ===\n');
      
    } catch (error) {
      console.error('\n--- FRONTEND API ERROR ---');
      console.error('Error fetching recommendations:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Fallback to regular games if recommendation fails
      console.log('Falling back to regular games...');
      fetchGames();
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchasedGames = async () => {
    if (!currentUser) return;
    
    try {
      const response = await axios.get('http://localhost:3001/api/customer/purchases');
      const purchases = response.data.purchases || [];
      const gameIds = purchases.map((purchase: any) => purchase.game_id);
      setPurchasedGames(gameIds);
    } catch (error) {
      console.error('Error fetching purchased games:', error);
    }
  };

  // Handle AI search for recommendations
  const handleAiSearch = async () => {
    if (!currentUser) return;
    
    console.log('🔍 AI Search triggered with query:', aiSearchQuery);
    setLoading(true);
    setPage(1); // Reset to page 1
    // Force refresh when user explicitly searches (forceRefresh = true)
    await fetchRecommendedGames(aiSearchQuery, true);
    setLoading(false);
  };

  const filteredGames = games.filter(game => {
    // Search filter (includes name and publisher)
    const matchesSearch = game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (game.publisher_name && game.publisher_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Genre filter
    const matchesGenre = selectedGenres.length === 0 || 
      (game.genres && game.genres.some(genre => selectedGenres.includes(genre)));
    
    // Platform filter
    const matchesPlatform = selectedPlatforms.length === 0 || 
      (game.platforms && game.platforms.some(platform => selectedPlatforms.includes(platform)));
    
    // Price filter
    const matchesPrice = game.price >= priceRange[0] && game.price <= priceRange[1];
    
    // Rating filter
    const matchesRating = !game.average_rating || 
      (game.average_rating >= ratingRange[0] && game.average_rating <= ratingRange[1]);
    
    return matchesSearch && matchesGenre && matchesPlatform && matchesPrice && matchesRating;
  }).sort((a, b) => {
    // If user is logged in and games have scores, sort by AI score (keep original order)
    if (currentUser && a.score !== undefined && b.score !== undefined) {
      return (b.score || 0) - (a.score || 0); // Sort by score DESC (highest first)
    }
    
    // Otherwise, sort by selected criteria
    switch (sortBy) {
      case 'price_asc':
        return a.price - b.price;
      case 'price_desc':
        return b.price - a.price;
      case 'rating':
        return (b.average_rating || 0) - (a.average_rating || 0);
      case 'name':
      default:
        return a.name.localeCompare(b.name);
    }
  });

  const handleGameClick = async (gameId: number) => {
    // Navigate to game detail first
    navigate(`/games/${gameId}`);
    
    // Track view if user is logged in (async, don't wait)
    if (currentUser) {
      trackView(gameId);
    }
  };

  const trackView = async (gameId: number) => {
    if (!currentUser) return;
    
    try {
      await axios.post(`http://localhost:3001/api/customer/games/${gameId}/view`);
    } catch (error) {
      console.error('Error tracking view:', error);
      // Don't prevent navigation if view tracking fails
    }
  };

  const handleFilterOpen = () => {
    setFilterOpen(true);
  };

  const handleFilterClose = () => {
    setFilterOpen(false);
  };

  const handleClearFilters = () => {
    setSelectedGenres([]);
    setSelectedPlatforms([]);
    setPriceRange([0, 2000000]);
    setRatingRange([0, 5]);
    setSortBy('name');
    setSearchTerm('');
    setPage(1); // Reset to page 1
  };

  const handleGenreChange = (genre: string) => {
    setSelectedGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
    setPage(1); // Reset to page 1 when filter changes
  };

  const handlePlatformChange = (platform: string) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform) 
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
    setPage(1); // Reset to page 1 when filter changes
  };

  // Show loading when: auth loading OR data loading OR (user logged in but no games yet)
  if (authLoading || loading || (currentUser && games.length === 0)) {
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
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 800 }}>
              {currentUser ? 'Gợi ý dành cho bạn' : 'Tất cả Games'}
          </Typography>
            {currentUser && (
              <Chip 
                label="AI Recommended" 
                color="primary" 
                size="small"
                sx={{ fontWeight: 600 }}
              />
            )}
          </Box>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {currentUser 
              ? aiSearchQuery 
                ? `Tìm kiếm "${aiSearchQuery}" trong ${totalGames} games được gợi ý (Trang ${page}/${totalPages})`
                : `Những game phù hợp nhất dựa trên sở thích và lịch sử của bạn (${totalGames} games được gợi ý - Trang ${page}/${totalPages})`
              : 'Khám phá thư viện game đa dạng với hàng nghìn tựa game chất lượng cao'
            }
          </Typography>

          {/* Search and Filters */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            {currentUser ? (
              // AI Search for logged-in users
              <>
                <TextField
                  fullWidth
                  placeholder="Tìm kiếm game theo từ khóa (VD: puzzle, action, rpg)..."
                  value={aiSearchQuery}
                  onChange={(e) => setAiSearchQuery(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAiSearch();
                    }
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ maxWidth: 500 }}
                />
                <Button
                  variant="contained"
                  onClick={handleAiSearch}
                  disabled={loading}
                  sx={{ minWidth: 120 }}
                >
                  {loading ? 'Đang tìm...' : 'Tìm kiếm AI'}
                </Button>
                {aiSearchQuery && (
                  <Button
                    variant="outlined"
                    onClick={async () => {
                      setAiSearchQuery('');
                      setLoading(true);
                      setPage(1);
                      await fetchRecommendedGames(); // Fetch without query (will use cache if available)
                      setLoading(false);
                    }}
                  >
                    Xóa
                  </Button>
                )}
                <Button
                  variant="outlined"
                  color="warning"
                  onClick={async () => {
                    if (currentUser) {
                      clearUserCache(currentUser.user_id);
                      setLoading(true);
                      setPage(1);
                      setAiSearchQuery('');
                      await fetchRecommendedGames('', true); // Force refresh after clearing cache
                      setLoading(false);
                    }
                  }}
                  sx={{ fontSize: '0.75rem', padding: '6px 10px' }}
                >
                  🔄 Làm mới
                </Button>
              </>
            ) : (
              // Regular search for guests
              <>
                <TextField
                  fullWidth
                  placeholder="Tìm kiếm games..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1); // Reset to page 1 when searching
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ maxWidth: 400 }}
                />
                <Button
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  onClick={handleFilterOpen}
                  sx={{ minWidth: 120 }}
                >
                  Bộ lọc
                </Button>
              </>
            )}
          </Box>
        </Box>

        {/* All Games Grid */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
            {currentUser ? 'Games được gợi ý cho bạn' : 'Tất cả Games'}
          </Typography>
        </Box>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)', xl: 'repeat(5, 1fr)' }, gap: 2 }}>
          {filteredGames.map((game) => (
            <Card
              key={game.game_id}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                }
              }}
              onClick={() => handleGameClick(game.game_id)}
            >
              <Box
                sx={{
                  height: 180,
                  backgroundImage: game.image ? `url(${game.image})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  overflow: 'hidden',
                }}
              >
                {/* Overlay for better text readability */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%)',
                  }}
                />
                
                {/* Content overlay */}
                <Box sx={{ position: 'relative', zIndex: 1, p: 2, color: 'white' }}>
                <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600, 
                      mb: 1,
                      textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                      lineHeight: 1.2,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {game.name}
                </Typography>

                {/* Genres */}
                  <Box sx={{ mb: 2, minHeight: 24 }}>
                    {game.genres && game.genres.length > 0 ? (
                      <>
                        {game.genres.slice(0, 2).map((genre) => (
                    <Chip
                      key={genre}
                      label={genre}
                      size="small"
                            sx={{ 
                              mr: 0.5, 
                              mb: 0.5,
                              backgroundColor: 'rgba(255,255,255,0.2)',
                              color: 'white',
                              border: '1px solid rgba(255,255,255,0.3)',
                              fontSize: '0.7rem',
                              height: 20,
                              '&:hover': {
                                backgroundColor: 'rgba(255,255,255,0.3)',
                              }
                            }}
                    />
                  ))}
                        {game.genres.length > 2 && (
                          <Chip
                            label={`+${game.genres.length - 2}`}
                            size="small"
                            sx={{ 
                              mr: 0.5, 
                              mb: 0.5,
                              backgroundColor: 'rgba(255,255,255,0.2)',
                              color: 'white',
                              border: '1px solid rgba(255,255,255,0.3)',
                              fontSize: '0.7rem',
                              height: 20,
                            }}
                          />
                        )}
                      </>
                    ) : (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: 'rgba(255,255,255,0.7)',
                          fontStyle: 'italic',
                          textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                        }}
                      >
                        Chưa có thể loại
                      </Typography>
                    )}
                </Box>

                {/* Price and Rating */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        color: '#ffd700', 
                        fontWeight: 700,
                        textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                        fontSize: '0.9rem',
                      }}
                    >
                    {game.price === 0 ? 'Miễn phí' : `${(game.price / 1000).toFixed(0)}K`}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          mr: 0.5,
                          textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                        }}
                      >
                      ⭐ {game.average_rating ? Number(game.average_rating).toFixed(1) : 'N/A'}
                    </Typography>
                    {currentUser && game.score && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: '#4caf50',
                          fontWeight: 600,
                          textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                        }}
                      >
                        Score: {typeof game.score === 'number' ? game.score.toFixed(3) : game.score}
                      </Typography>
                    )}
                    </Box>
                  </Box>
                </Box>
              </Box>
            </Card>
          ))}
        </Box>

        {filteredGames.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography variant="h6" color="text.secondary">
              Không tìm thấy game nào phù hợp với bộ lọc
            </Typography>
          </Box>
        )}

        {/* Pagination - Show for both guests and logged-in users when there are multiple pages */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 4, mb: 2, gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<NavigateBeforeIcon />}
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              Trang trước
            </Button>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body1">
                Trang {page} / {totalPages}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ({totalGames} games)
              </Typography>
            </Box>
            <Button
              variant="outlined"
              endIcon={<NavigateNextIcon />}
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >
              Trang sau
            </Button>
          </Box>
        )}

        {/* Filter Dialog */}
        <Dialog open={filterOpen} onClose={handleFilterClose} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              Bộ lọc Games
              <Button
                startIcon={<ClearIcon />}
                onClick={handleClearFilters}
                size="small"
              >
                Xóa bộ lọc
              </Button>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              {/* Sort By */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Sắp xếp theo</InputLabel>
                <Select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setPage(1); // Reset to page 1 when sort changes
                  }}
                >
                  <MenuItem value="name">Tên A-Z</MenuItem>
                  <MenuItem value="price_asc">Giá thấp đến cao</MenuItem>
                  <MenuItem value="price_desc">Giá cao đến thấp</MenuItem>
                  <MenuItem value="rating">Đánh giá cao nhất</MenuItem>
                </Select>
              </FormControl>

              <Divider sx={{ my: 2 }} />

              {/* Price Range */}
              <Typography variant="h6" gutterBottom>
                Khoảng giá: {priceRange[0].toLocaleString('vi-VN')} - {priceRange[1].toLocaleString('vi-VN')} VND
              </Typography>
              <Slider
                value={priceRange}
                onChange={(_, newValue) => {
                  setPriceRange(newValue as number[]);
                  setPage(1); // Reset to page 1 when price range changes
                }}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${(value / 1000).toFixed(0)}K`}
                min={0}
                max={2000000}
                step={50000}
                sx={{ mb: 3 }}
              />

              <Divider sx={{ my: 2 }} />

              {/* Rating Range */}
              <Typography variant="h6" gutterBottom>
                Đánh giá: {ratingRange[0]} - {ratingRange[1]} sao
              </Typography>
              <Slider
                value={ratingRange}
                onChange={(_, newValue) => {
                  setRatingRange(newValue as number[]);
                  setPage(1); // Reset to page 1 when rating range changes
                }}
                valueLabelDisplay="auto"
                min={0}
                max={5}
                step={0.1}
                sx={{ mb: 3 }}
              />

              <Divider sx={{ my: 2 }} />

              {/* Genres */}
              <Typography variant="h6" gutterBottom>
                Thể loại
              </Typography>
              <FormGroup>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {genres.map((genre) => (
                    <FormControlLabel
                      key={genre}
                      control={
                        <Checkbox
                          checked={selectedGenres.includes(genre)}
                          onChange={() => handleGenreChange(genre)}
                        />
                      }
                      label={genre}
                    />
                  ))}
                </Box>
              </FormGroup>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Nền tảng
              </Typography>
              <FormGroup>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {platforms.map((platform) => (
                    <FormControlLabel
                      key={platform}
                      control={
                        <Checkbox
                          checked={selectedPlatforms.includes(platform)}
                          onChange={() => handlePlatformChange(platform)}
                        />
                      }
                      label={platform}
                    />
                  ))}
                </Box>
              </FormGroup>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleFilterClose}>
              Đóng
            </Button>
            <Button onClick={handleFilterClose} variant="contained">
              Áp dụng
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default GamesPage;
