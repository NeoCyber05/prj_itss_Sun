# Business Logic — RakuSlide

> Tài liệu này được tổng hợp từ file `ボピーシー_システム仕様書 (バッキ)(1).xlsx`.  
> Mục tiêu: chuyển nội dung đặc tả hệ thống thành tài liệu business logic để dùng khi phân tích, thiết kế database, thiết kế service/controller và triển khai chức năng.

---

## 1. Tổng quan hệ thống

### 1.1. Tên ứng dụng

**RakuSlide**

### 1.2. Bài toán cần giải quyết

Hệ thống hướng tới việc hỗ trợ giáo viên người Nhật đang làm việc tại Việt Nam và sinh viên có nhu cầu tạo slide thuyết trình. Các vấn đề chính:

- Mất nhiều thời gian để soạn slide bài giảng.
- Khó tìm template phù hợp với nội dung hoặc curriculum.
- Tốn thời gian tìm hình ảnh phù hợp với chủ đề.
- Tốn công tự tạo quiz.
- Cần thêm ý tưởng khi tạo slide mới.
- Cần cơ chế chia sẻ, tái sử dụng, cải tiến slide giữa người dùng.

### 1.3. Giải pháp tổng thể

RakuSlide cung cấp một hệ thống tạo, tìm kiếm, chỉnh sửa, chia sẻ và đánh giá template slide. Hệ thống tích hợp thêm AI để tạo tài liệu bài giảng, tìm kiếm hình ảnh để chèn vào slide và hỗ trợ tạo quiz tự động từ dữ liệu người dùng nhập.

---

## 2. Role người dùng

| Role ID | Role | Mô tả |
|---:|---|---|
| 1 | Người dùng | Người đã đăng nhập, cần tạo slide cho bài giảng hoặc thuyết trình. Có quyền dùng đầy đủ các chức năng chính như tạo/chỉnh sửa template, chia sẻ, lưu thư viện, đánh giá, cập nhật hồ sơ. |
| 2 | Tài khoản khách | Người chưa đăng nhập hoặc chưa đăng ký. Có thể tìm kiếm, xem template, đăng nhập hoặc đăng ký để dùng đầy đủ chức năng. |

---

## 3. Danh sách chức năng nghiệp vụ

| ID | Chức năng | Role áp dụng | Mô tả nghiệp vụ |
|---:|---|---|---|
| 1 | Tìm kiếm template | Người dùng, Khách | Cho phép tìm kiếm template, xem trước template và áp dụng vào bài giảng để chỉnh sửa. |
| 2 | Tạo template | Người dùng | Cho phép thiết kế, lưu trữ template riêng, tái sử dụng hoặc chia sẻ với người khác. |
| 3 | Tạo tài liệu bài giảng bằng AI | Người dùng | Người dùng nhập topic/keyword/prompt, hệ thống dùng AI tạo dàn ý hoặc nội dung văn bản cho từng slide. |
| 4 | Tìm kiếm hình ảnh | Người dùng | Cho phép tìm ảnh theo từ khóa và chèn trực tiếp vào slide từ màn hình chỉnh sửa. |
| 5 | Tạo quiz tự động | Người dùng | Người dùng nhập câu hỏi và đáp án, hệ thống tạo slide quiz theo layout có sẵn. |
| 6 | Chia sẻ tài liệu | Người dùng | Cho phép chia sẻ slide/template bằng link hoặc cấp quyền cho người khác. Người nhận chỉ được thao tác trong phạm vi quyền được cấp. |
| 7 | Xem thư viện template đã lưu | Người dùng | Hiển thị các template đã lưu/tạo để người dùng mở lại, xóa hoặc quản lý. |
| 8 | Cập nhật hồ sơ | Người dùng | Cho phép cập nhật thông tin cá nhân như tên hiển thị, số điện thoại, avatar, mật khẩu. |
| 9 | Đăng nhập | Khách | Xác thực tài khoản để chuyển từ khách sang người dùng đã đăng nhập. |
| 10 | Đăng ký | Khách | Tạo tài khoản mới để sử dụng chức năng chia sẻ và sử dụng slide. |
| 11 | Đánh giá | Người dùng | Cho phép người đã sử dụng template gửi rating sao và bình luận. |

