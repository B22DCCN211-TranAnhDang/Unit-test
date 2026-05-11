# Báo cáo Unit Test Chức Năng Cập Nhật Thông Tin Cá Nhân

## 1.1. Tools and Libraries

- Framework kiểm thử: `Jest`
- Bộ chuyển đổi TypeScript cho Jest: `ts-jest`
- Môi trường test: `jest-environment-jsdom`
- Thư viện hỗ trợ test hook/component: `@testing-library/react`
- Cơ chế mock: `jest.mock(...)`, `jest.fn()`
- Thư viện hỗ trợ assertion DOM: `@testing-library/jest-dom`

## 1.2. Scope of Testing

### Các hàm, class, tệp được kiểm thử

- [src/lib/hooks/useProfileForm.ts](/d:/library-management-system-main/library-management-system-main/src/lib/hooks/useProfileForm.ts:1)
  - Hook `useProfileForm()`
- [src/app/api/auth/me/route.ts](/d:/library-management-system-main/library-management-system-main/src/app/api/auth/me/route.ts:1)
  - Hàm `PUT(request)` cho chức năng cập nhật hồ sơ cá nhân
- [tests/unit/profile.form.test.tsx](/d:/library-management-system-main/library-management-system-main/tests/unit/profile.form.test.tsx:1)
  - Chứa các test case `UT_EP_01` đến `UT_EP_06`
- [tests/unit/profile.route.test.ts](/d:/library-management-system-main/library-management-system-main/tests/unit/profile.route.test.ts:1)
  - Chứa các test case `UT_EP_07` đến `UT_EP_11`

### Các hàm, class, tệp không kiểm thử trong phạm vi này

- [src/app/dashboard/profile/page.tsx](/d:/library-management-system-main/library-management-system-main/src/app/dashboard/profile/page.tsx:1)
  - Lý do: phần lớn logic đã được tách vào `useProfileForm`, nên unit test tập trung vào hook và route để dễ cô lập hành vi.
- [src/api/auth.api.ts](/d:/library-management-system-main/library-management-system-main/src/api/auth.api.ts:1)
  - Lý do: được mock trong hook test để giữ phạm vi là unit test.
- [src/services/user.service.ts](/d:/library-management-system-main/library-management-system-main/src/services/user.service.ts:1)
  - Lý do: được mock trong route test để không phụ thuộc DB thật.
- Hệ thống file thật, avatar thật, cơ sở dữ liệu thật
  - Lý do: đều được mock để bảo đảm test chạy nhanh, độc lập và có thể lặp lại.

## 1.3. Unit Test Cases

- Tổng số test case trong phạm vi báo cáo: `11`
- Kết quả hiện tại: `8 pass`, `3 fail`
- Bảng dưới đây được viết theo dạng TSV để có thể copy trực tiếp vào Excel.

```tsv
Mã Test Case	Mục tiêu kiểm thử	Dữ liệu đầu vào	Kết quả mong đợi	Ghi chú
UT_EP_01	Kiểm tra hook khởi tạo dữ liệu form từ thông tin người dùng hiện tại	User hiện tại có fullName = 'Kurenai Shu', email = 'kurenai@example.com', phoneNumber = '0123456789', address = 'Hanoi'	formData được đổ đúng từ user và isEditMode = false	Kết quả hiện tại: Pass. Chỉ kiểm thử hook, không truy cập DB
UT_EP_02	Kiểm tra nút Cancel khôi phục lại dữ liệu gốc và xóa trạng thái avatar tạm	Đang chỉnh sửa, đổi fullName, phoneNumber và gọi handleRemoveAvatar sau đó Cancel	Dữ liệu quay lại giá trị ban đầu của user, avatarPreview = null, avatarRemoved = false	Kết quả hiện tại: Pass. CheckDB: không áp dụng
UT_EP_03	Kiểm tra hook chặn upload avatar sai định dạng	File avatar = tai_lieu.pdf, type = application/pdf	Hiển thị toaster lỗi Invalid file type và không tạo preview avatar	Kết quả hiện tại: Pass. CheckDB: không áp dụng
UT_EP_04	Kiểm tra hook phải chặn lưu khi họ tên chỉ gồm khoảng trắng	fullName = '   '	Không được gọi AuthApi.updateMe, hiển thị lỗi Full name is required	Kết quả hiện tại: Fail. Hook hiện tại vẫn gọi API với fullName chỉ có khoảng trắng
UT_EP_05	Kiểm tra lưu hồ sơ thành công sẽ cập nhật cache và thoát chế độ chỉnh sửa	fullName = 'Kurenai Pro', phoneNumber = '0999999999', address = 'Da Nang'	Gọi AuthApi.updateMe với dữ liệu mới, cập nhật query cache, isEditMode = false	Kết quả hiện tại: Pass. API được mock
UT_EP_06	Kiểm tra thao tác xóa avatar trên form	handleRemoveAvatar()	avatarRemoved = true và avatarPreview bị xóa	Kết quả hiện tại: Pass. CheckDB: không áp dụng
UT_EP_07	Kiểm tra API route từ chối request không phải multipart/form-data	Content-Type = application/json	Route trả về lỗi Content-Type must be multipart/form-data	Kết quả hiện tại: Pass. CheckDB: không có cập nhật DB
UT_EP_08	Kiểm tra API route xóa avatar cũ và cập nhật avatarUrl = null	fullName = 'Kurenai Pro', removeAvatar = true, user hiện có avatar cũ	Gọi FileUtils.deleteFileFromSystem, sau đó UserService.updateUser với avatarUrl = null	Kết quả hiện tại: Pass. CheckDB: xác minh đúng dữ liệu cập nhật; Rollback: file system và DB đều mock
UT_EP_09	Kiểm tra API route phải từ chối họ tên chỉ gồm khoảng trắng	fullName = '   '	Route phải trả lỗi Full name is required và không gọi UserService.updateUser	Kết quả hiện tại: Fail. Route hiện tại chỉ kiểm tra !fullName nên chuỗi khoảng trắng vẫn lọt qua
UT_EP_10	Kiểm tra API route phải chặn file giả ảnh nhưng MIME type không phải image	fullName = 'Kurenai Pro', avatar = file avatar.jpg có type application/pdf	Route phải báo lỗi kiểu file không hợp lệ và không ghi file lên hệ thống	Kết quả hiện tại: Fail. Route hiện tại chỉ kiểm tra extension nên file .jpg giả vẫn có thể đi tiếp
UT_EP_11	Kiểm tra API route upload avatar hợp lệ thành công	fullName = 'Kurenai Pro', phoneNumber = '0123456789', address = 'Hanoi', avatar = avatar.png type image/png	Gọi FileUtils.writeFileToSystem, xóa avatar cũ, cập nhật avatarUrl mới qua UserService.updateUser	Kết quả hiện tại: Pass. CheckDB: xác minh đúng avatarUrl mới; Rollback: file system và DB đều mock
```

