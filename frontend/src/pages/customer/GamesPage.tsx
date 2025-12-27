import { useState, useEffect, useMemo, useRef } from 'react';
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
  Snackbar,
  Alert,
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
  const [allRecommendations, setAllRecommendations] = useState<Game[]>([]); // Store all games/recommendations from API
  const [topDownloadGames, setTopDownloadGames] = useState<Game[]>([]);
  const [newestGames, setNewestGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [carouselLoading, setCarouselLoading] = useState(true);
  const [newestCarouselLoading, setNewestCarouselLoading] = useState(true);
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

  // ⚡ Optimization: Use refs instead of state for inputs to avoid ANY re-renders while typing
  const searchInputRef = useRef<HTMLInputElement>(null);
  const aiInputRef = useRef<HTMLInputElement>(null);

  const [page, setPage] = useState(1);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const ITEMS_PER_PAGE = 20; // Items per page for both guest and recommendations
  const navigate = useNavigate();
  const { currentUser, loading: authLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const [enableAdaptiveBoost, setEnableAdaptiveBoost] = useState(() => {
    // Load from localStorage, default to true
    const saved = localStorage.getItem('enableAdaptiveBoost');
    return saved !== null ? saved === 'true' : true;
  });

  // Save enableAdaptiveBoost to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('enableAdaptiveBoost', String(enableAdaptiveBoost));
    console.log(`💾 Saved Adaptive Boost setting: ${enableAdaptiveBoost ? 'ON ⚡' : 'OFF 🔒'}`);
  }, [enableAdaptiveBoost]);

  // Refetch recommendations when boost setting changes (only for logged-in users)
  useEffect(() => {
    // Skip if auth is loading or user not logged in
    if (authLoading || !currentUser) {
      return;
    }

    // Skip on first mount (will be handled by main effect)
    const isFirstMount = !allRecommendations.length;
    if (isFirstMount) {
      return;
    }

    // Refetch with new boost setting
    console.log(`🔄 Boost setting changed to: ${enableAdaptiveBoost ? 'ON ⚡' : 'OFF 🔒'}`);
    console.log(`   Clearing ALL cache for user ${currentUser.user_id}...`);

    // ⚠️ CLEAR ALL CACHE for this user (both boost and noboost)
    clearUserCache(currentUser.user_id);

    setLoading(true);
    setPage(1);

    // Force fresh fetch with new boost setting
    fetchRecommendedGames(aiSearchQuery, true).finally(() => {
      setLoading(false);
    });
  }, [enableAdaptiveBoost, currentUser]); // Trigger when boost or user changes

  useEffect(() => {
    // Fetch top download games and newest games once on mount
    fetchTopDownloadGames();
    fetchNewestGames();
  }, []);

  useEffect(() => {
    // Don't fetch anything while auth is still loading
    if (authLoading) {
      console.log('⏳ Auth still loading, waiting...');
      return;
    }

    console.log('🔄 Main Effect - currentUser:', currentUser ? 'LOGGED IN' : 'GUEST');

    // Clear ALL states immediately when user login status changes
    setAllRecommendations([]); // Clear all recommendations/games
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
          page: 1
          // No limit parameter - backend will return all games
        }
      });
      const allGames = response.data.games || [];
      setAllRecommendations(allGames); // Store all games for client-side pagination

      console.log(`✅ Fetched ${allGames.length} games for guests`);
    } catch (error) {
      console.error('Error fetching games:', error);
      setAllRecommendations([]);
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

  const fetchNewestGames = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/customer/games/top/newest', {
        params: { limit: 10 }
      });
      setNewestGames(response.data.games || []);
    } catch (error) {
      console.error('Error fetching newest games:', error);
      setNewestGames([]);
    } finally {
      setNewestCarouselLoading(false);
    }
  };

  // 💾 Cache utility functions
  const getCacheKey = (userId: number, query: string = '', boostEnabled: boolean = true) => {
    const boostSuffix = boostEnabled ? '_boost' : '_noboost';
    return `ai_reco_${userId}_${query.trim().toLowerCase()}${boostSuffix}`;
  };

  const loadFromCache = (userId: number, query: string = '', boostEnabled: boolean = true) => {
    try {
      const cacheKey = getCacheKey(userId, query, boostEnabled);
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

  const saveToCache = (userId: number, query: string = '', recommendations: Game[], boostEnabled: boolean = true) => {
    try {
      const cacheKey = getCacheKey(userId, query, boostEnabled);
      const data = {
        recommendations,
        timestamp: Date.now(),
        query: query.trim(),
        boostEnabled: boostEnabled
      };
      localStorage.setItem(cacheKey, JSON.stringify(data));
      console.log(`💾 Saved to cache: ${cacheKey} (${recommendations.length} games, boost: ${boostEnabled ? 'ON' : 'OFF'})`);
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
      const cached = loadFromCache(currentUser.user_id, searchQuery, enableAdaptiveBoost);
      if (cached && cached.length > 0) {
        const allGames = cached;
        setAllRecommendations(allGames);
        setLoading(false);

        console.log(`✅ Loaded ${allGames.length} recommendations from cache (boost: ${enableAdaptiveBoost ? 'ON' : 'OFF'})`);
        return;
      }
    }

    try {
      console.log('\n=== FRONTEND RECOMMENDATION REQUEST ===');
      console.log('User:', currentUser);
      console.log('User ID:', currentUser.user_id);
      console.log('Search Query:', searchQuery || '(none)');
      console.log('Adaptive Boost:', enableAdaptiveBoost ? 'ON ⚡ (1)' : 'OFF 🔒 (0)');
      console.log('Force Refresh:', forceRefresh);
      console.log('Request URL: http://localhost:3001/api/reco/games');

      const params: any = {
        user_id: currentUser.user_id,
        enable_adaptive: enableAdaptiveBoost ? 1 : 0,  // Send boost setting to backend
        days: 7  // Use interactions from last 7 days for adaptive boosting
      };

      console.log('Request params:', params);

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
        console.log('\n--- FIRST 5 RECOMMENDED GAMES ---');
        response.data.games.slice(0, 5).forEach((game: any, index: number) => {
          const score = game.score;
          const scoreText = typeof score === 'number' ? score.toFixed(3) : 'N/A';
          console.log(`${index + 1}. ${game.name} (ID: ${game.game_id})`);
          console.log(`   Score: ${scoreText}`);
          console.log(`   Boost: ${enableAdaptiveBoost ? 'ON ⚡' : 'OFF 🔒'}`);
        });
      }

      const allGames = response.data.games || [];

      // 💾 Save to cache with boost setting
      saveToCache(currentUser.user_id, searchQuery, allGames, enableAdaptiveBoost);

      setAllRecommendations(allGames); // Store all recommendations

      console.log(`\n✅ Total recommendations: ${allGames.length}`);
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

  // ⚡ MANUAL TRIGGER: Only update search states when button is clicked
  const handleAiSearch = async () => {
    if (!currentUser) return;

    const currentAiQuery = aiInputRef.current?.value || '';
    const currentLocalSearch = searchInputRef.current?.value || '';

    console.log('🚀 Manual search triggered');
    console.log('AI Query:', currentAiQuery);
    console.log('Local Search:', currentLocalSearch);

    // Sync state only when button clicked - this triggers the heavy filtering logic
    setAiSearchQuery(currentAiQuery);
    setSearchTerm(currentLocalSearch);
    setPage(1);

    // Check if we need to call API or just filter locally
    const willUseLocalFilter = currentLocalSearch !== '' ||
      selectedGenres.length > 0 ||
      selectedPlatforms.length > 0 ||
      priceRange[0] !== 0 || priceRange[1] !== 2000000 ||
      ratingRange[0] !== 0 || ratingRange[1] !== 5 ||
      sortBy !== 'name';

    if (!willUseLocalFilter) {
      console.log('🔄 Calling AI API...');
      setLoading(true);
      await fetchRecommendedGames(currentAiQuery, true);
      setLoading(false);

      setSnackbarMessage('Đã cập nhật gợi ý AI mới!');
      setSnackbarOpen(true);
    } else {
      console.log('📋 Filtering locally...');
      setSnackbarMessage('Đã áp dụng bộ lọc thành công!');
      setSnackbarOpen(true);
    }
  };

  const handleFilterApply = () => {
    handleFilterClose();
    setSnackbarMessage('Đã áp dụng bộ lọc thành công!');
    setSnackbarOpen(true);
  };

  // Use allRecommendations for both guests and logged-in users (all data loaded once)
  const sourceGames = allRecommendations;

  // ⚡ USE MEMO: Optimize filtering logic to only run when necessary
  const allFilteredGames = useMemo(() => {
    console.log('⚡ Recalculating allFilteredGames...');
    return sourceGames.filter(game => {
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
      // If user is logged in and games have scores, sort by AI score
      if (currentUser && a.score !== undefined && b.score !== undefined) {
        return (b.score || 0) - (a.score || 0);
      }

      switch (sortBy) {
        case 'price_asc': return a.price - b.price;
        case 'price_desc': return b.price - a.price;
        case 'rating': return (b.average_rating || 0) - (a.average_rating || 0);
        case 'name':
        default: return a.name.localeCompare(b.name);
      }
    });
  }, [sourceGames, searchTerm, selectedGenres, selectedPlatforms, priceRange, ratingRange, sortBy, currentUser]);

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
        {/* Header with Gradient Background */}
        <Box
          sx={{
            mb: 4,
            p: 4,
            borderRadius: 4,
            background: 'linear-gradient(to bottom, #ffffff, #f8f9fa)',
            border: '1px solid #e0e0e0',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
          }}
        >
          <Typography
            variant="h3"
            component="h1"
            sx={{
              fontWeight: 800,
              mb: 2,
              color: 'text.primary',
            }}
          >
            {currentUser ? '✨ Gợi ý dành cho bạn' : '🎮 Khám phá Games'}
          </Typography>



          {/* Search and Filters */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {currentUser ? (
              // AI Search for logged-in users
              <>
                <Box sx={{ display: 'flex', gap: 1, flex: 1, minWidth: 300 }}>
                  <TextField
                    placeholder="🤖 Tìm kiếm AI (gọi API)..."
                    inputRef={aiInputRef}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAiSearch();
                      }
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon color="primary" />
                        </InputAdornment>
                      ),
                    }}
                    size="small"
                    fullWidth
                    sx={{
                      bgcolor: 'white',
                      '& .MuiInputBase-input': {
                        color: '#000000',
                        fontWeight: 500
                      }
                    }}
                  />

                  {/* Local Filter Search Box */}
                  <TextField
                    placeholder="🔍 Lọc trong list (tên/publisher)..."
                    inputRef={searchInputRef}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAiSearch();
                      }
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <FilterIcon color="secondary" />
                        </InputAdornment>
                      ),
                    }}
                    size="small"
                    fullWidth
                    sx={{
                      bgcolor: 'white',
                      '& .MuiInputBase-input': {
                        color: '#000000',
                        fontWeight: 500
                      }
                    }}
                  />
                </Box>

                <Button
                  variant="contained"
                  onClick={handleAiSearch}
                  disabled={loading}
                >
                  {loading ? 'Đang tìm...' : 'AI Search'}
                </Button>

                <Button
                  variant="outlined"
                  onClick={handleFilterOpen}
                  startIcon={<FilterIcon />}
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
                  color="success"
                  sx={{
                    '&:hover': {
                      backgroundColor: 'rgba(76, 175, 80, 0.04)',
                    },
                  }}
                >
                  Làm mới
                </Button>

                {/* Adaptive Boost Toggle */}
                <Button
                  variant={enableAdaptiveBoost ? "contained" : "outlined"}
                  onClick={() => {
                    setEnableAdaptiveBoost(!enableAdaptiveBoost);
                    // Effect will auto-refetch with new setting
                  }}
                  startIcon={<span>{enableAdaptiveBoost ? '⚡' : '🔒'}</span>}
                  size="small"
                  sx={{
                    borderWidth: 2,
                    borderColor: enableAdaptiveBoost ? 'rgba(255, 152, 0, 0.6)' : 'rgba(158, 158, 158, 0.6)',
                    color: enableAdaptiveBoost ? 'white' : '#9e9e9e',
                    fontWeight: 600,
                    borderRadius: 2,
                    background: enableAdaptiveBoost
                      ? 'linear-gradient(135deg, #FF9800 0%, #F57C00 100%)'
                      : 'rgba(158, 158, 158, 0.15)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderWidth: 2,
                      borderColor: enableAdaptiveBoost ? '#FF9800' : '#9e9e9e',
                      background: enableAdaptiveBoost
                        ? 'linear-gradient(135deg, #F57C00 0%, #FF9800 100%)'
                        : 'rgba(158, 158, 158, 0.25)',
                      transform: 'scale(1.05)',
                      boxShadow: enableAdaptiveBoost
                        ? '0 4px 12px rgba(255, 152, 0, 0.4)'
                        : '0 4px 12px rgba(158, 158, 158, 0.3)',
                    },
                  }}
                  title={enableAdaptiveBoost
                    ? "Adaptive Boost BẬT: Gợi ý dựa trên sở thích của bạn"
                    : "Adaptive Boost TẮT: Gợi ý điểm gốc (không cá nhân hóa)"}
                >
                  {enableAdaptiveBoost ? 'Boost ON' : 'Boost OFF'}
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
                        <SearchIcon color="primary" />
                      </InputAdornment>
                    ),
                  }}
                  size="small"
                  fullWidth
                  sx={{ bgcolor: 'white' }}
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
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mb: 3,
              p: 2.5,
              borderRadius: 3,
              background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 165, 0, 0.2) 100%)',
              border: '2px solid rgba(255, 215, 0, 0.4)',
              boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)',
            }}
          >
            <DownloadIcon
              sx={{
                fontSize: 36,
                color: '#FFD700',
                filter: 'drop-shadow(0 2px 4px rgba(255, 215, 0, 0.5))',
              }}
            />
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              🏆 Top Download
            </Typography>
            {!carouselLoading && topDownloadGames.length > 0 && (
              <Chip
                label={`${topDownloadGames.length} games`}
                sx={{
                  background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                  color: '#000',
                  fontWeight: 700,
                  border: '2px solid rgba(255, 165, 0, 0.3)',
                  boxShadow: '0 2px 8px rgba(255, 215, 0, 0.3)',
                }}
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
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      borderRadius: 3,
                      overflow: 'hidden',
                      border: '2px solid rgba(255, 215, 0, 0.2)',
                      background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.05) 0%, rgba(255, 165, 0, 0.05) 100%)',
                      boxShadow: '0 4px 20px rgba(255, 215, 0, 0.15)',
                      '&:hover': {
                        transform: 'translateY(-12px) scale(1.02)',
                        boxShadow: '0 20px 40px rgba(255, 215, 0, 0.3), 0 0 20px rgba(255, 215, 0, 0.2)',
                        border: '2px solid rgba(255, 215, 0, 0.5)',
                        '&::before': {
                          opacity: 1,
                        }
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 165, 0, 0.1) 100%)',
                        opacity: 0,
                        transition: 'opacity 0.4s ease',
                        pointerEvents: 'none',
                        zIndex: 1,
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
                        background: index < 3
                          ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
                          : 'linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(50,50,50,0.8) 100%)',
                        color: index < 3 ? '#000' : '#fff',
                        width: 45,
                        height: 45,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1.3rem',
                        border: index < 3 ? '3px solid #FFA500' : '2px solid rgba(255,255,255,0.2)',
                        boxShadow: index < 3
                          ? '0 4px 15px rgba(255, 215, 0, 0.5), 0 0 20px rgba(255, 215, 0, 0.3)'
                          : '0 2px 8px rgba(0,0,0,0.5)',
                        transition: 'all 0.3s ease',
                        backdropFilter: 'blur(10px)',
                        '&:hover': {
                          transform: 'scale(1.1) rotate(5deg)',
                        }
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
                        <Box sx={{ mb: 2.2, minHeight: 26.4 }}>
                          {game.genres && game.genres.length > 0 ? (
                            <>
                              {game.genres.slice(0, 2).map((genre) => (
                                <Chip
                                  key={genre}
                                  label={genre}
                                  size="small"
                                  sx={{
                                    mr: 0.6,
                                    mb: 0.6,
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.15) 100%)',
                                    color: 'white',
                                    border: '1.5px solid rgba(255,255,255,0.4)',
                                    fontSize: '0.75rem',
                                    height: 24,
                                    fontWeight: 600,
                                    backdropFilter: 'blur(10px)',
                                    transition: 'all 0.3s ease',
                                    '&:hover': {
                                      background: 'linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.25) 100%)',
                                      transform: 'translateY(-2px)',
                                      boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                                    }
                                  }}
                                />
                              ))}
                              {game.genres.length > 2 && (
                                <Chip
                                  label={`+${game.genres.length - 2}`}
                                  size="small"
                                  sx={{
                                    background: 'linear-gradient(135deg, rgba(255,215,0,0.3) 0%, rgba(255,165,0,0.3) 100%)',
                                    color: 'white',
                                    fontSize: '0.75rem',
                                    height: 24,
                                    fontWeight: 700,
                                    border: '1.5px solid rgba(255,215,0,0.5)',
                                    backdropFilter: 'blur(10px)',
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
                                fontSize: '0.75rem',
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

        {/* Newest Releases Carousel */}
        <Box sx={{ mb: 6 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mb: 3,
              p: 2.5,
              borderRadius: 3,
              background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2) 0%, rgba(56, 142, 60, 0.2) 100%)',
              border: '2px solid rgba(76, 175, 80, 0.4)',
              boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)',
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              ✨ 🆕 Mới phát hành
            </Typography>
            {!newestCarouselLoading && newestGames.length > 0 && (
              <Chip
                label={`${newestGames.length} games`}
                sx={{
                  background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                  color: 'white',
                  fontWeight: 700,
                  border: '2px solid rgba(76, 175, 80, 0.3)',
                  boxShadow: '0 2px 8px rgba(76, 175, 80, 0.3)',
                }}
                size="small"
              />
            )}
          </Box>

          {newestCarouselLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
              <CircularProgress size={40} />
              <Typography variant="body1" sx={{ ml: 2 }} color="text.secondary">
                Đang tải game mới phát hành...
              </Typography>
            </Box>
          ) : newestGames.length > 0 ? (
            <SlickSlider
              dots={true}
              infinite={true}
              speed={500}
              slidesToShow={4}
              slidesToScroll={1}
              autoplay={true}
              autoplaySpeed={3500}
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
              {newestGames.map((game) => (
                <Box key={game.game_id} sx={{ px: 1.5 }}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      borderRadius: 3,
                      overflow: 'hidden',
                      border: '2px solid rgba(76, 175, 80, 0.2)',
                      background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.05) 0%, rgba(56, 142, 60, 0.05) 100%)',
                      boxShadow: '0 4px 20px rgba(76, 175, 80, 0.15)',
                      '&:hover': {
                        transform: 'translateY(-12px) scale(1.02)',
                        boxShadow: '0 20px 40px rgba(76, 175, 80, 0.3), 0 0 20px rgba(76, 175, 80, 0.2)',
                        border: '2px solid rgba(76, 175, 80, 0.5)',
                        '&::before': {
                          opacity: 1,
                        }
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(56, 142, 60, 0.1) 100%)',
                        opacity: 0,
                        transition: 'opacity 0.4s ease',
                        pointerEvents: 'none',
                        zIndex: 1,
                      }
                    }}
                    onClick={() => handleGameClick(game.game_id)}
                  >
                    {/* NEW Badge */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        zIndex: 2,
                        background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                        color: '#000',
                        px: 2.5,
                        py: 0.8,
                        borderRadius: 2,
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        boxShadow: '0 4px 15px rgba(255, 193, 7, 0.6), 0 0 25px rgba(255, 193, 7, 0.4)',
                        border: '2px solid rgba(255, 255, 255, 0.4)',
                        backdropFilter: 'blur(10px)',
                        textTransform: 'uppercase',
                        letterSpacing: '1px',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'scale(1.1) rotate(-3deg)',
                          boxShadow: '0 6px 25px rgba(255, 193, 7, 0.8), 0 0 30px rgba(255, 193, 7, 0.5)',
                        }
                      }}
                    >
                      ✨ NEW
                    </Box>

                    <Box
                      sx={{
                        height: 240,
                        backgroundImage: game.image ? `url(${game.image})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        position: 'relative',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: '50%',
                          background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                        }
                      }}
                    />

                    <Box sx={{ p: 2.2, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      <Typography
                        variant="h6"
                        sx={{
                          mb: 1.65,
                          fontWeight: 700,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          fontSize: '1.1rem',
                        }}
                      >
                        {game.name}
                      </Typography>

                      {/* Genres */}
                      <Box sx={{ mb: 2.2, minHeight: 26.4 }}>
                        {game.genres && game.genres.length > 0 ? (
                          <>
                            {game.genres.slice(0, 2).map((genre) => (
                              <Chip
                                key={genre}
                                label={genre}
                                size="small"
                                sx={{
                                  mr: 0.6,
                                  mb: 0.6,
                                  background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.25) 0%, rgba(255, 152, 0, 0.25) 100%)',
                                  color: '#FFC107',
                                  border: '1.5px solid rgba(255, 193, 7, 0.5)',
                                  fontSize: '0.75rem',
                                  height: 24,
                                  fontWeight: 600,
                                  backdropFilter: 'blur(10px)',
                                  transition: 'all 0.3s ease',
                                  '&:hover': {
                                    background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.35) 0%, rgba(255, 152, 0, 0.35) 100%)',
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 4px 8px rgba(255, 193, 7, 0.4)',
                                  }
                                }}
                              />
                            ))}
                            {game.genres.length > 2 && (
                              <Chip
                                label={`+${game.genres.length - 2}`}
                                size="small"
                                sx={{
                                  background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.35) 0%, rgba(255, 165, 0, 0.35) 100%)',
                                  color: '#FFD700',
                                  fontSize: '0.75rem',
                                  height: 24,
                                  fontWeight: 700,
                                  border: '1.5px solid rgba(255, 215, 0, 0.6)',
                                  backdropFilter: 'blur(10px)',
                                }}
                              />
                            )}
                          </>
                        ) : (
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'text.secondary',
                              fontStyle: 'italic',
                              fontSize: '0.75rem',
                            }}
                          >
                            Chưa có thể loại
                          </Typography>
                        )}
                      </Box>

                      <Box sx={{ mt: 'auto' }}>
                        {/* Price */}
                        <Typography variant="h5" color="primary" sx={{ fontWeight: 800, mb: 1.1 }}>
                          {game.price === 0 ? 'Miễn phí' : `${game.price.toLocaleString('vi-VN')} ₫`}
                        </Typography>

                        {/* Rating */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.55 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              bgcolor: 'rgba(255, 193, 7, 0.1)',
                              px: 1.1,
                              py: 0.44,
                              borderRadius: 1.1,
                            }}
                          >
                            <Typography sx={{ color: '#FFC107', mr: 0.55, fontSize: '1.1rem' }}>★</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.935rem' }}>
                              {game.average_rating ? game.average_rating.toFixed(1) : 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Box>
                  </Card>
                </Box>
              ))}
            </SlickSlider>
          ) : (
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              Không có game mới nào
            </Typography>
          )}
        </Box>

        {/* All Games Grid */}
        <Box sx={{ mb: 4 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 2.5,
              borderRadius: 3,
              background: currentUser
                ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)'
                : 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%)',
              border: currentUser
                ? '2px solid rgba(102, 126, 234, 0.4)'
                : '2px solid rgba(99, 102, 241, 0.4)',
              boxShadow: currentUser
                ? '0 4px 15px rgba(102, 126, 234, 0.3)'
                : '0 4px 15px rgba(99, 102, 241, 0.3)',
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                background: currentUser
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {currentUser ? '🎯 Dành riêng cho bạn' : '🎮 Tất cả Games'}
            </Typography>
            {!loading && totalFilteredGames > 0 && (
              <Chip
                label={`${totalFilteredGames} games`}
                sx={{
                  background: currentUser
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                  color: 'white',
                  fontWeight: 700,
                  border: '2px solid rgba(102, 126, 234, 0.3)',
                  boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                }}
                size="small"
              />
            )}
          </Box>
        </Box>

        {/* Show loading spinner for games list */}
        {loading ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              py: 10,
              px: 4,
              borderRadius: 4,
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)',
              border: '2px dashed rgba(102, 126, 234, 0.5)',
            }}
          >
            <CircularProgress
              size={60}
              thickness={4}
              sx={{
                color: '#667eea',
                mb: 3,
              }}
            />
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {currentUser ? '✨ Đang tạo gợi ý AI cho bạn...' : '🎮 Đang tải danh sách games...'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Vui lòng chờ trong giây lát
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)', xl: 'repeat(5, 1fr)' }, gap: 2.5 }}>
              {filteredGames.map((game) => (
                <Card
                  key={game.game_id}
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    borderRadius: 3,
                    overflow: 'hidden',
                    border: '2px solid rgba(102, 126, 234, 0.15)',
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.03) 0%, rgba(118, 75, 162, 0.03) 100%)',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                    '&:hover': {
                      transform: 'translateY(-8px) scale(1.02)',
                      boxShadow: '0 15px 35px rgba(102, 126, 234, 0.25), 0 5px 15px rgba(0,0,0,0.15)',
                      border: '2px solid rgba(102, 126, 234, 0.4)',
                      '&::before': {
                        opacity: 1,
                      }
                    },
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%)',
                      opacity: 0,
                      transition: 'opacity 0.4s ease',
                      pointerEvents: 'none',
                      zIndex: 1,
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
              <Box
                sx={{
                  textAlign: 'center',
                  py: 10,
                  px: 4,
                  gridColumn: '1 / -1',
                  borderRadius: 4,
                  background: 'linear-gradient(135deg, rgba(240, 147, 251, 0.15) 0%, rgba(245, 87, 108, 0.15) 100%)',
                  border: '2px dashed rgba(240, 147, 251, 0.5)',
                }}
              >
                <Typography
                  variant="h3"
                  sx={{
                    mb: 2,
                    fontSize: '3rem',
                  }}
                >
                  🔍
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    mb: 1,
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Không tìm thấy game nào
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Thử điều chỉnh bộ lọc hoặc tìm kiếm với từ khóa khác
                </Typography>
              </Box>
            )}
          </>
        )}

        {/* Pagination - Show for both guests and logged-in users when there are multiple pages */}
        {!loading && totalFilteredPages > 1 && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mt: 5,
              mb: 2,
              gap: 3,
              p: 3,
              borderRadius: 3,
              background: 'rgba(49, 68, 108, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(255, 255, 255, 0.8)',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            }}
          >
            <Button
              variant="outlined"
              startIcon={<NavigateBeforeIcon />}
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              sx={{
                borderWidth: 2,
                borderColor: '#667eea',
                color: '#667eea',
                fontWeight: 600,
                borderRadius: 2,
                px: 3,
                py: 1,
                background: 'rgba(102, 126, 234, 0.08)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderWidth: 2,
                  borderColor: '#667eea',
                  background: 'rgba(102, 126, 234, 0.15)',
                  transform: 'translateX(-4px)',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                },
                '&:disabled': {
                  borderColor: 'rgba(102, 126, 234, 0.3)',
                  color: 'hsla(0, 0.00%, 100.00%, 0.40)',
                  background: 'rgba(102, 126, 234, 0.05)',
                }
              }}
            >
              Trang trước
            </Button>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.5,
                px: 3,
                py: 1.5,
                borderRadius: 2,
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.12) 0%, rgba(118, 75, 162, 0.12) 100%)',
                border: '2px solid rgba(102, 126, 234, 0.3)',
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  color: 'white',
                }}
              >
                Trang {page} / {totalFilteredPages}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 500,
                  color: '#6b7280',
                }}
              >
                📊 {totalFilteredGames} games
              </Typography>
            </Box>
            <Button
              variant="outlined"
              endIcon={<NavigateNextIcon />}
              onClick={() => setPage(page + 1)}
              disabled={page === totalFilteredPages}
              sx={{
                borderWidth: 2,
                borderColor: '#667eea',
                color: '#667eea',
                fontWeight: 600,
                borderRadius: 2,
                px: 3,
                py: 1,
                background: 'rgba(102, 126, 234, 0.08)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderWidth: 2,
                  borderColor: '#667eea',
                  background: 'rgba(102, 126, 234, 0.15)',
                  transform: 'translateX(4px)',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                },
                '&:disabled': {
                  borderColor: 'rgba(102, 126, 234, 0.3)',
                  color: 'rgba(102, 126, 234, 0.4)',
                  background: 'rgba(102, 126, 234, 0.05)',
                }
              }}
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
            <Button onClick={handleFilterApply} variant="contained">
              Áp dụng
            </Button>
          </DialogActions>
        </Dialog>

        {/* Success Toast */}
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbarOpen(false)}
            severity="success"
            variant="filled"
            sx={{
              width: '100%',
              borderRadius: '12px',
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </Container>
  );
};

export default GamesPage;
