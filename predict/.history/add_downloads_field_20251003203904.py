import json
import random

# Đọc file game.json
with open('game.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Thêm field downloads cho mỗi game với giá trị ngẫu nhiên
for game in data['games']:
    # Tạo số lượt download ngẫu nhiên từ 10,000 đến 100,000,000
    downloads = random.randint(10000, 100000000)
    game['downloads'] = downloads

# Ghi lại file
with open('game.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Đã thêm field 'downloads' vào tất cả games!")
print("Số lượng games đã cập nhật:", len(data['games']))
