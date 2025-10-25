# Product Requirements Document (PRD)
## Mario Style Wedding Invitation Game

---

## 1. Overview

### 1.1 Product Vision
Một trò chơi theo phong cách Mario được thiết kế đặc biệt làm thiệp mời đám cưới tương tác, mang đến trải nghiệm độc đáo và thú vị cho khách mời.

### 1.2 Target Audience
- Khách mời đám cưới (gia đình, bạn bè, đồng nghiệp)
- Người chơi trên mobile (chế độ landscape) và desktop

### 1.3 Core Concept
Game platformer 2D theo phong cách Super Mario Bros, trong đó nhân vật chú rể (Mario) vượt qua các chướng ngại vật để đến với cô dâu (thay thế cho công chúa), kết hợp thông tin đám cưới vào gameplay.

---

## 2. Technical Requirements

### 2.1 Platform
- **Primary**: HTML5 (Canvas/WebGL)
- **Mobile**: Landscape orientation only
- **Desktop**: Responsive web browser

### 2.2 Technology Stack
- HTML5 Canvas/Phaser.js/PixiJS
- JavaScript/TypeScript
- CSS3 for responsive layout
- Mobile-first responsive design

### 2.3 Performance Requirements
- Load time: < 5 seconds trên 4G
- Frame rate: 60 FPS ổn định
- Touch controls phản hồi < 50ms
- Tối ưu cho các thiết bị mobile phổ biến

### 2.4 Browser Compatibility
- Chrome 90+
- Safari 14+
- Firefox 88+
- Edge 90+

### 2.5 Backend Requirements - Firebase

#### 2.5.1 Database - Firebase Firestore
- **Database**: Cloud Firestore (NoSQL document database)
- **Free tier**: 1GB storage, 50K reads/day, 20K writes/day
- **Real-time**: Automatic sync, real-time listeners
- **Offline support**: Built-in offline persistence

**Collections:**
```
/players (collection)
  /{playerId} (document)
    - name: string
    - score: number
    - time: number (seconds)
    - items: map {
        tien: number,
        tin: number,
        nha: number,
        xe: number,
        soDo: number,
        vang: number
      }
    - device: string ("mobile" | "desktop")
    - ip: string (for rate limiting)
    - createdAt: timestamp
    - updatedAt: timestamp

/rsvp (collection) - Optional
  /{rsvpId} (document)
    - name: string
    - phone: string
    - guests: number
    - note: string
    - playedGame: boolean
    - score: number (if played)
    - device: string
    - createdAt: timestamp
```

#### 2.5.2 API - Firebase Cloud Functions
**Functions:**
- `submitScore(data)` - Submit player score
  - Input: `{ name, score, time, items, device }`
  - Output: `{ success: true, playerId: string }`
  - Rate limiting: 10 submissions/hour per IP

- `getLeaderboard(data)` - Get top players
  - Input: `{ period: 'all'|'daily'|'weekly', limit: number }`
  - Output: `Array<Player>`

- `submitRSVP(data)` - Submit RSVP (optional)
  - Input: `{ name, phone, guests, note, ... }`
  - Output: `{ success: true, rsvpId: string }`

#### 2.5.3 Security
**Firestore Security Rules:**
- Public read access to leaderboard
- Validated write access (name, score, time required)
- No update/delete (data integrity)
- IP-based rate limiting in Cloud Functions

**Data Validation:**
- Name: 2-50 characters, profanity filter
- Score: Positive integer, < 100,000 (prevent fake scores)
- Time: Positive integer, > 10 seconds (prevent cheating)
- Device: Must be "mobile" or "desktop"

**Rate Limiting:**
- 10 score submissions per IP per hour
- Firebase Cloud Functions tracks IP addresses
- Temporary ban after excessive submissions

---

## 3. Core Features

### 3.1 Gameplay Mechanics

#### 3.1.1 Character Control
- **Mario (Chú rể)**
  - Di chuyển: trái/phải
  - Nhảy: nút jump (có double jump)
  - Sprint: giữ nút để chạy nhanh hơn

#### 3.1.2 Level Design
- **1 level chính** từ điểm bắt đầu đến đích (cô dâu)
- Độ dài: 3-5 phút gameplay
- Checkpoints để không phải chơi lại từ đầu

#### 3.1.3 Obstacles & Enemies
- Goomba/Koopa được themed theo đám cưới
- Pipes, blocks, platforms
- Không quá khó, phù hợp với mọi lứa tuổi

### 3.2 Wedding Integration

#### 3.2.1 Story Elements
- **Intro screen**: Câu chuyện tình yêu ngắn gọn
- **In-game collectibles** (theo văn hóa Việt Nam):
  - **Coins**: Tiền (xu vàng, tiền giấy)
  - **Power-ups**:
    - Tin (nhà tin/nhà trọ) - tăng tốc độ
    - Nhà (căn nhà) - invincibility
    - Xe (ô tô) - sprint boost
    - Sổ đỏ (sổ hồng) - extra life
    - Vàng (thỏi vàng, nhẫn vàng) - điểm cao
  - Mỗi item có giá trị điểm khác nhau
- **End screen**: Thông tin đám cưới chi tiết

#### 3.2.2 Wedding Information Display
- Tên cô dâu - chú rể
- Ngày giờ đám cưới
- Địa điểm (có link Google Maps)
- Thông tin liên hệ
- RSVP button/form

#### 3.2.3 Customization
- Sprite của Mario → hình ảnh chú rể
- Sprite của Princess → hình ảnh cô dâu
- Background music → nhạc đám cưới/nhạc chủ đề của cặp đôi
- Color scheme theo theme đám cưới

### 3.3 Player History & Leaderboard System

#### 3.3.1 Score Tracking
- **Score calculation**:
  - Coins collected: 10 points/coin
  - Power-ups:
    - Tin: 20 points
    - Nhà: 50 points
    - Xe: 30 points
    - Sổ đỏ: 100 points
    - Vàng: 200 points
  - Time bonus: Càng nhanh càng cao điểm
  - Completion bonus: 500 points

#### 3.3.2 Player Data Storage
- **Local Storage** (optional login):
  - Player name input
  - High score
  - Play count
  - Best time
