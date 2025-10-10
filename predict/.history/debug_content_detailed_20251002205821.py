#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import json
import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import StandardScaler
from scipy.sparse import hstack, csr_matrix

def load_data():
    """Load game and benchmark data"""
    # Load games
    with open('game.json', 'r', encoding='utf-8') as f:
        game_data = json.load(f)
    
    # Load CPU benchmarks
    with open('cpu.json', 'r', encoding='utf-8') as f:
        cpu_data = json.load(f)
    
    # Load GPU benchmarks  
    with open('gpu.json', 'r', encoding='utf-8') as f:
        gpu_data = json.load(f)
    
    return game_data, cpu_data, gpu_data

def get_cpu_score(cpu_name, cpu_benchmarks):
    """Convert CPU name to benchmark score"""
    cpu_name = str(cpu_name).lower()
    
    # Flatten all CPU categories
    all_cpus = {}
    for category in cpu_benchmarks.values():
        if isinstance(category, dict):
            all_cpus.update(category)
    
    # Find matching CPU
    for cpu, score in all_cpus.items():
        if cpu.lower() in cpu_name or cpu_name in cpu.lower():
            return score
    return 1000  # Default score

def get_gpu_score(gpu_name, gpu_benchmarks):
    """Convert GPU name to benchmark score"""
    gpu_name = str(gpu_name).lower()
    
    # Flatten all GPU categories
    all_gpus = {}
    for category in gpu_benchmarks.values():
        if isinstance(category, dict):
            all_gpus.update(category)
    
    # Find matching GPU
    for gpu, score in all_gpus.items():
        if gpu.lower() in gpu_name or gpu_name in gpu.lower():
            return score
    return 1000  # Default score

def build_content_features_detailed(games_data, cpu_benchmarks, gpu_benchmarks):
    """Build content features with detailed explanation"""
    
    print("=== BUILDING CONTENT FEATURES ===")
    print(f"Total games: {len(games_data['games'])}")
    
    # Prepare text and numerical features
    text_features = []
    numerical_features = []
    
    print("\n--- Processing Each Game ---")
    
    for i, game in enumerate(games_data['games']):
        print(f"\nGame {i+1}: {game['name']}")
        
        # === TEXT FEATURES ===
        genre_str = ' '.join(game.get('genre', []))
        publisher = game.get('publisher', '')
        age_rating = game.get('age_rating', '')
        platform_str = ' '.join(game.get('platform', []))
        mode = game.get('mode', '')
        multiplayer = 'multiplayer' if game.get('multiplayer', False) else 'singleplayer'
        language_str = ' '.join(game.get('language', []))
        
        text_feature = f"{genre_str} {publisher} {age_rating} {platform_str} {mode} {multiplayer} {language_str}"
        text_features.append(text_feature)
        
        print(f"  Text Feature: '{text_feature}'")
        
        # === NUMERICAL FEATURES ===
        # 1. Price (log-scaled)
        price = game.get('price', 0)
        log_price = np.log1p(price)  # log(1 + price)
        
        # 2. CPU Score (min_spec)
        min_cpu = game.get('min_spec', {}).get('cpu', '')
        cpu_score = get_cpu_score(min_cpu, cpu_benchmarks)
        
        # 3. GPU Score (min_spec)  
        min_gpu = game.get('min_spec', {}).get('gpu', '')
        gpu_score = get_gpu_score(min_gpu, gpu_benchmarks)
        
        # 4. RAM (GB)
        min_ram = game.get('min_spec', {}).get('ram', '0GB')
        ram_gb = float(min_ram.replace('GB', '').replace('MB', '').replace('gb', '').replace('mb', ''))
        if 'mb' in min_ram.lower():
            ram_gb = ram_gb / 1024  # Convert MB to GB
            
        # 5. Storage (GB)
        storage = game.get('min_spec', {}).get('storage', '0GB')
        storage_gb = float(storage.replace('GB', '').replace('MB', '').replace('gb', '').replace('mb', ''))
        if 'mb' in storage.lower():
            storage_gb = storage_gb / 1024  # Convert MB to GB
        
        numerical_feature = [log_price, cpu_score, gpu_score, ram_gb, storage_gb]
        numerical_features.append(numerical_feature)
        
        print(f"  Numerical Features:")
        print(f"    Price: {price:,} VND -> Log Price: {log_price:.3f}")
        print(f"    CPU: '{min_cpu}' -> Score: {cpu_score}")
        print(f"    GPU: '{min_gpu}' -> Score: {gpu_score}")
        print(f"    RAM: '{min_ram}' -> {ram_gb:.2f} GB")
        print(f"    Storage: '{storage}' -> {storage_gb:.2f} GB")
    
    # === TF-IDF VECTORIZATION ===
    print(f"\n--- TF-IDF Vectorization ---")
    tfidf = TfidfVectorizer(stop_words='english', max_features=1000)
    text_matrix = tfidf.fit_transform(text_features)
    
    print(f"Text matrix shape: {text_matrix.shape}")
    print(f"TF-IDF features: {len(tfidf.get_feature_names_out())}")
    print(f"Sample TF-IDF features: {list(tfidf.get_feature_names_out())[:10]}")
    
    # === NUMERICAL STANDARDIZATION ===
    print(f"\n--- Numerical Standardization ---")
    numerical_array = np.array(numerical_features)
    scaler = StandardScaler()
    numerical_scaled = scaler.fit_transform(numerical_array)
    
    print(f"Numerical matrix shape: {numerical_scaled.shape}")
    print(f"Original numerical stats:")
    print(f"  Mean: {numerical_array.mean(axis=0)}")
    print(f"  Std:  {numerical_array.std(axis=0)}")
    print(f"Scaled numerical stats:")
    print(f"  Mean: {numerical_scaled.mean(axis=0)}")
    print(f"  Std:  {numerical_scaled.std(axis=0)}")
    
    # === COMBINE FEATURES ===
    print(f"\n--- Combining Features ---")
    numerical_sparse = csr_matrix(numerical_scaled)
    combined_features = hstack([text_matrix, numerical_sparse])
    
    print(f"Combined matrix shape: {combined_features.shape}")
    print(f"Total features: {combined_features.shape[1]}")
    print(f"  Text features: {text_matrix.shape[1]}")
    print(f"  Numerical features: {numerical_sparse.shape[1]}")
    
    return combined_features, tfidf, scaler

