 BÁO CÁO NỘI DUNG THUYẾT TRÌNH: HỆ THỐNG GỢI Ý GAME THÔNG MINH

 Trang 1: Giới thiệu Đề tài
   Mục tiêu chính: Tự động đề xuất những trò chơi phù hợp nhất với sở thích và túi tiền của người dùng.
   Vấn đề giải quyết: Người dùng thường bị lạc giữa hàng nghìn lựa chọn; hệ thống sẽ đóng vai trò như một "người tư vấn" hiểu rõ sở thích và cấu hình máy tính của họ.
   Điểm đặc biệt: Không chỉ nhìn vào việc người dùng thích gì, mà còn kiểm tra xem máy tính của họ có chơi được game đó hay không để đảm bảo trải nghiệm tốt nhất.

 Trang 2: 3 Trụ cột chính của Hệ thống
Để đạt độ chính xác cao nhất, hệ thống kết hợp 3 loại thuật toán chuyên biệt:
1.  Game Tương đồng (Similarity): Tìm những game "sinh đôi" hoặc cùng thể loại với game bạn đang xem.
2.  Hệ thống Lai (Hybrid): Kết hợp nhiều nguồn dữ liệu (lịch sử chơi, cộng đồng, tuổi tác) để đưa ra danh sách tổng hợp sâu.
3.  Hệ số Thúc đẩy (Boost): Một bộ lọc thực tế để ưu tiên các game chạy mượt trên máy người dùng hoặc đang có giá tốt.

 Trang 3: Giải thích về "Game Tương đồng" (Content Similarity)
   Cách hoạt động: Hệ thống thu thập hai loại dữ liệu từ mỗi trò chơi để tạo ra một "DNA kỹ thuật số" riêng biệt.
   Kỹ thuật xử lý tệp dữ liệu:
    1.  Vector Chữ (Text Vector): Chuyển đổi các thông tin như Tên, Thể loại, Nhà phát hành, Mô tả thành dạng số bằng thuật toán TF-IDF. (Thể loại được ưu tiên x3).
    2.  Vector Số (Numeric Vector): Các thông số như Đánh giá (Rating), Giá cả (Price), Lượt tải (Downloads) được chuẩn hóa về cùng một thang đo (0-1).
   Kết hợp: Hai vector này được ghép lại (Concatenate) với trọng số: Vector Chữ chiếm ưu tiên cao (1.0) và Vector Số hỗ trợ thêm (0.5).
   Tính toán: Sử dụng phép đo Cosine Similarity để tìm khoảng cách giữa các cặp vector.
   Công thức: Similarity(A, B) = (Vector A  Vector B) / (|Vector A|  |Vector B|)
   Ví dụ ngắn gọn:
       Game A (Đang xem): Hành động, RPG, NPH Ubisoft, Giá 50$.
       Game B (Gợi ý): Hành động, Phiêu lưu, NPH Ubisoft, Giá 45$.
       => Kết quả: Game B có điểm tương đồng cao (>0.85) vì khớp cả "Vector Chữ" (thể loại/NPH) và "Vector Số" (tầm giá).

 Trang 4: Giải thích về Thuật toán Lai (Hybrid)
Đây là "bộ não" trung tâm, nơi hệ thống kết hợp nhiều nguồn dữ liệu khác nhau để đưa ra gợi ý đa chiều. Ngoài phần Nội dung (Content) đã nói, hệ thống còn 3 thành phần chủ chốt:

1.  SVD (Singular Value Decomposition - Lọc cộng đồng):
       Bước 1 - Xây dựng Ma trận Ratings (R): Quy đổi hành vi thành điểm số để máy hiểu được mức độ yêu thích:
        - Yêu thích (Favorite): +3.0 điểm.
        - Xem game (View): +0.5 điểm (mỗi lần xem).
        - Mua & Đánh giá (Review): 1.0 đến 5.0 điểm.
        - Ví dụ: Một người mua game cho 5 sao và xem 2 lần sẽ có điểm = 5 + (2  0.5) = 6.0 điểm.
    
    Minh họa Ma trận đầu vào:
    | Người dùng | Game 1 | Game 2 | Game 3 | Game 4 | Game 8 (Cần đoán) |
    | :--- | :---: | :---: | :---: | :---: | :---: |
    | User A | 3.0 | 5.0 | 0.0 | 1.5 | ??? |
    | User B | 5.0 | 4.5 | 3.0 | 0.0 | 9.5 |
    | User C | 0.0 | 1.0 | 4.0 | 5.0 | 2.0 |
    | User D | 4.0 | 5.0 | 0.5 | 2.0 | 9.0 |

       Bước 2 - Phân tách và Dự đoán:
        - Hệ thống nhận thấy User A có điểm số rất giống User B và User D (cùng thích Game 1 & 2).
        - Mà User B và D đều cực kỳ thích Game 8 (9.5đ và 9.0đ).
        - Thuật toán SVD sẽ thực hiện phép nhân ma trận để "điền" con số dự đoán (ví dụ 8.7đ) vào ô ??? của User A.

       Ví dụ kết quả dự đoán (User A - Game 8):
        - Thành phần 1 (Cơ bản): +2.23đ (Khớp vì cả User và Game đều không thuộc nhóm đồ họa nặng).
        - Thành phần 2 (Sở thích): +0.95đ (Khớp vì cả User và Game đều mang tính kể chuyện).
        - Kết quả: Sau khi cộng Mean (Trung bình), máy dự đoán bạn sẽ thích Game 8 ở mức 5.51/10. 
    
       Mục đích: Tìm thấy những "viên ngọc thô" bạn chưa từng thấy nhưng cộng đồng có gu giống bạn đã kiểm chứng.

2.  Demographic (Nhân khẩu học - Ưu tiên nhóm tuổi):
       Cơ chế: Chấm điểm Game dựa trên hành vi của những người cùng "tần số" thông qua hai bước nhân toán học:
       Bước 1 - Tính độ giống nhau giữa 2 người (User Similarity):
        - Điểm Tuổi = 1.0 - (Chênh lệch tuổi  0.2).
        - Điểm Giới tính: Cùng phái = 1.0, Khác phái = 0.5.
        - Độ tương đồng (Demo Sim) = Điểm Tuổi  Điểm Giới tính.
       Bước 2 - Tính điểm Gợi ý cho Game (Weighted Score):
        - Công thức: Điểm Game = (Tổng các [Điểm đánh giá  Độ tương đồng]) / (Tổng các Độ tương đồng)
    
       Ví dụ cụ thể: Bạn là User A (20 tuổi, Nam). Cần tính điểm cho Game X.
        - Người B (21 tuổi, Nam): Rất giống bạn (Độ tương tương đồng = 0.9). Họ cho Game X 5 sao.
        - Người C (50 tuổi, Nữ): Rất khác bạn (Độ tương đồng = 0.1). Họ cho Game X 1 sao.
        
        => Tính toán:
        - Tử số: (5 sao  0.9) + (1 sao  0.1) = 4.6
        - Mẫu số: 0.9 + 0.1 = 1.0
        - Kết quả: 4.6 / 1.0 = 4.6 điểm.
    
       Mục đích: Ưu tiên ý kiến của những người "cùng gu" và cùng lứa tuổi để gợi ý chính xác hơn.

3.  Keyword (Tìm kiếm thông minh):
       Cơ chế: Không chỉ tìm kiếm từ khóa thô, hệ thống sử dụng một "Thư viện từ khóa" (Library) để tự động dịch/mở rộng từ khóa (VD: Gõ "hành động" sẽ tự tìm cả "Action").
       Quy tắc chấm điểm (Raw Score):
        - Khớp tên game (Name): +3.0 điểm (Ưu tiên tuyệt đối).
        - Khớp Thể loại (Genre): +2.5 điểm.
        - Khớp Mô tả (Description): +2.0 điểm.
        - Khớp Hãng (Publisher), Nền tảng (Platform), Ngôn ngữ: +1.5 điểm.
        - Khớp Cấu hình (CPU, GPU, RAM): +1.5 điểm.
        - Khớp Chế độ chơi (Mode), Lứa tuổi: +1.0 điểm.
       Mục đích: Giúp người dùng tìm được chính xác game theo nhu cầu cụ thể (về hãng, về cấu hình máy hoặc sở thích riêng).

 Trang 5: Trọng số và Cách tính Điểm Lai
