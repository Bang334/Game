import json
import argparse
import random
import math
from typing import List, Dict, Any, Tuple
from collections import defaultdict, Counter

import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, average_precision_score
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import re
import unicodedata

# ------------- Data Loading -------------
def load_data(json_path: str):
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data['games'], data['users']

# ------------- Utilities -------------
def normalize_cpu(cpu_str: str) -> float:
    if 'Pentium' in cpu_str:
        return 1.0
    elif 'i3' in cpu_str:
        return 3.0
    elif 'i5' in cpu_str:
        return 5.0
    elif 'i7' in cpu_str:
        return 7.0
    return 0.0

def normalize_gpu(gpu_str: str) -> float:
    gpu_map = {
        'Intel HD': 1.0,
        'GTX 650': 2.0,
        'GTX 750Ti': 3.0,
        'GTX 960': 4.0,
        'GTX 1050': 5.0,
        'GTX 1060': 6.0,
        'RTX 2060': 7.0,
        'RTX 3060': 8.0,
        'RTX 3070': 9.0,
    }
    return gpu_map.get(gpu_str, 0.0)

def normalize_ram(ram_str: str) -> float:
    try:
        s = str(ram_str).strip()
        m = re.search(r"([0-9]+(?:\.[0-9]+)?)", s)
        return float(m.group(1)) if m else 0.0
    except:
        return 0.0

def normalize_storage(stor_str: str) -> float:
    try:
        s = str(stor_str).strip()
        m = re.search(r"([0-9]+(?:\.[0-9]+)?)", s)
        return float(m.group(1)) if m else 0.0
    except:
        return 0.0

def compute_norms(games: List[Dict[str, Any]]) -> Dict[str, Tuple[float, float]]:
    years = [g['release_year'] for g in games]
    prices = [g['price'] for g in games]
    capacities = [g['capacity'] for g in games]
    cpus = [normalize_cpu(g['rec_spec']['cpu']) for g in games]
    gpus = [normalize_gpu(g['rec_spec']['gpu']) for g in games]
    rams = [normalize_ram(g['rec_spec']['ram']) for g in games]
    storages = [normalize_storage(g['rec_spec']['storage']) for g in games]
    return {
        'year': (min(years), max(years)),
        'price': (min(prices), max(prices)),
        'capacity': (min(capacities), max(capacities)),
        'cpu': (min(cpus), max(cpus)),
        'gpu': (min(gpus), max(gpus)),
        'ram': (min(rams), max(rams)),
        'storage': (min(storages), max(storages)),
    }

def build_id_maps(games: List[Dict[str, Any]]):
    game_by_id = {g['id']: g for g in games}
    all_genres = sorted({genre for g in games for genre in g['genre']})
    publishers = sorted({g['publisher'] for g in games})
    modes = sorted({g['mode'] for g in games})
    norms = compute_norms(games)
    return game_by_id, all_genres, publishers, modes, norms

def multi_hot(values: List[str], universe: List[str]) -> List[int]:
    s = set(values)
    return [1 if u in s else 0 for u in universe]

def popularity_features(games: List[Dict[str, Any]], users: List[Dict[str, Any]]) -> Dict[int, Dict[str, float]]:
    pop_fav = Counter()
    pop_buy = Counter()
    for u in users:
        pop_fav.update(u.get('favorite_games', []))
        pop_buy.update(u.get('purchased_games', []))
    features = {}
    for g in games:
        gid = g['id']
        total = pop_fav[gid] + pop_buy[gid]
        features[gid] = {
            'pop_total': float(total),
            'pop_fav': float(pop_fav[gid]),
            'pop_buy': float(pop_buy[gid]),
        }
    max_total = max((v['pop_total'] for v in features.values()), default=1.0)
    max_fav = max((v['pop_fav'] for v in features.values()), default=1.0)
    max_buy = max((v['pop_buy'] for v in features.values()), default=1.0)
    for gid, v in features.items():
        v['pop_total'] = v['pop_total'] / max_total if max_total > 0 else 0.0
        v['pop_fav'] = v['pop_fav'] / max_fav if max_fav > 0 else 0.0
        v['pop_buy'] = v['pop_buy'] / max_buy if max_buy > 0 else 0.0
    return features

