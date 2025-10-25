# 🚀 Deployment Guide - Wedding Game

Hướng dẫn chi tiết deploy game lên production (Vercel + Firebase)

## ✅ Prerequisites

- Node.js 18+ đã cài đặt
- Git đã cài đặt
- Tài khoản GitHub (free)
- Tài khoản Firebase (free)
- Tài khoản Vercel (free)

---

## 📋 Step-by-Step Deployment

### Step 1: Install Dependencies (2 phút)

```bash
# Cài dependencies cho frontend
npm install

# Cài dependencies cho Firebase Functions
cd functions
npm install
cd ..
```

---

### Step 2: Setup Firebase Project (5 phút)

#### 2.1 Create Firebase Project

1. Mở [Firebase Console](https://console.firebase.google.com)
2. Click **"Add project"**
3. Project name: `wedding-game` (hoặc tên bạn muốn)
4. Disable Google Analytics (optional)
5. Click **"Create project"**
6. Đợi ~30 giây

#### 2.2 Enable Firestore Database

1. Sidebar: **Build** → **Firestore Database**
2. Click **"Create database"**
3. Chọn **"Start in production mode"**
4. Location: **asia-southeast1 (Singapore)** ← Gần VN nhất
5. Click **"Enable"**

#### 2.3 Install Firebase CLI

```bash
npm install -g firebase-tools
```

#### 2.4 Login Firebase

```bash
firebase login
```

Browser sẽ mở, login với Google account

#### 2.5 Initialize Firebase in Project

```bash
firebase init
```

**Chọn:**
- ✅ Firestore
- ✅ Functions

**Questions:**
- Use existing project? **Yes** → Chọn project vừa tạo
- Firestore rules file? **firestore.rules** (Enter)
- Firestore indexes file? **firestore.indexes.json** (Enter)
- Language? **JavaScript**
- ESLint? **No**
- Install dependencies? **Yes**

---

### Step 3: Deploy Firebase (3 phút)

```bash
# Deploy Firestore rules & indexes
firebase deploy --only firestore

# Deploy Cloud Functions
firebase deploy --only functions
```

**Lưu ý:** Lần đầu deploy functions có thể hỏi enable billing. Chọn free tier (Spark Plan).

✅ Output sẽ hiển thị:
```
✔  Deploy complete!

Functions:
  submitScore(us-central1)
  getLeaderboard(us-central1)
  submitRSVP(us-central1)
```

---

### Step 4: Get Firebase Config (1 phút)

1. Firebase Console → **⚙️ Project Settings**
2. Scroll xuống **"Your apps"**
3. Click **</> Web app icon**
4. App nickname: `Wedding Game`
5. Click **"Register app"**
6. **Copy** config object:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "wedding-game-xxxx.firebaseapp.com",
  projectId: "wedding-game-xxxx",
  storageBucket: "wedding-game-xxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:xxxxx"
};
```

---

### Step 5: Setup Environment Variables (1 phút)

```bash
# Copy template
cp .env.example .env.local
```

**Edit `.env.local`** và paste values từ Firebase config:

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=wedding-game-xxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=wedding-game-xxxx
VITE_FIREBASE_STORAGE_BUCKET=wedding-game-xxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:xxxxx
```

---

### Step 6: Test Locally (2 phút)

```bash
npm run dev
```

Mở http://localhost:5173

**Test:**
- ✅ Màn hình intro hiển thị
- ✅ Có thể chơi game
- ✅ Có thể skip to wedding info
- ✅ Leaderboard hiển thị (mock data)
- ✅ Submit score works (check Firebase Console > Firestore)

---

### Step 7: Push to GitHub (2 phút)

```bash
# Init git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Wedding game ready"

# Create GitHub repo (go to github.com/new)
# Then add remote
git remote add origin https://github.com/YOUR_USERNAME/wedding-game.git

# Push
git push -u origin main
```

---

### Step 8: Deploy to Vercel (3 phút)