- **Backend Database** (for leaderboard):
  - Name
  - Score
  - Time completed
  - Date played
  - Device type (mobile/desktop)

#### 3.3.3 Leaderboard Features
- **Real-time leaderboard** hiển thị top players
- **Filters**:
  - All time
  - Daily
  - Weekly
- **Display info**:
  - Rank
  - Player name
  - Score
  - Time
  - Date
- **Prize announcement**: Banner thông báo quà cho người cao điểm nhất
- **Export function**: Admin có thể export danh sách để trao quà

### 3.4 Mobile Controls

#### 3.4.1 Touch Interface
- **Virtual D-pad**: Di chuyển trái/phải (bên trái màn hình)
- **Jump button**: Bên phải màn hình
- **Sprint button**: Optional, có thể auto-sprint
- Buttons lớn, dễ bấm (min 60px)

#### 3.4.2 Landscape Optimization
- Force landscape orientation
- Warning message nếu người dùng giữ portrait
- UI elements positioned cho landscape

#### 3.4.3 iPhone Dynamic Island Handling
- **Safe area insets**: Tránh vùng Dynamic Island (iPhone 14 Pro, 15 Pro, 16 Pro)
- **Critical UI positioning**:
  - Score, timer: Không đặt ở giữa trên cùng
  - Buttons: Đặt ở góc, tránh vùng bị che
- **CSS env() variables**:
  - `safe-area-inset-top`
  - `safe-area-inset-left`
  - `safe-area-inset-right`
- **Testing**: Test trên các iPhone có Dynamic Island
- **Fallback**: Margin an toàn 44px từ top cho landscape

### 3.5 Desktop Controls
- Keyboard: Arrow keys / WASD
- Spacebar: Jump
- Shift: Sprint

### 3.6 Accessibility Features

#### 3.6.1 Typography
- **Font size tối thiểu**: 16px cho tất cả text
- **Body text**: 18px - 20px
- **UI buttons**: 18px - 24px
- **Score/timer**: 24px - 32px (dễ đọc khi chơi)
- **Font family**: Sans-serif, dễ đọc (Roboto, Arial, Helvetica)
- **Line height**: 1.5 cho đoạn text dài

