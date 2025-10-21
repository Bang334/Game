# 🎮 Game Recommendation System

## 📁 Cấu trúc thư mục

```
game_recommendation_system/
├── content_similarity_benchmark.py       # Core recommendation algorithm
├── similar_games_api.py                  # Flask API server
├── requirements.txt                     # Dependencies
├── cpu.json                             # CPU benchmark scores
├── gpu.json                             # GPU benchmark scores
└── README.md                            # This file
```

## 🚀 Cách sử dụng

### 1. Cài đặt dependencies
```bash
cd game_recommendation_system
pip install -r requirements.txt
```

### 2. Chạy API server
```bash
python similar_games_api.py
```

### 3. API endpoints
- `GET /api/similar-games/<game_id>?user_id=<user_id>`
- Trả về 8 games tương tự với similarity & compatibility scores

## 🎯 Tính năng

### 📊 Similarity Score (60%)
- **Content-based**: Tên, mô tả, thể loại, publisher
- **TF-IDF + Cosine Similarity**

### ⚙️ Compatibility Score (40%)
- **CPU/GPU/RAM**: 59% (phần cứng)
- **Price**: 13% (giá cả)
- **Rating**: 10% (chất lượng)
- **Age Rating**: 10% (độ tuổi)
- **Release Year**: 8% (năm phát hành)

## 📈 Kết quả
- **Real-time recommendations**
- **Personalized filtering** (loại bỏ games đã mua/thích)
- **7-factor compatibility scoring**
- **CORS support** cho frontend integration
