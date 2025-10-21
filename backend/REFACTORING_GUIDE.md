# Backend Refactoring Guide

## 📋 Tổng quan

Đã refactor backend để **tách biệt logic khỏi routing**, giúp code dễ maintain, debug và test hơn.

## 🏗️ Cấu trúc mới

### **Trước khi refactor:**
```
routes/
  ├── customer.ts  (876 lines - chứa TẤT CẢ logic)
  └── admin.ts     (307 lines - chứa TẤT CẢ logic)

controllers/
  ├── gameController.ts     (EMPTY ❌)
  ├── userController.ts     (EMPTY ❌)
  ├── purchaseController.ts (EMPTY ❌)
  └── wishlistController.ts (EMPTY ❌)
```

### **Sau khi refactor:**
```
routes/
  ├── customer.ts  (98 lines - CHỈ routing)
  └── admin.ts     (72 lines - CHỈ routing)

controllers/
  ├── index.ts              (Export tất cả controllers)
  ├── gameController.ts     (217 lines - Game logic)
  ├── userController.ts     (86 lines - User logic)
  ├── purchaseController.ts (165 lines - Purchase logic)
  ├── wishlistController.ts (104 lines - Wishlist logic)
  ├── reviewController.ts   (232 lines - Review logic)
  ├── balanceController.ts  (234 lines - Balance logic)
  ├── viewController.ts     (75 lines - View tracking logic)
  └── adminController.ts    (19 lines - Admin logic)
```

---

## ✅ Lợi ích

### 1. **Separation of Concerns**
- **Router**: Chỉ định nghĩa routes và gọi controller
- **Controller**: Xử lý business logic
- **Model**: Tương tác với database

### 2. **Dễ Debug**
```typescript
// Trước: Logic lẫn lộn trong router
router.get('/games', async (req, res) => {
  try {
    // 50+ lines logic ở đây
  } catch (error) {
    // Khó biết lỗi từ đâu
  }
})

// Sau: Rõ ràng, dễ trace
router.get('/games', GameController.getAllGames)
```

### 3. **Dễ Test**
```typescript
// Có thể test từng controller độc lập
describe('GameController', () => {
  it('should get all games', async () => {
    await GameController.getAllGames(req, res)
    expect(res.json).toHaveBeenCalled()
  })
})
```

### 4. **Reusable**
```typescript
// Controller có thể dùng ở nhiều route khác nhau
router.get('/admin/games', requireAdmin, GameController.getAllGames)
router.get('/customer/games', GameController.getAllGames)
```

---

## 📂 Chi tiết Controllers

### **GameController**
Xử lý tất cả logic liên quan đến games:
- `getAllGames()` - Lấy danh sách games với filter, sort, pagination
- `getGameById()` - Lấy chi tiết game
- `getTopDownloaded()` - Top games theo downloads
- `getTopRated()` - Top games theo rating
- `getAllGenres()` - Lấy danh sách genres
- `getAllPlatforms()` - Lấy danh sách platforms
- `getAllPublishers()` - Lấy danh sách publishers

### **UserController**
Quản lý user profile:
- `getProfile()` - Lấy thông tin user
- `updateProfile()` - Cập nhật profile
- `getAllUsers()` - Lấy tất cả users (Admin)

### **PurchaseController**
Xử lý purchases:
- `getUserPurchases()` - Lấy lịch sử mua của user
- `createPurchase()` - Tạo purchase mới
- `getAllPurchases()` - Lấy tất cả purchases (Admin)

### **WishlistController**
Quản lý wishlist:
- `getUserWishlist()` - Lấy wishlist của user
- `addToWishlist()` - Thêm game vào wishlist
- `removeFromWishlistById()` - Xóa theo wishlist_id
- `removeFromWishlistByGameId()` - Xóa theo game_id