#### 3.6.2 High-Contrast Mode
- **Toggle button**: Bật/tắt high-contrast mode
- **High-contrast palette**:
  - Background: #000000 (black) hoặc #FFFFFF (white)
  - Text: #FFFFFF (white) hoặc #000000 (black)
  - Buttons: High contrast borders (3px solid)
  - Interactive elements: Yellow (#FFD700) highlights
- **Maintained for**:
  - Người lớn tuổi
  - Người khiếm thị màu
  - Điều kiện ánh sáng kém
- **Persistence**: Lưu setting vào localStorage

#### 3.6.3 Visual Accessibility
- **Button states**:
  - Normal, Hover, Active, Disabled states rõ ràng
  - Border contrast ratio ≥ 3:1
- **Text contrast**: WCAG AA standard (4.5:1)
- **Focus indicators**: Visible outline cho keyboard navigation
- **No text in images**: Text luôn là HTML text, không embed trong ảnh

#### 3.6.4 UX for Skip / Replay

**During Intro:**
- **"Skip Game → Wedding Info" button**:
  - Luôn hiển thị ở góc trên phải (hoặc dưới nút Start Game)
  - Size lớn: min 120px width × 48px height
  - Contrast cao, dễ thấy
  - Icon: ⏩ hoặc ➡️
  - Text: "Bỏ qua game - Xem thông tin"

**During Gameplay:**
- **Pause menu** (nút Pause luôn có):
  - Resume Game
  - Restart Level
  - **Skip to Wedding Info** (in-game shortcut)
  - Settings (sound, controls)

**After Completion:**
- **Victory screen** có 3 nút chính:
  - **"Play Again"** (primary button, lớn nhất)
    - Icon: 🔄
    - Text: "Chơi lại"
    - Size: 160px × 56px
  - **"View Wedding Info"** (secondary button)
    - Icon: 💒 hoặc 💍
    - Text: "Xem thông tin đám cưới"
    - Size: 160px × 56px
  - **"Leaderboard"** (tertiary)
    - Xem toàn bộ BXH

**Navigation Flow:**
- Từ Wedding Info → "Back to Game" button
- Từ Leaderboard → "Back to Game" hoặc "Wedding Info"
- Breadcrumb: Home > Game > Results > Info

---

## 4. User Flow

### 4.1 Entry Point
1. Khách mời nhận link/QR code
2. Mở trên browser (mobile/desktop)
3. Loading screen với tên cặp đôi

### 4.2 Intro Screen
1. Animated title: "[Tên Chú Rể] ❤️ [Tên Cô Dâu]"
2. Brief story text (optional, có thể skip)
3. **"Start Game" button** (primary, center, lớn)
4. **"Skip to Wedding Info" button** (secondary, visible, luôn hiển thị)
   - Position: Góc trên phải hoặc dưới Start Game
   - Min size: 120px × 48px
   - High contrast để dễ thấy
5. Controls instruction (collapsible)
6. Settings: Sound/Music toggle, High-contrast mode toggle

### 4.3 Gameplay
1. Level bắt đầu
2. Thu thập items (trái tim, nhẫn)
3. Vượt qua obstacles
4. Đến đích (cô dâu)

### 4.4 End Screen / Wedding Info

#### 4.4.1 Victory Screen (After Completing Game)
1. **Victory animation** (confetti, celebration)
2. **Score summary**:
   - Total score (lớn, nổi bật)
   - Items collected breakdown
   - Time taken
   - Rank message (Top 10, Top 50, etc.)
3. **Player name input** (nếu chưa nhập):
   - "Nhập tên để lưu điểm"
   - Validation: 2-20 ký tự
4. **Primary Actions** (3 nút lớn, dễ thấy):
   - **"Play Again" (🔄)** - Primary button, 160px × 56px
   - **"View Wedding Info" (💒)** - Secondary button, 160px × 56px
   - **"Leaderboard" (🏆)** - Tertiary button
5. **Mini leaderboard preview**: Top 5 players

#### 4.4.2 Wedding Info Page (Accessed via Skip or After Game)

**Fallback for Non-Gamers:**
Khi người dùng skip game, vẫn track và lưu thông tin:
- Device info (mobile/desktop, browser, OS)
- Access time và timestamp
- Referral source (nếu có)
- Interaction events (scroll, click, form fills)

1. **Hero section**:
   - **Ảnh đại diện cặp đôi** (lớn, nổi bật)
   - Tên đầy đủ với animation
   - **Countdown timer đến ngày cưới**:
     - Format: "XX ngày XX giờ XX phút XX giây"
     - Animate khi số thay đổi
     - Khi hết countdown: "Hôm nay là ngày trọng đại!"
   - Quote/câu nói đặc biệt
   - Background music (auto-mute nếu silent mode)
2. **Event Details**:
   - Ngày giờ (calendar format)
   - Địa điểm chi tiết
   - Google Maps embed (interactive)
   - Dress code (nếu có)
   - Timeline sự kiện (tiệc ngày, tiệc tối)
3. **Prize announcement**:
   - Banner thông báo quà cho người cao điểm nhất
   - Deadline để tham gia (nếu có)
   - CTA: "Chơi game để nhận quà!"
4. **RSVP Form** (tracked ngay cả khi skip game):
   - Họ tên (required)
   - Số điện thoại (required)
   - Số người tham dự (dropdown: 1, 2, 3+)
   - Ghi chú (optional)
   - **Hidden fields**:
     - Device type
     - Access timestamp
     - Did play game: Yes/No
     - Game score (if played)
5. **Actions**:
   - **"Play Game" button** (nếu chưa chơi - incentivize)
   - **"Play Again" button** (nếu đã chơi)
   - Share buttons (Facebook, Zalo, Copy link)
   - "Add to Calendar" button
6. **Additional Features**:
   - Photo gallery (optional)
   - **Leaderboard link**: "Xem bảng xếp hạng"
   - Gift registry info (optional)

---

## 5. Design Requirements

### 5.1 Visual Style
- **Flexible art style**: Hỗ trợ cả pixel art và PNG images
- **Asset format**: PNG với transparent background
- Nhân vật và items có thể sử dụng ảnh PNG thật
- Color palette: Có thể tùy chỉnh theo theme đám cưới
- Bright, cheerful, romantic

### 5.2 Characters
- **Chú rể (Mario)**: Suit/vest, có thể custom màu
- **Cô dâu (Princess)**: Váy cưới, vương miện/hoa
- Enemies: Themed theo đám cưới (ví dụ: cupcake thay vì Goomba)

### 5.3 Environment
- Background: Romantic setting (vườn, lâu đài, bãi biển)
- Platforms: Wedding themed (cake tiers, present boxes)
- **Collectibles** (PNG images supported):
  - Tiền (xu vàng, tiền giấy VND)
  - Tin (icon nhà tin/nhà trọ)
  - Nhà (căn nhà, biệt thự)
  - Xe (ô tô, xe hơi)
  - Sổ đỏ (sổ hồng bất động sản)
  - Vàng (thỏi vàng, nhẫn vàng, vòng vàng)

### 5.4 Audio

#### 5.4.1 Background Music
- 8-bit version nhạc đám cưới hoặc nhạc chủ đề
- Looping seamlessly
- Volume control (slider)
- Auto-mute detection:
  - **iOS Silent Mode**: Detect via `navigator.vibrate()` fallback
  - **Android**: Detect via Audio Context state
  - **User preference**: Save mute state to localStorage
  - **Respect autoplay policy**: Start muted, require user interaction

#### 5.4.2 Sound Effects
- Jump, coin collect, power-up sounds
- Mario classic SFX style
- Independent volume from music
- Can disable separately from music

#### 5.4.3 Audio Controls
- **Mute/unmute button**: Luôn visible (góc màn hình)
- **Auto-mute triggers**:
  - Device in silent/vibrate mode
  - User taps mute before
  - System audio policy (iOS restrictions)
- **Smart audio handling**:
  - Fade in/out (không bật đột ngột)
  - Pause when tab inactive
  - Resume when tab active (nếu không muted)

#### 5.4.4 Implementation
```javascript
// Detect silent mode
const detectSilentMode = async () => {
  if (navigator.vibrate) {
    // iOS silent mode detection
    const canVibrate = navigator.vibrate(0);
    return !canVibrate; // Silent if can't vibrate
  }
  return false;
};

// Auto-mute if silent mode
if (await detectSilentMode()) {
  muteAudio();
}
```

---

## 6. Content Requirements - Thông Tin Thiệp Cưới Theo Văn Hóa Việt Nam

### 6.1 Lời Mời Cưới (Wedding Invitation Text)

#### 6.1.1 Header / Title
```
THIỆP MỜI CƯỚI
[hoặc]
WEDDING INVITATION
```

#### 6.1.2 Lời Mở Đầu (Opening)
Có thể chọn 1 trong các phong cách:

**Phong cách Trang Trọng:**
```
Trân trọng kính mời
Đến dự tiệc cưới của con chúng tôi
```

**Phong cách Hiện Đại:**
```
Rất hân hạnh được mời bạn
Đến chung vui trong ngày trọng đại của chúng tôi
```

**Phong cách Thân Mật:**
```
Chúng tôi rất vui được đón bạn
Đến chia sẻ niềm hạnh phúc trong ngày cưới
```

### 6.2 Thông Tin Gia Đình (Family Information)

#### 6.2.1 Nhà Trai (Groom's Family)
```
NHÀ TRAI
---------
Ông: [Tên bố chú rể]
Bà: [Tên mẹ chú rể]

Trân trọng kính mời
đến dự tiệc cưới của con trai

[TÊN CHÚ RỂ ĐẦY ĐỦ]
```

#### 6.2.2 Nhà Gái (Bride's Family)
```
NHÀ GÁI
---------
Ông: [Tên bố cô dâu]
Bà: [Tên mẹ cô dâu]

Trân trọng kính mời
đến dự tiệc cưới của con gái

[TÊN CÔ DÂU ĐẦY ĐỦ]
```

#### 6.2.3 Combined Format (Nếu cả 2 họ cùng tổ chức)
```
Gia đình nhà trai: Ông [Tên] - Bà [Tên]
Gia đình nhà gái: Ông [Tên] - Bà [Tên]

Trân trọng kính mời quý khách
đến dự tiệc cưới của

[TÊN CHÚ RỂ] ♥ [TÊN CÔ DÂU]
```

### 6.3 Thông Tin Sự Kiện (Event Details)

#### 6.3.1 Lễ Vu Quy (Bride's Ceremony - Optional)
```
📍 LỄ VU QUY (NHÀ GÁI)

🗓️ Thời gian: [Giờ] - [Ngày/Tháng/Năm]
   Ví dụ: 08:00 Sáng - Chủ nhật, 15/12/2024

📍 Địa điểm: [Địa chỉ nhà gái đầy đủ]
   Ví dụ: 123 Đường ABC, Phường XYZ, Quận 1, TP.HCM

📞 Liên hệ: [SĐT gia đình nhà gái]
```

#### 6.3.2 Lễ Thành Hôn / Tiệc Cưới (Main Wedding Reception)
```
💒 Lễ THÀNH HÔN / TIỆC CƯỚI

🗓️ Thời gian: [Giờ] - [Ngày/Tháng/Năm]
   Format options:
   - 18:00 Tối - Chủ nhật, 15/12/2024
   - Thứ Bảy, ngày 14 tháng 12 năm 2024, lúc 17:00
   - Saturday, December 14, 2024 at 5:00 PM

📍 Địa điểm: [Tên nhà hàng/trung tâm tiệc cưới]
   [Địa chỉ đầy đủ]

🅿️ Chỗ đậu xe: [Thông tin parking nếu có]

📞 Liên hệ: [SĐT gia đình nhà trai hoặc cặp đôi]
   Chú rể: [SĐT]
   Cô dâu: [SĐT]
```

#### 6.3.3 Timeline Chi Tiết
```
📅 CHƯƠNG TRÌNH SỰ KIỆN

17:00 - 17:30  Đón tiếp khách
17:30 - 18:00  Lễ vu quy (nếu tổ chức cùng ngày)
18:00 - 18:30  Nghi thức gia tiên, rước dâu
18:30 - 19:30  Tiệc chiêu đãi
19:30 - 21:00  Chương trình văn nghệ, cắt bánh
21:00 - 22:00  Tiệc cocktail, chụp ảnh
```

### 6.4 Thông Tin Bổ Sung (Additional Information)

#### 6.4.1 Dress Code
```
👔 Dress Code:
   - Nam: Vest, Suit (tối màu)
   - Nữ: Áo dài, Váy dạ hội
   - Lưu ý: Tránh mặc trắng (màu của cô dâu)
```

#### 6.4.2 RSVP
```
💌 XÁC NHẬN THAM DỰ

Vui lòng xác nhận trước ngày [Ngày/Tháng/Năm]
📞 Liên hệ: [SĐT] - [Tên người liên hệ]
📧 Email: [Email]
💬 Zalo/Messenger: [Link]
hoặc điền form RSVP trực tuyến
```

#### 6.4.3 Thông Tin Khách Sạn (Accommodation)
```
🏨 THÔNG TIN LƯU TRÚ

Dành cho khách từ xa:
• [Tên khách sạn 1] - [SĐT] - Cách [X]km
• [Tên khách sạn 2] - [SĐT] - Cách [X]km

Ưu đãi đặc biệt cho khách mời (nếu có)
Code: WEDDING2024
```

#### 6.4.4 Mừng Cưới (Gift Registry)
```
🎁 MỪNG CƯỚI

Sự hiện diện của quý khách là niềm vui lớn nhất
Nếu muốn gửi lời chúc mừng:

🏦 Chuyển khoản:
   Ngân hàng: [Tên ngân hàng]
   Chủ tài khoản: [Tên]
   Số tài khoản: [STK]
   Nội dung: [Tên khách] mung cuoi [Tên cặp đôi]

📮 Hoặc:
   Trao trực tiếp tại buổi tiệc
```

### 6.5 Lời Kết (Closing)

```
Sự hiện diện của quý khách là niềm vinh hạnh cho gia đình chúng tôi

Trân trọng cảm ơn!

---

[Tên gia đình nhà trai] ♥ [Tên gia đình nhà gái]
```

### 6.6 Required Data Fields (For CMS/Config)

```javascript
// Wedding info configuration
{
  // Thông tin cặp đôi
  groom: {
    fullName: "Nguyễn Văn A",
    firstName: "A",
    father: "Nguyễn Văn B",
    mother: "Trần Thị C",
    phone: "0901234567",
    avatar: "/images/groom.png"
  },
  bride: {
    fullName: "Trần Thị D",
    firstName: "D",
    father: "Trần Văn E",
    mother: "Lê Thị F",
    phone: "0907654321",
    avatar: "/images/bride.png"
  },

  // Sự kiện
  events: [
    {
      type: "vu_quy", // Lễ vu quy (nhà gái)
      title: "Lễ Vu Quy (Nhà Gái)",
      date: "2024-12-15",
      time: "08:00",
      timezone: "GMT+7",
      location: {
        name: "Nhà riêng",
        address: "123 Đường ABC, Phường XYZ, Quận 1, TP.HCM",
        googleMapsUrl: "https://maps.google.com/...",
        parking: "Có chỗ đậu xe trong ngõ"
      },
      contact: {
        name: "Bố cô dâu",
        phone: "0909999999"
      }
    },
    {
      type: "thanh_hon", // Lễ thành hôn (nhà trai)
      title: "Lễ Thành Hôn & Tiệc Cưới",
      date: "2024-12-15",
      time: "18:00",
      timezone: "GMT+7",
      location: {
        name: "Trung Tâm Tiệc Cưới ABC",
        address: "456 Đường DEF, Quận 3, TP.HCM",
        googleMapsUrl: "https://maps.google.com/...",
        parking: "Bãi đậu xe miễn phí tầng B1-B2",
        capacity: "500 khách"
      },
      contact: {
        name: "Bố chú rể",
        phone: "0908888888"
      }
    }
  ],

  // Timeline
  timeline: [
    { time: "17:00", activity: "Đón tiếp khách" },
    { time: "18:00", activity: "Nghi thức gia tiên" },
    { time: "18:30", activity: "Tiệc chiêu đãi" },
    { time: "19:30", activity: "Chương trình văn nghệ" },
    { time: "21:00", activity: "Tiệc cocktail" }
  ],

  // Thông tin bổ sung
  dressCode: "Áo dài, Vest, Váy dạ hội (Tránh mặc trắng)",

  rsvp: {
    deadline: "2024-12-01",
    phone: "0901234567",
    email: "wedding@example.com"
  },

  accommodation: [
    {
      name: "Khách sạn ABC",
      phone: "028.xxxx.xxxx",
      distance: "2km từ địa điểm tiệc",
      priceRange: "500k-1M/đêm"
    }
  ],

  giftRegistry: {
    bank: "Vietcombank",
    accountName: "Nguyen Van A",
    accountNumber: "1234567890",
    transferNote: "Mung cuoi A ♥ D"
  },

  // Văn bản
  invitationText: {
    opening: "Trân trọng kính mời",
    closing: "Sự hiện diện của quý khách là niềm vinh hạnh cho gia đình chúng tôi. Trân trọng cảm ơn!"
  },

  // Story
  loveStory: "Chúng tôi gặp nhau lần đầu vào năm 2020...",

  // Photos
  photos: {
    hero: "/images/hero.jpg",
    gallery: [
      "/images/photo1.jpg",
      "/images/photo2.jpg"
    ]
  }
}
```

### 6.7 Display Format (UI Layout)

Wedding Info Page nên hiển thị theo thứ tự:
1. **Hero Section**: Ảnh đại diện + tên + countdown
2. **Lời Mời**: Opening text
3. **Thông Tin Gia Đình**: Nhà trai + Nhà gái
4. **Sự Kiện**:
   - Lễ Vu Quy (nếu có)
   - Lễ Thành Hôn / Tiệc Cưới
5. **Timeline**: Chương trình chi tiết
6. **Google Maps**: Embed map cho từng địa điểm
7. **Dress Code**
8. **RSVP Form**
9. **Thông tin bổ sung**: Khách sạn, mừng cưới
10. **Lời cảm ơn**: Closing text
11. **Photo Gallery** (optional)
12. **Game Leaderboard Link**

---

## 7. Success Metrics

### 7.1 Technical Metrics
- Page load time < 5s
- 60 FPS maintained
- < 5% bounce rate
- Mobile vs Desktop traffic ratio

### 7.2 Engagement Metrics
- Average play time
- Completion rate
- RSVP conversion rate
- Social shares

---

## 8. Development Phases

### Phase 1: MVP (Core Game)
- Basic platformer mechanics
- 1 simple level
- Desktop keyboard controls
- Static wedding info display

### Phase 2: Mobile Optimization
- Touch controls
- Landscape orientation lock
- Responsive UI
- Performance optimization

### Phase 3: Wedding Customization
- Character customization system
- Theme color customization
- Music upload
- Content management

### Phase 4: Leaderboard & Scoring
- Player history tracking
- Score calculation system
- Leaderboard backend (Firebase/Supabase)
- Real-time leaderboard updates
- Admin dashboard for exporting player data

### Phase 5: Advanced Features
- RSVP form integration
- Photo gallery
- Guest book
- Multiple language support
- Prize distribution tracking

### Phase 6: Accessibility & Polish
- High-contrast mode implementation
- Font size optimization (16px minimum)
- Skip/Replay UX improvements
- WCAG AA compliance
- Cross-browser testing
- iPhone Dynamic Island testing

---

## 9. Build & Deployment

### 9.1 Development Environment Setup

#### 9.1.1 Prerequisites
- Node.js 18+ và npm/yarn
- Git for version control
- Code editor: VS Code (recommended)
- Browser DevTools

#### 9.1.2 Project Structure
```
wedding-game/
├── src/
│   ├── assets/
│   │   ├── images/          # PNG sprites, characters, items
│   │   ├── audio/           # Music, SFX
│   │   ├── levels/          # Tiled JSON files
│   │   └── fonts/           # Web fonts
│   ├── game/
│   │   ├── scenes/          # Phaser scenes
│   │   ├── entities/        # Player, enemies, items
│   │   ├── config.js        # Game configuration
│   │   └── main.js          # Entry point
│   ├── ui/
│   │   ├── components/      # React/Vue components
│   │   ├── screens/         # Intro, Victory, Wedding Info
│   │   └── styles/          # CSS/SCSS
│   ├── services/
│   │   ├── leaderboard.js   # API calls
│   │   ├── storage.js       # LocalStorage utilities
│   │   └── analytics.js     # Tracking
│   └── utils/
│       ├── accessibility.js # High-contrast, font scaling
│       └── device.js        # Device detection
├── public/
│   └── index.html
├── functions/               # Firebase Cloud Functions
│   └── api/
│       ├── scores.js
│       └── leaderboard.js
├── package.json
├── webpack.config.js
└── README.md
```

#### 9.1.3 Installation
```bash
# Clone repository
git clone <repo-url>
cd wedding-game

# Install dependencies
npm install

# Environment variables
cp .env.example .env
# Edit .env with Firebase config, API keys
```

### 9.2 Build Process

#### 9.2.1 Development Build
```bash
# Start dev server with hot reload
npm run dev

# Runs on http://localhost:3000
# Enable source maps for debugging
```

#### 9.2.2 Production Build
```bash
# Build optimized bundle
npm run build

# Output to /dist folder
# Minification, tree-shaking, code splitting enabled
```

#### 9.2.3 Build Optimization
- **Asset optimization**:
  - Image compression: TinyPNG, ImageOptim
  - Audio compression: MP3 128kbps
  - Sprite atlases: TexturePacker
- **Code optimization**:
  - Webpack bundle analyzer
  - Code splitting by route
  - Lazy loading for assets
  - Tree shaking unused code
- **Performance**:
  - Preload critical assets
  - Progressive loading
  - Service worker caching (PWA)

#### 9.2.4 Build Configuration
```javascript
// webpack.config.js highlights
module.exports = {
  optimization: {
    minimize: true,
    splitChunks: {
      chunks: 'all',
    },
  },
  performance: {
    maxAssetSize: 512000,  // 500KB limit
    maxEntrypointSize: 512000,
  },
};
```

### 9.3 Testing

#### 9.3.1 Local Testing
- **Desktop browsers**: Chrome, Firefox, Safari, Edge
- **Mobile emulation**: Chrome DevTools device mode
- **Accessibility**:
  - WAVE browser extension
  - Lighthouse accessibility audit
  - Keyboard navigation testing

#### 9.3.2 Device Testing
- **Real devices**:
  - iPhone 14 Pro / 15 Pro (Dynamic Island)
  - iPhone SE (small screen)
  - Android flagship (Samsung, Pixel)
  - Android mid-range
  - iPad (landscape tablet)
- **Orientation testing**: Force landscape, test portrait warning
- **Performance testing**: 4G/3G throttling

#### 9.3.3 Cross-browser Testing
- BrowserStack / Sauce Labs
- Test matrix:
  - iOS Safari 14+
  - Chrome Android 90+
  - Desktop browsers (latest 2 versions)

### 9.4 Deployment

#### 9.4.1 Frontend Hosting - Vercel (Free)

**🎯 Vercel - Free Forever Plan**

**Free tier features:**
- ✅ Unlimited personal projects
- ✅ 100GB bandwidth/month
- ✅ Serverless functions included
- ✅ Auto SSL + Global CDN
- ✅ Custom domain support (miễn phí)
- ✅ Auto deploy from GitHub
- ✅ Preview deployments for PRs
- ✅ Environment variables support

**Deploy Options:**

**Option A: Via Vercel CLI (Nhanh nhất)**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (interactive)
vercel

# Production deploy
vercel --prod
```

**Option B: Via GitHub Integration (Tự động nhất - RECOMMENDED)**
1. Push code lên GitHub
2. Truy cập [vercel.com](https://vercel.com)
3. Import GitHub repository
4. Add environment variables
5. Deploy (auto deploy khi push code mới)

```bash
# Push to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/username/wedding-game.git
git push -u origin main

# Then import on vercel.com
```

**Build Configuration:**
```javascript
// vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "env": {
    "VITE_FIREBASE_API_KEY": "@firebase_api_key",
    "VITE_FIREBASE_PROJECT_ID": "@firebase_project_id"
  }
}
```

**Deployment URL:**
- Default: `https://wedding-game.vercel.app`
- Custom domain: `https://wedding.yourdomain.com` (free SSL)

