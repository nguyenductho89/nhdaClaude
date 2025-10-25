# Wedding Game - Mario Style Wedding Invitation

Game thiệp cưới theo phong cách Mario, được xây dựng với Phaser 3, Firebase và Vercel.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup Firebase

#### 2.1 Create Firebase Project

1. Truy cập [Firebase Console](https://console.firebase.google.com)
2. Tạo project mới: `wedding-game`
3. Enable Firestore Database (chọn `asia-southeast1` region)
4. Enable Cloud Functions

#### 2.2 Install Firebase CLI

```bash
npm install -g firebase-tools
```

#### 2.3 Login và Initialize Firebase

```bash
firebase login
firebase init

# Chọn:
# - Firestore
# - Functions
#
# Use existing project: chọn project vừa tạo
# Accept defaults cho Firestore
# Choose JavaScript cho Functions
```

#### 2.4 Deploy Firebase

```bash
# Deploy Firestore rules & indexes
firebase deploy --only firestore

# Install dependencies for Functions
cd functions
npm install
cd ..

# Deploy Cloud Functions
firebase deploy --only functions
```

#### 2.5 Get Firebase Config

1. Firebase Console → Project Settings (⚙️)
2. Scroll xuống "Your apps" → Web app (</> icon)
3. Register app: `Wedding Game`
4. Copy config object

### 3. Setup Environment Variables

```bash
# Copy template
cp .env.example .env.local

# Edit .env.local with your Firebase config
# Paste values from Firebase Console
```

### 4. Run Locally

```bash
npm run dev
```

Mở http://localhost:5173

### 5. Deploy to Vercel

#### Option A: Via GitHub (Recommended)

```bash
# Init git và push to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/wedding-game.git
git push -u origin main

# Then:
# 1. Go to vercel.com
# 2. Import GitHub repository
# 3. Add environment variables from .env.local
# 4. Deploy
```

#### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Production deploy
vercel --prod
```

## 📁 Project Structure

```
wedding-game/
├── src/
│   ├── config/
│   │   ├── firebase.js      # Firebase config
│   │   └── game.js          # Game constants & wedding info
│   ├── game/
│   │   └── scenes/
│   │       ├── IntroScene.js      # Màn hình intro
│   │       ├── GameScene.js       # Gameplay chính
│   │       └── WeddingInfoScene.js # Thông tin đám cưới
│   ├── services/
│   │   └── leaderboard.js   # Firebase API calls
│   └── main.js              # Entry point
├── functions/
│   ├── index.js             # Cloud Functions
│   └── package.json
├── firestore.rules          # Firestore security rules
├── firestore.indexes.json   # Firestore indexes
├── index.html
├── vite.config.js
└── package.json
```

## 🎮 Game Features

- ✅ Mario-style platformer gameplay
- ✅ Collectibles: Tiền, Tin, Nhà, Xe, Sổ đỏ, Vàng
- ✅ Leaderboard với Firebase Firestore
- ✅ Wedding info page theo văn hóa Việt Nam
- ✅ Mobile controls (touch)
- ✅ Desktop controls (keyboard)
- ✅ Landscape only cho mobile
- ✅ Score tracking & submission

## 🔧 Customization

### Edit Wedding Info

Edit file `src/config/game.js`:

```javascript
export const WEDDING_INFO = {
  groom: {
    fullName: "Nguyễn Văn A",
    // ... your info
  },
  bride: {
    fullName: "Trần Thị D",
    // ... your info
  },
  events: [
    // ... your event details
  ]
};
```

### Edit Item Scores

Edit `GAME_CONSTANTS.ITEM_SCORES` in `src/config/game.js`

## 🎯 Tech Stack

- **Frontend**: Phaser 3 + Vite
- **Backend**: Firebase Cloud Functions
- **Database**: Firebase Firestore
- **Hosting**: Vercel
- **Cost**: $0/month (100% free tier)

## 📊 Free Tier Limits

- **Vercel**: 100GB bandwidth/month
- **Firebase Firestore**: 50K reads/day, 20K writes/day
- **Firebase Functions**: 2M invocations/month

Đủ cho ~500 khách mời, ~1000 lượt chơi.

## 🔐 Security

- Firestore Security Rules: Public read, validated write
- Rate limiting: 10 submissions/hour per IP
- Name profanity filtering
- Score validation (prevent cheating)

## 📱 Browser Support

- Chrome 90+
- Safari 14+
- Firefox 88+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 📝 License

MIT

## 🎉 Credits

Built with love for weddings 💒
