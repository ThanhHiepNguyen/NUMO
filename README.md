## NUMO – Luật chơi (Online – Turn-Based, Bản hoàn chỉnh)

NUMO là game đấu trí **1 vs 1**, người chơi luân phiên đoán mật mã số bí mật của đối thủ.  
Mục tiêu là **đoán đúng toàn bộ mật mã của đối thủ sớm nhất** theo cơ chế lượt **ABAB (turn-based, không đoán đồng thời)**.

---

### 1️⃣ Tổng quan

- **Số người chơi trong 1 phòng**: 2 người (A và B).  
- **Cơ chế lượt**: A đoán → B đoán → A đoán → B đoán → ... (luân phiên tuyệt đối).  
- **Điều kiện thắng chính**: Người đầu tiên có một lượt đoán mà **ĐÚNG VỊ TRÍ = độ dài mật mã** của đối thủ sẽ **thắng ngay lập tức** (trừ trường hợp hòa đặc biệt, xem bên dưới).

---

### 2️⃣ Phòng chơi (Room)

- **Số người trong phòng**:  
  - Mỗi phòng chỉ chứa đúng **2 người chơi**.

- **Quy định phòng**:  
  - **Độ dài mật mã**: từ **3 đến 6 chữ số**.  
  - **Tối đa 10 lượt đoán cho mỗi người** (tối đa 20 lượt tổng nếu đi hết).  
  - **Thời gian suy nghĩ mỗi lượt**: tối đa **60 giây** cho mỗi lần đoán.

- **Bắt đầu ván đấu**:  
  - Khi phòng đã có đủ 2 người chơi → chuyển sang **giai đoạn thiết lập mật mã (Setup Phase)**.

---

### 3️⃣ Thiết lập mật mã (Setup Phase)

- **Mỗi người chơi** nhập vào **1 dãy số bí mật**:
  - Độ dài tuân theo quy định phòng (3–6 chữ số).
  - **Cho phép trùng chữ số**.  
    - Ví dụ hợp lệ: `111`, `2244`, `90909`.

- **Bảo mật mật mã**:
  - Mật mã **chỉ được lưu trên server** (ví dụ: trong Redis).  
  - Người chơi **không thể xem** mật mã của đối thủ.  
  - Client không nhận được mật mã gốc dưới bất kỳ hình thức nào.

- **Kết thúc Setup**:
  - Khi **cả hai người chơi** đã nhập mật mã hợp lệ → game chuyển sang **giai đoạn chơi (Play Phase)**.

---

### 4️⃣ Cơ chế lượt chơi (ABAB – Turn-Based)

#### 🔁 Luân phiên tuyệt đối

- Hai người chơi **đoán luân phiên** theo thứ tự:  
  - A → B → A → B → ...
- Ở **mọi thời điểm**, thỏa mãn:
  - **Chỉ 1 người duy nhất** được phép gửi lượt đoán.  
  - Người còn lại **bắt buộc chờ**, không được đoán.
- **Không có đoán đồng thời**:
  - Server là bên **kiểm soát lượt** và từ chối mọi yêu cầu đoán sai lượt.

#### ⏱️ Thời gian lượt

- Mỗi lượt đoán có tối đa **60 giây**:
  - Tính từ khi đến lượt bạn cho tới khi bạn gửi đoán lên server.
- Nếu người chơi:
  - **Không gửi bất kỳ lượt đoán nào trong 60 giây**  
  → Người đó **THUA NGAY LẬP TỨC**.  
  → Game kết thúc, đối thủ **thắng do hết thời gian**.

---

### 5️⃣ Cơ chế đoán & phản hồi

Khi đến lượt một người chơi (ví dụ **A**):

1. **A gửi** một dãy số đoán (cùng độ dài với mật mã):  
   - Ví dụ: `4564`.

2. **Server kiểm tra hợp lệ**:
   - Có đúng đang là **lượt của A** không?  
   - Độ dài dãy số đoán có **đúng với độ dài mật mã** đã quy định không?

3. **Server tính kết quả** dựa trên mật mã của **B**:
   - **SỐ ĐÚNG (Correct Digits)**.  
   - **ĐÚNG VỊ TRÍ (Correct Positions)**.