---

## 4. Business logic theo module

## 4.1. Module xác thực: Đăng ký, đăng nhập

### 4.1.1. Đăng nhập

**Actor:** Khách

**Input:**

- Email hoặc ID đăng nhập.
- Mật khẩu.
- Có thể đăng nhập bằng Google hoặc Facebook.

**Luồng xử lý chính:**

1. Người dùng mở màn hình đăng nhập.
2. Nhập email/ID và mật khẩu.
3. Khi bấm nút đăng nhập, hệ thống đối chiếu thông tin xác thực.
4. Nếu thông tin hợp lệ, hệ thống chuyển người dùng sang role **Người dùng** và điều hướng tới màn hình tương ứng.
5. Nếu thông tin không hợp lệ, hệ thống hiển thị thông báo lỗi và không chuyển trang.

**Rule nghiệp vụ:**

- Password phải được ẩn khi nhập.
- Nếu đăng nhập sai, không được tạo session.
- Sau khi đăng nhập thành công, các chức năng chỉ dành cho người dùng phải được mở khóa.
- Header chuyển từ trạng thái khách sang trạng thái đã đăng nhập, hiển thị user icon/menu.

### 4.1.2. Đăng ký

**Actor:** Khách

**Input:**

- Tên người dùng.
- Email.
- Mật khẩu.
- Nhập lại mật khẩu.
- Checkbox đồng ý điều khoản.
- Có thể đăng ký bằng Google hoặc Facebook.

**Luồng xử lý chính:**

1. Khách mở màn hình đăng ký.
2. Nhập đầy đủ thông tin bắt buộc.
3. Hệ thống kiểm tra điều kiện đăng ký.
4. Nếu hợp lệ, hệ thống tạo tài khoản trong bảng User.
5. Sau khi tạo thành công, hệ thống tự động đăng nhập hoặc chuyển về trang đăng nhập.

**Rule nghiệp vụ:**

- Chỉ cho phép đăng ký khi đã tick đồng ý điều khoản.
- Email phải đúng định dạng.
- Email không được trùng với email đã tồn tại.
- Mật khẩu xác nhận phải khớp với mật khẩu.
- Nếu hệ thống yêu cầu xác nhận email, phải gửi email xác nhận sau khi đăng ký.
- Đăng ký bằng Google/Facebook phải liên kết được với tài khoản ngoài.

---

## 4.2. Module tìm kiếm template

**Actor:** Người dùng, Khách

**Input:**

- Keyword trong thanh tìm kiếm.
- Bộ lọc danh mục, ví dụ: ngữ pháp, từ vựng, hội thoại.
- Có thể lọc/sắp xếp theo category hoặc điều kiện hiển thị.

**Luồng xử lý chính:**

1. Người dùng nhập keyword vào thanh tìm kiếm.
2. Nhấn Enter để chuyển sang màn hình kết quả tìm kiếm.
3. Hệ thống tìm các template có chứa chuỗi con khớp với keyword.
4. Hệ thống chỉ hiển thị template thỏa mãn quyền truy cập, tối thiểu là template công khai.
5. Người dùng bấm vào template card để mở màn hình chi tiết template.
6. Nếu không có kết quả, hiển thị thông báo không tìm thấy kết quả phù hợp.

**Rule nghiệp vụ:**

- Kết quả tìm kiếm phải khớp keyword theo dạng chứa chuỗi con.
- Khách chỉ được xem các template công khai hoặc template được hệ thống cho phép truy cập.
- Người dùng đăng nhập có thể xem thêm template của chính mình, template đã lưu hoặc template được chia sẻ.
- Kết quả phải hiển thị đúng dạng card/list theo thiết kế màn hình tìm kiếm.
- Bộ lọc category phải sắp xếp/lọc lại danh sách template theo category được chọn.
- Từ một template trong kết quả, người dùng có thể đi tới màn hình chi tiết.

---

## 4.3. Module xem chi tiết template

**Actor:** Người dùng, Khách

**Dữ liệu hiển thị:**

