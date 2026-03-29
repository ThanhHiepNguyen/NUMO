## 🔢 PvP Guessing Game (Kiểu Kahoot, 2 người đấu trí)

### 1. Tổng quan
- **Host** (người tạo phòng) đăng nhập và tạo phòng, chọn **độ dài mật mã** từ **3–6 chữ số**.
- **Player** (người tham gia) không cần tài khoản, chỉ cần nhập **mã phòng (roomCode)** + **nickname** để vào phòng.
- Mỗi người chơi tự chọn một **mật mã bí mật** (chuỗi số, đúng `codeLength`, cho phép trùng số, ví dụ: `1123`, `4444`, `9090`).
- Mật mã được lưu trên server, **không ai có thể xem được mật mã của đối thủ**.
- Khi **cả hai đều nhập xong mật mã**, game chuyển sang trạng thái **PLAYING** và bắt đầu phase đoán.

---

### 2. Lượt chơi & Round (ABAB – Turn-based)
- Game chơi theo lượt **luân phiên tuyệt đối**:
  - A đoán → Server trả kết quả → Nếu chưa kết thúc → đến lượt B.
  - B đoán → Server trả kết quả → kết thúc 1 round → `round += 1`.
- **1 round = 2 lượt đoán**: 1 lượt của A + 1 lượt của B.
- **Không có đoán đồng thời**:
  - Tại mọi thời điểm, chỉ **1 người đang đến lượt**, người còn lại chỉ chờ kết quả.

---

### 3. Thời gian & Miss lượt
- Mỗi lượt đoán có **60 giây** để người đến lượt gửi dự đoán.
- Nếu hết **60 giây** mà **không gửi đoán**:
  - Lượt đó được tính là **bỏ lượt (miss 1 lượt)**.
  - Game **không kết thúc ngay**, chỉ chuyển lượt sang đối thủ.
- Mỗi người chơi có bộ đếm **`missCount` riêng**:
  - Nếu **`missCount >= 3`**:
    - Người đó **thua ngay lập tức**.
    - Đối thủ **thắng ngay lập tức**.

---

### 4. Cơ chế tính điểm mỗi lần đoán
Khi một người đoán, server trả về **2 chỉ số**:

- **`correctDigits` – Số đúng**  
  Tổng số chữ số trong **lượt đoán** có xuất hiện trong **mật mã đối thủ**,  
  được tính **có giới hạn theo số lần xuất hiện thực tế** trong mật mã.

- **`correctPositions` – Đúng vị trí**  
  Số chữ số vừa **đúng giá trị** vừa **đúng vị trí** trong chuỗi mật mã.

**Quy trình tính chuẩn:**
1. Duyệt từng vị trí:
   - Nếu `guess[i] === secret[i]` → tăng `correctPositions`, đánh dấu vị trí đó đã dùng ở cả `guess` và `secret`.
2. Với các vị trí còn lại (chưa dùng):
   - Với mỗi `guess[i]` chưa dùng, tìm một `secret[j]` chưa dùng mà `guess[i] === secret[j]` → nếu có:
     - tăng `correctDigits`
     - đánh dấu `secret[j]` đã dùng.
3. **Lưu ý**: `correctDigits` **bao gồm cả** các số đúng vị trí, nên luôn thỏa `correctDigits >= correctPositions`.

**Ví dụ minh họa:**
- Mật mã: `2344`, Đoán: `4564` → `correctDigits = 2`, `correctPositions = 1`.
- Mật mã: `2344`, Đoán: `4444` → `correctDigits = 2`, `correctPositions = 2`.
- Mật mã: `1203`, Đoán: `3012` → `correctDigits = 4`, `correctPositions = 0`.
- Mật mã: `1123`, Đoán: `1111` → `correctDigits = 2`, `correctPositions = 2`.
- Mật mã: `5050`, Đoán: `5005` → `correctDigits = 4`, `correctPositions = 2`.
- Mật mã: `5987`, Đoán: `1978` → `correctDigits = 3`, `correctPositions = 1`.

---

### 5. Điều kiện kết thúc game
Game kết thúc khi xảy ra một trong các trường hợp:

1. **Đoán đúng toàn bộ (thắng ngay)**
   - Nếu tại một lượt đoán mà:
     - `correctPositions === codeLength`
   - → Người đoán **thắng ngay lập tức**, game dừng.

2. **Bị miss 3 lượt**
   - Nếu một người chơi có `missCount >= 3`:
   - → Người đó **thua trận**, đối thủ **thắng ngay**.

3. **Hết 10 round nhưng chưa ai đoán đúng toàn bộ**
   - Tối đa **10 round = 20 lượt đoán** (A 10 lượt, B 10 lượt).
   - Nếu hết 10 round mà:
     - Chưa ai đoán đúng toàn bộ.
     - Chưa ai thua vì `missCount >= 3`.
   - → So sánh:
     - Mỗi người lấy **lượt đoán có `correctPositions` cao nhất**.
     - Ai có `correctPositions` cao hơn → **thắng**.
     - Nếu **bằng nhau** → **trận đấu hòa**.

---

### 6. Flow giống Kahoot (ở mức khái niệm)
1. **Host tạo phòng**
   - Đăng nhập, chọn `codeLength` (3–6), nhấn “Tạo phòng”.
   - Hệ thống sinh `roomCode` để chia cho người chơi.
2. **Player join phòng**
   - Nhập `roomCode` + nickname → join vào phòng.
3. **Host nhấn “Bắt đầu game”**
   - Khi đủ 2 người, host start → chuyển sang phase **nhập mật mã bí mật**.
