import json
import numpy as np
import pandas as pd
from scipy.sparse.linalg import svds
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import warnings
warnings.filterwarnings('ignore')

class SimpleGameRecommender:
    def __init__(self):
        self.games_data = None
        self.users_data = None
        self.cpu_data = None
        self.gpu_data = None
        self.user_item_matrix = None
        self.svd_model = None
        
    def load_data(self):
        """Load data from JSON files"""
        try:
            with open('game.json', 'r', encoding='utf-8') as f:
                data = json.load(f)
                self.games_data = data['games']
                self.users_data = data['users']
            
            with open('cpu.json', 'r', encoding='utf-8') as f:
                self.cpu_data = json.load(f)
            
            with open('gpu.json', 'r', encoding='utf-8') as f:
                self.gpu_data = json.load(f)
                
            print("Data loaded successfully!")
            return True
        except Exception as e:
            print(f"Error loading data: {e}")
            return False
    
    def preprocess_data(self):
        """Preprocess data for SVD"""
        user_game_ratings = []
        
        for user in self.users_data:
            user_id = user['id']
            favorites = user.get('favorite_games', [])
            purchased = user.get('purchased_games', [])
            
            for game in self.games_data:
                game_id = game['id']
                if game_id in favorites:
                    rating = 5.0
                elif game_id in purchased:
                    rating = 3.0
                else:
                    rating = 0.0
                
                user_game_ratings.append({
                    'user_id': user_id,
                    'game_id': game_id,
                    'rating': rating
                })
        
        ratings_df = pd.DataFrame(user_game_ratings)
        self.user_item_matrix = ratings_df.pivot(index='user_id', columns='game_id', values='rating').fillna(0)
        
        print(f"User-Item Matrix shape: {self.user_item_matrix.shape}")
        print("Data preprocessed successfully!")
    
    def train_svd_model(self, k=2):
        """Train SVD model"""
        try:
            user_ratings_mean = np.mean(self.user_item_matrix.values, axis=1)
            ratings_demeaned = self.user_item_matrix.values - user_ratings_mean.reshape(-1, 1)
            
            U, sigma, Vt = svds(ratings_demeaned, k=k)
            sigma = np.diag(sigma)
            
            predicted_ratings = np.dot(np.dot(U, sigma), Vt) + user_ratings_mean.reshape(-1, 1)
            
            self.svd_model = {
                'U': U,
                'sigma': sigma,
                'Vt': Vt,
                'user_ratings_mean': user_ratings_mean,
                'predicted_ratings': predicted_ratings
            }
            
            print(f"SVD model trained successfully with k={k}")
            return True
        except Exception as e:
            print(f"Error training SVD: {e}")
            return False
    
    def get_recommendations(self, user_id, top_n=5):
        """Get recommendations for a user"""
        if self.svd_model is None:
            return []
        
        try:
            user_idx = user_id - 1
            if user_idx >= len(self.svd_model['predicted_ratings']):
                return []
            
            user_predictions = self.svd_model['predicted_ratings'][user_idx]
            
            user_data = next((u for u in self.users_data if u['id'] == user_id), None)
            if user_data:
                interacted_games = set(user_data.get('favorite_games', []) + 
                                     user_data.get('purchased_games', []))
            else:
                interacted_games = set()
            
            recommendations = []
            for game_idx, predicted_rating in enumerate(user_predictions):
                game_id = game_idx + 1
                if game_id not in interacted_games:
                    game = next((g for g in self.games_data if g['id'] == game_id), None)
                    if game:
                        recommendations.append({
                            'game_id': game_id,
                            'game_name': game['name'],
                            'predicted_rating': predicted_rating,
                            'actual_rating': game.get('rating', 0),
                            'genre': game.get('genre', []),
                            'price': game.get('price', 0)
                        })
            
            recommendations.sort(key=lambda x: x['predicted_rating'], reverse=True)
            return recommendations[:top_n]
            
        except Exception as e:
            print(f"Error getting recommendations: {e}")
            return []
    
    def display_recommendations(self, recommendations, user_name):
        """Display recommendations"""
        print(f"\n=== Recommendations for {user_name} ===")
        
        if not recommendations:
            print("No recommendations found.")
            return
        
        for i, rec in enumerate(recommendations, 1):
            print(f"{i}. {rec['game_name']}")
            print(f"   Rating: {rec['actual_rating']}/5.0")
            print(f"   Predicted Score: {rec['predicted_rating']:.3f}")
            print(f"   Genre: {', '.join(rec['genre'])}")
            print(f"   Price: {rec['price']:,} VND")
            print("-" * 40)

def main():
    print("Starting Game Recommendation System Test...")
    
    recommender = SimpleGameRecommender()
    
    if not recommender.load_data():
        return
    
    recommender.preprocess_data()
    
    if not recommender.train_svd_model(k=2):
        return
    
    print("\n" + "="*60)
    print("TESTING RECOMMENDATIONS")
    print("="*60)
    
    for user_id in [1, 2, 3]:
        user_data = next((u for u in recommender.users_data if u['id'] == user_id), None)
        if user_data:
            print(f"\nUser: {user_data['name']} (ID: {user_id})")
            print(f"Favorite Games: {user_data.get('favorite_games', [])}")
            print(f"Purchased Games: {user_data.get('purchased_games', [])}")
            
            recommendations = recommender.get_recommendations(user_id, top_n=5)
            recommender.display_recommendations(recommendations, user_data['name'])
    
    print("\nTest completed successfully!")

if __name__ == "__main__":
    main()