- Ảnh slide chính.
- Danh sách thumbnail slide.
- Thông tin template: mô tả, số slide, tác giả, thông tin liên quan.
- Danh sách template liên quan.
- Các nút thao tác tùy theo role.

**Luồng xử lý chính cho người dùng đã đăng nhập:**

1. Người dùng mở chi tiết template từ kết quả tìm kiếm.
2. Hệ thống hiển thị ảnh slide chính và danh sách thumbnail.
3. Khi bấm thumbnail, ảnh slide chính đổi sang slide tương ứng.
4. Người dùng có thể:
   - Sử dụng template này.
   - Xem preview toàn màn hình.
   - Tải xuống dưới dạng PPTX hoặc PDF.
   - Lưu vào dự án/thư viện cá nhân.
   - Mở template liên quan.

**Luồng xử lý chính cho khách:**

1. Khách có thể xem chi tiết template.
2. Khách có thể xem preview và tải xuống nếu template cho phép.
3. Nếu cần thao tác yêu cầu đăng nhập, hệ thống điều hướng khách tới đăng nhập/đăng ký.

**Rule nghiệp vụ:**

- Thông tin chi tiết template phải được lấy từ database.
- Thumbnail phải điều khiển đúng slide chính.
- Nút tải xuống phải xuất đúng định dạng PPTX hoặc PDF.
- Nút lưu vào dự án chỉ áp dụng cho người dùng đã đăng nhập.
- Template liên quan phải điều hướng được tới trang chi tiết tương ứng.

---

## 4.4. Module tạo và chỉnh sửa template

**Actor:** Người dùng

**Input/Thao tác:**

- Chọn template trống hoặc template có sẵn.
- Thêm/xóa/sắp xếp slide.
- Chèn text, ảnh, biểu đồ.
- Chỉnh font, size, màu, căn lề, in đậm, in nghiêng, gạch chân, link.
- Kéo thả, resize phần tử trên canvas.
- Chọn layout.
- Preview slide.
- Chia sẻ template.
- Tạo quiz từ màn hình chỉnh sửa.

**Luồng xử lý chính:**

1. Người dùng bắt đầu từ template trống hoặc template có sẵn.
2. Hệ thống mở màn hình chỉnh sửa slide.
3. Người dùng thao tác trên canvas:
   - Click để chọn/chỉnh sửa phần tử.
   - Kéo thả để di chuyển phần tử.
   - Resize bằng handle.
   - Dùng toolbar để định dạng text.
4. Người dùng có thể thêm slide, xóa slide, đổi thứ tự slide trong danh sách thumbnail.
5. Người dùng có thể mở tab AI, ảnh hoặc layout từ side panel.
6. Người dùng preview hoặc chia sẻ template sau khi chỉnh sửa.

**Rule nghiệp vụ:**

- Chỉ người dùng đã đăng nhập được tạo và chỉnh sửa template.
- Mỗi thay đổi trên canvas cần được phản ánh vào trạng thái hiện tại của slide.
- Danh sách thumbnail phải đồng bộ với danh sách slide thực tế.
- Khi chọn thumbnail, canvas phải chuyển sang đúng slide.
- Khi đổi thứ tự slide, thứ tự lưu trữ cũng phải thay đổi.
- Toolbar chỉ áp dụng định dạng cho phần tử/text đang được chọn.
- Nút Share mở popup chia sẻ template.
- Nút Create Quiz điều hướng tới màn hình tạo quiz.
- Preview hiển thị slide ở chế độ xem trước.

---

## 4.5. Module tạo tài liệu bài giảng bằng AI

**Actor:** Người dùng

**Input:**

- Chủ đề bài giảng.
- Keyword.
- Nội dung văn bản hoặc prompt yêu cầu AI.

**Luồng xử lý chính:**

1. Người dùng mở tab AI text trong side panel của màn hình chỉnh sửa.
2. Nhập prompt hoặc topic.
3. Bấm nút tạo.
4. Hệ thống gửi input cho AI.
5. AI sinh script hoặc nội dung văn bản.
6. Sau khi có kết quả, người dùng có thể tải xuống hoặc chỉnh sửa nội dung.