4. **Cả hai nhập mật mã bí mật**
   - Mỗi người nhập `secretCode` đúng `codeLength`, chỉ gồm chữ số, cho phép trùng.
   - Khi cả hai đều set xong → game chuyển sang phase **PLAYING**.
5. **Phase đoán (ABAB)**
   - Server quản lý:
     - `currentTurn` (đến lượt ai),
     - `currentRound` (1–10),
     - `missCount` cho từng người,
     - lịch sử đoán + kết quả (`correctDigits`, `correctPositions`).

---

### 7. Roadmap triển khai (backend)
- **Bước 1**: Thiết kế `schema.prisma`
  - Bảng `User` (host), `Room`, `PlayerInRoom`, `GuessHistory`.
- **Bước 2**: Auth cơ bản cho host (register/login, JWT).
- **Bước 3**: API cho Room
  - Tạo phòng, join phòng, start game.
- **Bước 4**: API nhập mật mã bí mật cho từng player.
- **Bước 5**: API đoán + hàm chấm điểm theo logic trên.
- **Bước 6**: Cơ chế miss lượt + xử lý timeout (60 giây).
- **Bước 7**: WebSocket (NestJS Gateway) để realtime trạng thái phòng và kết quả đoán.
- **Bước 8**: Giao diện web đơn giản cho Host & Player (giống luồng Kahoot).

---

### 8. Lộ trình triển khai chi tiết (ưu tiên theo thứ tự)
1) Chuẩn bị hạ tầng
   - `.env`: `DATABASE_URL`, `JWT_SECRET`
   - Prisma: 
    + generate client
   - Seed tối thiểu (nếu cần user test)

2) Xác thực (Auth)
   - Đăng ký/đăng nhập email/password (JWT)
   - Guard cho endpoint yêu cầu đăng nhập (host); cho phép guest tham gia phòng

3) Room lifecycle (Host)
   - Tạo phòng (roomCode), chọn `codeLength` 3–6
   - Lấy thông tin phòng theo `code`
   - Bắt đầu phase nhập secret khi đủ 2 người

4) Player lifecycle (Guest/User)
   - Join phòng bằng `roomCode` + `nickname`
   - Lấy trạng thái bản thân trong phòng
   - Rời phòng

5) Secret & Game start
   - Người chơi nhập `secretCode` (đúng `codeLength`, chỉ gồm số)
   - Khi cả 2 đã nhập, chuyển `status=PLAYING`, khởi tạo `currentTurn`

6) Gameplay (Guess)
   - Submit guess (đúng người, đúng lượt, đúng độ dài)
   - Tính `correctDigits`, `correctPositions`
   - Cập nhật `missCount`, `currentTurn`, `currentRound`, `endReason` nếu kết thúc

7) Trạng thái trận
   - API `state` gọn nhẹ để FE poll
   - (Tùy chọn) WebSocket đẩy sự kiện theo phòng

8) Kết thúc & thống kê
   - Ghi `endReason`, `finishedAt`, cập nhật `winCount/lossCount/drawCount`
   - Leaderboard đơn giản

9) Chất lượng
   - DTO validation (class-validator)
   - E2E vài case chính (create/join/secret/guess/finish)

---

### 9. API tối thiểu (REST)
- Auth
  - `POST /auth/register`
    - body: `{ email, username, password }`
    - 201: `{ user: {id,email,username}, token }`
  - `POST /auth/login`
    - body: `{ email, password }`
    - 200: `{ user, token }`

- Room (Host)
  - `POST /rooms`
    - auth: optional (nếu host cần đăng nhập)
    - body: `{ codeLength: number (3..6) }`
    - 201: `{ room: {id, code, codeLength, status, hostId, createdAt} }`
  - `GET /rooms/:code`
    - 200: `{ room: {...}, players: [{id,nickname,role}], state: {status,currentTurn,currentRound,endReason} }`
  - `POST /rooms/:code/start-secrets`
    - auth: host là chủ phòng
    - 200: `{ status: "SETTING_SECRET" }`

- Player (join/leave/self)
  - `POST /rooms/:code/join`
    - body: `{ nickname }` (kèm token nếu là user đăng nhập)
    - 201: `{ player: {id, role, nickname}, room }`
  - `POST /rooms/:code/leave`
    - body: `{ playerId }`
    - 200: `{ left: true }`
  - `GET /rooms/:code/me`
    - header: token hoặc query `playerId` (guest)
    - 200: `{ player, roomState }`

- Secret
  - `POST /rooms/:code/secret`
    - body: `{ playerId?, secretCode }`
    - 200: `{ ok: true, status: "SETTING_SECRET"|"PLAYING" }`

- Gameplay
  - `POST /rooms/:code/guess`
    - body: `{ playerId?, guessValue }`
    - 200: `{
        result: { correctDigits, correctPositions },
        turnIndex, roundIndex,
        nextTurn: "PLAYER_1"|"PLAYER_2"|null,
        finished: boolean,
        endReason?: "FULL_CODE_WIN"|"MISS_LIMIT"|"MAX_ROUNDS_TIE"|"ABANDONED"
      }`
  - `GET /rooms/:code/state`
    - 200: `{
        status, currentTurn, currentRound, endReason,
        players: [{role,nickname,missCount}],
        lastTurn?: {playerRole, guessValueMasked, correctDigits, correctPositions}
      }`

- Leaderboard
  - `GET /leaderboard?limit=10`
    - 200: `{ users: [{username, winCount, lossCount, drawCount}] }`
