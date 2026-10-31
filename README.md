# HUIT Invitation – Link riêng có lưu trên Netlify

## Deploy cập nhật website đang dùng
1. Giữ lại đúng **website Netlify** đang dùng, KHÔNG cần tạo site mới và KHÔNG cần đổi mật khẩu.
2. Giải nén ZIP, ghi đè toàn bộ source vào **repository GitHub đang nối Netlify** (gồm `site/`, `netlify/`, `netlify.toml`, `package.json`).
3. Commit/push, chờ Netlify **Published**. Bấm Ctrl+F5 khi mở `/admin`.
4. Nhập `HUIT_ADMIN_PASSWORD` đã đặt trên Netlify. Không đưa mật khẩu vào repository.

## Tạo và lưu link dành cho một khách
1. Mở `https://ten-site.netlify.app/admin`.
2. Nhập mật khẩu, thông tin lễ, tên người nhận và cách xưng hô; chọn MP3 riêng (nếu muốn).
3. Bấm **Lưu thiệp & lấy link riêng**.
4. Trang Admin hiện link dạng `https://ten-site.netlify.app/i/5e...` để sao chép.
5. Link đã được lưu trong **Netlify Blobs**, không cần export file hay deploy lần nữa. Khách có thể mở link ngay.
6. Sử dụng **Danh sách thiệp đã lưu** để mở/sửa/xóa; sửa link có sẵn **không đổi URL**. Bấm **Tạo thiệp mới** để tạo link cho người tiếp theo.
7. Muốn lưu nhiều link một lượt, nhập mỗi tên một dòng tại **Lưu nhiều thiệp cùng lúc**, bấm **Lưu tất cả & tạo link**; tải CSV nếu cần.

## Hành vi quan trọng
- Thiệp cá nhân lưu **bản sao** của thông tin sự kiện, tên khách và cài đặt nhạc tại thời điểm lưu. Thay đổi cấu hình chung ở trang `/` không tự sửa các thiệp riêng đã gửi.
- Link `/i/<id>` lưu riêng trên Netlify; không thể bị đổi tên chỉ bằng thêm `?to=`.
- Nhạc MP3 đã tải lên từ Admin phiên bản này được lưu thành từng tệp riêng trong Netlify Blobs (`songs/<asset-id>.mp3`), không ghi đè bài hát đã dùng cho thiệp khác. Tối đa **15 MB**, tải theo phần 2 MB.
- File MP3 đã tải lên phiên bản cũ (trong `background.mp3`) vẫn nghe được, trừ khi sau đó ghi đè bằng một phiên bản cũ hơn. Sửa/xóa thiệp không tự xóa MP3 dùng chung để tránh làm hỏng các link khác.
- Link `/?to=Ten` của các thiệp đời cũ vẫn hoạt động, nhưng **chỉ link `/i/<id>` mới lưu được riêng**.
- Sau khi lưu, link tồn tại trên website đang deploy, không phụ thuộc máy tính Admin. Hãy luôn dùng cùng một Netlify site, tránh tạo site mới sẽ dùng một kho lưu trữ khác.
- Không chia sẻ URL Admin hay mật khẩu; link thiệp cá nhân là URL dài khó đoán chứ **không phải trang đăng nhập bảo mật**. Ai có link đều có thể xem thiệp.
- Netlify Functions/Blobs có thể có chi phí hoặc giới hạn gói. Link có thể lỗi khi Netlify không hoạt động.
- Các URL và lời mời phải sử dụng đúng thông tin sự kiện thực tế trước khi phát hành.

## Kiểm thử sau deploy
- Lưu `Nguyễn Văn A` → link `/i/<id-A>` hiện tên A.
- Tạo thiệp mới, lưu `Trần Thị B` → link `/i/<id-B>` khác link A.
- Mở lại link A → vẫn hiện A.
- Chọn Sửa thiệp A, đổi thành `Nguyễn Văn C`, Lưu → vẫn là id-A nhưng hiện C.
- Thử xóa thiệp A → link A hiện thông báo không tồn tại/đã thu hồi.
