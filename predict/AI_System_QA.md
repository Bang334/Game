# TỔNG HỢP CÂU HỎI & TRẢ LỜI VỀ HỆ THỐNG GỢI Ý (AI RECOMMENDATION SYSTEM)

Tài liệu này tổng hợp các câu hỏi từ cơ bản đến nâng cao (Chuyên sâu/Kỹ thuật) về hệ thống gợi ý game được triển khai trong dự án.

---

## PHẦN 1: KIẾN TRÚC VÀ THUẬT TOÁN (MỨC ĐỘ: CAO)

### Câu 1: Tại sao hệ thống lại chọn thuật toán SVD (Singular Value Decomposition) thay vì các phương pháp Collaborative Filtering truyền thống như User-User hay Item-Item?
**Trả lời:** 
Hệ thống sử dụng SVD (thông qua thư viện `scipy.sparse.linalg.svds`) vì:
1. **Khử nhiễu (Noise Reduction):** SVD giúp loại bỏ các "nhiễu" trong dữ liệu tương tác thưa thớt (sparse data) bằng cách chỉ giữ lại `k` thành phần quan trọng nhất (latent factors).
2. **Xử lý sự thưa thớt (Data Sparsity):** Trong thực tế, một người dùng chỉ chơi một vài game trên hàng nghìn game. SVD giúp "lấp đầy" các ô trống trong ma trận bằng cách dự đoán rating dựa trên các đặc trưng ẩn.
3. **Hiệu năng:** Sau khi đã phân rã ma trận, việc dự đoán rating chỉ đơn giản là phép nhân các vector thấp chiều, nhanh hơn nhiều so với việc tính toán similarity giữa hàng triệu cặp user/item mỗi khi cần gợi ý.

### Câu 2: Giải thích quy trình xây dựng ma trận đặc trưng cho Content-based Filtering trong hệ thống?
**Trả lời:** 
Quy trình được thực hiện qua các bước kỹ thuật sau:
1. **Feature Engineering:** Kết hợp dữ liệu từ nhiều trường: `genres`, `tags`, `developer`, `publisher` và `description`.
2. **Text Processing:** Chuyển đổi dữ liệu văn bản về dạng chuẩn (lower case, loại bỏ ký tự đặc biệt).
3. **TF-IDF Vectorization:** Sử dụng `TfidfVectorizer` để tính toán trọng số cho từng từ khóa. NHỮNG từ khóa xuất hiện quá thường xuyên (như "game", "play") sẽ bị giảm trọng số, trong khi các từ đặc trưng (như "open-world", "souls-like") sẽ có trọng số cao hơn.
4. **Similarity Matrix:** Tính toán **Cosine Similarity** giữa các vector game để tạo ra một ma trận vuông thể hiện độ tương đồng giữa mọi cặp game.

### Câu 3: Làm thế nào hệ thống chuẩn hóa (normalize) điểm số phần cứng từ các linh kiện CPU/GPU khác nhau để so sánh?
**Trả lời:** 
Hệ thống không so sánh tên trực tiếp mà sử dụng dữ liệu benchmark:
1. **Lookup Table:** Hệ thống load dữ liệu từ `cpu_data.json` và `gpu_data.json` chứa điểm hiệu năng thực tế.
2. **StandardScaler:** Sử dụng `sklearn.preprocessing.StandardScaler` để đưa các điểm benchmark về cùng một phân phối chuẩn (mean=0, std=1).
3. **Hardware Compatibility Check:** Hàm `can_run_game` thực hiện so sánh điểm sau chuẩn hóa của máy người dùng với điểm yêu cầu tối thiểu của game. Điều này cho phép hệ thống "hiểu" rằng một card đồ họa đời cũ nhưng cao cấp vẫn có thể mạnh hơn card đời mới giá rẻ.

---

## PHẦN 2: CƠ CHẾ LAI (HYBRID) VÀ TRỌNG SỐ ĐỘNG

### Câu 4: Công thức toán học để hợp nhất kết quả từ 4 phương pháp gợi ý (SVD, Content, Demographic, Keyword) là gì?
**Trả lời:** 
Hệ thống sử dụng công thức **Weighted Average (Trung bình trọng số)**:
$$FinalScore = (SVD \times w_1) + (Content \times w_2) + (Demographic \times w_3) + (Keyword \times w_4)$$
Trong đó:
- Các điểm số thành phần được đưa về thang [0, 1].
- Các trọng số $w$ thay đổi linh hoạt tùy theo ngữ cảnh (Context-aware).