**Rule nghiệp vụ:**

- Phải có ô nhập prompt/chủ đề cho AI.
- AI tạo script/text dựa trên nội dung người dùng nhập.
- Kết quả AI không tự động thay thế nội dung slide nếu người dùng chưa chọn áp dụng.
- Người dùng có quyền chỉnh sửa kết quả AI trước khi dùng.
- Cần xử lý trường hợp prompt rỗng bằng validation.

---

## 4.6. Module tìm kiếm hình ảnh

**Actor:** Người dùng

**Input:**

- Keyword tìm kiếm ảnh.

**Luồng xử lý chính:**

1. Người dùng mở tab tìm kiếm ảnh trong side panel.
2. Nhập keyword.
3. Hệ thống gọi API tìm kiếm ảnh.
4. Hệ thống hiển thị danh sách ảnh phù hợp.
5. Người dùng click hoặc kéo thả ảnh để chèn vào slide.

**Rule nghiệp vụ:**

- Kết quả ảnh phải phù hợp với keyword.
- Nếu không có ảnh phù hợp, hiển thị thông báo không tìm thấy kết quả.
- Ảnh được chọn phải được chèn trực tiếp vào slide hiện tại.
- Ảnh hiển thị cần rõ nét và tải nhanh.
- Người dùng không cần mở tab trình duyệt mới để lấy ảnh.

---

## 4.7. Module tạo quiz tự động

**Actor:** Người dùng

**Input:**

- Loại câu hỏi.
- Nội dung câu hỏi.
- Các lựa chọn A, B, C, D.
- Đáp án đúng.
- Danh sách câu hỏi đã thêm.

**Luồng xử lý chính:**

1. Người dùng mở màn hình tạo quiz.
2. Chọn loại câu hỏi.
3. Hệ thống thay đổi giao diện nhập đáp án theo loại câu hỏi.
4. Người dùng nhập câu hỏi và các lựa chọn.
5. Người dùng chọn một đáp án đúng.
6. Bấm lưu câu hỏi.
7. Hệ thống validate dữ liệu.
8. Nếu hợp lệ, câu hỏi được thêm vào danh sách.
9. Người dùng có thể chỉnh sửa hoặc xóa câu hỏi.
10. Khi bấm hoàn tất quiz, hệ thống lưu toàn bộ dữ liệu quiz vào database và chuyển trang.

**Rule nghiệp vụ:**

- Mỗi câu hỏi phải có nội dung câu hỏi.
- Mỗi câu hỏi trắc nghiệm phải có đầy đủ lựa chọn và đúng một đáp án đúng.
- Radio đáp án đúng chỉ được chọn một đáp án cho một câu hỏi.
- Nếu thiếu câu hỏi hoặc thiếu đáp án, hệ thống hiển thị lỗi và yêu cầu nhập lại.
- Nút thêm phương án tạo thêm một dòng nhập lựa chọn.
- Nút lưu câu hỏi đưa dữ liệu vào danh sách câu hỏi tạm thời.
- Số lượng câu hỏi trong phần quiz summary phải cập nhật động theo danh sách câu hỏi.
- Nút chỉnh sửa đưa dữ liệu câu hỏi cũ lên form nhập.
- Nút xóa phải xác nhận trước khi loại bỏ khỏi danh sách.
- Nút hoàn tất quiz lưu toàn bộ quiz vào database.
- Có thể bố trí nút lưu bộ câu hỏi thành template.

---

## 4.8. Module chia sẻ tài liệu/template

**Actor:** Người dùng

**Input/Thao tác:**

- Mở popup chia sẻ.
- Thêm người dùng được cấp quyền.
- Chọn quyền truy cập.
- Copy link chia sẻ.
- Bật/tắt chia sẻ.
- Quản lý hoặc thu hồi quyền.

**Luồng xử lý chính:**

1. Người dùng bấm nút Share ở màn hình chỉnh sửa hoặc quản lý template.
2. Hệ thống mở popup chia sẻ.
3. Người dùng có thể thêm người được cấp quyền.
4. Hệ thống gợi ý user khi người dùng nhập ký tự.
5. Người dùng chọn mức quyền truy cập.
6. Người dùng có thể copy link chia sẻ.
7. Người nhận link chỉ được xem hoặc chỉnh sửa theo quyền được cấp.
8. Người sở hữu có thể thay đổi hoặc thu hồi quyền.