Hệ thống tính toán theo quy tắc cộng dồn điểm số có trọng số:
Điểm Lai = (SVD  W1) + (Nội dung  W2) + (Lứa tuổi  W3) + (Từ khóa  W4)

Các kịch bản trọng số (W) thực tế:
   Khi KHÔNG tìm kiếm: 45% SVD + 35% Nội dung + 20% Lứa tuổi.
   Khi CÓ tìm kiếm: 60% Từ khóa + 15% SVD + 15% Nội dung + 10% Lứa tuổi.
   Người dùng MỚI (Cold Start): 70% SVD + 30% Lứa tuổi (Bỏ qua Nội dung vì chưa có lịch sử).

 Trang 6: Giải thích về "Boost" (Hệ số Thúc đẩy)
Đây là bước Cá nhân hóa và Thích ứng giúp kết quả thực tế hơn bằng cách nhân thêm hệ số ưu tiên.
   Các hệ số nhân:
       Nhà phát hành: Nếu là hãng bạn thích gần đây, nhân thêm 1.2 (+20%).
       Giá cả: Nếu nằm trong tầm giá bạn hay mua, nhân thêm 1.2. Nếu quá đắt, nhân 0.6.
       Phần cứng: Nếu máy chỉ đạt cấu hình tối thiểu, nhân 0.7 để ưu tiên các game nhẹ hơn chạy mượt hơn.
   Công thức cuối cùng: Điểm Cuối Cùng = Điểm Lai  Hệ số NPH  Hệ số Giá  Hệ số Cấu hình.
   Ví dụ: Game Cyberpunk có điểm Lai cao (0.9) nhưng máy bạn yếu (nhân 0.7) và giá đắt (nhân 0.6) => Điểm thực tế giảm xuống còn 0.378.

   Điều chỉnh Trọng số Động (Dynamic Weight Adjustment):
       Hệ thống tự động học từ thói quen của bạn: Nếu bạn thường xuyên chọn các game nằm ngoài Top 10 gợi ý, hệ thống sẽ tự động giảm trọng số Từ khóa (Keyword) và tăng trọng số Nội dung/Cộng đồng.
       Mục đích: Giúp bộ lọc không bị quá "hẹp", cho phép bạn khám phá được những game tiềm năng mà trước đó hệ thống chưa ưu tiên.

 Trang 7: Tổng kết - Trường hợp sử dụng
Để tối ưu hóa trải nghiệm, hệ thống tự động kích hoạt thuật toán phù hợp nhất theo từng vị trí:

| Loại thuật toán | Khi nào sử dụng? | Mục đích chính |
| :--- | :--- | :--- |
| Game Tương đồng | Khi xem chi tiết 1 Game. | Tìm các lựa chọn thay thế "cùng gu" ngay lập tức. |
| Hệ thống Lai (Trang chủ) | Khi vừa đăng nhập. | Bao quát toàn bộ sở thích lâu dài và gợi ý từ cộng đồng. |
| Hệ thống Lai (Tìm kiếm) | Khi gõ từ khóa. | Tập trung tối đa vào độ chính xác của từ khóa tìm kiếm. |
| Hệ số Thúc đẩy (Boost) | Luôn áp dụng ở bước cuối. | Đảm bảo game gợi ý phải thực tế (chơi được, mua được). |
| Cold Start (Hybrid) | Người dùng chưa có lịch sử. | Dựa vào tuổi/giới tính để gợi ý "đón đầu". |
