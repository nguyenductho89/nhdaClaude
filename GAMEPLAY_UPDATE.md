# 🎮 Current Gameplay - Endless Runner

## 📋 Game Type
**Dinosaur Endless Runner** (Chrome Dino Style) với theme công việc/stress

---

## 🎯 Core Mechanics

### Auto-Run
- Nhân vật chạy tự động từ trái sang phải
- Tốc độ tăng dần: 300px/s → 600px/s
- Không có điều khiển trái/phải

### Jump Controls
**Desktop:**
- Spacebar / Up Arrow / Click anywhere

**Mobile:**
- Nút ⬆ góc phải dưới (100px, ultra responsive)
- Tap anywhere cũng được (desktop mode)

### Game Duration
- **2 phút** để hoàn thành
- Có thể kết thúc sớm nếu va chạm obstacles

---

## 😰 Enemies - Work/Stress Theme

### Ground Enemies (70% spawn rate)
- **😰 Stress** - Lo âu công việc
- **⏰ Deadline** - Hạn chót
- **💼 Công việc** - Áp lực work
- **👔 Ông sếp** - Ông sếp khó tính
- **🌙 OT** - Làm thêm giờ
- **📊 Meeting** - Cuộc họp

### Flying Enemies (30% spawn rate)
Bay ở 3 độ cao khác nhau:
- **📧 Email khẩn** - Email cần trả lời gấp
- **📄 Báo cáo** - Report cần làm
- **📞 Điện thoại** - Cuộc gọi không ngừng
- **😡 Sếp giận** - Ông sếp nổi giận
- **📝 Task mới** - Công việc mới xuất hiện

**Flying Heights:**
- Low: 80px (cúi người hoặc timing)
- Medium: 120px (nhảy vừa)
- High: 160px (nhảy cao)

---

## 💰 Collectibles - Của Hồi Môn

### Items (theo độ hiếm)
- **💰 Tiền** (50%) - 10 điểm
- **🏠 Tin** (25%) - 50 điểm
- **🏡 Nhà** (13%) - 100 điểm
- **🚗 Xe** (8%) - 150 điểm + 5s invincibility
- **💍 Vàng** (4%) - 300 điểm + x2 multiplier 10s

### Spawn Mechanics
- Procedurally generated
- Risk vs Reward positioning
- Cao/thấp khác nhau, phải timing nhảy
- Spawn mỗi 2 giây

---

## 📊 Scoring System

### Score Calculation
```
Final Score = Distance + Items + Bonuses

Distance: 1 point/meter (auto-increment)

Items:
- Tiền: 10 pts
- Tin: 50 pts
- Nhà: 100 pts
- Xe: 150 pts (+ invincibility)
- Vàng: 300 pts (+ 2x multiplier)

Bonuses:
- Combo (5+ items): +50 pts
- Survival time: +10 pts/10s
- Perfect run (no hit + 2 min): +1000 pts

Multipliers:
- Combo active: x1.5
- Gold item: x2 (10 seconds)
```

---

## 🎯 Difficulty Scaling

### Speed Progression
- Start: 300px/s
- Max: 600px/s
- Increase: +30px/s every 30 seconds

### Obstacle Density
- Gap: 1500-3000ms (start)
- Reduces: 200ms every tier
- Min gap: 1000ms (max difficulty)

### Safe Periods
- First 5 seconds: no obstacles
- Every 45 seconds: 3s safe zone (breather)

---

## 🏆 End Conditions

### Game Over
- Collision with any obstacle
- Shows score + stats

### Victory
- Complete 2 minutes without dying
- +1000 Perfect Run Bonus (if no collision)
- Shows full stats + leaderboard

---

## 📱 Mobile Optimizations

### Fullscreen UI
- **Margins:** 5px absolute minimum
- **Canvas:** 100vw x 100vh (RESIZE mode)
- **Ground:** 30px from bottom

### UI Layout
```
TOP-LEFT (5px):
- Score: [number only]
- Distance: [number]m

TOP-RIGHT (5px):
- Timer: 0:00
- Pause: ⏸

BOTTOM-RIGHT (10px):
- Jump Button: ⬆ (100px circle)

CENTER (when active):
- Combo: 🔥 COMBO x5
- Multiplier: ⭐ x2
```

### Font Sizes
- Mobile: 16px base / 12px small
- Desktop: 24px base / 18px small

---

## ⚡ Power-Ups

### 🚗 Xe (Car) - Invincibility
- Duration: 5 seconds
- Effect: Cyan tint on player
- Can pass through all obstacles

### 💍 Vàng (Gold) - Score Multiplier
- Duration: 10 seconds
- Effect: x2 score for all points
- Gold star indicator shown

---

## 🎨 Visual Style

### Player
- Simple rectangle (40x60px)
- Gray color (#535353) like Chrome Dino
- Fixed position: 100-150px from left

### Backgrounds
- Sky: Static gradient (#87CEEB)
- Clouds: Slow parallax (x0.2)
- Mountains: Medium parallax (x0.5)
- Ground: Scrolling (x1.0)

### Emoji Sizes
- Ground obstacles: 48px
- Flying enemies: 42px
- Collectibles: 32-40px (by rarity)

---

## 🎮 Gameplay Loop

1. **Start** - Auto-run begins
2. **Obstacles appear** - Ground + Flying enemies
3. **Jump to avoid** - Single button control
4. **Collect items** - Risk vs Reward
5. **Speed increases** - Every 30 seconds
6. **Survive 2 minutes** - Victory!
7. **Or collision** - Game Over
8. **Show stats** - Score + Leaderboard

---

## 💡 Tips for Players

- **Hold space** không còn - chỉ nhấn 1 lần là nhảy
- **Flying enemies** bay ở nhiều độ cao - cần timing
- **Xe item** cho invincibility - ưu tiên lấy khi khó
- **Vàng item** x2 điểm - lấy trước khi thu thập nhiều items
- **Combo system** - lấy 5+ items liên tiếp = +50 bonus
- **Perfect run** - không va chạm + 2 phút = +1000!

---

## 🚀 Current Status

✅ Core endless runner mechanics
✅ Work/stress themed enemies
✅ Ground + Flying obstacles
✅ Procedural generation
✅ Dynamic difficulty scaling
✅ Combo system
✅ Power-ups (invincibility, multiplier)
✅ Fullscreen mobile optimized
✅ Responsive UI (desktop + mobile)
✅ Safe area insets (iPhone notch)
✅ Landscape mode enforcement
✅ Score tracking + leaderboard integration

---

## 📝 Technical Details

### Phaser Config
- Mode: RESIZE (mobile) / FIT (desktop)
- Physics: Arcade
- Gravity: 1000 (per-object)
- Canvas: 100% viewport

### Performance
- Target: 60 FPS
- Smooth scrolling
- Efficient spawning/cleanup
- Memory-optimized tweens

---

**Game ready for production! 🎉**
