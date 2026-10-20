# 🔐 Ứng Dụng Web Đăng Nhập Với Google (Gmail) & GitHub OAuth 2.0

Trang web xác thực đăng nhập hiện đại, an toàn và trực quan bằng tài khoản **Google (Gmail)** và **GitHub** sử dụng giao thức chuẩn công nghiệp **OAuth 2.0**.

---

## 👥 Thông Tin Nhóm Phát Triển - Nhóm 8

- **Tên nhóm:** Nhóm 8
- **Danh sách thành viên:**
  1. **Trần Quang Vinh**
  2. **Huỳnh Minh Trí**
- **Đề tài:** Xây dựng ứng dụng Web xác thực đăng nhập qua Google (Gmail) & GitHub OAuth 2.0

---

## ✨ Tính Năng Nổi Bật

- 🚀 **Google OAuth 2.0 (Gmail)**: Xác thực trực tiếp với tài khoản Google, lấy thông tin tên, email đã xác minh, và ảnh đại diện.
- 🐙 **GitHub OAuth**: Đăng nhập nhanh bằng tài khoản lập trình viên GitHub, tự động xử lý email riêng tư (private email), hiển thị số lượng repos, followers, bio.
- ⚡ **Chế Độ Demo Sẵn Sàng (Instant Test Mode)**: Có sẵn 2 nút test đăng nhập mô phỏng Gmail và GitHub để bạn có thể trải nghiệm toàn bộ giao diện và luồng xử lý mà **chưa cần tạo App Key ngay**.
- 🛡️ **Quản Lý Phiên Làm Việc (Session)**: Sử dụng HTTP-only cookie và session an toàn ở phía máy chủ Express.
- 🎨 **Giao Diện Hiện Đại & Sang Trọng**: Thiết kế Dark Mode phong cách Glassmorphism, hiệu ứng ánh sáng gradient động (Ambient glow), micro-animations, và hoàn toàn tương thích trên mọi kích thước màn hình (Mobile & Desktop).
- 📜 **Thanh Thông Báo & Cảnh Báo Trực Quan**: Tự động thông báo nếu thiếu khóa cấu hình `.env` và có modal hướng dẫn từng bước.

---

## 📁 Cấu Trúc Thư Mục

```text
e:\BT\
├── .env                  # Tệp cấu hình các Client ID, Secret và Port
├── .env.example          # Tệp mẫu cấu hình
├── package.json          # Danh sách thư viện và scripts
├── server.js             # Máy chủ Express xử lý OAuth flow & Session
├── README.md             # Hướng dẫn chi tiết
└── public/
    ├── index.html        # Trang đăng nhập chính
    ├── dashboard.html    # Trang thông tin tài khoản sau khi đăng nhập
    ├── style.css         # Hệ thống giao diện CSS Glassmorphism
    ├── app.js            # Xử lý logic phía client cho trang đăng nhập
    └── dashboard.js      # Xử lý hiển thị thông tin hồ sơ người dùng
```

---

## 🚀 Hướng Dẫn Khởi Chạy Nhanh

### Bước 1: Khởi động máy chủ
Mở terminal tại thư mục dự án và chạy:
```bash
npm start
```
Hoặc chế độ tự động reload khi sửa code:
```bash
npm run dev
```

### Bước 2: Truy cập ứng dụng
Mở trình duyệt và truy cập:
👉 **[http://localhost:3000](http://localhost:3000)**

> 💡 **Mẹo:** Bạn có thể nhấn ngay vào nút **⚡ Test Gmail** hoặc **⚡ Test GitHub** ở khung Demo trên trang chủ để trải nghiệm luồng đăng nhập mà không cần cấu hình key!

---

## 🔑 Hướng Dẫn Cấu Hình Khóa OAuth Thực Tế

Để người dùng thật có thể đăng nhập bằng tài khoản Google và GitHub của họ, bạn mở file `.env` và điền các thông tin sau:

### 1. Lấy thông tin Google OAuth (Gmail)
1. Truy cập vào **[Google Cloud Console](https://console.cloud.google.com/)**.
2. Tạo một Dự án mới (New Project) hoặc chọn dự án hiện có.
3. Vào menu **APIs & Services** &rarr; **OAuth consent screen**:
   - Chọn User Type là **External** & bấm **Create**.
   - Điền tên App Name, User support email, Developer contact email.
   - Thêm Scope: `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`.
4. Vào menu **Credentials** &rarr; **Create Credentials** &rarr; **OAuth client ID**:
   - Application type: Chọn **Web application**.
   - Name: Tùy ý (ví dụ: `AuthGateway`).
   - Mục **Authorized redirect URIs** (URI chuyển hướng được ủy quyền): Nhập chính xác:
     ```text
     http://localhost:3000/auth/google/callback
     ```
5. Nhấn **Create**, bạn sẽ nhận được **Client ID** và **Client Secret**. Sao chép vào `.env`:
   ```env
   GOOGLE_CLIENT_ID=chuỗi_client_id_của_bạn.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=chuỗi_secret_của_bạn
   ```

---

### 2. Lấy thông tin GitHub OAuth
1. Đăng nhập vào GitHub và truy cập vào **[Developer Settings - OAuth Apps](https://github.com/settings/developers)**.
2. Nhấn nút **New OAuth App** (hoặc **Register a new application**).
3. Điền các trường thông tin:
   - **Application name**: `AuthGateway`
   - **Homepage URL**: `http://localhost:3000`
   - **Authorization callback URL**: Nhập chính xác:
     ```text
     http://localhost:3000/auth/github/callback
     ```
4. Bấm **Register application**.
5. Bạn sẽ thấy **Client ID**. Tiếp tục bấm nút **Generate a new client secret** để tạo bí mật.
6. Sao chép cả hai vào file `.env`:
   ```env
   GITHUB_CLIENT_ID=chuỗi_github_client_id
   GITHUB_CLIENT_SECRET=chuỗi_github_client_secret
   ```

---

## 🛠️ Công Nghệ Sử Dụng

- **Backend**: Node.js (v24), Express.js, Express-Session, Dotenv.
- **Frontend**: HTML5 Semantic, Modern Vanilla CSS (CSS Variables, Flexbox, Grid, Glassmorphism, Keyframe Animations), Vanilla ES6 JavaScript.
- **Bảo mật**: HTTP-Only Cookie, State flow protection, Safe credential handling qua `.env`.
