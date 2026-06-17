# GreenCampus Project

Nền tảng mua bán và cộng đồng campus dành cho sinh viên đại học. Cho phép sinh viên đăng bán đồ, đăng bài cộng đồng, nhắn tin với người bán và theo dõi giao dịch.

## Cấu trúc thư mục

```
GreenCampus_Project/
├── backend/              # Node.js/Express API server
│   ├── server.js         # Entry point
│   ├── .env              # Biến môi trường (không commit)
│   ├── uploads/          # Ảnh upload từ người dùng
│   └── src/
│       ├── config/db.js  # Kết nối MySQL + auto-migration schema
│       ├── controllers/  # Logic xử lý request (7 controllers)
│       ├── middleware/    # JWT auth middleware
│       ├── models/        # Truy vấn database (6 models)
│       └── routes/        # Định nghĩa API routes (7 files)
└── fontend/              # React SPA (chú ý: tên folder bị typo)
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── main.jsx       # Entry point
        ├── App.jsx        # Root component, quản lý global state
        ├── config/api.js  # API_URL config
        └── components/    # 26 React components
```

## Tech Stack

| Tầng | Công nghệ |
|------|-----------|
| Backend runtime | Node.js + Express.js v5 |
| Database | MySQL (mysql2 v3) |
| Authentication | JWT (jsonwebtoken) + bcryptjs |
| File upload | Multer (disk storage → `backend/uploads/`) |
| Frontend | React v18 + Vite v4 |
| Styling | Tailwind CSS v3 |
| Icons | Lucide React |

## Khởi động dự án

```bash
# Backend (chạy ở cổng 5000)
cd backend
npm install
npm run dev        # nodemon auto-restart

# Frontend (chạy ở cổng 5173)
cd fontend
npm install
npm run dev        # Vite dev server
```

### Yêu cầu môi trường

Backend đọc từ `backend/.env`:
```
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASS=123456
DB_NAME=green_campus
JWT_SECRET=greencampus_jwt_secret_key_2024
JWT_EXPIRES_IN=7d
```

Frontend gọi API qua `fontend/src/config/api.js` → `http://localhost:5000/api`

## Database (MySQL)

Database tên `green_campus`. Schema được tự động khởi tạo/migrate trong `backend/src/config/db.js` khi server start.

### Các bảng chính

| Bảng | Mô tả |
|------|-------|
| `users` | Tài khoản sinh viên (id, full_name, email, password, student_id, department, university, avatar_url, role_id) |
| `items` | Sản phẩm đăng bán (id, user_id, title, content, price, item_condition, category_id, status ENUM(AVAILABLE,SOLD), quantity) |
| `item_images` | Ảnh sản phẩm (id, item_id, image_url, is_primary) |
| `categories` | Danh mục sản phẩm (tên tiếng Việt) |
| `social_posts` | Bài đăng cộng đồng (id, user_id, content, image_url, post_type ENUM(NORMAL,SALE), price, is_sold) |
| `post_likes` | Lượt thích bài đăng (post_id, user_id) |
| `messages` | Tin nhắn trực tiếp (sender_id, receiver_id, content, item_id, post_id, is_read) |
| `pinned_items` | Sản phẩm ghim trong cuộc trò chuyện (user1_id, user2_id, item_id) |
| `transactions` | Giao dịch (item_id, buyer_id, seller_id, amount, status ENUM(PENDING,SHIPPING,COMPLETED,CANCELLED)) |
| `ratings` | Đánh giá sau giao dịch (transaction_id, rater_id, rated_user_id, rating 1-5, comment) |

## API Endpoints

| Prefix | Controller | Chức năng |
|--------|-----------|-----------|
| `/api/auth` | authController | Đăng ký, đăng nhập, đặt lại mật khẩu |
| `/api/users` | userController | Hồ sơ người dùng |
| `/api/categories` | categoryController | Danh sách danh mục |
| `/api/items` | itemController | CRUD sản phẩm + upload ảnh |
| `/api/posts` | postController | CRUD bài đăng, like, đánh dấu đã bán |
| `/api/chat` | chatController | Tin nhắn, danh sách hội thoại |
| `/api/transactions` | transactionController | Tạo và cập nhật giao dịch |

File upload trả về URL dạng `/uploads/{filename}`, frontend resolve thành `http://localhost:5000/uploads/{filename}`.

## Kiến trúc Frontend

`App.jsx` là root component, dùng React hooks để quản lý toàn bộ state:

- `currentUser` — dữ liệu người dùng đăng nhập (lưu localStorage)
- `currentPage` — trang hiện tại (home, feed, messages, profile, cart, history, settings, greenlife)
- `cartItems` — giỏ hàng (lưu localStorage, không có server-side cart)
- `selectedProduct` / `selectedStore` — state trang chi tiết
- `refreshTrigger` — cơ chế invalidate cache sau khi thay đổi dữ liệu

**Lưu ý:** Giỏ hàng chỉ lưu client-side (localStorage), không đồng bộ server.

## Luồng nghiệp vụ quan trọng

**Đăng ký/Đăng nhập:** Validate → bcrypt hash → JWT 7 ngày → lưu localStorage

**Tạo giao dịch:** Tạo transaction → Giảm quantity của item → Nếu quantity ≤ 0 → cập nhật status item thành SOLD

**Upload ảnh:** Multer lưu vào `backend/uploads/` với tên `item-{timestamp}-{random}.{ext}` hoặc `post-{timestamp}-{random}.{ext}`

**Tin nhắn:** Hỗ trợ reference đến item/post trong context. `pinned_items` normalize user IDs (min/max) để đảm bảo unique per cặp user.

## Màu sắc thương hiệu (Tailwind)

```
brand-green:   #2D6A4F  (màu chủ đạo)
brand-primary: #E1F0C4  (màu nền nhạt)
```

## Lưu ý khi phát triển

- **Tên thư mục frontend là `fontend`** (typo) — không đổi tên vì có thể ảnh hưởng các script
- Schema database tự migrate khi server khởi động — tránh chỉnh sửa trực tiếp DB ngoài `db.js`
- Không có Docker, CI/CD, hay `.gitignore` hiện tại
- Giao diện và dữ liệu bằng tiếng Việt
- Fallback ảnh dùng `ui-avatars.com` (avatar) và `placehold.co` (sản phẩm)
- Connection pool giới hạn 10 kết nối MySQL