def calculate_content_similarity_detailed(combined_features):
    """Calculate cosine similarity with details"""
    
    print(f"\n=== CALCULATING COSINE SIMILARITY ===")
    
    # Calculate cosine similarity
    similarity_matrix = cosine_similarity(combined_features)
    
    print(f"Similarity matrix shape: {similarity_matrix.shape}")
    print(f"Similarity range: [{similarity_matrix.min():.3f}, {similarity_matrix.max():.3f}]")
    
    # Normalize to 0-1 range
    similarity_normalized = (similarity_matrix + 1) / 2
    
    print(f"Normalized similarity range: [{similarity_normalized.min():.3f}, {similarity_normalized.max():.3f}]")
    
    return similarity_normalized

def show_content_score_example(games_data, similarity_matrix, user_id=1, target_game_id=7):
    """Show detailed content score calculation for a specific example"""
    
    print(f"\n=== CONTENT SCORE EXAMPLE ===")
    
    # Get user's interacted games
    users = games_data['users']
    user = next(u for u in users if u['id'] == user_id)
    
    favorite_games = user.get('favorite_games', [])
    purchased_games = user.get('purchased_games', [])
    interacted_games = list(set(favorite_games + purchased_games))
    
    print(f"User: {user['name']} (ID: {user_id})")
    print(f"Favorite games: {favorite_games}")
    print(f"Purchased games: {purchased_games}")
    print(f"All interacted games: {interacted_games}")
    
    # Get target game
    target_game = next(g for g in games_data['games'] if g['id'] == target_game_id)
    print(f"\nTarget game: {target_game['name']} (ID: {target_game_id})")
    
    # Calculate content score
    print(f"\n--- Content Score Calculation ---")
    
    similarities = []
    for game_id in interacted_games:
        # Convert to 0-based index
        game_idx = game_id - 1
        target_idx = target_game_id - 1
        
        similarity = similarity_matrix[target_idx, game_idx]
        similarities.append(similarity)
        
        interacted_game = next(g for g in games_data['games'] if g['id'] == game_id)
        print(f"  Similarity with {interacted_game['name']} (ID: {game_id}): {similarity:.4f}")
    
    # Final content score (average similarity)
    content_score = np.mean(similarities) if similarities else 0.0
    
    print(f"\nFinal Content Score: {content_score:.4f}")
    print(f"Calculation: ({' + '.join([f'{s:.4f}' for s in similarities])}) / {len(similarities)} = {content_score:.4f}")
    
    return content_score

def main():
    """Main function"""
    
    # Load data
    games_data, cpu_benchmarks, gpu_benchmarks = load_data()
    
    # Build content features
    combined_features, tfidf, scaler = build_content_features_detailed(games_data, cpu_benchmarks, gpu_benchmarks)
    
    # Calculate similarity
    similarity_matrix = calculate_content_similarity_detailed(combined_features)
    
    # Show example
    print("\n" + "="*60)
    content_score = show_content_score_example(games_data, similarity_matrix, user_id=1, target_game_id=7)
    
    # Show another example
    print("\n" + "="*60)
    content_score2 = show_content_score_example(games_data, similarity_matrix, user_id=1, target_game_id=5)
    
    # Show similarity matrix sample
    print(f"\n=== SIMILARITY MATRIX SAMPLE ===")
    print("First 5x5 games similarity:")
    print(similarity_matrix[:5, :5])

if __name__ == "__main__":
    main()
