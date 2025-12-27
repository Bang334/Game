 BÁO CÁO NỘI DUNG THUYẾT TRÌNH: HỆ THỐNG GỢI Ý GAME THÔNG MINH



 Trang 1: Giới thiệu Đề tài
Hệ thống Gợi ý Game Đa thuật toán
   Mục tiêu chính: Tự động đề xuất những trò chơi phù hợp nhất với sở thích và túi tiền của người dùng.
   Vấn đề giải quyết: Người dùng thường bị lạc giữa hàng nghìn lựa chọn; hệ thống sẽ đóng vai trò như một "người tư vấn" hiểu rõ sở thích và cấu hình máy tính của họ.
   Điểm đặc biệt: Không chỉ nhìn vào việc người dùng thích gì, mà còn kiểm tra xem máy tính của họ có chơi được game đó hay không.



 Trang 2: 3 Trụ cột chính của Hệ thống
Để đạt độ chính xác cao nhất, hệ thống kết hợp 3 loại thuật toán chuyên biệt:
1.  Game Tương đồng (Similarity): Tìm những game "sinh đôi" hoặc cùng thể loại với game bạn đang xem.
2.  Hệ thống Lai (Hybrid): Kết hợp nhiều nguồn dữ liệu (lịch sử chơi, cộng đồng, tuổi tác) để đưa ra danh sách tổng quát.
3.  Hệ số Thúc đẩy (Boost): Một bộ lọc thực tế để ưu tiên các game chạy mượt trên máy người dùng hoặc đang có giá tốt.



 Trang 3: Giải thích về "Game Tương đồng"
   Cách hoạt động: Hệ thống quét các thông tin của game như: Thể loại (Hành động, Nhập vai), Nhà phát hành, và cả những từ ngữ trong mô tả game.
   Kỹ thuật: Chuyển văn bản thành dạng số để máy tính "đo" được khoảng cách giữa các game (Cosine Similarity).
   Ứng dụng: Khi người dùng xem một game, hệ thống ngay lập tức gợi ý các game có "vector đặc trưng" gần nhất.



 Trang 4: Giải thích về Thuật toán Lai (Hybrid)
Đây là phần quan trọng nhất, nơi hệ thống gom các "manh mối" khác nhau về người dùng để đưa ra kết luận.

Hệ thống chia làm 4 phần con:
1.  SVD (Học từ cộng đồng): Dự đoán sở thích dựa trên hành vi của những người dùng tương tự (Collaborative Filtering).
2.  Content (Lịch sử cá nhân): Dựa vào những game bạn đã từng mua, yêu thích hoặc xem nhiều nhất.
3.  Demographic (Nhân khẩu học): Ưu tiên game dựa trên độ tuổi và giới tính.
4.  Keyword (Từ khóa): Dành riêng cho chức năng tìm kiếm.



 Trang 5: Công thức Lai & Trọng số (Bám sát mã nguồn)
Hệ thống tính toán theo quy tắc cộng dồn điểm số:
Điểm Lai = (SVD x W1) + (Nội dung x W2) + (Lứa tuổi x W3) + (Từ khóa x W4)

Các kịch bản trọng số (W) thực tế trong Code:
1.  Khi KHÔNG tìm kiếm: 45% SVD + 35% Nội dung + 20% Lứa tuổi.
2.  Khi CÓ tìm kiếm: 60% Từ khóa + 15% SVD + 15% Nội dung + 10% Lứa tuổi.
3.  Người dùng MỚI (Cold Start): 70% SVD + 30% Lứa tuổi (Bỏ qua Nội dung vì chưa có lịch sử).



 Trang 6: Giải thích về "Boost" (Hệ số Thúc đẩy)
Đây là bước Cá nhân hóa và Thích ứng cuối cùng giúp kết quả thực tế hơn:

   Tính thích ứng thời gian: Ưu tiên phân tích hành vi của bạn trong 7 ngày gần nhất (Adaptive).
   Nguyên tắc: Nhân thêm hệ số ưu tiên (từ 0.6 đến 1.2) cho từng thuộc tính.
   Mục tiêu: Đảm bảo gợi ý vừa "hợp gu" vừa "chơi được" ngay lập tức trên máy của bạn.



 Trang 7: Tổng kết  Tại sao cần cả 3 và dùng khi nào?

