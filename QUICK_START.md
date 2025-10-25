# ⚡ Quick Start - Wedding Game

Deploy trong 15 phút!

## 🚀 Commands

```bash
# 1. Install dependencies
npm install

# 2. Test locally
npm run dev
# → http://localhost:5173

# 3. Build for production
npm run build

# 4. Preview production build
npm run preview
```

## 🔥 Firebase Setup (5 phút)

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize (chọn Firestore + Functions)
firebase init

# Deploy
firebase deploy
```

## 🌐 Vercel Deploy (3 phút)

### Option A: GitHub + Vercel
```bash
git init
git add .
git commit -m "Initial commit"
git push -u origin main

# Then go to vercel.com → Import repo → Deploy
```

### Option B: Vercel CLI
```bash
npm i -g vercel
vercel login
vercel --prod
```

## 📝 Environment Variables

Copy từ Firebase Console và add vào Vercel:

```env
VITE_FIREBASE_API_KEY=your-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:xxxxx
```

## ✅ Checklist

- [ ] Firebase project created
- [ ] Firestore enabled (asia-southeast1)
- [ ] Cloud Functions deployed
- [ ] Environment variables configured
- [ ] Tested locally (npm run dev)
- [ ] Build successful (npm run build)
- [ ] Deployed to Vercel
- [ ] Custom domain added (optional)

## 📖 Full Guide

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed instructions.

## 🎯 What's Included

✅ Game với Phaser 3
✅ Firebase Firestore leaderboard
✅ Cloud Functions (submitScore, getLeaderboard)
✅ Wedding info page (văn hóa VN)
✅ Mobile controls
✅ Responsive design
✅ Firestore security rules
✅ Rate limiting

## 💰 Cost

**$0/month** với free tiers:
- Vercel: 100GB bandwidth
- Firebase: 50K reads/day, 2M function calls/month

## 🔗 URLs After Deployment

- **Game**: https://your-project.vercel.app
- **Firebase Console**: https://console.firebase.google.com
- **Vercel Dashboard**: https://vercel.com/dashboard

---

**Ready to deploy? Let's go!** 🚀