4. **Server trả kết quả**:
   - Kết quả của lượt đoán được gửi cho **cả A và B**:
     - Giá trị đoán.  
     - Số đúng.  
     - Đúng vị trí.

5. **Nếu game chưa kết thúc**:
   - Server chuyển **lượt chơi** sang người còn lại (từ A → B hoặc B → A).

---

### 6️⃣ Cơ chế tính điểm (Scoring Logic)

Giả sử:
- `secret` = mật mã bí mật của đối thủ.  
- `guess`  = dãy số mà bạn đoán.

#### 📍 ĐÚNG VỊ TRÍ (Correct Positions)

- Là số lượng chữ số trong `guess` mà:
  - **Đúng giá trị** và  
  - **Đúng vị trí (index)** so với `secret`.
- Tính bằng cách so sánh theo từng vị trí:
  - Với mỗi vị trí `i`, nếu `secret[i] === guess[i]` → tăng `correct_positions` lên 1.

#### ✅ SỐ ĐÚNG (Correct Digits)

- Là **tổng số chữ số** trong `guess` **có xuất hiện trong `secret`**.  
- **Không vượt quá số lần xuất hiện thực tế** của chữ số đó trong mật mã.
- **Không loại trừ / không đánh dấu** chữ số đã tính ở đúng vị trí.  
- **Không phụ thuộc vị trí** (chỉ cần xuất hiện trong mật mã là được).

#### 📌 Quy tắc quan trọng

- Tập các chữ số **ĐÚNG VỊ TRÍ** luôn là **một phần con** của tập **SỐ ĐÚNG**:  
  - \( \text{ĐÚNG VỊ TRÍ} \subseteq \text{SỐ ĐÚNG} \)
- **Hai chỉ số được tính độc lập**:
  - Khi tính **SỐ ĐÚNG**, **không loại trừ** các chữ số đã tính là **ĐÚNG VỊ TRÍ**.  
  - Không sử dụng cơ chế "đánh dấu" hay "loại trừ" như một số game khác.

#### 🧮 Cách tính SỐ ĐÚNG (gợi ý thuật toán)

- Đếm tần suất từng chữ số trong `secret` → `freqSecret[d]` với `d` từ 0–9.  
- Đếm tần suất từng chữ số trong `guess`  → `freqGuess[d]`.  
- Với mỗi chữ số `d` từ 0 đến 9:
  - Cộng vào `correct_digits` giá trị `min(freqSecret[d], freqGuess[d])`.

#### 📊 Ví dụ (Mật mã: `2344`)

| Đoán | Số đúng | Đúng vị trí |
|------|--------|------------|
| 4564 |   2    |     1      |
| 4444 |   2    |     2      |

Giải thích nhanh:
- Với `4564`:
  - Mật mã `2344` có hai số `4`.  
  - Lượt đoán có hai số `4` → **Số đúng = 2**.  
  - Chỉ có chữ số `4` ở cuối cùng trùng vị trí → **Đúng vị trí = 1**.
- Với `4444`:
  - Mật mã vẫn chỉ có hai số `4` → **Số đúng = 2**.  
  - Hai số `4` cuối cùng trùng vị trí → **Đúng vị trí = 2**.

---

### 7️⃣ Điều kiện kết thúc ván đấu

#### 🏆 Thắng ngay lập tức

- Khi một lượt đoán có:
  - **ĐÚNG VỊ TRÍ = độ dài mật mã**  
→ Người thực hiện lượt đoán đó **THẮNG NGAY LẬP TỨC**.  
→ Game kết thúc ngay, **không cần chờ lượt còn lại**.

#### 🤝 Hòa (Draw) trong cùng một cặp lượt

- Xét **cùng một vòng lượt** (A → B):
  - Nếu trong **cùng vòng đó**:
    - A có một lượt đoán đúng toàn bộ mật mã của B, và  
    - B cũng có một lượt đoán đúng toàn bộ mật mã của A  
  → Kết quả ván đấu là **HÒA**.

#### ⛔ Thua do hết thời gian

- Nếu một người chơi:
  - Không gửi lượt đoán trong **60 giây** khi đến lượt mình,  
  → Người đó **THUA NGAY** do hết thời gian.  
  → Đối thủ được tính là **THẮNG**.

