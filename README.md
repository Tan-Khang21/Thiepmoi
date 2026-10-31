# HUIT Graduation Invitation – Netlify Admin & Public

## Cách triển khai khuyên dùng (không cần VPS)
1. Đăng nhập GitHub (https://github.com), tạo một **repository private** mới.
2. Tải toàn bộ file trong thư mục dự án này lên repository (đừng chỉ tải `site/`; phải có `netlify/`, `netlify.toml`, `package.json`).
3. Truy cập https://app.netlify.com/start, đăng nhập Netlify, chọn **Import from Git** -> GitHub -> repository vừa tạo.
4. Netlify sẽ nhận `netlify.toml`: Publish directory `site`, Functions `netlify/functions`; **không cần build command**. Bấm Deploy.
5. Vào **Project configuration → Environment variables**, thêm biến **`HUIT_ADMIN_PASSWORD`** với mật khẩu tự đặt ít nhất 12 ký tự. Mật khẩu này không có sẵn trong source và KHÔNG đưa lên GitHub. Sau khi thêm, trigger redeploy ở Netlify nếu được yêu cầu.
6. Vào trang `https://ten-site.netlify.app/admin`, điền mật khẩu và chỉnh cấu hình. Bấm **Lưu thay đổi lên website**.
7. Khách dùng `https://ten-site.netlify.app/?to=Nguyen%20Van%20A`; phần Public tự đọc cấu hình mới qua Netlify Functions + Blobs.

Nếu chỉ muốn đăng thiệp tĩnh, có thể kéo thư mục `site/` vào https://app.netlify.com/drop nhưng **không có API Admin**, không thể đồng bộ nhạc/nội dung. Vì bạn muốn Admin lưu thay đổi trực tiếp, dùng **Import from Git** như trên.

## Chức năng
- Public: giữ toàn bộ thiết kế HUIT, cổng line-art, binary rain, confetti, phong bì, VR360, cá nhân hóa `?to=` và `?role=`.
- Admin: sửa tên sinh viên, tên người nhận mặc định, xưng hô, năm, thời gian, địa điểm, Google Maps; link riêng hàng loạt/CSV.
- Nhạc: mặc định nhạc piano đã nhúng trong HTML, hoặc upload MP3 (tối đa 3 MB), link MP3 HTTPS, tắt nhạc. MP3 lưu ở Netlify Blobs.
- API write được kiểm tra mật khẩu ở Netlify Functions. Link `/admin` có thể mở công khai nhưng **không có mật khẩu thì không thể lưu hay upload nhạc**.

## Lưu ý
- URL `?to=...` **ưu tiên** tên riêng và ghi đè tên người nhận mặc định. Tên đã gửi trong URL không thể đổi chung từ Admin nếu bạn không phát link mới.
- Không cần tạo lại `index.html` khi sửa nội dung. Khách tải lại trang để nhận thay đổi.
- Netlify Functions & Blobs phụ thuộc Internet. Chưa có môi trường tài khoản Netlify của bạn nên dự án chưa được deploy thực tế.
- Kích thước file MP3 tối đa 3 MB do giới hạn upload/response Functions; không upload nhạc có bản quyền nếu không có quyền sử dụng.
- Nếu mở thẳng `index.html` từ máy, sẽ dùng giá trị dự phòng và không có tính năng lưu Admin.
- Lịch lễ và địa điểm là thông tin mẫu, cần chỉnh chính xác theo thư mời chính thức trước khi chia sẻ.
- Link nhạc ngoài cần CORS/phát trực tiếp, HTTPS. VR360 có thể bị chặn iframe bởi trang cung cấp.
- Một mật khẩu chung phù hợp website cá nhân; nếu triển khai cho nhiều người quản trị, nên dùng xác thực tài khoản chuyên dụng.
- Tránh chạy Deploy Preview cùng production với cùng kho Blobs khi đang sửa nội dung, vì dữ liệu site-wide dùng chung.
