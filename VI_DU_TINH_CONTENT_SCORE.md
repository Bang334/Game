# 🎨 TÍNH CONTENT-BASED SCORE (NGẮN GỌN)

## 📌 NGUYÊN LÝ

**Content-based filtering:** Gợi ý item tương tự item user đã thích.
**Cốt lõi:** So sánh đặc trưng (Feature Vector) giữa các game.

---

## 🔧 QUY TRÌNH TÍNH TOÁN

Quá trình gồm 3 bước chính: Vector hóa → Tính độ giống nhau (Similarity) → Tính điểm (Score).

### BƯỚC 1: VECTOR HÓA & KẾT HỢP (FEATURE ENGINEERING)

Game được mô tả bởi 2 loại dữ liệu, cần chuyển về cùng dạng số để tính toán:

1.  **Text Features (Dạng chữ):** Genre, Publisher, Dev...
    *   Xử lý: Dùng **TF-IDF** hoặc One-Hot Encoding.
    *   Kết quả: Vector `V_text`.
2.  **Numeric Features (Dạng số):** Price, Rating, Year...
    *   Xử lý: **Normalize** (chuẩn hóa) về khoảng [0, 1].
    *   Kết quả: Vector `V_num`.

**➔ Vector Tổng hợp (Final Feature Vector):**
Hai vector này được nối lại (concatenate), thường áp dụng trọng số ưu tiên Text:

`Vector_Cuối = [Vector_Chữ * Trọng_Số_Text] + [Vector_Số * Trọng_Số_Num]`

*(Ví dụ: Text quan trọng hơn nên hệ số Text=1.0, Num=0.5)*

### BƯỚC 2: TÍNH ĐỘ TƯƠNG ĐỒNG (COSINE SIMILARITY)

Đo góc giữa 2 vector của Game A và Game B (Kết quả từ 0 đến 1, càng gần 1 càng giống):

`Similarity(A, B) = (A nhân B) / (Độ_dài_A * Độ_dài_B)`

### BƯỚC 3: TÍNH CONTENT SCORE

Nếu User đã thích một danh sách game {G1, G2, ...}, điểm số cho game mới X là trung bình độ tương đồng:

`Score(X) = Tổng (Độ_tương_đồng * Trọng_số_tương_tác) / Tổng_số_game`

*(Trọng số tương tác: Ví dụ User "Mua" thì nhân hệ số cao hơn là chỉ "Xem")*

---

## 📊 VÍ DỤ MINH HỌA

**User thích:** Game A (Action, $60).
**Cần tính:** Game X (Action, $70) và Game Y (RPG, $40).

**1. Vector hóa:**
*   **Game A:** `[1.0 (Action), 0.0 (RPG), 0.6 ($60)]`
*   **Game X:** `[1.0 (Action), 0.0 (RPG), 0.7 ($70)]`
*   **Game Y:** `[0.0 (Action), 1.0 (RPG), 0.4 ($40)]`

**2. Tính Similarity (giả sử trọng số 1:1):**
*   **Sim(A, X):** Cao (Cùng Action, giá gần nhau). Ví dụ: **0.95**
*   **Sim(A, Y):** Thấp (Khác Genre, giá xa). Ví dụ: **0.15**

**3. Kết luận:**
Gợi ý **Game X** cho User.

---

## ✅ TÓM LẠI
Đúng như bạn thắc mắc, Content Score được tính từ việc **kết hợp** cả text (đã chuyển sang số) và số liệu gốc thành **một vector duy nhất** cho mỗi game, sau đó tính khoảng cách giữa các vector này.