#### Option A: Via Vercel Website (Recommended)

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign up with GitHub"**
3. Click **"New Project"**
4. **Import** your `wedding-game` repository
5. **Framework Preset**: Vite (auto-detected)
6. **Build Command**: `npm run build` (auto-filled)
7. **Output Directory**: `dist` (auto-filled)
8. Click **"Environment Variables"** → Add:

```
VITE_FIREBASE_API_KEY = AIza...
VITE_FIREBASE_AUTH_DOMAIN = wedding-game-xxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID = wedding-game-xxxx
VITE_FIREBASE_STORAGE_BUCKET = wedding-game-xxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID = 123456789
VITE_FIREBASE_APP_ID = 1:123456789:web:xxxxx
```

9. Click **"Deploy"**

⏳ Đợi ~2 phút...

✅ **Done!** Your game is live!

**URL:** `https://wedding-game-xxxxx.vercel.app`

#### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Add environment variables when prompted
# (or add via Vercel Dashboard)

# Production deploy
vercel --prod
```

---

### Step 9: Add Custom Domain (Optional, 3 phút)

1. Buy domain (Namecheap, GoDaddy) hoặc dùng subdomain có sẵn
2. Vercel Dashboard → **Domains** → **Add**
3. Enter: `wedding.yourdomain.com`
4. Vercel sẽ show DNS instructions

**At your domain provider:**
```
Type: CNAME
Name: wedding (or @)
Value: cname.vercel-dns.com
```

5. Wait ~1-2 phút cho SSL auto-provision

✅ **Your game is now at:** `https://wedding.yourdomain.com`

---

## 🎊 Share with Guests

### QR Code

1. Go to [qr-code-generator.com](https://www.qr-code-generator.com/)
2. Enter your URL: `https://wedding-game-xxxxx.vercel.app`
3. Download QR code
4. Print trên thiệp cưới

### Short URL

1. Go to [bit.ly](https://bit.ly)
2. Shorten your URL
3. Custom: `bit.ly/wedding-an-d` (example)

### Share via:

- 📱 Zalo/Messenger group
- 📧 Email
- 📘 Facebook event
- 📋 WhatsApp

---

## 🔄 Update Content

### Update Wedding Info

1. Edit `src/config/game.js`
2. Commit & push:

```bash
git add .
git commit -m "Update wedding info"
git push
```

3. Vercel auto-redeploys (~1 phút)

### View Leaderboard

Firebase Console → Firestore → `players` collection

### Export Player Data

```javascript
// In Firebase Console > Firestore
// Click "Export" or use Firebase Admin SDK
```

---

## ⚠️ Troubleshooting

### Problem: Firebase Functions not working

**Solution:** Check region. Functions phải cùng region với Firestore.

```bash
firebase functions:config:get
```

### Problem: Vercel deployment failed

**Solution:** Check environment variables đã add chưa.

### Problem: CORS error

**Solution:** Deploy Cloud Functions với correct config.

### Problem: Leaderboard không hiển thị

**Solution:**
1. Check Firebase Console > Functions logs
2. Check browser console errors
3. Verify Firestore indexes deployed

---

## 📊 Monitor

### Vercel Analytics

Vercel Dashboard → Your Project → **Analytics**

- Page views
- Visitors
- Performance metrics

### Firebase Console

- Firestore: View players, RSVP
- Functions: View logs, invocations
- Performance: Monitor load times

---

## 💰 Cost (Free Tier Limits)

| Service | Free Limit | Enough For |
|---------|-----------|------------|
| Vercel | 100GB/month | ~10,000 visitors |
| Firestore | 50K reads/day | ~1,000 players |
| Functions | 2M invocations/month | ~1,000 players |

**Total:** $0/month cho đám cưới 200-500 khách ✅

---

## 🎉 Done!

Your wedding game is now LIVE and ready to share! 🎊

**Next steps:**
1. ✅ Test game trên nhiều devices
2. ✅ Share link với vài người thân test
3. ✅ Monitor leaderboard
4. ✅ Announce game cho tất cả khách mời

**Chúc mừng đám cưới!** 💒❤️