**Rule nghiệp vụ:**

- Phải có các mức quyền như chỉ xem hoặc có thể chỉnh sửa.
- Người nhận link không được thao tác vượt quá quyền được cấp.
- Link copy phải hoạt động khi gửi cho người khác.
- Khi copy link thành công, hệ thống hiển thị toast/thông báo.
- Có thể bật/tắt chia sẻ bất kỳ lúc nào.
- Khi thu hồi quyền, user bị thu hồi không còn truy cập được template.
- Danh sách quyền truy cập phải lấy từ database và hiển thị trên màn hình quản lý template.

---

## 4.9. Module thư viện template đã lưu / quản lý template

**Actor:** Người dùng

**Dữ liệu hiển thị:**

- Danh sách template người dùng đã tạo.
- Danh sách template người dùng đã lưu.
- Trạng thái chia sẻ: công khai, riêng tư, chỉ người được mời.
- Danh sách quyền truy cập.

**Luồng xử lý chính:**

1. Người dùng mở màn hình quản lý template.
2. Hệ thống hiển thị danh sách template đã tạo hoặc đã lưu.
3. Người dùng có thể sắp xếp theo tên, ngày cập nhật hoặc trạng thái chia sẻ.
4. Người dùng có thể mở nhanh template.
5. Người dùng có thể xóa template khỏi danh sách đã lưu.
6. Người dùng có thể quản lý link và quyền truy cập.

**Rule nghiệp vụ:**

- Danh sách template đã lưu phải đồng bộ theo tài khoản.
- Khi người dùng đăng nhập trên thiết bị khác, danh sách phải được cập nhật.
- Nếu xóa khỏi danh sách đã lưu, chỉ xóa quan hệ lưu của người dùng, không nhất thiết xóa template gốc.
- Template do người dùng sở hữu mới được phép chỉnh sửa quyền.
- Bộ lọc theo tên sắp xếp A-Z.
- Bộ lọc theo ngày cập nhật sắp xếp từ cũ đến mới hoặc theo quy tắc UI đã định.
- Trạng thái chia sẻ phải phản ánh đúng cấu hình hiện tại.

---

## 4.10. Module cập nhật hồ sơ

**Actor:** Người dùng

**Input:**

- Tên hiển thị.
- Số điện thoại.
- Avatar.
- Mật khẩu hiện tại.
- Mật khẩu mới nếu đổi mật khẩu.

**Luồng xử lý chính:**

1. Người dùng mở màn hình hồ sơ.
2. Hệ thống hiển thị avatar, email, ngày tham gia và thông tin hiện tại.
3. Người dùng chỉnh sửa tên hiển thị, số điện thoại hoặc avatar.
4. Khi lưu, hệ thống validate dữ liệu.
5. Nếu hợp lệ, hệ thống cập nhật database và hiển thị thông báo thành công.
6. Nếu đổi mật khẩu, hệ thống xác thực mật khẩu cũ trước khi cho phép đổi mật khẩu mới.

**Rule nghiệp vụ:**

- Email hiển thị ở chế độ chỉ đọc.
- Ngày tham gia lấy từ hệ thống/database.
- Số điện thoại phải đúng định dạng.
- Đổi avatar phải cập nhật ngay cả ở header user icon.
- Đổi mật khẩu phải xác thực mật khẩu cũ.
- Nút hủy bỏ thay đổi và quay về màn hình trước.
- Nút lưu cập nhật dữ liệu và hiển thị thông báo hoàn tất.

---

## 4.11. Module đánh giá template

**Actor:** Người dùng

**Input:**

- Rating từ 1 đến 5 sao.
- Bình luận đánh giá, tối đa 500 ký tự.

**Luồng xử lý chính:**

