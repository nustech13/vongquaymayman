# Vòng Quay May Mắn

Landing page nhỏ dùng HTML, CSS và JavaScript thuần. Không cần cài đặt package hay build.

## Chạy trên máy tính
1. Giải nén file ZIP.
2. Mở `index.html` bằng trình duyệt.
3. Thêm lựa chọn, chọn màu và nhấn **QUAY NGAY**. Vòng quay chạy trong 10 giây.

## Tính năng
- Vòng quay canvas nhiều màu, đèn viền và hiệu ứng easing dừng mượt.
- Thêm, sửa, xóa lựa chọn; xóa tất cả hoặc khôi phục danh sách mẫu.
- Kết quả hiển thị trong popup, kèm hiệu ứng confetti.
- Các lựa chọn được lưu tự động bằng `localStorage` trên trình duyệt hiện tại.
- Responsive cho máy tính, tablet và điện thoại.
- Không phụ thuộc thư viện JavaScript bên ngoài.

## Deploy lên Cloudflare Pages
1. Tạo GitHub repository và push toàn bộ file trong thư mục này.
2. Trong Cloudflare Dashboard, mở **Workers & Pages** → tạo Pages project → **Connect to Git**.
3. Chọn repository và nhánh `main`.
4. Framework preset: `None`; build command để trống; build output directory đặt là thư mục gốc (`/` hoặc `.` theo hướng dẫn trong dashboard).
5. Deploy. Mỗi lần `git push` lên `main`, website sẽ được deploy lại.

## Lưu ý
- Mỗi lựa chọn có xác suất bằng nhau tại thời điểm bắt đầu quay. Đây là hiệu ứng giải trí, không dùng cho xổ số hoặc quyết định cần tính công bằng có kiểm chứng.
- Dữ liệu chỉ lưu trong trình duyệt của người dùng, không đồng bộ giữa các thiết bị.
- Tối đa 30 lựa chọn để nhãn trên vòng quay vẫn dễ đọc.