#### 9.4.2 Backend Deployment - Firebase (Free)

**🔥 Firebase - Spark Plan (100% Free)**

**Free tier features:**
- ✅ **Firestore Database**: 1GB storage, 50K reads/day, 20K writes/day
- ✅ **Cloud Functions**: 2M invocations/month, 400K GB-seconds
- ✅ **Realtime Database**: 1GB storage, 10GB/month transfer (alternative)
- ✅ **Authentication**: Unlimited users (nếu cần)
- ✅ **Hosting**: 10GB storage, 360MB/day bandwidth (có thể dùng thay Vercel)
- ✅ **Storage**: 5GB cho ảnh/assets

**Đủ cho:** Đám cưới 200-500 khách, ~1000 lượt chơi game

---

**Setup Firebase Project**

**Step 1: Tạo Firebase Project**
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Init project
firebase init

# Chọn:
# ✅ Firestore
# ✅ Functions
# ✅ Hosting (optional)
```

**Step 2: Firestore Database Setup**

Tạo collection `players` với structure:
```javascript
// Collection: players
{
  id: "auto-generated-id",
  name: "Nguyễn Văn A",
  score: 1250,
  time: 180, // seconds
  items: {
    tien: 10,
    tin: 2,
    nha: 1,
    xe: 1,
    soDo: 0,
    vang: 3
  },
  device: "mobile", // or "desktop"
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

**Firestore Security Rules:**
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Players collection
    match /players/{playerId} {
      // Allow anyone to read
      allow read: if true;

      // Allow create with validation
      allow create: if request.resource.data.name is string &&
                       request.resource.data.score is int &&
                       request.resource.data.time is int &&
                       request.resource.data.device in ['mobile', 'desktop'];

      // Prevent updates and deletes (data integrity)
      allow update, delete: if false;
    }

    // RSVP collection (optional)
    match /rsvp/{rsvpId} {
      allow read: if request.auth != null; // Only admin
      allow create: if true; // Anyone can submit RSVP
      allow update, delete: if false;
    }
  }
}
```

**Firestore Indexes:**
```javascript
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "players",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "score", "order": "DESCENDING" },
        { "fieldPath": "time", "order": "ASCENDING" }
      ]
    }
  ]
}
```

**Step 3: Cloud Functions Setup**

```bash
# Navigate to functions directory
cd functions

