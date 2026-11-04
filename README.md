# HUIT Invitation V35 — Khắc phục mép thư

- Xóa đường vàng ngang do pseudo-element được thêm trong V31–V32.
- Dùng chung tọa độ đường cắt giữa nắp và thân phong bì, tránh hở mép hai bên.
- Nắp vẫn lật trên bản lề ở mép trên, huy hiệu được nhấc trước.
- Giữ nền công nghệ V34, cấu hình Netlify, Admin, link cá nhân hóa và nhạc.

## Deploy
Chép nội dung dự án vào root repository GitHub đang kết nối Netlify; commit và push. Giữ nguyên biến `HUIT_ADMIN_PASSWORD`. Sau khi deploy xong, Ctrl+F5 để tránh cache CSS cũ.


## V38 — Huy hiệu đầy đủ và vị trí lá thư
- Huy hiệu và hai đuôi ruy băng được tách thành một ảnh WebP trong suốt để bay cùng nhau.
- Nắp, thân thư dùng ảnh bìa đã xử lý sạch huy hiệu/ruy băng in sẵn.
- Hạ thư nhẹ so với V37 trên cả desktop và mobile.
- Giữ nguyên Admin, Netlify Functions, nhạc và liên kết thiệp đã lưu.
- Khi deploy, phải upload cả thư mục `site/assets`.


V39 updates: lowered the envelope slightly and replaced the simple circular backdrop with a more dynamic tech-cinematic background (side hologram panels, scanline, grid overlay, comet streaks, and a softer halo).


### Phiên bản V40 – Nền Ceremonial Aurora
Đã bỏ các panel hologram, các vòng quỹ đạo lớn và lưới phủ kín. Nền mới dùng ánh sáng xanh HUIT như sân khấu tốt nghiệp, tia sáng mềm, đường phối cảnh cực mảnh, điểm vàng và hạt sáng. Hỗ trợ reduced-motion và giảm hiệu ứng ở màn hình nhỏ.


V41 — Neon campus theme using new assets: neon-side-elements.webp, neon-side-left.webp, neon-side-right.webp. Letter stacking fixed: opened flap behind rising letter, rising letter behind front pocket. Header label updated to THƯ MỜI LỄ TỐT NGHIỆP. Deploy site/ and netlify/ together.


## V42
- An cac the cong nghe o hai ben, giu lai hinh kien truc truong phia duoi.
- Chuyen phong bi sang trai mot chut (desktop/mobile).
- Day 0/1 ro hon va mo dan, bien mat truoc khu vuc truong phia duoi.

## V44 – Motion refinements
- Restore invitation art layout; V43 accidentally changed the absolute circle element into flow and pushed portrait/logo down.
- Subtle recurring random mini-fireworks inside the opened card (canvas, stopped on close, disabled by reduced-motion).
- Animated blue and gold tracer beams in lower left/right background, with glowing glints moving along curves.
- Keep the envelope left offset and same vertical position as V42.

## V45 - Chuyển động sóng nhấp nhô
- Thay các vệt sáng chạy dọc thành các lớp sóng nhấp nhô lên/xuống theo phương dọc (trái 5.8 giây, phải 6.7 giây), mỗi lớp lệch pha.
- Tách lớp sóng dưới nền từ ảnh gốc để phần kiến trúc trường ở phía sau không chuyển động.
- Các đường viền SVG phát sáng dao động dọc thay vì chạy ngang; bỏ các chấm chạy theo đường cong.
- Giữ nguyên phong bì, pháo bông trong thiệp, Admin và Netlify Functions.

Deploy Netlify: dùng nội dung bên trong ZIP ở thư mục gốc, giữ `netlify.toml`, `site/` và `netlify/functions/`.


## V46 — Sóng lan từ trong ra
- Sóng xanh lam/xanh ngọc/vàng được vẽ bằng Canvas, liên tục lan từ phía phong bì ra hai mép màn hình theo hàm sin biến thiên theo không gian và thời gian.
- Bỏ chuyển động nhấp lên/xuống toàn bộ ảnh nền V45 và tắt các vệt laser nét đứt V44. Hình tòa nhà đứng yên; chỉ bề mặt sóng chuyển động.
- Giới hạn tốc độ làm mới khoảng 40fps, tạm dừng khi trang ở nền, hỗ trợ chế độ giảm chuyển động.
- Admin, hệ thống link mời và Netlify Functions giữ nguyên.


V47: Smooth continuous full-width outward-traveling waves behind the envelope, no seam at center. Rebuilt the floating graduation cap using cleaner blue-cyan 3D SVG with a gold tassel. Admin and Netlify functions unchanged.
