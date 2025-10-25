# 🦖 Gameplay Update: Mario → Dinosaur Endless Runner

## 📋 Summary of Changes

PRD đã được cập nhật từ **Mario Platformer** sang **Dinosaur Endless Runner** (Chrome Dino style)

---

## 🎮 Major Gameplay Changes

### Before (Mario Platformer)
- ❌ Platformer with left/right movement
- ❌ Multiple controls (move, jump, sprint)
- ❌ Level-based với đích cuối
- ❌ Checkpoints
- ❌ Tương đối phức tạp cho người mới

### After (Dinosaur Endless Runner)
- ✅ Auto-run endless runner
- ✅ Single button control (jump only)
- ✅ Procedurally generated obstacles
- ✅ Time-based or collision-based end
- ✅ Cực kỳ đơn giản - học trong 5 giây

---

## 🕹️ Control Changes

### Desktop
**Before:**
- Arrow keys: Move left/right
- Spacebar: Jump
- Shift: Sprint

**After:**
- **Spacebar**: Jump (chỉ 1 nút!)
- **Up Arrow**: Jump (alternative)
- **Click anywhere**: Jump (mouse)
- Tap vs Hold = Low jump vs High jump

### Mobile
**Before:**
- Virtual D-pad (left/right)
- Jump button
- Sprint button
- 3 controls phức tạp

**After:**
- **Tap anywhere on screen** = Jump
- **Hold tap** = High jump
- NO buttons needed!
- Perfect cho người lớn tuổi

---

## 🎯 Scoring System Changes

### Before (Platformer)
- Items collected
- Time to complete
- Completion bonus

### After (Endless Runner)
```
Score = Distance + Items + Bonuses

Distance: 1 point/meter (auto-increment)
Items:
  - Tiền: 10 pts
  - Tin: 50 pts
  - Nhà: 100 pts
  - Xe: 150 pts (+ invincibility)
  - Sổ đỏ: 200 pts
  - Vàng: 300 pts (+ 2x multiplier)

Bonuses:
  - Combo (5+ items): +50 pts
  - Survival time: +10 pts/10s
  - Perfect run (2 min no hit): +1000 pts
  - Multipliers: x1.5 (combo), x2 (gold item)
```

---

## 🚧 Obstacles Changes

### Before (Platformer)
- Platforms to jump on
- Enemies (Goomba, Koopa)
- Pipes, blocks
- Static level design

### After (Endless Runner)
**Ground Obstacles:**
- 🎂 Bánh cưới (low - easy)
- 🎁 Hộp quà (medium)
- 💐 Bó hoa (high jump needed)
- 🍾 Chai champagne (tall)
- 💒 Cổng hoa (wide timing)

**Flying Obstacles:**
- 🎈 Balloons (duck or time jump)
- 🕊️ Chim bồ câu (timing)
- 🎊 Confetti cannons

---

## 📊 Difficulty Progression

### Before (Platformer)
- Fixed level difficulty
- Optional checkpoints

### After (Endless Runner)
- **Dynamic difficulty scaling:**
  - Speed: 300px/s → 600px/s (gradual)
  - Obstacle density increases every 30s
  - Max difficulty at 2 minutes
  - Random "breather" periods (safe zones)

---

## 🎨 Visual Style Changes

### Before (Platformer)
- Tileset-based levels
- Platform graphics
- Enemy sprites
- Level backgrounds

### After (Endless Runner)
- **Parallax scrolling backgrounds:**
  - Sky layer (static/slow)
  - Cloud layer (medium)
  - Mountain layer (fast)
  - Ground layer (repeating tile)
- **Simpler assets needed:**
  - Character sprite (running animation)
  - Obstacle sprites (wedding themed)
  - Collectible icons (PNG)
  - No complex level design required

---

## 💰 Collectibles - Của Hồi Môn (Unchanged Content)

Items vẫn giữ nguyên văn hóa Việt Nam:
- 💰 Tiền (Money)
- 🏠 Tin (Small house/apartment)
- 🏡 Nhà (Villa/House)
- 🚗 Xe (Car)
- 📜 Sổ đỏ (Red book/Property deed)
- 💍 Vàng (Gold/Ring)

**Spawn mechanics:**
- Procedurally generated along path
- Risk vs Reward positioning
- Combo system for consecutive collection

---

## ⏱️ Game Duration

### Before (Platformer)
- 3-5 minutes per level
- Player-paced (can stop, go back)
- Finish when reach end goal

