# Hướng Dẫn Đăng Ký Tài Khoản và Hệ Thống Thông Báo Toast

## 📋 Tổng Quan

Hệ thống đã được cập nhật với các tính năng mới:
1. ✅ Chức năng đăng ký tài khoản người dùng
2. ✅ Hệ thống thông báo toast (toast notifications) toàn diện
3. ✅ Thông báo cho tất cả các hành động quan trọng

---

## 🎯 Các Tính Năng Đã Thêm

### 1. **Đăng Ký Tài Khoản**

#### Trang Đăng Ký (`/auth/register`)
- **Thông tin bắt buộc:**
  - Tên đăng nhập (username)
  - Email
  - Mật khẩu (tối thiểu 6 ký tự)
  - Xác nhận mật khẩu

- **Thông tin tùy chọn:**
  - Tuổi
  - Giới tính (Nam/Nữ/Khác)

#### Validation
- ✅ Kiểm tra email đã tồn tại
- ✅ Kiểm tra username đã tồn tại
- ✅ Kiểm tra độ dài mật khẩu
- ✅ Kiểm tra mật khẩu khớp

#### Tự động sau khi đăng ký thành công
- Tự động đăng nhập
- Chuyển hướng về trang chủ
- Hiển thị thông báo chào mừng

---

### 2. **Hệ Thống Toast Notifications**

Toast notifications được tích hợp sử dụng thư viện `notistack` với các loại thông báo:

#### **🟢 Success (Thành công)**
- Đăng nhập thành công
- Đăng ký thành công
- Mua game thành công
- Thêm vào wishlist thành công
- Đánh giá game thành công

#### **🔴 Error (Lỗi)**
- Đăng nhập thất bại
- Email/username đã tồn tại
- Số dư không đủ
- Lỗi khi mua game
- Lỗi khi đánh giá

#### **🔵 Info (Thông tin)**
- Đăng xuất thành công
- Xóa khỏi wishlist

---

## 📁 Các File Đã Được Cập Nhật

### 1. **AuthContext.tsx**
```typescript
// Thêm chức năng register
register: (data: RegisterData) => Promise<User>

// Thêm toast cho login
enqueueSnackbar(`Chào mừng ${username}! Đăng nhập thành công.`, { variant: 'success' })

// Thêm toast cho logout
enqueueSnackbar('Đăng xuất thành công', { variant: 'info' })
```

### 2. **RegisterPage.tsx** (Mới)
- Form đăng ký đầy đủ
- Validation tích hợp
- UI/UX đẹp mắt
- Link quay lại trang đăng nhập

### 3. **LoginPage.tsx**
- Thêm link đến trang đăng ký
- Toast thông báo tự động

### 4. **GameDetailPage.tsx**
```typescript
// Toast khi thêm/xóa wishlist
enqueueSnackbar(`Đã thêm ${game.name} vào wishlist`, { variant: 'success' })

// Toast khi mua game
enqueueSnackbar(`Mua game ${game.name} thành công!`, { variant: 'success' })

// Toast khi có lỗi
enqueueSnackbar('Số dư không đủ để mua game này', { variant: 'error' })
```

### 5. **RatingModal.tsx**
```typescript
// Toast khi đánh giá thành công
enqueueSnackbar('Đánh giá đã được gửi thành công!', { variant: 'success' })
```

### 6. **App.tsx**
- Thêm route `/auth/register`
- Đã có SnackbarProvider cấu hình sẵn

---

## 🚀 Hướng Dẫn Sử Dụng

### Đăng Ký Tài Khoản Mới

1. Truy cập trang đăng nhập: `http://localhost:3000/auth/login`
2. Click vào "Đăng ký ngay"
3. Điền thông tin:
   ```
   Tên đăng nhập: john_doe
   Email: john@example.com
   Mật khẩu: password123
   Xác nhận mật khẩu: password123
   Tuổi: 25 (tùy chọn)
   Giới tính: Nam (tùy chọn)
   ```
4. Click "Đăng ký"
5. Hệ thống tự động đăng nhập và chuyển về trang chủ

### Sử dụng Toast Notifications

Toast sẽ tự động hiển thị khi:
- ✅ Đăng nhập/đăng xuất
- ✅ Mua game
- ✅ Thêm/xóa wishlist
- ✅ Đánh giá game
- ✅ Các lỗi xảy ra

**Vị trí hiển thị:** Góc trên bên phải màn hình  
**Thời gian hiển thị:** 3 giây  
**Số lượng tối đa:** 3 toast cùng lúc

---

## 🎨 Cấu Hình Toast

Toast đã được cấu hình trong `App.tsx`:

```tsx
<SnackbarProvider 
  maxSnack={3}                                          // Tối đa 3 toast
  anchorOrigin={{ vertical: 'top', horizontal: 'right' }} // Vị trí
  autoHideDuration={3000}                              // 3 giây
>
```

### Tùy Chỉnh Toast

Để thay đổi vị trí hoặc thời gian hiển thị, cập nhật trong `App.tsx`:

```tsx
// Thay đổi vị trí
anchorOrigin={{ 
  vertical: 'bottom',    // top, bottom
  horizontal: 'center'   // left, center, right
}}

// Thay đổi thời gian
autoHideDuration={5000}  // 5 giây
```

---

## 🔧 API Endpoints

### Đăng Ký
```
POST /api/auth/register
Body: {
  username: string,
  email: string,
  password: string,
  age?: number,
  gender?: string
}
```

### Đăng Nhập
```
POST /api/auth/login
Body: {
  email: string,
  password: string
}
```

---

## 📝 Messages Thông Báo

### Đăng nhập
- ✅ "Chào mừng [username]! Đăng nhập thành công."
- ❌ "Email hoặc mật khẩu không đúng"
- ❌ "Vui lòng nhập đầy đủ email và mật khẩu"

### Đăng ký
- ✅ "Chào mừng [username]! Đăng ký tài khoản thành công."
- ❌ "Email đã được sử dụng"
- ❌ "Tên đăng nhập đã tồn tại"
- ❌ "Vui lòng nhập đầy đủ thông tin"
- ❌ "Mật khẩu xác nhận không khớp"
- ❌ "Mật khẩu phải có ít nhất 6 ký tự"

### Đăng xuất
- ℹ️ "Đăng xuất thành công"

### Mua game
- ✅ "Mua game [game_name] thành công! Bạn có thể tải xuống ngay bây giờ."
- ❌ "Số dư không đủ để mua game này"
- ❌ "Bạn đã mua game này rồi"
- ❌ "Vui lòng đăng nhập để mua game"

### Wishlist
- ✅ "Đã thêm [game_name] vào wishlist"
- ℹ️ "Đã xóa khỏi wishlist"
- ❌ "Có lỗi xảy ra khi cập nhật wishlist"

### Đánh giá
- ✅ "Đánh giá đã được gửi thành công!"
- ✅ "Đánh giá đã được cập nhật thành công!"
- ❌ "Có lỗi xảy ra khi lưu đánh giá"

---

## 🎯 Testing

### Test Đăng Ký
1. Vào `/auth/register`
2. Nhập thông tin hợp lệ
3. Kiểm tra toast "Đăng ký thành công"
4. Kiểm tra redirect về home page

### Test Toast
1. **Login:** Đăng nhập → Xem toast thành công
2. **Logout:** Đăng xuất → Xem toast info
3. **Purchase:** Mua game → Xem toast thành công/lỗi
4. **Wishlist:** Thêm/xóa → Xem toast
5. **Rating:** Đánh giá game → Xem toast

---

## 💡 Best Practices

### 1. **Sử dụng Toast đúng cách**
```typescript
// ✅ Đúng - Thông tin cụ thể
enqueueSnackbar(`Đã thêm ${game.name} vào wishlist`, { variant: 'success' })

// ❌ Sai - Quá chung chung
enqueueSnackbar('Thành công', { variant: 'success' })
```

### 2. **Xử lý Error Messages**
```typescript
// ✅ Đúng - Parse error code
const errorCode = error.response?.data?.error;
const message = errorCode === 'INSUFFICIENT_BALANCE'
  ? 'Số dư không đủ'
  : 'Có lỗi xảy ra';

// ❌ Sai - Message chung chung
const message = 'Có lỗi xảy ra';
```

### 3. **Timing**
- Success: 3 giây (mặc định)
- Error: 5 giây (quan trọng hơn)
- Info: 2-3 giây

---

## 🐛 Troubleshooting

### Toast không hiển thị
1. Kiểm tra `SnackbarProvider` đã wrap toàn bộ app
2. Kiểm tra import `useSnackbar` từ `notistack`
3. Kiểm tra `notistack` đã được cài đặt

### Đăng ký không hoạt động
1. Kiểm tra backend đang chạy (port 3001)
2. Kiểm tra endpoint `/api/auth/register`
3. Xem console log để biết chi tiết lỗi

### Toast bị overlap
1. Giảm `maxSnack` xuống 2 hoặc 1
2. Tăng `autoHideDuration` để toast biến mất nhanh hơn

---

## 🔗 Routes Mới

```
/auth/login    - Trang đăng nhập
/auth/register - Trang đăng ký (MỚI)
/login         - Redirect đến /auth/login
```

---

## 📦 Dependencies

Các package đã có sẵn:
- ✅ `notistack@^3.0.2` - Toast notifications
- ✅ `@mui/material` - UI components
- ✅ `react-router-dom` - Routing
- ✅ `axios` - HTTP client

---

## 🎉 Kết Luận

Hệ thống đã được cập nhật thành công với:
1. ✅ Chức năng đăng ký tài khoản đầy đủ
2. ✅ Toast notifications toàn diện
3. ✅ UX/UI được cải thiện đáng kể
4. ✅ Error handling tốt hơn

Người dùng giờ có thể:
- Tự đăng ký tài khoản
- Nhận phản hồi ngay lập tức cho mọi hành động
- Hiểu rõ trạng thái của các thao tác

---

**Tạo bởi:** AI Assistant  
**Ngày:** 2025-01-10  
**Version:** 1.0