1. Người dùng mở màn hình đánh giá sau khi sử dụng template.
2. Chọn số sao.
3. Nhập bình luận.
4. Bấm gửi đánh giá.
5. Hệ thống lưu rating và comment vào database.
6. Hệ thống hiển thị thông báo thành công.
7. Hệ thống cập nhật điểm sao trung bình của template.
8. Nếu bấm bỏ qua, không gửi đánh giá và quay lại màn hình trước hoặc dashboard.

**Rule nghiệp vụ:**

- Chỉ người dùng đã đăng nhập mới gửi đánh giá.
- Rating phải nằm trong khoảng 1 đến 5.
- Bình luận tối đa 500 ký tự.
- Sau khi gửi, điểm trung bình của template phải được tính lại.
- Nút bỏ qua không lưu dữ liệu đánh giá.
- Nút quay lại trở về màn hình chi tiết template.

---

## 4.12. Module đa ngôn ngữ

**Actor:** Người dùng, Khách

**Luồng xử lý chính:**

1. Người dùng chọn ngôn ngữ từ dropdown.
2. Hệ thống đổi ngôn ngữ hiển thị của toàn bộ website.
3. Trạng thái ngôn ngữ được áp dụng cho các màn hình dùng chung.

**Rule nghiệp vụ:**

- Nút chọn ngôn ngữ là thành phần dùng chung trên nhiều màn hình.
- Khi đổi ngôn ngữ, toàn bộ label, text UI và nội dung hệ thống cần chuyển theo ngôn ngữ đã chọn.
- Ngôn ngữ đã chọn nên được lưu để giữ nguyên khi chuyển trang.

---

## 5. Danh sách màn hình và logic điều hướng

| Screen ID | Màn hình | Role | Logic chính |
|---|---|---|---|
| 1 | Dashboard | Người dùng, Khách | Hiển thị slide gần đây, template đề xuất và navigation chính. |
| 2 | Màn hình chỉnh sửa slide | Người dùng | Workspace chính để chỉnh sửa slide, dùng AI, tìm ảnh, chọn layout, preview và chia sẻ. |
| 2a | Popup chia sẻ template | Người dùng | Thiết lập quyền truy cập, thêm người dùng, copy link chia sẻ. |
| 3 | Màn hình tìm kiếm và hiển thị | Người dùng, Khách | Hiển thị danh sách template theo keyword/category. |
| 4 | Màn hình chi tiết template | Người dùng, Khách | Xem slide, thumbnail, thông tin chi tiết, tải xuống, lưu hoặc dùng template. |
| 5 | Màn hình quản lý template | Người dùng | Quản lý template đã tạo/đã lưu và quyền chia sẻ. |
| 6 | Màn hình tạo quiz | Người dùng | Nhập câu hỏi, đáp án, danh sách câu hỏi và lưu quiz. |
| 7 | Màn hình hồ sơ | Người dùng | Xem/cập nhật thông tin cá nhân, avatar, số điện thoại, mật khẩu. |
| 8 | Màn hình đăng nhập | Khách | Xác thực tài khoản bằng email/password hoặc social login. |
| 9 | Màn hình đăng ký | Khách | Tạo tài khoản mới bằng form hoặc social registration. |
| 10 | Màn hình đánh giá | Người dùng | Gửi rating sao và bình luận cho template. |

---

## 6. Quy tắc truy cập theo role

| Chức năng | Khách | Người dùng |
|---|---:|---:|
| Tìm kiếm template công khai | Có | Có |
| Xem chi tiết template công khai | Có | Có |
| Đăng nhập | Có | Không cần |
| Đăng ký | Có | Không cần |
| Tạo template | Không | Có |
| Chỉnh sửa template | Không | Có |
| Tạo tài liệu bằng AI | Không | Có |
| Tìm ảnh và chèn vào slide | Không | Có |
| Tạo quiz | Không | Có |
| Lưu template vào thư viện | Không | Có |
| Chia sẻ template | Không | Có |
| Quản lý quyền truy cập | Không | Có, nếu là chủ sở hữu hoặc có quyền phù hợp |
| Đánh giá template | Không | Có |
| Cập nhật hồ sơ | Không | Có |

---

## 7. Đối tượng dữ liệu chính

Các entity dưới đây được suy ra từ đặc tả chức năng và màn hình.