### Câu 5: Giải thích cơ chế "Trọng số động" (Dynamic Weighting) dựa trên hành vi người dùng.
**Trả lời:** 
Trong `app.py`, hàm `get_dynamic_weights` thực hiện điều chỉnh trọng số như sau:
1. **Search Context:** Nếu có từ khóa (`keyword`), hệ thống chuyển sang chế độ "Exploration", đặt trọng số Keyword cao nhất (60%) để đảm bảo kết quả đúng ý định tìm kiếm.
2. **User History Context:** Với người dùng có ít hơn 3 tương tác, trọng số SVD bị hạ thấp và tăng trọng số Demographic/Popularity để tránh sai số do thiếu dữ liệu.
3. **Variety Control:** Khi người dùng đã có nhiều tương tác, hệ thống tự động cân bằng lại để giới thiệu cả những game tương tự (Content-based) và những game mới lạ (SVD).

---

## PHẦN 3: AI TRAINING & DATA PIPELINE (MỨC ĐỘ: CHUYÊN SÂU)

### Câu 6: Làm thế nào hệ thống xử lý yếu tố thời gian (Temporal Impact) trong sở thích người dùng?
**Trả lời:** 
Hệ thống thực hiện thông qua 2 cơ chế:
1. **Recency Bias:** Trong hàm `get_user_interactions_from_db`, hệ thống ưu tiên các tương tác trong 7-30 ngày gần nhất để phân tích xu hướng hiện tại của người dùng.
2. **Interaction Weighting:** Các hành vi khác nhau có giá trị khác nhau: `Purchase` (1.0) > `Rating` (0.8) > `Favorite` (0.6) > `View` (0.2). Điều này đảm bảo những game người dùng đã bỏ tiền mua sẽ ảnh hưởng mạnh hơn những game họ chỉ vô tình click vào xem.

### Câu 7: Giải thích cơ chế "Boost Factor" và cách nó giúp hệ thống vượt qua các hạn chế của thuật toán gốc.
**Trả lời:** 
`Boost Factor` hoạt động như một lớp hậu xử lý (Post-processing):
- **Phản hồi:** Sau khi thuật toán gốc đưa ra danh sách, mỗi game sẽ được nhân với một hệ số từ 0.6 đến 1.2.
- **Tiêu chí:** 
    - Nếu game thuộc nhà phát hành người dùng thích -> Boost +20%.
    - Nếu game có giá nằm trong ngưỡng trung bình người dùng thường mua -> Boost +10%.
    - Nếu game quá cũ hoặc quá đắt so với lịch sử -> Penalty (giảm điểm).
- **Mục đích:** Giúp kết quả gợi ý trở nên "thực tế" hơn với túi tiền và thói quen tiêu dùng của người dùng.

### Câu 8: Tại sao cần một file log phức tạp (`ai_retrain_log.json`) và cơ chế `check_and_retrain_svd`?
**Trả lời:** 
Vì việc huấn luyện AI tốn tài nguyên (CPU/RAM), hệ thống áp dụng chiến lược **Lazy Training**:
1. **Threshold-based:** Chỉ train lại khi số lượng tương tác mới vượt ngưỡng (ví dụ: 10 interactions).
2. **Integrity Check:** Trước khi train, nó kiểm tra tính toàn vẹn của dữ liệu (không có giá trị null, đủ số lượng mẫu tối thiểu).
3. **Atomic Updates:** Sau khi train xong, model mới sẽ được swap vào bộ nhớ để phục vụ người dùng mà không cần restart server.

---

## PHẦN 4: ĐÁNH GIÁ VÀ TỐI ƯU HÓA

### Câu 9: Làm sao để đánh giá độ chính xác của hệ thống này khi chưa có phản hồi thực tế từ người dùng?
**Trả lời:** 
Trong code có triển khai hàm `print_user_similarity_analysis`. Chúng ta đánh giá bằng các chỉ số:
1. **Coverage:** Tỷ lệ bao phủ của các game được gợi ý so với toàn bộ kho game.
2. **Serendipity:** Khả năng gợi ý những game bất ngờ nhưng phù hợp (thông qua SVD).
3. **Recall @ N:** Kiểm tra xem các game người dùng đã mua trong quá khứ có xuất hiện trong top N gợi ý của mô hình hay không.

### Câu 10: Nếu hệ thống mở rộng lên hàng triệu người dùng, điểm nghẽn (bottleneck) sẽ nằm ở đâu và cách khắc phục?
**Trả lời:** 
- **Điểm nghẽn:** Việc tính toán Ma trận tương đồng (Similarity Matrix) toàn cục sẽ tốn $O(N^2)$ bộ nhớ và thời gian.
- **Khắc phục:** 
    1. Sử dụng **Approximate Nearest Neighbors (ANN)** như thư viện `Faiss` để tìm kiếm game tương tự thay vì tính toán vector đầy đủ.
    2. Chuyển sang **Incremental SVD** để cập nhật mô hình theo từng tương tác nhỏ thay vì train lại toàn bộ ma trận khổng lồ.
    3. Lưu trữ kết quả gợi ý vào **Redis Cache** với TTL (Time-to-live) để giảm tải cho AI Engine.