## 1.4. Project Link

- URL GitHub của unit test script: `Chưa xác định trong workspace hiện tại`
- Ghi chú: workspace hiện tại không chứa metadata `.git` hoặc remote URL, nên cần tự điền link GitHub repo thật trước khi nộp.

## 1.5. Execution Report

### Lệnh thực thi

```powershell
yarn jest tests/unit/profile.form.test.tsx tests/unit/profile.route.test.ts --runInBand
```

### Kết quả thực thi

- Tổng số test suite: `2`
- Số test suite pass: `0`
- Số test suite fail: `2`
- Tổng số test case: `11`
- Số test case pass: `8`
- Số test case fail: `3`
- Tỷ lệ pass: `72.73%`

### Các test case đang fail

- `UT_EP_04`: hook vẫn cho phép gọi API khi `fullName` chỉ có khoảng trắng
- `UT_EP_09`: route chưa trim `fullName` trước khi validate nên vẫn chấp nhận chuỗi khoảng trắng
- `UT_EP_10`: route chỉ kiểm tra extension file, chưa kiểm tra MIME type ảnh thật

### Bằng chứng thực thi

- Log thực thi: [reports/profile-test-execution.txt](/d:/library-management-system-main/library-management-system-main/reports/profile-test-execution.txt:1)
- Ảnh chụp màn hình nên chụp:
  - Terminal hiển thị `Tests: 3 failed, 8 passed, 11 total`
  - Terminal hiển thị chi tiết 3 lỗi fail

### Tiêu chí đánh giá Pass/Fail

- `Pass`: kết quả thực tế trùng với kết quả mong đợi của test case
- `Fail`: kết quả thực tế khác kết quả mong đợi, xử lý validation sai, hoặc thao tác DB/file không đúng yêu cầu

## 1.6. Code Coverage Report

### Lệnh đo coverage

```powershell
yarn jest tests/unit/profile.form.test.tsx tests/unit/profile.route.test.ts --runInBand --coverage --collectCoverageFrom=src/lib/hooks/useProfileForm.ts --collectCoverageFrom=src/app/api/auth/me/route.ts
```

### Kết quả coverage

| Tệp | Statements | Branches | Functions | Lines |
|---|---:|---:|---:|---:|
| `src/app/api/auth/me/route.ts` | `84.90%` | `81.81%` | `50.00%` | `84.90%` |
| `src/lib/hooks/useProfileForm.ts` | `72.50%` | `38.63%` | `76.92%` | `72.72%` |
| `Tổng phạm vi edit profile` | `77.44%` | `60.22%` | `73.33%` | `77.69%` |

### Phần chưa được bao phủ

- `src/lib/hooks/useProfileForm.ts`
  - Một số nhánh lỗi như file quá lớn, save thất bại do API trả lỗi, handleAvatarClick, và một phần preview avatar chưa được phủ hết.
- `src/app/api/auth/me/route.ts`
  - Một số nhánh lỗi như file quá lớn, lỗi ghi file, và một số nhánh GET chưa nằm trong phạm vi test này.

### Bằng chứng coverage

- Log coverage: [reports/profile-coverage.txt](/d:/library-management-system-main/library-management-system-main/reports/profile-coverage.txt:1)
- Ảnh chụp màn hình nên chụp:
  - Terminal hiển thị bảng coverage
  - Nếu có HTML report thì chụp từ thư mục `coverage`

## 1.7. Tài liệu tham khảo và danh sách prompt đã dùng

### Tài liệu tham khảo

- Mẫu test case chức năng `Cập nhật thông tin cá nhân (Edit Profile)` do người dùng cung cấp
- Tài liệu Jest chính thức:
  - `https://jestjs.io/`
- Tài liệu Testing Library:
  - `https://testing-library.com/docs/react-testing-library/intro/`

### Danh sách prompt đã dùng

1. `tiếp chức năng này đi 1.3 viết dạng excel nhá`

## Ghi chú về CheckDB và Rollback

- Đây là bộ `unit test`, không phải `integration test`
- `CheckDB` được thực hiện bằng cách xác minh các lời gọi mock như:
  - `AuthApi.updateMe`
  - `UserService.updateUser`
  - `FileUtils.writeFileToSystem`
  - `FileUtils.deleteFileFromSystem`
- `Rollback` được xử lý ở mức unit test bằng cách:
  - không ghi vào cơ sở dữ liệu thật
  - không ghi file thật
  - mock toàn bộ thao tác DB và file system
  - reset mock bằng `jest.clearAllMocks()` trước mỗi test
