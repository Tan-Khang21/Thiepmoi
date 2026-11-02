# HUIT Invitation – Cinematic 3D (V25)

Phiên bản này cập nhật trực tiếp từ **V24: Admin + Public + link riêng từng khách + nhạc MP3 tối đa 15 MB**. Không thay đổi cấu trúc dữ liệu, API hoặc Netlify Functions.

## Hiệu ứng mới

- **Phong bì 3D:** nghiêng nhẹ theo vị trí con trỏ trên desktop; ánh sáng và bóng đổ phản ứng theo góc nhìn.
- **Mở phong bì theo trình tự:** dấu HUIT phát sáng → nắp thư lật 3D → ánh sáng xuất hiện từ bên trong → lá thư trượt lên.
- **Camera tiến nhẹ về phía cổng HUIT:** phần mái, hai trụ và nét phối cảnh chuyển động với tốc độ/độ dịch chuyển khác nhau; tiêu đề dịu đi trong lúc lá thư bay lên, rồi hiện thiệp.
- **Đóng thư:** khi đóng thiệp, lá thư thu về trước, nắp thư đóng sau, dấu niêm phong trở lại.
- **Mobile & Accessibility:** giảm biên độ zoom trên điện thoại; không yêu cầu con trỏ; tôn trọng cài đặt `prefers-reduced-motion`.

## Deploy lên website Netlify hiện tại

1. Giải nén gói ZIP tại **thư mục gốc repository** GitHub đã kết nối Netlify; ghi đè các file cũ.
2. Giữ nguyên **site Netlify**, biến môi trường `HUIT_ADMIN_PASSWORD`, các dữ liệu và link thiệp đã lưu.
3. Commit và push lên GitHub. Netlify deploy tự động; đợi trạng thái **Published**.
4. Mở lại trang Public và `/admin` (bấm Ctrl+F5 nếu trình duyệt đang lưu cache).

**Không cần tạo lại link thiệp.** Các đường dẫn `/i/<mã-thiệp>` vẫn sử dụng Netlify Blobs hiện tại.

## Cách sử dụng

- Trên trang Public, đưa chuột lên phong bì để thấy hiệu ứng nghiêng nhẹ; bấm vào phong bì để mở thiệp.
- Khi mở, camera tiến nhẹ về cổng trường. Nội dung và nhạc riêng của mỗi khách vẫn được tải từ cấu hình đã lưu.
- Bấm dấu **×** để đóng thiệp và xem phong bì khép lại.
- Quản lý nội dung, nhạc, tạo / sửa / xóa link riêng ở `/admin` như bản V24.

## Các tập tin chính

- `site/index.html`: trang Public và hiệu ứng mở thiệp.
- `site/admin.html`, `site/admin.js`: quản trị thiệp.
- `netlify/functions/`: lưu cấu hình, nhạc và link riêng.
- `netlify.toml`, `package.json`: cấu hình Netlify.

## Lưu ý

Website Public có thể xem thử khi mở `site/index.html`, nhưng tính năng lưu dữ liệu, link riêng và nhạc online cần Netlify Functions/Blobs. Bản này được kiểm tra cú pháp JavaScript và luồng mở/đóng trên Chromium ở kích thước desktop và mobile trong môi trường thử nghiệm; bạn nên thử lại sau khi deploy để xác nhận cấu hình Netlify thực tế.