---

### 8️⃣ Kết thúc sau 10 lượt (Luật mới – Tie-break)

#### 📌 Điều kiện kích hoạt

- Sau khi:
  - Cả **A và B** đều đã **đoán đủ 10 lượt** (tức là mỗi người đã dùng hết 10 lượt được phép).  
  - **Không ai** đoán đúng toàn bộ mật mã của đối thủ (không có lượt nào có ĐÚNG VỊ TRÍ = độ dài mật mã).

→ Lúc này game **tự động kết thúc** và kích hoạt luật **phân thắng thua bằng thành tích tốt nhất**.

#### 🧮 Cách phân thắng thua

So sánh **thành tích tốt nhất** của mỗi người chơi trên toàn bộ các lượt đoán của họ (không cộng dồn).

1. **Ưu tiên ĐÚNG VỊ TRÍ cao nhất**:
   - Người chơi có **lượt đoán** với giá trị **ĐÚNG VỊ TRÍ lớn hơn** sẽ **THẮNG**.

2. **Nếu ĐÚNG VỊ TRÍ cao nhất bằng nhau**:
   - So sánh tiếp **SỐ ĐÚNG cao nhất** giữa hai người.  
   - Ai có **SỐ ĐÚNG cao nhất lớn hơn** → **THẮNG**.

3. **Nếu cả ĐÚNG VỊ TRÍ cao nhất và SỐ ĐÚNG cao nhất đều bằng nhau**:
   - Ván đấu được tính là **HÒA**.

📌 Lưu ý quan trọng:
- Chỉ xét **một lượt tốt nhất** của mỗi người chơi (theo thứ tự ưu tiên ở trên).  
- **Không cộng dồn** điểm hay tổng hợp nhiều lượt lại với nhau.

---

### 9️⃣ Lịch sử & thống kê

#### 📜 History (Lịch sử ván đấu)

Hệ thống cần lưu lại **toàn bộ diễn biến ván đấu** để có thể xem lại bất cứ lúc nào:

- Mật mã của mỗi người chơi (chỉ lưu trên server, **ẩn với user**).  
- Toàn bộ **các lượt đoán** (theo thứ tự thời gian):  
  - Người chơi nào đoán.  
  - Chuỗi số đoán.  
  - Kết quả: **Số đúng**, **Đúng vị trí**.  
  - Thời điểm thực hiện.  
- **Lý do kết thúc game**:
  - Thắng do đoán đúng mật mã.  
  - Thắng/thua do hết thời gian.  
  - Hòa trong cùng cặp lượt.  
  - Hòa sau 10 lượt với tie-break.

Dữ liệu lịch sử nên được lưu ở dạng **JSON** (ví dụ trong PostgreSQL) để dễ dàng:
- Tra cứu, hiển thị lại cho người chơi.  
- Phân tích, thống kê.

#### 📈 Statistics (Thống kê người chơi)

Đối với mỗi tài khoản người chơi, hệ thống nên lưu:

- **Tổng số trận đã chơi**.  
- **Số trận Thắng / Thua / Hòa**.  
- Có thể mở rộng thêm:
  - Tỷ lệ thắng.  
  - Chuỗi thắng dài nhất.  
  - Thời gian trung bình mỗi ván, v.v.

Các thống kê này cần được **cập nhật ngay khi game kết thúc** để đảm bảo dữ liệu luôn chính xác và realtime cho người chơi.

---

### 🔚 Tóm tắt nhanh

- NUMO là game **1vs1, đoán mật mã số**, chơi **luân phiên tuyệt đối**.  
- Mỗi người có **tối đa 10 lượt đoán**, mỗi lượt tối đa **60 giây**.  
- Kết quả mỗi lượt gồm **Số đúng** (Correct Digits) và **Đúng vị trí** (Correct Positions), tính **độc lập**.  
- Game có thể kết thúc do **đoán đúng toàn bộ**, **hết thời gian**, **hòa trong cùng vòng lượt**, hoặc **hòa/thắng thua sau 10 lượt** dựa trên **lượt đoán tốt nhất**.