def user_profile(user: Dict[str, Any], game_by_id: Dict[int, Dict[str, Any]], all_genres: List[str]) -> Dict[str, Any]:
    counts = Counter()
    years = []
    publishers = Counter()
    modes = Counter()
    inter = set(user.get('favorite_games', [])) | set(user.get('purchased_games', []))
    for gid in inter:
        g = game_by_id.get(gid)
        if not g: 
            continue
        counts.update(g['genre'])
        years.append(g['release_year'])
        publishers[g['publisher']] += 1
        modes[g['mode']] += 1
    total = sum(counts.values()) or 1
    genre_pref = {genre: counts[genre]/total for genre in all_genres}
    year_mean = float(np.mean(years)) if years else 0.0
    year_std = float(np.std(years)) if years else 1.0
    top_publisher = publishers.most_common(1)[0][0] if publishers else ""
    top_mode = modes.most_common(1)[0][0] if modes else ""
    multi_count = sum(1 for gid in inter if game_by_id.get(gid, {}).get('multiplayer', False))
    multi_pref = multi_count / len(inter) if inter else 0.0
    capacities = [game_by_id.get(gid, {}).get('capacity', 0) for gid in inter]
    capacity_mean = float(np.mean(capacities)) if capacities else 0.0
    capacity_std = float(np.std(capacities)) if capacities else 1.0
    cpus = [normalize_cpu(game_by_id.get(gid, {}).get('rec_spec', {}).get('cpu', '')) for gid in inter]
    cpu_mean = float(np.mean(cpus)) if cpus else 0.0
    cpu_std = float(np.std(cpus)) if cpus else 1.0
    gpus = [normalize_gpu(game_by_id.get(gid, {}).get('rec_spec', {}).get('gpu', '')) for gid in inter]
    gpu_mean = float(np.mean(gpus)) if gpus else 0.0
    gpu_std = float(np.std(gpus)) if gpus else 1.0
    rams = [normalize_ram(game_by_id.get(gid, {}).get('rec_spec', {}).get('ram', '')) for gid in inter]
    ram_mean = float(np.mean(rams)) if rams else 0.0
    ram_std = float(np.std(rams)) if rams else 1.0
    storages = [normalize_storage(game_by_id.get(gid, {}).get('rec_spec', {}).get('storage', '')) for gid in inter]
    storage_mean = float(np.mean(storages)) if storages else 0.0
    storage_std = float(np.std(storages)) if storages else 1.0
    return {
        'genre_pref': genre_pref,
        'year_mean': year_mean,
        'year_std': year_std,
        'top_publisher': top_publisher,
        'top_mode': top_mode,
        'multi_pref': multi_pref,
        'capacity_mean': capacity_mean,
        'capacity_std': capacity_std,
        'cpu_mean': cpu_mean,
        'cpu_std': cpu_std,
        'gpu_mean': gpu_mean,
        'gpu_std': gpu_std,
        'ram_mean': ram_mean,
        'ram_std': ram_std,
        'storage_mean': storage_mean,
        'storage_std': storage_std
    }

def content_similarity(user_prof: Dict[str, Any], game: Dict[str, Any], all_genres: List[str]) -> Dict[str, float]:
    g_vec = np.array([1.0 if gen in game['genre'] else 0.0 for gen in all_genres])
    p_vec = np.array([user_prof['genre_pref'][gen] for gen in all_genres])
    denom = (np.linalg.norm(g_vec) * np.linalg.norm(p_vec)) or 1.0
    genre_sim = float(np.dot(g_vec, p_vec) / denom)
    year_std = user_prof['year_std'] if user_prof['year_std'] != 0 else 1.0
    year_dist = abs(game['release_year'] - user_prof['year_mean']) / year_std
    year_score = float(math.exp(-year_dist))
    pub_match = 1.0 if user_prof['top_publisher'] and game['publisher'] == user_prof['top_publisher'] else 0.0
    mode_match = 1.0 if user_prof['top_mode'] and game['mode'] == user_prof['top_mode'] else 0.0
    multi_sim = 1.0 - abs(user_prof['multi_pref'] - (1.0 if game['multiplayer'] else 0.0))
    capacity_std = user_prof['capacity_std'] if user_prof['capacity_std'] != 0 else 1.0
    capacity_dist = abs(user_prof['capacity_mean'] - game['capacity']) / capacity_std
    capacity_score = float(math.exp(-capacity_dist))
    cpu_std = user_prof['cpu_std'] if user_prof['cpu_std'] != 0 else 1.0
    cpu_dist = abs(user_prof['cpu_mean'] - normalize_cpu(game.get('rec_spec', {}).get('cpu', ''))) / cpu_std
    cpu_score = float(math.exp(-cpu_dist))
    gpu_std = user_prof['gpu_std'] if user_prof['gpu_std'] != 0 else 1.0
    gpu_dist = abs(user_prof['gpu_mean'] - normalize_gpu(game.get('rec_spec', {}).get('gpu', ''))) / gpu_std
    gpu_score = float(math.exp(-gpu_dist))
    ram_std = user_prof['ram_std'] if user_prof['ram_std'] != 0 else 1.0
    ram_dist = abs(user_prof['ram_mean'] - normalize_ram(game.get('rec_spec', {}).get('ram', ''))) / ram_std
    ram_score = float(math.exp(-ram_dist))
    storage_std = user_prof['storage_std'] if user_prof['storage_std'] != 0 else 1.0
    storage_dist = abs(user_prof['storage_mean'] - normalize_storage(game.get('rec_spec', {}).get('storage', ''))) / storage_std
    storage_score = float(math.exp(-storage_dist))
    return {
        'genre_sim': genre_sim,
        'year_score': year_score,
        'pub_match': pub_match,
        'mode_match': mode_match,
        'multi_sim': multi_sim,
        'capacity_score': capacity_score,
        'cpu_score': cpu_score,
        'gpu_score': gpu_score,
        'ram_score': ram_score,
        'storage_score': storage_score
    }

