"""
Content Similarity Engine
Pure content-based similarity for finding similar games
Does NOT require user data - only game attributes
"""

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler


class ContentSimilarityEngine:
    """Engine for computing content-based similarity between games"""
    
    def __init__(self):
        self.games_data = None
        self.similarity_matrix = None
    
    def load_games(self, games):
        """Load games data and build similarity matrix"""
        self.games_data = games
        self.build_similarity_matrix()
    
    def build_similarity_matrix(self):
        """Build content similarity matrix using TF-IDF and game attributes"""
        if not self.games_data:
            raise ValueError("No games data loaded")
        
        print(f"🔍 Building content similarity matrix for {len(self.games_data)} games...")
        
        # Extract text and numeric features
        text_features = []
        numeric_features = []
        
        for game in self.games_data:
            # === TEXT FEATURES ===
            features_text = []
            
            # Name
            if game.get('name'):
                features_text.append(game['name'])
            
            # Description (first 100 chars)
            if game.get('description'):
                features_text.append(game['description'][:100])
            
            # Publisher
            if game.get('publisher'):
                features_text.append(game['publisher'])
            
            # Genres (weighted 3x - most important)
            genres = game.get('genre', [])
            if isinstance(genres, list):
                features_text.extend(genres * 3)
            
            # Platforms
            platforms = game.get('platform', [])
            if isinstance(platforms, list):
                features_text.extend(platforms)
            
            # Mode
            if game.get('mode'):
                features_text.append(game['mode'])
            
            # Age rating
            if game.get('age_rating'):
                features_text.append(game['age_rating'])
            
            # Multiplayer
            if game.get('multiplayer'):
                features_text.append('multiplayer')
            else:
                features_text.append('singleplayer')
            
            text_features.append(' '.join(features_text))
            
            # === NUMERIC FEATURES ===
            # Rating (normalized 0-1)
            rating = game.get('rating', 0)
            rating_normalized = rating / 5.0 if rating > 0 else 0
            
            # Price (log scale, normalized 0-1)
            price = game.get('price', 0)
            price_normalized = np.log10(max(price, 1)) / 7.0
            
            # Downloads (log scale, normalized 0-1)
            downloads = game.get('downloads', 0)
            downloads_normalized = np.log10(max(downloads, 1)) / 9.0
            
            # Release year (normalized)
            release_date = game.get('release_date', '2020-01-01')
            try:
                release_year = int(release_date.split('-')[0]) if release_date else 2020
            except:
                release_year = 2020
            year_normalized = (release_year - 1990) / 35.0
            
            numeric_features.append([
                rating_normalized,
                price_normalized,
                downloads_normalized,
                year_normalized
            ])
        
        # Build TF-IDF matrix for text features
        vectorizer = TfidfVectorizer(max_features=500, stop_words='english')
        text_matrix = vectorizer.fit_transform(text_features)
        
        # Normalize numeric features
        numeric_array = np.array(numeric_features)
        scaler = StandardScaler()
        numeric_matrix = scaler.fit_transform(numeric_array)
        
        # Combine text and numeric features
        from scipy.sparse import hstack, csr_matrix
        numeric_sparse = csr_matrix(numeric_matrix)
        
        # Weight: Text (1x), Numeric (0.5x)
        combined_matrix = hstack([text_matrix, numeric_sparse * 0.5])
        
        # Calculate cosine similarity
        self.similarity_matrix = cosine_similarity(combined_matrix)
        
        print(f"✅ Similarity matrix built: {self.similarity_matrix.shape}")
        print(f"   Text features: {text_matrix.shape[1]} dimensions")
        print(f"   Numeric features: {numeric_matrix.shape[1]} dimensions")
        print(f"   Similarity range: {self.similarity_matrix.min():.3f} - {self.similarity_matrix.max():.3f}")
    
    def get_similar_games(self, game_id, top_n=8, exclude_ids=None):
        """
        Get similar games for a specific game
        
        Args:
            game_id: ID of the target game
            top_n: Number of similar games to return
            exclude_ids: List of game IDs to exclude (e.g., purchased games)
        
        Returns:
            List of similar games with similarity scores
        """
        if self.similarity_matrix is None:
            raise ValueError("Similarity matrix not built. Call build_similarity_matrix() first.")
        
        # Find game index
        game_idx = next((i for i, g in enumerate(self.games_data) if g['id'] == game_id), None)
        if game_idx is None:
            raise ValueError(f"Game {game_id} not found")
        
        # Get similarity scores for this game
        similarities = self.similarity_matrix[game_idx]
        
        # Create list of (game_id, similarity) pairs
        similar_games = []
        exclude_set = set(exclude_ids) if exclude_ids else set()
        
        for i, sim_score in enumerate(similarities):
            other_game = self.games_data[i]
            other_id = other_game['id']
            
            # Skip self and excluded games
            if other_id == game_id or other_id in exclude_set:
                continue
            
            similar_games.append({
                'game': other_game,
                'similarity_score': float(sim_score)
            })
        
        # Sort by similarity (descending)
        similar_games.sort(key=lambda x: x['similarity_score'], reverse=True)
        
        # Return top N
        return similar_games[:top_n]


def get_similar_games_simple(games, target_game_id, top_n=8, exclude_ids=None):
    """
    Convenience function to get similar games without creating an instance
    
    Args:
        games: List of all games
        target_game_id: ID of the game to find similar games for
        top_n: Number of similar games to return
        exclude_ids: List of game IDs to exclude
    
    Returns:
        List of similar games with full details
    """
    engine = ContentSimilarityEngine()
    engine.load_games(games)
    
    similar = engine.get_similar_games(target_game_id, top_n, exclude_ids)
    
    # Return with full game details
    result = []
    for item in similar:
        game = item['game']
        result.append({
            'id': game['id'],
            'name': game['name'],
            'description': game.get('description', ''),
            'image': game.get('image', ''),
            'price': game.get('price', 0),
            'rating': game.get('rating', 0),
            'downloads': game.get('downloads', 0),
            'publisher': game.get('publisher', ''),
            'genre': game.get('genre', []),
            'platform': game.get('platform', []),
            'release_date': game.get('release_date', ''),
            'age_rating': game.get('age_rating', ''),
            'similarity_score': item['similarity_score'],
            'multiplayer': game.get('multiplayer', False)
        })
    
    return result


if __name__ == '__main__':
    # Test the engine
    print("Testing Content Similarity Engine...")
    
    # Load sample data
    import json
    with open('game.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
        games = data['games']
    
    # Test
    similar = get_similar_games_simple(games, target_game_id=1, top_n=5)
    
    print(f"\nTop 5 similar games to game 1:")
    for i, game in enumerate(similar, 1):
        print(f"{i}. {game['name']} (similarity: {game['similarity_score']:.3f})")