# Install dependencies
npm install
```

**Example Cloud Function - Submit Score:**
```javascript
// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

// Submit score endpoint
exports.submitScore = functions.https.onCall(async (data, context) => {
  // Validate input
  const { name, score, time, items, device } = data;

  if (!name || !score || !time || !device) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  // Rate limiting (basic)
  const ip = context.rawRequest.ip;
  const recentSubmissions = await db.collection('players')
    .where('ip', '==', ip)
    .where('createdAt', '>', new Date(Date.now() - 3600000)) // 1 hour
    .get();

  if (recentSubmissions.size >= 10) {
    throw new functions.https.HttpsError('resource-exhausted', 'Too many submissions');
  }

  // Name filtering
  const filteredName = filterProfanity(name);

  // Save to Firestore
  const playerRef = await db.collection('players').add({
    name: filteredName,
    score: parseInt(score),
    time: parseInt(time),
    items: items || {},
    device: device,
    ip: ip, // For rate limiting
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  return { success: true, playerId: playerRef.id };
});

// Get leaderboard
exports.getLeaderboard = functions.https.onCall(async (data, context) => {
  const { period = 'all', limit = 100 } = data;

  let query = db.collection('players')
    .orderBy('score', 'desc')
    .orderBy('time', 'asc');

  // Filter by period
  if (period === 'daily') {
    const yesterday = new Date(Date.now() - 86400000);
    query = query.where('createdAt', '>', yesterday);
  } else if (period === 'weekly') {
    const lastWeek = new Date(Date.now() - 604800000);
    query = query.where('createdAt', '>', lastWeek);
  }

  const snapshot = await query.limit(limit).get();

  const players = [];
  snapshot.forEach(doc => {
    players.push({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    });
  });

  return players;
});

// Simple profanity filter
function filterProfanity(text) {
  const badWords = ['spam', 'test', /* add more */];
  let filtered = text;
  badWords.forEach(word => {
    const regex = new RegExp(word, 'gi');
    filtered = filtered.replace(regex, '***');
  });
  return filtered.substring(0, 50); // Max 50 chars
}
```

**Step 4: Deploy Firebase**
```bash
# Deploy Firestore rules and indexes
firebase deploy --only firestore

# Deploy Cloud Functions
firebase deploy --only functions

# Deploy all
firebase deploy
```

**Step 5: Get Firebase Config**
```bash
# Go to Firebase Console → Project Settings → General
# Copy config object
```

**Firebase Config (for frontend):**
```javascript
// src/config/firebase.js
export const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "wedding-game-xxxxx.firebaseapp.com",
  projectId: "wedding-game-xxxxx",
  storageBucket: "wedding-game-xxxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:xxxxxxxxxxxxx"
};
```

**Step 6: Frontend Integration**
```bash
# Install Firebase SDK
npm install firebase
```

```javascript
// src/services/leaderboard.js
import { initializeApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { firebaseConfig } from '../config/firebase';

const app = initializeApp(firebaseConfig);
const functions = getFunctions(app);

// Submit score
export async function submitScore(name, score, time, items, device) {
  const submitScoreFn = httpsCallable(functions, 'submitScore');
  const result = await submitScoreFn({ name, score, time, items, device });
  return result.data;
}

// Get leaderboard
export async function getLeaderboard(period = 'all', limit = 100) {
  const getLeaderboardFn = httpsCallable(functions, 'getLeaderboard');
  const result = await getLeaderboardFn({ period, limit });
  return result.data;
}
```

---

**Tech Stack Summary: Vercel + Firebase (100% Free)**

| Component | Service | Free Tier Limits |
|-----------|---------|------------------|
| **Frontend Hosting** | Vercel | 100GB bandwidth/month |
| **Database** | Firebase Firestore | 1GB storage, 50K reads/day, 20K writes/day |
| **API/Functions** | Firebase Cloud Functions | 2M invocations/month |
| **Storage** | Firebase Storage | 5GB (for images/assets) |
| **SSL/CDN** | Vercel + Firebase | ✅ Included |
| **Custom Domain** | Vercel | ✅ Free |

**Total Cost: $0/month** (cho đám cưới 200-500 khách) 🎉

#### 9.4.3 Environment Variables

**Local Development (.env.local):**
```bash
# Firebase config
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=wedding-game-xxxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=wedding-game-xxxxx
VITE_FIREBASE_STORAGE_BUCKET=wedding-game-xxxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:xxxxxxxxxxxxx

# Optional
VITE_ANALYTICS_ID=G-XXXXXXXXXX (Google Analytics)
```

**Vercel Environment Variables:**
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add same variables as above
3. Set environment: Production, Preview, Development
4. Deploy to apply changes

**Firebase Environment Config:**
```bash
# For Cloud Functions
firebase functions:config:set app.name="Wedding Game"
firebase functions:config:set app.url="https://wedding.yourdomain.com"
```

#### 9.4.4 Custom Domain (Optional)
```bash
# Add custom domain
# Example: wedding.example.com

# DNS Configuration:
# A record: @ → hosting IP
# CNAME: www → hosting domain

# SSL certificate (auto with Vercel/Netlify)
```

### 9.5 CI/CD Pipeline

#### 9.5.1 GitHub Actions Example
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

#### 9.5.2 Deployment Workflow
1. **Development**: Push to `dev` branch → Auto deploy to staging
2. **Testing**: QA on staging URL
3. **Production**: Merge to `main` → Auto deploy to production
4. **Rollback**: Revert commit if issues found

### 9.6 Monitoring & Analytics

#### 9.6.1 Performance Monitoring
- **Google Analytics 4**: User behavior, events
- **Vercel Analytics**: Core Web Vitals
- **Sentry**: Error tracking, crash reports

#### 9.6.2 Key Metrics to Track
- Page load time
- Game completion rate
- Skip rate (people who skip game)
- Leaderboard submissions
- RSVP conversion
- Device/browser breakdown
- Geographic data

#### 9.6.3 Custom Events
```javascript
// Track gameplay events
analytics.track('game_started');
analytics.track('game_completed', { score, time });
analytics.track('skip_to_info_clicked');
analytics.track('rsvp_submitted');
```

### 9.7 Maintenance & Updates

#### 9.7.1 Post-Launch Checklist
- [ ] Monitor error logs daily
- [ ] Check leaderboard for spam
- [ ] Verify RSVP submissions
- [ ] Test on new devices/browsers
- [ ] Update content if needed

#### 9.7.2 Content Updates
- Edit wedding info without redeploying
- Update leaderboard prizes
- Modify game difficulty
- Add/remove items

#### 9.7.3 Backup & Recovery
- Database backups (daily for Firestore)
- Asset backups (S3/Cloud Storage)
- Code versioning (Git tags)

### 9.8 Quick Start Guide - Deploy in 15 Minutes (Free)

**🚀 Path: Vercel + Firebase (100% Free)**

#### Step 1: Prepare Code (2 min)
```bash
# Clone or init project
git init wedding-game
cd wedding-game

# Install dependencies
npm install phaser howler firebase

# Create basic structure
mkdir -p src/{game,ui,services,assets}
```

#### Step 2: Setup Firebase (5 min)

**2.1. Create Firebase Project**
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click "Add project"
3. Enter project name: `wedding-game`
4. Disable Google Analytics (optional)
5. Create project (wait ~30 seconds)

**2.2. Setup Firestore Database**
1. Firebase Console → Build → Firestore Database
2. Click "Create database"
3. Start in **production mode**
4. Choose location: `asia-southeast1` (Singapore - gần VN nhất)
5. Enable

**2.3. Setup Cloud Functions**
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Initialize Firebase
firebase init

# Select:
# ✅ Firestore
# ✅ Functions
# Use existing project → select your project
# Accept defaults for Firestore
# For Functions: choose JavaScript, install dependencies
```

**2.4. Deploy Firestore Rules & Functions**

Edit `firestore.rules`:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /players/{playerId} {
      allow read: if true;
      allow create: if request.resource.data.name is string;
    }
  }
}
```

Edit `functions/index.js` - copy code from Section 9.4.2

Deploy:
```bash
firebase deploy --only firestore,functions
```

**2.5. Get Firebase Config**
1. Firebase Console → Project Settings (⚙️ icon)
2. Scroll to "Your apps" → Web app (</> icon)
3. Register app: name = "Wedding Game"
4. Copy config object

#### Step 3: Configure Environment (1 min)
```bash
# Create .env.local
cat > .env.local << EOF
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
EOF
```

#### Step 4: Test Locally (2 min)
```bash
# Start dev server
npm run dev