### After (Endless Runner)
- **2-3 minutes per run**
- Constant forward motion (can't stop)
- End conditions:
  1. Collision with obstacle → Game Over
  2. Complete 2 minutes → Success + Bonus

---

## 🎯 Accessibility Improvements

### Easier for Everyone
- ✅ **One button** vs multiple controls
- ✅ **Auto-run** - không cần lo di chuyển
- ✅ **Simple timing** - chỉ cần nhảy đúng lúc
- ✅ **Visual feedback** rõ ràng
- ✅ **Forgiving difficulty** - có safe zones
- ✅ **Perfect for elderly** - không phức tạp
- ✅ **Mobile friendly** - tap anywhere
- ✅ **One-hand playable**

### Learning Curve
- Mario Platformer: ~2-3 phút để hiểu
- **Dinosaur Runner: ~5 giây để hiểu** ⭐

---

## 🏗️ Technical Advantages

### Simpler to Implement
- ✅ No complex level design needed
- ✅ No collision with platforms (chỉ obstacles)
- ✅ Simpler physics (gravity + jump only)
- ✅ Procedural generation dễ hơn tile-based
- ✅ Less assets needed overall
- ✅ Easier to balance difficulty
- ✅ Better performance (less objects on screen)

### Better for Wedding Context
- ✅ Quick games (2-3 min vs 5+ min)
- ✅ Easier for all ages
- ✅ More replayable (random generation)
- ✅ Leaderboard more competitive
- ✅ Perfect for casual mobile gaming

---

## 🎮 Gameplay Loop

### Chrome Dino Style Flow

```
1. START
   ↓
2. Auto-run forward (constant speed)
   ↓
3. Obstacles appear from right
   ↓
4. Player taps/presses to JUMP
   ↓
5. Collect items mid-air (optional)
   ↓
6. Land safely
   ↓
7. Speed increases gradually
   ↓
8. Repeat steps 3-7
   ↓
9. END (collision or time complete)
   ↓
10. Show score + wedding info + leaderboard
```

---

## 📱 Mobile Optimization

### Perfect for Landscape Mobile
- Full screen tap = jump
- No virtual buttons cluttering screen
- Clean, minimalist UI
- Score counter top-left (safe from Dynamic Island)
- Pause button top-right
- **Optimal UX for wedding guests**

---

## 🆚 Comparison Table

| Aspect | Mario Platformer | Dinosaur Runner |
|--------|------------------|-----------------|
| **Controls** | 3+ buttons | 1 button |
| **Complexity** | Medium | Very Low |
| **Learning time** | 2-3 minutes | 5 seconds |
| **Mobile friendly** | Moderate | Excellent |
| **Elderly friendly** | Moderate | Excellent |
| **Game duration** | 3-5 min | 2-3 min |
| **Replayability** | Low | High |
| **Development** | Complex | Simple |
| **Performance** | Medium | Excellent |
| **Assets needed** | Many | Fewer |

---

## 🎊 Why This Change is Better for Wedding Game

1. **Accessibility**: Mọi người đều chơi được, kể cả người lớn tuổi
2. **Quick & Fun**: 2-3 phút - perfect cho event
3. **Mobile Perfect**: Tap anywhere - không cần aim buttons
4. **Competitive**: Random generation → high replay value
5. **Simple**: Giải thích trong 5 giây
6. **Less Development**: Faster to build & deploy
7. **Better Performance**: Smooth 60 FPS easier to achieve
8. **Universal Appeal**: Chrome Dino game = everyone knows it!

---

## 🔄 What Stays The Same

- ✅ Wedding theme & Vietnamese culture
- ✅ Collectibles (tiền, nhà, xe, sổ đỏ, vàng)
- ✅ Leaderboard system
- ✅ RSVP integration
- ✅ Firebase + Vercel stack
- ✅ Wedding info display
- ✅ Prize for highest score
- ✅ Landscape mobile orientation
- ✅ High-contrast mode
- ✅ Accessibility features

---

## 🚀 Implementation Priority

### Phase 1: Core Gameplay (Week 1)
- [x] Auto-run character
- [x] Jump mechanics (tap/hold)
- [x] Collision detection
- [x] Basic obstacles
- [x] Score counter

### Phase 2: Content (Week 2)
- [x] Wedding themed obstacles
- [x] Collectibles (tiền, nhà, xe, etc.)
- [x] Parallax background
- [x] Sound effects

### Phase 3: Polish (Week 3)
- [x] Difficulty scaling
- [x] Combo system
- [x] Multipliers
- [x] UI polish
- [x] Wedding info integration

### Phase 4: Deployment (Week 4)
- [x] Firebase integration
- [x] Leaderboard
- [x] Testing
- [x] Vercel deployment

---

## 🎯 Success Metrics (Same as Before)

- Completion rate (target: >70%)
- Average score (for balancing)
- Play time (target: 2-3 min)
- Replay rate (target: >40%)
- RSVP conversion (track skip vs play)
- Leaderboard submissions

---

## ✅ Ready to Implement!

PRD đã updated hoàn chỉnh. Game giờ đơn giản hơn, dễ chơi hơn, và phù hợp hơn cho wedding context!

**Advantages:**
- 🎯 Simpler = Better for all ages
- 🎮 Chrome Dino = Familiar to everyone
- 📱 Perfect for mobile wedding guests
- ⚡ Faster development time
- 🏆 More competitive leaderboard

**Next step:** Update game code to implement endless runner mechanics!
