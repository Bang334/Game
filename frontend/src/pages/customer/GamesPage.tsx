import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Card,
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
  Slider as MuiSlider,
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
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import SlickSlider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

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
  publisher?: string;
  score?: number; // AI recommendation score
}

/**
 * GamesPage Component
 * 
 * === SEARCH & FILTER LOGIC ===
 * 
 * 1. AI Search (gọi API với keyword):
 *    - User nhập keyword vào ô "🤖 Tìm kiếm AI"
 *    - Nếu KHÔNG có local filters → Gọi API: /api/reco/games?query=...
 *    - Nếu CÓ local filters → KHÔNG gọi API (chỉ filter local)
 *    - Lưu kết quả vào allRecommendations (cache)
 * 
 * 2. Local Filters (filter trong list đã có):
 *    - User nhập vào ô "🔍 Lọc trong list"
 *    - Hoặc dùng Filter Dialog (genre, price, platform, rating)
 *    - KHÔNG gọi API - filter trực tiếp trong allRecommendations
 *    - Nhanh, real-time
 * 
 * 3. Use Cases:
 *    Case A: User search "action" → API fetch 100 games action
 *    Case B: User filter "EA publisher" → Filter 100 games → show 15 EA games
 *    Case C: User search "Call of Duty" → Filter by name → show 3 games
 *    Case D: User clear filters → Show toàn bộ 100 games đã fetch
 * 
 * === BENEFITS ===
 * - Performance: Local filter không cần gọi API
 * - Cost: Giảm số lần gọi AI service
 * - UX: Filter tức thì, không loading
 * - Smart: Chỉ gọi API khi thực sự cần
 */