| Entity | Ý nghĩa | Thuộc tính gợi ý |
|---|---|---|
| User | Tài khoản người dùng | id, username, email, passwordHash, avatarUrl, phoneNumber, role, createdAt |
| Template | Template slide | id, ownerId, title, description, category, visibility, createdAt, updatedAt |
| Slide | Một slide trong template | id, templateId, orderIndex, contentJson, thumbnailUrl |
| TemplateSave | Quan hệ người dùng lưu template | userId, templateId, savedAt |
| SharePermission | Quyền chia sẻ template | id, templateId, targetUserId, permissionType, shareLink, isEnabled |
| Review | Đánh giá template | id, templateId, userId, rating, comment, createdAt |
| Quiz | Bộ quiz | id, ownerId, templateId, title, createdAt |
| Question | Câu hỏi trong quiz | id, quizId, questionText, questionType, correctAnswer |
| QuestionOption | Lựa chọn trong câu hỏi | id, questionId, label, content, isCorrect |
| AIResult | Kết quả AI sinh ra | id, userId, prompt, generatedText, createdAt |
| ImageSearchResult | Kết quả tìm kiếm ảnh | keyword, imageUrl, sourceUrl, insertedAt |

---

## 8. Acceptance criteria theo Product Backlog

## 8.1. Thiết kế cơ sở dữ liệu

- ERD được hoàn thành.
- Migration hoạt động bình thường.
- Các thao tác CRUD vượt qua kiểm thử.

## 8.2. Thiết lập môi trường phát triển

- Ứng dụng khởi chạy bình thường trên môi trường local.

## 8.3. Tìm kiếm template

- Chỉ hiển thị những template chứa chuỗi con khớp với chuỗi tìm kiếm.
- Kết quả tìm kiếm hiển thị đúng theo thiết kế màn hình tìm kiếm.
- Kết quả có thể hiển thị các template có quyền truy cập công khai.
- Nếu không có kết quả phù hợp, hiển thị thông báo rõ ràng rằng không tìm thấy kết quả.

## 8.4. Đăng nhập

- Giao diện đăng nhập đúng theo thiết kế màn hình ID 8.
- Khi khách nhập đúng thông tin xác thực, hệ thống chuyển hướng đúng sang màn hình của role Người dùng.
- Khi nhập sai thông tin xác thực, hệ thống hiển thị lỗi và không chuyển trang.

## 8.5. Tạo template

- Người dùng có thể chọn template trống hoặc template có sẵn để bắt đầu chỉnh sửa.
- Hệ thống cho phép thêm, xóa, thay đổi thứ tự slide trong bộ bài giảng.
- Các công cụ chỉnh sửa cơ bản như chèn text, chèn ảnh, chọn font hoạt động đúng theo thiết kế màn hình chỉnh sửa.

## 8.6. Chia sẻ tài liệu

- Hệ thống hiển thị các tùy chọn quyền truy cập, ví dụ chỉ xem hoặc có thể chỉnh sửa.
- Nút copy link và link được tạo ra hoạt động chính xác.
- Người nhận link chỉ xem/chỉnh sửa theo quyền được cấp.
- Không cho phép người nhận thực hiện thao tác vượt quyền.
- Có thể bật/tắt chức năng chia sẻ bất kỳ lúc nào.

## 8.7. Xem thư viện template đã lưu

- Hệ thống hiển thị đầy đủ danh sách template mà người dùng đã lưu.
- Người dùng có thể mở nhanh hoặc xóa template khỏi danh sách đã lưu.
- Danh sách được đồng bộ với tài khoản khi đăng nhập trên thiết bị khác.

## 8.8. Tìm kiếm hình ảnh

- Thanh tìm kiếm ảnh trả về kết quả phù hợp với keyword người dùng nhập.
- Người dùng có thể kéo thả hoặc click ảnh để chèn trực tiếp vào slide.
- Ảnh hiển thị rõ nét và tải nhanh.
- Nếu không có kết quả, hiển thị thông báo không tìm thấy ảnh phù hợp.

## 8.9. Tạo tài liệu bài giảng bằng AI