def similar_users(users: List[Dict[str, Any]], pivot_user: Dict[str, Any]) -> List[Tuple[int, Dict[str, Any]]]:
    A = set(pivot_user.get('favorite_games', []))
    sims = []
    for u in users:
        if u['id'] == pivot_user['id']:
            continue
        overlap = len(A & set(u.get('favorite_games', [])))
        if overlap > 0:
            sims.append((overlap, u))
    sims.sort(key=lambda x: x[0], reverse=True)
    return sims[:5]

def collaborative_signal(game_id: int, neighbors: List[Tuple[int, Dict[str, Any]]]) -> Dict[str, float]:
    votes = 0.0
    weighted = 0.0
    for overlap, u in neighbors:
        liked = (game_id in u.get('favorite_games', [])) or (game_id in u.get('purchased_games', []))
        if liked:
            votes += 1.0
            weighted += overlap
    k = max(1.0, float(len(neighbors)))
    return {
        'cf_votes': votes / k,
        'cf_weighted': weighted / 5.0
    }

def scale_val(val: float, minv: float, maxv: float) -> float:
    return (val - minv) / (maxv - minv) if maxv > minv else 0.0

def encode_game(game: Dict[str, Any], all_genres: List[str], publishers: List[str], modes: List[str], norms: Dict[str, Tuple[float, float]]) -> List[float]:
    genre_vec = multi_hot(game['genre'], all_genres)
    pub_vec = multi_hot([game['publisher']], publishers)
    mode_vec = multi_hot([game['mode']], modes)
    year = scale_val(game['release_year'], *norms['year'])
    price = scale_val(game['price'], *norms['price'])
    multiplayer_flag = 1.0 if game['multiplayer'] else 0.0
    capacity = scale_val(game['capacity'], *norms['capacity'])
    cpu_norm = scale_val(normalize_cpu(game['rec_spec']['cpu']), *norms['cpu'])
    gpu_norm = scale_val(normalize_gpu(game['rec_spec']['gpu']), *norms['gpu'])
    ram_norm = scale_val(normalize_ram(game['rec_spec']['ram']), *norms['ram'])
    storage_norm = scale_val(normalize_storage(game['rec_spec']['storage']), *norms['storage'])
    return list(map(float, genre_vec + pub_vec + mode_vec)) + [year, price, multiplayer_flag, capacity, cpu_norm, gpu_norm, ram_norm, storage_norm]