# Open http://localhost:5173
# Test game, submit score, check leaderboard
```

#### Step 5: Deploy to Vercel (5 min)

**Option A: GitHub + Vercel (Recommended)**
```bash
# Push to GitHub
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/username/wedding-game.git
git push -u origin main

# Deploy via Vercel Web UI:
# 1. Go to vercel.com → Sign up/Login with GitHub
# 2. New Project → Import your repo
# 3. Configure:
#    - Framework: Vite
#    - Build Command: npm run build
#    - Output Directory: dist
# 4. Add Environment Variables (copy from .env.local)
# 5. Deploy
```

**Option B: Vercel CLI (Faster)**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Add environment variables when prompted
# Or add via vercel.com dashboard

# Production deploy
vercel --prod
```

**Done! Your game is live at `https://wedding-game.vercel.app`** 🎉

#### Step 6: Add Custom Domain (Optional, 3 min)
1. Buy domain hoặc dùng subdomain có sẵn
2. Vercel Dashboard → Domains → Add
3. Enter domain: `wedding.yourdomain.com`
4. Update DNS (at domain provider):
   ```
   Type: CNAME
   Name: wedding (or @)
   Value: cname.vercel-dns.com
   ```
5. Wait for SSL (~1-2 min, auto)

**Alternative: Firebase Hosting (If you prefer all-Firebase)**
```bash
# Init hosting
firebase init hosting

# Build
npm run build

# Deploy
firebase deploy --only hosting

# Live at: https://wedding-game.web.app
```