| Loại thuật toán | Khi nào dùng? | Tại sao phải dùng? |
| : | : | : |
| Game Tương đồng | Khi xem game cụ thể. | Tìm các lựa chọn "cùng thể loại" nhanh chóng. |
| Hệ thống Lai | Trang chủ / Tìm kiếm. | Tổng hợp sâu sở thích của người dùng và cộng đồng. |
| Hệ số Boost | Bước cuối cùng. | Đảm bảo game phù hợp cấu hình, túi tiền và hứng thú hiện tại. |



 Trang 8: Phụ lục (1)  Cách máy tính hiểu "Sự tương đồng"

 1. Thuật toán SVD (Học từ cộng đồng)
Hệ thống dùng phép phân tách ma trận để tìm ra các "đặc trưng ẩn".
Công thức rút gọn: Điểm dự đoán = (Lịch sử User) x (Độ quan trọng) x (Lịch sử Cộng đồng)

 2. Độ tương đồng Nội dung (Content Similarity)
Dùng để đo mức độ "giống nhau" giữa Game A và B.
   Trọng số đặc biệt: Thể loại (Genre) được nhân gấp 3 lần tầm quan trọng.
   Xử lý số liệu: Giá cả và lượt tải được quy đổi về dạng Log để so sánh công bằng hơn.



 Trang 9: Phụ lục (2)  Công thức Nhân khẩu học (Demographic)

Dùng để tìm nhóm người dùng "cùng tần sóng" với bạn.

 1. Tính độ giống nhau giữa hai người (User Similarity)
Độ giống nhau = (Điểm Tuổi) x (Điểm Giới tính)
   Điểm Tuổi: Lấy 1.0 trừ đi (Chênh lệch tuổi x 0.2). Nếu lệch 5 tuổi trở lên, coi như không liên quan (0 điểm).
   Điểm Giới tính: Nếu cùng phái = 1.0; Nếu khác phái = 0.5.

 2. Tính điểm Demo cho Game
Game nào được nhóm người "giống bạn" chơi nhiều nhất sẽ có điểm Demo cao nhất.



 Trang 10: Phụ lục (3)  Thuật toán Tìm kiếm (Keyword)

Hệ thống chấm điểm dựa trên mức độ xuất hiện từ khóa trong thông tin Game.

 1. Quy tắc cộng điểm thô (Raw Score):
   Khớp tên Game: +3.0 điểm (Ưu tiên cao nhất).
   Khớp Thể loại: +2.5 điểm.
   Khớp Mô tả: +2.0 điểm.
   Khớp NPH hoặc Platform: +1.5 điểm.
   Khớp cấu hình (CPU/GPU): +1.5 điểm.
   Khớp năm phát hành: +2.0 điểm.

 2. Chuẩn hóa:
Điểm Keyword = (Tổng điểm thô) / 15.0 (Để đưa về thang điểm từ 0 đến 1).



 Trang 11: Phụ lục (4)  Công thức Adaptive Boost

Đây là các "phần thưởng" hoặc "hình phạt" hệ thống dành cho mỗi đầu game.

 1. Cách tính Boost Factor (Hệ số nhân):
Mỗi Game sẽ có một hệ số nhân riêng biệt cho:
   Nhà phát hành (Publisher): Nếu là hãng bạn thích gần đây, nhân thêm 1.2 (+20%).
   Giá cả: Nếu nằm trong tầm giá bạn hay mua, nhân thêm 1.2. Nếu quá đắt, nhân 0.6 (40%).
   Phần cứng: Nếu máy bạn chỉ đạt yêu cầu Tối tiểu, hệ số bị "kéo xuống" 0.7 để ưu tiên các game máy bạn chạy mượt hơn.

 2. Kết quả cuối cùng:
Điểm Cuối Cùng = Điểm Lai x (Hệ số NPH x Hệ số Giá x Hệ số Cấu hình x Hệ số Thể loại)
   Kết quả này sẽ được dùng để sắp xếp thứ tự game xuất hiện trên màn hình của bạn.
