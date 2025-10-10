# 🛠️ Admin System - Hướng Dẫn Sử Dụng

## 📋 Tổng Quan

Hệ thống admin đầy đủ cho GameStore với các tính năng quản lý games, users, reviews, purchases và analytics.

## 🚀 Cài Đặt & Chạy

### 1. Chạy Backend
```bash
cd backend
npm install
npm run dev
```

### 2. Chạy Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Truy cập Admin Panel
- URL: `http://localhost:3000/admin`
- Login với tài khoản admin

## 📊 Các Trang Admin

### 1. **Dashboard** (`/admin`)
- Tổng quan hệ thống
- Thống kê tổng quan
- Recent purchases
- Top games

### 2. **Quản lý Users** (`/admin/users`)
- Xem danh sách users
- Chỉnh sửa thông tin user
- Xóa user
- Tìm kiếm users

### 3. **Quản lý Games** (`/admin/games`)
- Xem danh sách games
- Thêm game mới (`/admin/games/add`)
- Chỉnh sửa game
- Xóa game
- Tìm kiếm games

### 4. **Quản lý Reviews** (`/admin/reviews`)
- Xem danh sách reviews
- Xem chi tiết review
- Xóa review
- Tìm kiếm reviews

### 5. **Quản lý Purchases** (`/admin/purchases`)
- Xem danh sách purchases
- Thống kê doanh thu
- Xem chi tiết purchase
- Lọc theo status

### 6. **AI Analytics** (`/admin/analytics`)
- Behavior analysis
- User engagement scores
- Interaction trends
- System health

## 🔧 API Endpoints

### Games Management
- `GET /api/admin/games` - Lấy danh sách games
- `GET /api/admin/games/:id` - Lấy chi tiết game
- `POST /api/admin/games` - Tạo game mới
- `PUT /api/admin/games/:id` - Cập nhật game
- `DELETE /api/admin/games/:id` - Xóa game

### Users Management
- `GET /api/admin/users` - Lấy danh sách users
- `GET /api/admin/users/:id` - Lấy chi tiết user
- `PUT /api/admin/users/:id` - Cập nhật user
- `DELETE /api/admin/users/:id` - Xóa user

### Reviews Management
- `GET /api/admin/reviews` - Lấy danh sách reviews
- `DELETE /api/admin/reviews/:id` - Xóa review

### Purchases Management
- `GET /api/admin/purchases` - Lấy danh sách purchases
- `GET /api/admin/purchases/stats` - Thống kê purchases

### Dashboard & Analytics
- `GET /api/admin/dashboard` - Thống kê dashboard
- `GET /api/admin/publishers` - Lấy danh sách publishers
- `GET /api/admin/genres` - Lấy danh sách genres
- `GET /api/admin/platforms` - Lấy danh sách platforms

### AI Analytics
- `GET /api/ai/analytics` - System analytics
- `GET /api/ai/behavior/:userId` - User behavior analysis
- `GET /api/ai/stats` - Basic statistics

## 🧪 Testing

### Test Admin APIs
```bash
python test_admin_system.py
```

### Test AI System
```bash
python test_ai_system.py
```

### Manual Testing
1. Login as admin
2. Navigate to each admin page
3. Test CRUD operations
4. Check API responses in browser dev tools

## 🔐 Authentication

### Admin Access
- Role: `ADMIN`
- Required for all admin endpoints
- JWT token authentication

### Getting Admin Token
1. Login at `/login` with admin credentials
2. Check browser dev tools → Application → Local Storage
3. Copy the `token` value

### Using Token in API Calls
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3001/api/admin/games
```

## 📁 File Structure

### Frontend Admin Pages
```
frontend/src/pages/admin/
├── DashboardPage.tsx          # Main dashboard
├── UsersPage.tsx             # User management
├── GamesPage.tsx             # Games list
├── AddGamePage.tsx           # Add new game
├── ReviewsPage.tsx           # Reviews management
├── PurchasesPage.tsx         # Purchases management
└── AnalyticsDashboard.tsx    # AI analytics
```

### Backend Admin Routes
```
backend/src/routes/
├── admin.ts                  # Admin API endpoints
├── ai.ts                     # AI analytics endpoints
└── ...
```

## 🎯 Features

### Games Management
- ✅ List all games with search
- ✅ Add new game with full form
- ✅ Edit game details
- ✅ Delete games
- ✅ Filter by publisher, genre, platform

### Users Management
- ✅ List all users
- ✅ Edit user information
- ✅ Delete users
- ✅ Search users

### Reviews Management
- ✅ List all reviews
- ✅ View review details
- ✅ Delete reviews
- ✅ Search reviews

### Purchases Management
- ✅ List all purchases
- ✅ View purchase details
- ✅ Revenue statistics
- ✅ Filter by status

### AI Analytics
- ✅ User behavior analysis
- ✅ Engagement scores
- ✅ Interaction trends
- ✅ System health monitoring

## 🚨 Troubleshooting

### Common Issues

1. **Authentication Error (401)**
   - Check if user is logged in
   - Verify token is valid
   - Ensure user has ADMIN role

2. **API Connection Error**
   - Check if backend is running on port 3001
   - Verify CORS settings
   - Check network connectivity

3. **Page Not Found (404)**
   - Check if route is defined in App.tsx
   - Verify component is imported
   - Check browser console for errors

4. **Database Error**
   - Check database connection
   - Verify table structure
   - Check SQL queries

### Debug Steps
1. Check browser console for errors
2. Check backend logs
3. Verify API endpoints with Postman/curl
4. Check database connection
5. Verify authentication token

## 📈 Performance Tips

1. **Pagination**: Implement pagination for large datasets
2. **Caching**: Cache frequently accessed data
3. **Lazy Loading**: Load components on demand
4. **Optimization**: Optimize database queries
5. **Monitoring**: Monitor API response times

## 🔮 Future Enhancements

- [ ] Bulk operations (bulk delete, bulk update)
- [ ] Advanced filtering and sorting
- [ ] Export data to CSV/Excel
- [ ] Real-time notifications
- [ ] Advanced analytics dashboard
- [ ] User activity logs
- [ ] System backup/restore
- [ ] Multi-language support

## 📞 Support

For issues or questions:
1. Check this README
2. Review error logs
3. Test with provided scripts
4. Check API documentation

---

**Cập nhật**: $(date)
**Version**: 1.0.0
**Status**: ✅ Production Ready