---

**Your wedding game is now live!** 🎊

**Share với khách mời qua:**
- 📱 QR code trên thiệp giấy
- 💬 Zalo/Messenger group
- 📧 Email
- 📘 Facebook event
- 🔗 Link rút gọn: bit.ly, tinyurl.com

---

## 10. Constraints & Assumptions

### 10.1 Constraints
- File size < 10MB (cho loading nhanh)
- No app installation required
- Works offline after initial load (PWA)
- Không yêu cầu đăng nhập

### 10.2 Assumptions
- Khách mời có smartphone hoặc computer
- Internet connection available
- Basic gaming literacy

---

## 11. Future Enhancements

- Multiple levels (engagement story, ceremony, reception)
- Multiplayer mode (2 players cùng chơi)
- AR features (scan QR để chơi với AR)
- Achievement system (badges, trophies)
- Photo booth feature (chụp ảnh với game elements)
- Downloadable certificate cho người thắng
- Social sharing với score
- Custom level editor cho cặp đôi
- Replay system (xem lại gameplay)

---

## 12. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Không tương thích mobile | High | Extensive mobile testing, fallback controls |
| iPhone Dynamic Island che UI | High | Safe area insets, responsive positioning, testing trên iPhone Pro |
| Load time quá lâu | Medium | Asset optimization, lazy loading, progressive loading |
| Khó chơi với người lớn tuổi | Medium | Adjustable difficulty, tutorial, skip to info option |
| Browser compatibility | Medium | Progressive enhancement, polyfills |
| Leaderboard cheating/spam | Medium | Rate limiting, score validation, admin moderation |
| Backend downtime | Low | LocalStorage fallback, offline mode for scores |
| PNG assets quá nặng | Medium | Image compression, WebP format, lazy loading |