- Có khung nhập nội dung văn bản hoặc chủ đề/prompt cho AI.
- AI tự động tạo script/text.
- Sau khi AI trả kết quả đầu tiên, người dùng có thể tải xuống hoặc chỉnh sửa.

## 8.10. Tạo bài kiểm tra tự động

- Mỗi câu hỏi có đầy đủ nội dung câu hỏi, danh sách lựa chọn và đáp án đúng.
- Nếu dữ liệu nhập thiếu hoặc không hợp lệ, hệ thống hiển thị lỗi và yêu cầu nhập lại.
- Người dùng có thể chỉnh sửa câu hỏi và đáp án sau khi tạo.
- Có thể lưu bộ câu hỏi thành template.

## 8.11. Đánh giá

- Người dùng chọn mức độ hài lòng bằng sao từ 1 đến 5.
- Hệ thống cho phép nhập bình luận tối đa 500 ký tự.
- Sau khi gửi, hệ thống hiển thị thông báo thành công.
- Điểm sao trung bình của template được cập nhật.

## 8.12. Đăng ký

- Form đăng ký có đủ tên người dùng, email, mật khẩu và nhập lại mật khẩu.
- Hệ thống kiểm tra email sai định dạng, email đã tồn tại và mật khẩu xác nhận không khớp.
- Sau khi đăng ký thành công, user được lưu vào bảng User.
- Sau khi đăng ký, hệ thống tự động đăng nhập hoặc chuyển sang trang đăng nhập.
- Nếu yêu cầu xác nhận email, hệ thống gửi email xác nhận.
- Khách có thể đăng ký bằng Google hoặc Facebook.

## 8.13. Cập nhật hồ sơ

- Người dùng có thể thay đổi tên hiển thị, số điện thoại, avatar và mật khẩu.
- Hệ thống xác thực mật khẩu cũ trước khi cho phép đổi mật khẩu mới.
- Các thay đổi được cập nhật ngay trên giao diện, ví dụ avatar ở header cũng thay đổi.

---

## 9. Gợi ý phân lớp service khi triển khai

| Service | Trách nhiệm |
|---|---|
| AuthService | Đăng nhập, đăng ký, social login, quản lý session/token. |
| UserService | Cập nhật hồ sơ, avatar, số điện thoại, đổi mật khẩu. |
| TemplateService | Tạo, chỉnh sửa, lấy chi tiết, tải xuống, quản lý template. |
| SearchService | Tìm kiếm template theo keyword, category, quyền truy cập. |
| SlideEditorService | Quản lý slide, canvas element, thứ tự slide, layout, preview. |
| AIContentService | Nhận prompt, gọi AI, lưu/trả kết quả sinh nội dung. |
| ImageSearchService | Gọi API tìm kiếm ảnh và chèn ảnh vào slide. |
| QuizService | Tạo quiz, validate câu hỏi, lưu câu hỏi/đáp án. |
| SharingService | Tạo link chia sẻ, quản lý quyền, bật/tắt chia sẻ, thu hồi quyền. |
| ReviewService | Lưu rating/comment và cập nhật điểm trung bình template. |
| LibraryService | Lưu template vào thư viện, xóa khỏi thư viện, đồng bộ danh sách đã lưu. |

---

## 10. Ghi chú triển khai

- Các thao tác cần kiểm tra quyền truy cập trước khi thực thi: chỉnh sửa template, chia sẻ, quản lý quyền, lưu vào thư viện, đánh giá, cập nhật hồ sơ.
- Các màn hình dùng chung header cần thống nhất logic: logo về home, search bằng Enter, đổi ngôn ngữ, user menu hoặc login/register tùy role.
- Với dữ liệu slide/canvas, nên lưu cấu trúc dạng JSON để dễ render lại, chỉnh sửa, kéo thả và export.
- Với chia sẻ, nên tách quyền theo `owner`, `viewer`, `editor` hoặc các mức tương đương.
- Với review, nên lưu từng đánh giá riêng và tính lại rating trung bình theo template.
- Với quiz, nên tách bảng câu hỏi và bảng lựa chọn để hỗ trợ nhiều loại câu hỏi sau này.
