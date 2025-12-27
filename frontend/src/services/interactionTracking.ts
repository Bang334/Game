import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

// Track user interaction to SQLite via backend
export const trackInteraction = async (
  userId: number,
  gameId: number,
  interactionType: 'view' | 'favorite' | 'purchase',
  rating?: number
): Promise<boolean> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/interactions`, {
      user_id: userId,
      game_id: gameId,
      interaction_type: interactionType,
      rating: rating || null
    });
    
    if (response.data.success) {
      console.log(`✅ Interaction logged: ${interactionType} - game ${gameId} for user ${userId}`);
      return true;
    } else {
      console.error('❌ Failed to log interaction:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Error logging interaction:', error);
    return false;
  }
};

// Track game view (when user views game details page for >= 2 seconds)
export const trackGameView = (userId: number, gameId: number) => {
  return trackInteraction(userId, gameId, 'view');
};

// Track game like (when user adds to wishlist/favorites)
export const trackGameLike = (userId: number, gameId: number) => {
  return trackInteraction(userId, gameId, 'favorite');
};

// Track game purchase (after successful purchase)
export const trackGamePurchase = (userId: number, gameId: number) => {
  return trackInteraction(userId, gameId, 'purchase');
};

// Get user's interaction history (using existing SQLite data)
export const getUserInteractions = async (userId: number) => {
  // Data available in existing SQLite database
  console.log(`📊 User interactions available in SQLite database for user ${userId}`);
  return null;
};

// Get overall stats (using existing SQLite data)
export const getInteractionStats = async () => {
  // Stats available in existing SQLite database
  console.log(`📊 Interaction stats available in SQLite database`);
  return null;
};

// Debounced tracking for view events (prevent spam)
let viewTrackingTimeout: number | null = null;

export const trackGameViewDebounced = (userId: number, gameId: number, delay: number = 2000) => {
  if (viewTrackingTimeout) {
    clearTimeout(viewTrackingTimeout);
  }
  
  viewTrackingTimeout = setTimeout(() => {
    trackGameView(userId, gameId);
  }, delay);
};

// Clear user interactions (using existing SQLite data)
export const clearUserInteractions = async (userId: number) => {
  // Data managed in existing SQLite database
  console.log(`📊 User interactions managed in SQLite database for user ${userId}`);
  return null;
};