---

## Appendix

### A. Reference Games
- Super Mario Bros (NES)
- New Super Mario Bros
- HTML5 platformer examples

### B. Tools & Libraries

#### Frontend
- **Game Framework**: Phaser 3
- **Audio**: Howler.js
- **Build Tool**: Vite
- **Language**: JavaScript/TypeScript (optional)

#### Backend & Infrastructure
- **Hosting**: Vercel (free tier)
- **Database**: Firebase Firestore
- **API**: Firebase Cloud Functions
- **Admin**: Firebase Console

#### Development Tools
- **Code Editor**: VS Code
- **Version Control**: Git + GitHub
- **Level Editor**: Tiled Map Editor (optional)
- **Asset Creation**:
  - Pixel Art: Aseprite, Photopea
  - PNG Optimization: TinyPNG, ImageOptim
  - Audio: Audacity, FL Studio
- **Testing**:
  - Local: Chrome DevTools
  - Mobile: BrowserStack (optional), real devices
  - iPhone Simulator (for Dynamic Island testing)

### C. Asset Requirements

#### Image Assets
- **Format**: PNG with transparent background (alpha channel)
- **Character sprites**:
  - Pixel art: 32x32px or 64x64px
  - PNG photos: 128x128px to 256x256px (will be scaled)
  - Animation frames supported
- **Collectible items**:
  - Tiền: 32x32px
  - Tin, Nhà, Xe, Sổ đỏ, Vàng: 48x48px to 64x64px
  - PNG format cho phép dùng icon/ảnh thật
- **Tileset**: 16x16px (if using pixel art)
- **Background**: 1920x1080px (responsive)
- **Enemy sprites**: 32x32px or 64x64px

#### Audio Assets
- Background music: MP3/OGG format
- Sound effects: WAV/MP3 format
- Max file size: 5MB per audio file
