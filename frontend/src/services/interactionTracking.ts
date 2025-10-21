// Note: Using existing SQLite database data instead of real-time tracking
// All interaction data is already available in the SQLite database

// Track user interaction (disabled - using existing SQLite data)
export const trackInteraction = async (
  userId: number,
  gameId: number,
  interactionType: 'view' | 'like' | 'purchase',
  _rating?: number
): Promise<boolean> => {
  // Interaction tracking disabled - using existing SQLite database
  console.log(`📊 Interaction logged locally: ${interactionType} - game ${gameId} for user ${userId} (using existing SQLite data)`);
  return true;
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