def build_dataset(games, users):
    game_by_id, all_genres, publishers, modes, norms = build_id_maps(games)
    pop = popularity_features(games, users)
    X = []
    y = []
    pairs = []
    enc_game = {g['id']: encode_game(g, all_genres, publishers, modes, norms) for g in games}
    for user in users:
        prof = user_profile(user, game_by_id, all_genres)
        neighbors = similar_users(users, user)
        interacted = set(user.get('favorite_games', [])) | set(user.get('purchased_games', []))
        for gid in interacted:
            g = game_by_id.get(gid)
            if not g: 
                continue
            feat = []
            feat += enc_game[gid]
            feat += list(content_similarity(prof, g, all_genres).values())
            feat += list(collaborative_signal(gid, neighbors).values())
            feat += list(pop[gid].values())
            X.append(feat)
            y.append(1)
            pairs.append((user['id'], gid))
        unseen = [g['id'] for g in games if g['id'] not in interacted]
        k = min(max(5, len(interacted)*2), len(unseen))
        neg_ids = random.sample(unseen, k) if k > 0 else []
        for gid in neg_ids:
            g = game_by_id[gid]
            feat = []
            feat += enc_game[gid]
            feat += list(content_similarity(prof, g, all_genres).values())
            feat += list(collaborative_signal(gid, neighbors).values())
            feat += list(pop[gid].values())
            X.append(feat)
            y.append(0)
            pairs.append((user['id'], gid))
    return np.array(X, dtype=float), np.array(y, dtype=int), pairs, (all_genres, publishers, modes, norms)

def train_model(X: np.ndarray, y: np.ndarray, seed: int = 42):
    if len(np.unique(y)) < 2:
        clf = RandomForestClassifier(n_estimators=100, random_state=seed)
        clf.fit(X, y)
        return clf, None, None
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.25, random_state=seed, stratify=y)
    clf = RandomForestClassifier(
        n_estimators=400,
        max_depth=None,
        min_samples_split=2,
        min_samples_leaf=1,
        random_state=seed,
        n_jobs=-1
    )
    clf.fit(X_tr, y_tr)
    try:
        y_prob = clf.predict_proba(X_te)[:, 1]
        auc = roc_auc_score(y_te, y_prob)
        ap = average_precision_score(y_te, y_prob)
    except Exception:
        auc, ap = None, None
    return clf, auc, ap

def recommend_for_user(user_id: int, games, users, clf, feature_spaces, sim_search: np.ndarray):
    game_by_id, all_genres, publishers, modes, norms = build_id_maps(games)
    (all_genres, publishers, modes, norms) = feature_spaces

    user = next((u for u in users if u['id'] == user_id), None)
    if user is None:
        raise ValueError(f"User id {user_id} not found.")
    prof = user_profile(user, game_by_id, all_genres)
    neighbors = similar_users(users, user)

    interacted = set(user.get('favorite_games', [])) | set(user.get('purchased_games', []))
    pop = popularity_features(games, users)
    enc_game = {g['id']: encode_game(g, all_genres, publishers, modes, norms) for g in games}

    candidates = [g for g in games if g['id'] not in interacted]
    X_cand = []
    ids = []
    id_to_idx = {g['id']: idx for idx, g in enumerate(games)}
    for g in candidates:
        feat = []
        feat += enc_game[g['id']]
        feat += list(content_similarity(prof, g, all_genres).values())
        feat += list(collaborative_signal(g['id'], neighbors).values())
        feat += list(pop[g['id']].values())
        X_cand.append(feat)
        ids.append(g['id'])
    if not X_cand:
        return []

    sims_cand = np.array([sim_search[id_to_idx[gid]] for gid in ids], dtype=float)

    # Weighting: if no history, 100% keyword; else 80% keyword + 20% model
    alpha = 1.0 if len(interacted) == 0 else 0.8

    # If no history, skip model scoring entirely to avoid single-class issues
    if alpha == 1.0:
        probs = np.zeros(len(X_cand), dtype=float)
    else:
        # Predict probabilities safely (handle single-class model)
        proba = clf.predict_proba(np.array(X_cand, dtype=float))
        if proba.ndim == 2 and proba.shape[1] >= 2:
            probs = proba[:, 1]
        else:
            # Single-class case: fall back to neutral probability
            probs = np.full(len(X_cand), 0.5, dtype=float)
        # Normalize probs to [0,1] for fair combination
        p_min, p_max = float(np.min(probs)), float(np.max(probs))
        if p_max > p_min:
            probs = (probs - p_min) / (p_max - p_min)

    combined = alpha * sims_cand + (1.0 - alpha) * probs

    ranked = sorted(zip(ids, combined, sims_cand, probs), key=lambda x: x[1], reverse=True)
    return [(game_by_id[i], float(score), float(kw), float(model)) for i, score, kw, model in ranked]

