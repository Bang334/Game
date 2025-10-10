import axios from 'axios';

const API_URL = 'http://localhost:3001/api/ai';

// Generate unique session ID for tracking
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('session_id', sessionId);
  }
  return sessionId;
};

// Track user interaction
export const trackInteraction = async (
  userId: number,
  gameId: number,
  interactionType: 'view' | 'like' | 'purchase',
  rating?: number
): Promise<boolean> => {
  try {
    const sessionId = getSessionId();
    
    const response = await axios.post(`${API_URL}/interaction`, {
      user_id: userId,
      game_id: gameId,
      interaction_type: interactionType,
      rating,
      session_id: sessionId
    });
    
    if (response.data.success) {
      console.log(`✅ Tracked: ${interactionType} - game ${gameId}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error tracking interaction:', error);
    return false;
  }
};

// Track game view (when user views game details page for >= 2 seconds)
export const trackGameView = (userId: number, gameId: number) => {
  return trackInteraction(userId, gameId, 'view');
};

// Track game like (when user adds to wishlist/favorites)
export const trackGameLike = (userId: number, gameId: number) => {
  return trackInteraction(userId, gameId, 'like');
};

// Track game purchase (after successful purchase)
export const trackGamePurchase = (userId: number, gameId: number) => {
  return trackInteraction(userId, gameId, 'purchase');
};

// Get user's interaction history
export const getUserInteractions = async (userId: number) => {
  try {
    const response = await axios.get(`${API_URL}/interactions/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user interactions:', error);
    return null;
  }
};

// Get overall stats
export const getInteractionStats = async () => {
  try {
    const response = await axios.get(`${API_URL}/stats`);
    return response.data;
  } catch (error) {
    console.error('Error fetching interaction stats:', error);
    return null;
  }
};

// Debounced tracking for view events (prevent spam)
let viewTrackingTimeout: NodeJS.Timeout | null = null;

export const trackGameViewDebounced = (userId: number, gameId: number, delay: number = 2000) => {
  if (viewTrackingTimeout) {
    clearTimeout(viewTrackingTimeout);
  }
  
  viewTrackingTimeout = setTimeout(() => {
    trackGameView(userId, gameId);
  }, delay);
};

// Clear user interactions (for testing/privacy)
export const clearUserInteractions = async (userId: number) => {
  try {
    const response = await axios.delete(`${API_URL}/interactions/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error clearing user interactions:', error);
    return null;
  }
};

