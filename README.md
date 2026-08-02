# VocabReminder

VocabReminder là ứng dụng hỗ trợ học từ vựng tiếng Anh được phát triển bằng Java. Ứng dụng giúp người dùng lưu trữ, quản lý và ôn tập từ vựng thông qua hệ thống nhắc nhở định kỳ, góp phần hình thành thói quen học tập và cải thiện khả năng ghi nhớ.

## Giới thiệu

Việc học từ vựng thường gặp khó khăn do người học không duy trì được việc ôn tập thường xuyên. VocabReminder được xây dựng nhằm giải quyết vấn đề này bằng cách cho phép người dùng lưu trữ từ vựng cá nhân và nhận thông báo nhắc ôn tập theo thời gian đã cài đặt.

## Chức năng

* Quản lý danh sách từ vựng.
* Thêm, sửa và xóa từ vựng.
* Tìm kiếm từ vựng theo từ khóa.
* Lưu nghĩa và ví dụ minh họa.
* Nhắc nhở ôn tập theo lịch.
* Lưu trữ dữ liệu bằng MySQL.

## Công nghệ sử dụng

* Java
* Java Swing
* JDBC
* MySQL
* Maven

## Cấu trúc dự án

```text
VocabReminder/
├── src/
│   ├── dao/
│   ├── model/
│   ├── service/
│   ├── ui/
│   └── utils/
├── database/
├── resources/
└── pom.xml
```

## Hướng dẫn cài đặt

### Clone dự án

```bash
git clone https://github.com/atuanndev/VocabReminder.git
```

### Cài đặt môi trường

Yêu cầu:

* Java JDK 17 trở lên
* Maven
* MySQL

### Cấu hình cơ sở dữ liệu

1. Tạo cơ sở dữ liệu trong MySQL.
2. Import file SQL của dự án (nếu có).
3. Cập nhật thông tin kết nối trong file cấu hình.

### Chạy chương trình

```bash
mvn clean install
mvn exec:java
```

Hoặc mở dự án bằng IntelliJ IDEA/Eclipse và chạy lớp `Main`.

## Hình ảnh minh họa

Có thể bổ sung ảnh giao diện vào thư mục `screenshots` và hiển thị trong README.

```md
## Giao diện chính

![Home](screenshots/home.png)

## Thêm từ vựng

![Add Word](screenshots/add-word.png)
```

## Hướng phát triển

* Đăng nhập và quản lý tài khoản.
* Phân loại từ vựng theo chủ đề.
* Hỗ trợ phát âm.
* Ôn tập theo phương pháp Spaced Repetition (SRS).
* Thống kê quá trình học.
* Đồng bộ dữ liệu trực tuyến.

## Tác giả

**Bùi Anh Tuấn**

GitHub: https://github.com/atuanndev/VocabReminder

## Giấy phép

Dự án được phát hành theo giấy phép MIT.