def main():
    parser = argparse.ArgumentParser(description="Model-based Hybrid Game Recommender")
    parser.add_argument("--data", type=str, default="games.json", help="Path to games.json")
    parser.add_argument("--user_id", type=int, default=1, help="Target user id to recommend for")
    parser.add_argument("--top_k", type=int, default=5, help="Number of recommendations")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    args = parser.parse_args()

    random.seed(args.seed)
    np.random.seed(args.seed)

    games, users = load_data(args.data)
    search_text = input("Tìm kiếm: ").strip().lower()

    model = SentenceTransformer('paraphrase-multilingual-mpnet-base-v2')

    def game_to_text(g):
        fields = []
        for k, v in g.items():
            if isinstance(v, (str, int, float)):
                fields.append(str(v))
            elif isinstance(v, list):
                if k == 'platform':
                    tokens = []
                    for s in v:
                        for t in str(s).split(','):
                            t = t.strip()
                            if t:
                                tokens.append(t)
                    fields.append(' '.join(tokens))
                else:
                    fields.append(' '.join(map(str, v)))
            elif isinstance(v, dict):
                fields.append(' '.join(f"{kk}:{vv}" for kk, vv in v.items()))
        return ' '.join(fields)

    search_vec = model.encode([search_text]) if search_text.strip() else None
    game_texts = [game_to_text(g) for g in games]
    game_vecs = model.encode(game_texts)

    if search_vec is not None:
        sim_search = cosine_similarity(search_vec, game_vecs)[0]
        sim_min = np.min(sim_search)
        sim_max = np.max(sim_search)
        if sim_max > sim_min:
            sim_search = (sim_search - sim_min) / (sim_max - sim_min)

        q = search_text.lower()
        def strip_accents(s: str) -> str:
            return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')
        q_norm = strip_accents(q)

        attributes = {
            'Action': 'hành động chiến đấu bắn nhau action fighting',
            'Horror': 'kinh dị đáng sợ ma quái sợ hãi horror scary frightening',
            'Shooter': 'bắn súng shooter gun battle',
            'Strategy': 'chiến thuật chiến lược strategy tactic',
            'Adventure': 'phiêu lưu thám hiểm adventure exploration',
            'RPG': 'nhập vai rpg role playing',
            'Puzzle': 'giải đố puzzle brain teaser',
            'Casual': 'giải trí thư giãn casual fun relaxing',
            'Simulation': 'mô phỏng simulation sim',
            'Sports': 'thể thao sports football soccer',
            'Fighting': 'đối kháng fighting combat',
            'Board': 'cờ bàn board game chess',
            'Party': 'tiệc tùng party multiplayer fun',
            'Platformer': 'nhảy platformer jump platform',
            'Fantasy': 'huyền ảo fantasy magic mythical',
            'cheap': 'game giá rẻ tiền giá rẻ low price affordable',
            'expensive': 'game giá đắt tiền giá cao expensive premium',
            'multiplayer': 'đa người chơi multiplayer online co-op',
            'offline': 'game offline chơi một người single player',
            'online': 'game online chơi mạng multiplayer',
            'mobile': 'game mobile di động android ios',
            'pc': 'game pc máy tính windows',
            'new': 'game mới phát hành mới recent release',
            'old': 'game cũ classic retro old'
        }

        attr_texts = list(attributes.values())
        attr_vecs = model.encode(attr_texts)
        query_vec = model.encode([q_norm])[0]
        attr_sims = cosine_similarity([query_vec], attr_vecs)[0]
        max_idx = np.argmax(attr_sims)
        max_sim = attr_sims[max_idx]

        if max_sim > 0.5:
            matched_attr = list(attributes.keys())[max_idx]
            print(f"Đã phát hiện thuộc tính: {matched_attr} với độ tương đồng {max_sim:.2f}")
            boost_scores = np.zeros(len(games))
            mean_price = np.mean([g['price'] for g in games])
            median_year = np.median([g['release_year'] for g in games])
            for idx, g in enumerate(games):
                if matched_attr in g.get('genre', []):
                    boost_scores[idx] = 1.0
                elif matched_attr == 'cheap' and g['price'] <= mean_price:
                    boost_scores[idx] = 1.0
                elif matched_attr == 'expensive' and g['price'] > mean_price:
                    boost_scores[idx] = 1.0
                elif matched_attr == 'multiplayer' and g['multiplayer']:
                    boost_scores[idx] = 1.0
                elif matched_attr == 'offline' and g['mode'] == 'Offline':
                    boost_scores[idx] = 1.0
                elif matched_attr == 'online' and g['mode'] == 'Online':
                    boost_scores[idx] = 1.0
                elif matched_attr == 'mobile' and 'Mobile' in ''.join(g.get('platform', [])):
                    boost_scores[idx] = 1.0
                elif matched_attr == 'pc' and 'PC' in ''.join(g.get('platform', [])):
                    boost_scores[idx] = 1.0
                elif matched_attr == 'new' and g['release_year'] >= median_year:
                    boost_scores[idx] = 1.0
                elif matched_attr == 'old' and g['release_year'] < median_year:
                    boost_scores[idx] = 1.0
            sim_search = 0.6 * sim_search + 0.4 * boost_scores

        cheap_tokens = ['gia re', 're', 're tien', 'gia re tien']
        expensive_tokens = ['gia cao', 'dat', 'dat tien', 'gia dat tien']
        prices = np.array([g['price'] for g in games], dtype=float)
        pr_min, pr_max = float(np.min(prices)), float(np.max(prices))
        if pr_max > pr_min:
            price_norm = (prices - pr_min) / (pr_max - pr_min)
        else:
            price_norm = np.zeros_like(prices)
        if any(tok in q_norm for tok in cheap_tokens):
            # Strictly sort by ascending price (higher score for cheaper games)
            sim_search = 1.0 - price_norm
        elif any(tok in q_norm for tok in expensive_tokens):
            # Strictly sort by descending price (higher score for more expensive games)
            sim_search = price_norm

        smin, smax = float(np.min(sim_search)), float(np.max(sim_search))
        if smax > smin:
            sim_search = (sim_search - smin) / (smax - smin)
    else:
        sim_search = np.zeros(len(games))

    X, y, pairs, feature_spaces = build_dataset(games, users)
    clf, auc, ap = train_model(X, y, seed=args.seed)

    recs = recommend_for_user(args.user_id, games, users, clf, feature_spaces, sim_search)
    print("=== Model-based Hybrid Recommender ===")
    print(f"User ID: {args.user_id}")
    if auc is not None and ap is not None:
        print(f"Validation AUC: {auc:.3f} | AP: {ap:.3f}")
    else:
        print("Validation metrics unavailable (dataset too small or degenerate).")
    print("\nTop recommendations:")
    game_by_id, all_genres, publishers, modes, norms = build_id_maps(games)
    enc_game = {g['id']: encode_game(g, all_genres, publishers, modes, norms) for g in games}
    feature_names = [f"Thể loại: {g}" for g in all_genres] + [f"Nhà sản xuất: {p}" for p in publishers] + [f"Chế độ: {m}" for m in modes] + ["Năm phát hành", "Giá", "Multiplayer", "Dung lượng", "CPU", "GPU", "RAM", "Storage"]
    with open("top_features.txt", "w", encoding="utf-8") as f:
        f.write("STT, Tên game, Điểm tổng, Điểm từ khóa, " + ", ".join(feature_names) + "\n")
        inter = set(next((u for u in users if u['id'] == args.user_id), {}).get('favorite_games', [])) | set(next((u for u in users if u['id'] == args.user_id), {}).get('purchased_games', []))
        for i, (g, score, kw_score, model_score) in enumerate(recs, 1):
            weights = enc_game[g['id']]
            if len(inter) == 0:
                zero_weights = [0.0] * len(weights)
                line = [str(i), g['name'], str(round(score,3)), str(round(kw_score,3))] + [str(0.0) for _ in zero_weights]
            else:
                line = [str(i), g['name'], str(round(score,3)), str(round(kw_score,3))] + [str(round(w,3)) for w in weights]
            f.write(", ".join(line) + "\n")

if __name__ == "__main__":
    main()
    try:
        import pandas as pd
        import matplotlib.pyplot as plt
        df = pd.read_csv("top_features.txt", sep=",", skipinitialspace=True)
        feature_names = list(df.columns[3:])
        feature_sums = df[feature_names].sum()
        plt.figure(figsize=(12,6))
        plt.bar(feature_names, feature_sums)
        plt.xticks(rotation=90)
        plt.ylabel('Tổng trọng số đặc trưng trong top')
        plt.title('Phân bố trọng số các đặc trưng trong top game được gợi ý')
        plt.tight_layout()
        plt.savefig('feature_importance_chart.png')
        plt.show()
    except Exception as e:
        print(f"Không thể vẽ biểu đồ: {e}")