const GamesPage = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [allRecommendations, setAllRecommendations] = useState<Game[]>([]); // Store all recommendations from API
  const [topDownloadGames, setTopDownloadGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [carouselLoading, setCarouselLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [aiSearchQuery, setAiSearchQuery] = useState(''); // AI search query for recommendations
  const [filterOpen, setFilterOpen] = useState(false);
  const [genres, setGenres] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<number[]>([0, 2000000]);
  const [ratingRange, setRatingRange] = useState<number[]>([0, 5]);
  const [sortBy, setSortBy] = useState('name');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 20; // Items per page for both guest and recommendations
  const navigate = useNavigate();
  const { currentUser, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Fetch top download games once on mount
    fetchTopDownloadGames();
  }, []);

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
    
    if (currentUser) {
      // For logged-in users: fetch AI recommendations (no pagination)
      console.log('✅ Fetching AI recommendations...');
      fetchRecommendedGames();
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
      // Set publisher filter instead of search term
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

  const fetchTopDownloadGames = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/customer/games/top/downloaded', {
        params: { limit: 10 }
      });
      setTopDownloadGames(response.data.games || []);
    } catch (error) {
      console.error('Error fetching top download games:', error);
      setTopDownloadGames([]);
    } finally {
      setCarouselLoading(false);
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
        
        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        setGames(allGames.slice(startIndex, endIndex));
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
      
      setAllRecommendations(allGames); // Store all recommendations
      
      // Slice games for current page
      const startIndex = (page - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      setGames(allGames.slice(startIndex, endIndex));
      
      console.log(`\n✅ Total recommendations: ${allGames.length}, Current page: ${page}`);
      console.log('\n=== FRONTEND RECOMMENDATION COMPLETED ===\n');
      
    } catch (error) {
      console.error('\n--- FRONTEND API ERROR ---');
      console.error('Error fetching recommendations:', error);

      
      // Fallback to regular games if recommendation fails
      console.log('Falling back to regular games...');
      fetchGames();
    } finally {
      setLoading(false);
    }
  };


  // Check if user has any local filters active
  const hasLocalFilters = () => {
    return searchTerm !== '' ||
           selectedGenres.length > 0 ||
           selectedPlatforms.length > 0 ||
           priceRange[0] !== 0 || priceRange[1] !== 2000000 ||
           ratingRange[0] !== 0 || ratingRange[1] !== 5 ||
           sortBy !== 'name';
  };

  // Handle AI search for recommendations
  const handleAiSearch = async () => {
    if (!currentUser) return;
    
    console.log('🔍 AI Search triggered with query:', aiSearchQuery);
    
    // Case 1: User có filter local → Chỉ filter trong list đã có (không gọi API)
    if (hasLocalFilters()) {
      console.log('📋 Local filters active - filtering existing recommendations');
      console.log('Filters:', {
        searchTerm,
        selectedGenres,
        selectedPlatforms,
        priceRange,
        ratingRange,
        sortBy
      });
      // Không làm gì - filter logic đã chạy tự động qua allFilteredGames
      setPage(1); // Reset to page 1
      return;
    }
    
    // Case 2: Không có filter local → Gọi API với keyword mới
    console.log('🔄 No local filters - calling API with keyword:', aiSearchQuery);
    setLoading(true);
    setPage(1); // Reset to page 1
    // Force refresh when user explicitly searches (forceRefresh = true)
    await fetchRecommendedGames(aiSearchQuery, true);
    setLoading(false);
  };

  const sourceGames = currentUser ? allRecommendations : games;
  
  const allFilteredGames = sourceGames.filter(game => {
    // Search filter (includes name and publisher)
    const matchesSearch = game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (game.publisher_name && game.publisher_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (game.publisher && game.publisher.toLowerCase().includes(searchTerm.toLowerCase()));
    
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

  // Apply pagination to filtered games
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const filteredGames = allFilteredGames.slice(startIndex, endIndex);
  
  // Update total games and pages based on filtered results
  const totalFilteredGames = allFilteredGames.length;
  const totalFilteredPages = Math.ceil(totalFilteredGames / ITEMS_PER_PAGE);

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

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [selectedGenres, selectedPlatforms, priceRange, ratingRange, searchTerm, sortBy]);

  // Reset page when no games match filters
  useEffect(() => {
    if (totalFilteredGames === 0 && page > 1) {
      setPage(1);
    }
  }, [totalFilteredGames, page]);

  // Don't block the entire page - show progressive loading
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography 
            variant="h3" 
            component="h1" 
            sx={{ 
              fontWeight: 800,
              mb: 2,
              color: 'white',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}
          >
            {currentUser ? '✨ Gợi ý dành cho bạn' : '🎮 Khám phá Games'}
          </Typography>

          {/* Search Info Display */}
          {currentUser && (
            <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }} >
              {aiSearchQuery && (
                <Chip 
                  label={`🤖 AI: "${aiSearchQuery}"`}
                  onDelete={async () => {
                    setAiSearchQuery('');
                    setLoading(true);
                    setPage(1);
                    await fetchRecommendedGames();
                    setLoading(false);
                  }}
                  color="primary"
                  variant="outlined"
                />
              )}
              
              {hasLocalFilters() && (
                <Chip 
                  label={`🔍 Đã lọc: ${[
                    searchTerm && 'Tên',
                    selectedGenres.length > 0 && `${selectedGenres.length} thể loại`,
                    selectedPlatforms.length > 0 && `${selectedPlatforms.length} nền tảng`,
                    (priceRange[0] !== 0 || priceRange[1] !== 2000000) && 'Giá',
                    (ratingRange[0] !== 0 || ratingRange[1] !== 5) && 'Rating',
                    sortBy !== 'name' && 'Sort'
                  ].filter(Boolean).join(', ')}`}
                  onDelete={() => {
                    handleClearFilters();
                  }}
                  color="secondary"
                  variant="outlined"
                />
              )}
              
              {(aiSearchQuery || hasLocalFilters()) && (
                <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  💡 Tip: AI Search gọi API mới, Local Filter lọc trong list đã có
                </Typography>
              )}
            </Box>
          )}

          {/* Search and Filters */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {currentUser ? (
              // AI Search for logged-in users
              <>
                <Box sx={{ display: 'flex', gap: 1, flex: 1, minWidth: 300 }}>
                  {/* AI Search Box */}
                  <TextField
                    placeholder="🤖 Tìm kiếm AI (gọi API)..."
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
                    size="small"
                    sx={{ flex: 1 }}
                  />
                  
                  {/* Local Filter Search Box */}
                  <TextField
                    placeholder="🔍 Lọc trong list (tên/publisher)..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(1);
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <FilterIcon />
                        </InputAdornment>
                      ),
                    }}
                    size="small"
                    sx={{ flex: 1 }}
                  />
                </Box>
                
                <Button
                  variant="contained"
                  onClick={handleAiSearch}
                  disabled={loading}
                  sx={{ minWidth: 120 }}
                >
                  {loading ? 'Đang tìm...' : '🤖 AI Search'}
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={handleFilterOpen}
                  startIcon={<FilterIcon />}
                  sx={{ minWidth: 100 }}
                >
                  Bộ lọc
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={async () => {
                    if (currentUser) {
                      clearUserCache(currentUser.user_id);
                      setLoading(true);
                      setPage(1);
                      setAiSearchQuery('');
                      setSearchTerm('');
                      handleClearFilters();
                      await fetchRecommendedGames('', true);
                      setLoading(false);
                    }
                  }}
                  startIcon={<span>🔄</span>}
                  size="small"
                >
                  Làm mới
                </Button>
              </>
            ) : (
              // Regular search for guests
              <>
                <TextField
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
                  size="small"
                  sx={{ minWidth: 300, flex: 1 }}
                />
                <Button
                  variant="outlined"
                  startIcon={<FilterIcon />}
                  onClick={handleFilterOpen}
                >
                  Bộ lọc
                </Button>
              </>
            )}
          </Box>
        </Box>

        {/* Top Download Carousel */}
        <Box sx={{ mb: 6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <DownloadIcon sx={{ fontSize: 32, color: 'primary.main' }} />
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Top Download
            </Typography>
            {!carouselLoading && topDownloadGames.length > 0 && (
              <Chip 
                label={`${topDownloadGames.length} games`} 
                color="primary" 
                size="small"
              />
            )}
          </Box>
          
          {carouselLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress size={40} />
              <Typography variant="body1" sx={{ ml: 2 }} color="text.secondary">
                Đang tải top download games...
              </Typography>
            </Box>
          ) : topDownloadGames.length > 0 ? (
            <SlickSlider
              dots={true}
              infinite={true}
              speed={500}
              slidesToShow={4}
              slidesToScroll={1}
              autoplay={true}
              autoplaySpeed={3000}
              responsive={[
                {
                  breakpoint: 1536,
                  settings: {
                    slidesToShow: 4,
                    slidesToScroll: 1,
                  }
                },
                {
                  breakpoint: 1200,
                  settings: {
                    slidesToShow: 3,
                    slidesToScroll: 1,
                  }
                },
                {
                  breakpoint: 900,
                  settings: {
                    slidesToShow: 2,
                    slidesToScroll: 1,
                  }
                },
                {
                  breakpoint: 600,
                  settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1,
                  }
                }
              ]}
            >
              {topDownloadGames.map((game, index) => (
                <Box key={game.game_id} sx={{ px: 1.5 }}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: '0 12px 30px rgba(0,0,0,0.2)',
                      }
                    }}
                    onClick={() => handleGameClick(game.game_id)}
                  >
                    {/* Rank Badge */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        zIndex: 2,
                        bgcolor: index < 3 ? '#FFD700' : 'rgba(0,0,0,0.7)',
                        color: index < 3 ? '#000' : '#fff',
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1.2rem',
                        border: index < 3 ? '2px solid #FFA500' : 'none',
                      }}
                    >
                      {index + 1}
                    </Box>

                    <Box
                      sx={{
                        height: 220, // Tăng từ 200 lên 220 (+10%)
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
                      {/* Overlay */}
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

                      {/* Content */}
                      <Box sx={{ position: 'relative', zIndex: 1, p: 2.2, color: 'white' }}> {/* Tăng padding từ 2 lên 2.2 (+10%) */}
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            fontWeight: 600, 
                            mb: 1.1, // Tăng margin từ 1 lên 1.1 (+10%)
                            textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                            lineHeight: 1.2,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            fontSize: '1.1rem', // Tăng font size (+10%)
                          }}
                        >
                          {game.name}
                        </Typography>

                        {/* Genres */}
                        <Box sx={{ mb: 2.2, minHeight: 26.4 }}> {/* Tăng margin và minHeight (+10%) */}
                          {game.genres && game.genres.length > 0 ? (
                            <>
                              {game.genres.slice(0, 2).map((genre) => (
                                <Chip
                                  key={genre}
                                  label={genre}
                                  size="small"
                                  sx={{ 
                                    mr: 0.55, // Tăng margin (+10%)
                                    mb: 0.55, // Tăng margin (+10%)
                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                    color: 'white',
                                    border: '1px solid rgba(255,255,255,0.3)',
                                    fontSize: '0.77rem', // Tăng font size (+10%)
                                    height: 22, // Tăng height (+10%)
                                  }}
                                />
                              ))}
                              {game.genres.length > 2 && (
                                <Chip
                                  label={`+${game.genres.length - 2}`}
                                  size="small"
                                  sx={{ 
                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                    color: 'white',
                                    fontSize: '0.77rem', // Tăng font size (+10%)
                                    height: 22, // Tăng height (+10%)
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
                                fontSize: '0.77rem', // Tăng font size (+10%)
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
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                            }}
                          >
                            ⭐ {game.average_rating ? Number(game.average_rating).toFixed(1) : 'N/A'}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Card>
                </Box>
              ))}
            </SlickSlider>
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body1" color="text.secondary">
                Không có dữ liệu top download
              </Typography>
            </Box>
          )}
        </Box>

        {/* All Games Grid */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              {currentUser ? '🎯 Dành riêng cho bạn' : '🎮 Tất cả Games'}
            </Typography>
            {!loading && totalFilteredGames > 0 && (
              <Chip 
                label={`${totalFilteredGames} games`}
                size="small"
                variant="outlined"
                color="primary"
              />
            )}
          </Box>
        </Box>
        
        {/* Show loading spinner for games list */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
            <CircularProgress size={50} />
            <Typography variant="h6" sx={{ ml: 2 }} color="text.secondary">
              {currentUser ? 'Đang tải gợi ý AI cho bạn...' : 'Đang tải danh sách games...'}
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)', xl: 'repeat(5, 1fr)' }, gap: 2.2 }}> {/* Tăng gap từ 2 lên 2.2 (+10%) */}
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
                  height: 198, // Tăng từ 180 lên 198 (+10%)
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
                <Box sx={{ position: 'relative', zIndex: 1, p: 2.2, color: 'white' }}> {/* Tăng padding từ 2 lên 2.2 (+10%) */}
                <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600, 
                      mb: 1.1, // Tăng margin từ 1 lên 1.1 (+10%)
                      textShadow: '0 2px 4px rgba(0,0,0,0.8)',
                      lineHeight: 1.2,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      fontSize: '1.1rem', // Tăng font size (+10%)
                    }}
                  >
                    {game.name}
                </Typography>

                {/* Genres */}
                  <Box sx={{ mb: 2.2, minHeight: 26.4 }}> {/* Tăng margin và minHeight (+10%) */}
                    {game.genres && game.genres.length > 0 ? (
                      <>
                        {game.genres.slice(0, 2).map((genre) => (
                    <Chip
                      key={genre}
                      label={genre}
                      size="small"
                            sx={{ 
                              mr: 0.55, // Tăng margin (+10%)
                              mb: 0.55, // Tăng margin (+10%)
                              backgroundColor: 'rgba(255,255,255,0.2)',
                              color: 'white',
                              border: '1px solid rgba(255,255,255,0.3)',
                              fontSize: '0.77rem', // Tăng font size (+10%)
                              height: 22, // Tăng height (+10%)
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
                              mr: 0.55, // Tăng margin (+10%)
                              mb: 0.55, // Tăng margin (+10%)
                              backgroundColor: 'rgba(255,255,255,0.2)',
                              color: 'white',
                              border: '1px solid rgba(255,255,255,0.3)',
                              fontSize: '0.77rem', 
                              height: 22, // Tăng height (+10%)
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
                          fontSize: '0.77rem', // Tăng font size (+10%)
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
              <Box sx={{ textAlign: 'center', py: 8, gridColumn: '1 / -1' }}>
                <Typography variant="h6" color="text.secondary">
                  Không tìm thấy game nào phù hợp với bộ lọc
                </Typography>
              </Box>
            )}
          </>
        )}

        {/* Pagination - Show for both guests and logged-in users when there are multiple pages */}
        {!loading && totalFilteredPages > 1 && (
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
                Trang {page} / {totalFilteredPages}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                ({totalFilteredGames} games)
              </Typography>
            </Box>
            <Button
              variant="outlined"
              endIcon={<NavigateNextIcon />}
              onClick={() => setPage(page + 1)}
              disabled={page === totalFilteredPages}
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
              <MuiSlider
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
              <MuiSlider
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