### **ReviewController**
Quản lý reviews và ratings:
- `getUserReviews()` - Lấy reviews của user
- `getGameReviews()` - Lấy reviews của game
- `createOrUpdateReview()` - Tạo/cập nhật review
- `updateReview()` - Cập nhật review
- `deleteReview()` - Xóa review
- `getUserRatingForGame()` - Lấy rating của user cho game
- `createOrUpdateRating()` - Tạo/cập nhật rating
- `getAllReviews()` - Lấy tất cả reviews (Admin)

### **BalanceController**
Quản lý balance và transactions:
- `getUserTransactions()` - Lấy transaction history
- `requestDeposit()` - Yêu cầu nạp tiền
- `getUserPendingDeposits()` - Lấy deposits đang chờ
- `getAllDepositRequests()` - Lấy tất cả deposits (Admin)
- `approveDeposit()` - Duyệt deposit (Admin)
- `rejectDeposit()` - Từ chối deposit (Admin)

### **ViewController**
Track game views:
- `getUserViewedGames()` - Lấy games đã xem
- `addView()` - Thêm view
- `removeView()` - Xóa view

### **AdminController**
Admin-specific functions:
- `getAllUsers()` - Lấy tất cả users với roles

---

## 🔧 Cách sử dụng

### **Thêm route mới:**

1. **Tạo method trong Controller:**
```typescript
// backend/src/controllers/gameController.ts
export class GameController {
  static async getSimilarGames(req: Request, res: Response) {
    try {
      const gameId = parseInt(req.params.id)
      const games = await GameModel.findSimilarGames(gameId)
      res.json({ games })
    } catch (error) {
      console.error('Error in getSimilarGames:', error)
      res.status(500).json({ error: 'DB_ERROR' })
    }
  }
}
```

2. **Thêm route sử dụng controller:**
```typescript
// backend/src/routes/customer.ts
router.get('/games/:id/similar', GameController.getSimilarGames)
```

### **Debug khi có lỗi:**

1. **Check controller method** - Logic có đúng không?
2. **Check model** - Query database có đúng không?
3. **Check route** - Có gọi đúng controller không?

---

## 🎯 Best Practices

### ✅ **DO:**
- Đặt business logic trong controller
- Validate input trong controller
- Handle errors trong controller với try-catch
- Return consistent response format
- Add comments cho các method phức tạp

### ❌ **DON'T:**
- Đặt logic trong router
- Gọi database trực tiếp từ router
- Return nhiều format khác nhau
- Ignore error handling

---

## 📊 So sánh Code

### **Trước:**
```typescript
// routes/customer.ts (876 lines)
router.get('/games', async (req: Request, res: Response) => {
  try {
    const { search, genre, platform, publisher, minPrice, maxPrice, sortBy = 'name', page = '1', limit = '20' } = req.query
    
    let games = await GameModel.findAllWithPublisherAndGenres()
    
    // 50+ lines of filtering, sorting, pagination logic...
    
    res.json({ games: paginatedGames, pagination: {...} })
  } catch (error) {
    console.error('Error fetching games:', error)
    res.status(500).json({ error: 'DB_ERROR' })
  }
})
```

### **Sau:**
```typescript
// routes/customer.ts (98 lines)
router.get('/games', GameController.getAllGames)

// controllers/gameController.ts (217 lines)
export class GameController {
  static async getAllGames(req: Request, res: Response) {
    // Same logic, but organized and reusable
  }
}
```

---

## 🚀 Next Steps

1. **Thêm Unit Tests** cho từng controller
2. **Add validation middleware** (express-validator)
3. **Add API documentation** (Swagger/OpenAPI)
4. **Add error handling middleware** (centralized error handler)
5. **Add logging** (Winston/Morgan)

---

## 📝 Notes

- Tất cả controllers đều có error handling với try-catch
- Response format nhất quán: `{ success, data, error, message }`
- Authentication middleware (`requireAuth`, `requireAdmin`) vẫn trong router
- Models không thay đổi, chỉ refactor routing layer

---

**Refactored by:** AI Assistant  
**Date:** October 18, 2025  
**Version:** 1.0

