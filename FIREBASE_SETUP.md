# Cấu hình Firebase

Để kích hoạt tính năng đăng nhập và lưu điểm, bạn cần cấu hình Firebase.

1.  Tạo file `.env` tại thư mục gốc của dự án (cùng cấp với `package.json`).
2.  Copy nội dung sau vào file `.env`:

```env
VITE_FIREBASE_API_KEY=AIzaSy... (Thay bằng API Key của bạn)
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_DATABASE_URL=...
```

3.  Lấy các thông tin trên từ Firebase Console:
    *   Truy cập [Firebase Console](https://console.firebase.google.com/)
    *   Chọn Project của bạn
    *   Vào **Project Settings** (biểu tượng bánh răng)
    *   Cuộn xuống phần **Your apps**
    *   Chọn app Web (hoặc tạo mới nếu chưa có)
    *   Copy đoạn config trong `const firebaseConfig = { ... }` và điền vào file `.env`.

4.  Kích hoạt Authentication:
    *   Trong Firebase Console, vào menu **Build** > **Authentication**.
    *   Chọn tab **Sign-in method**.
    *   Kích hoạt **Google**.

5.  Kích hoạt Firestore Database:
    *   Trong Firebase Console, vào menu **Build** > **Firestore Database**.
    *   Tạo database mới (chọn **Start in production mode** hoặc **test mode**).

Sau khi cấu hình xong, khởi động lại dự án (`npm run dev`) để áp dụng thay đổi.
