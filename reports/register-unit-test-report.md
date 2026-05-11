# Báo cáo Unit Test Chức Năng Đăng Ký

## 1.1. Tools and Libraries

- Framework kiểm thử: `Jest`
- Bộ chuyển đổi TypeScript cho Jest: `ts-jest`
- Môi trường test: `jest-environment-jsdom`
- Cơ chế mock: `jest.mock(...)`, `jest.fn()`, `jest.spyOn(...)`
- Thư viện hỗ trợ trong file setup: `@testing-library/jest-dom`

## 1.2. Scope of Testing

### Các hàm, class, tệp được kiểm thử

- [src/lib/validators/auth.ts](d:/library-management-system-main/library-management-system-main/src/lib/validators/auth.ts:50)
  - Hàm `validateRegister(form)`
- [src/services/auth.service.ts](d:/library-management-system-main/library-management-system-main/src/services/auth.service.ts:18)
  - Hàm `AuthService.register(userData)`
- [tests/unit/register.validators.test.ts](d:/library-management-system-main/library-management-system-main/tests/unit/register.validators.test.ts:1)
  - Chứa các test case `UT_REG_01` đến `UT_REG_05`
- [tests/unit/auth.service.register.test.ts](d:/library-management-system-main/library-management-system-main/tests/unit/auth.service.register.test.ts:1)
  - Chứa các test case `UT_REG_06` đến `UT_REG_12`

### Các hàm, class, tệp không kiểm thử trong phạm vi này

- [src/lib/validators/auth.ts](d:/library-management-system-main/library-management-system-main/src/lib/validators/auth.ts:13)
  - Hàm `validateLogin(form)`
  - Lý do: thuộc chức năng đăng nhập, không thuộc phạm vi đăng ký.
- [src/services/auth.service.ts](d:/library-management-system-main/library-management-system-main/src/services/auth.service.ts:119)
  - Hàm `AuthService.login(credentials)`
  - Lý do: thuộc luồng đăng nhập, đã được tách sang gói test khác.
- [src/services/auth.service.ts](d:/library-management-system-main/library-management-system-main/src/services/auth.service.ts:202)
  - Hàm `refreshAccessToken(refreshToken)`
  - Lý do: không thuộc phạm vi đăng ký tài khoản.
- [src/services/auth.service.ts](d:/library-management-system-main/library-management-system-main/src/services/auth.service.ts:248)
  - Hàm `logout(refreshToken)` và `logoutAll(userId)`
  - Lý do: không liên quan đến luồng đăng ký.
- [src/services/auth.service.ts](d:/library-management-system-main/library-management-system-main/src/services/auth.service.ts:265)
  - Hàm `changePassword(userId, passwordData)`
  - Lý do: là chức năng độc lập với đăng ký.
- [src/app/api/auth/register/route.ts](d:/library-management-system-main/library-management-system-main/src/app/api/auth/register/route.ts:1)
  - Lý do: báo cáo này tập trung vào unit test cho validator và service, không phải integration test cho API route.
- Cơ sở dữ liệu thật, `bcrypt`, và hệ thống Gorse thật
  - Lý do: các thành phần này đã được mock để bảo đảm unit test chạy độc lập, ổn định và nhanh.

## 1.3. Bảng Unit Test Cases

- Tổng số test case trong phạm vi báo cáo: `12`
- Kết quả hiện tại: `8 pass`, `4 fail`
- Các test fail hiện được giữ lại để chứng minh lỗi còn tồn tại trong code theo yêu cầu báo cáo.

### Tệp: [tests/unit/register.validators.test.ts](d:/library-management-system-main/library-management-system-main/tests/unit/register.validators.test.ts:1)

| Mã Test Case | Mục tiêu kiểm thử | Dữ liệu đầu vào | Kết quả mong đợi | Ghi chú |
|---|---|---|---|---|
| `UT_REG_01` | Kiểm tra validator báo lỗi khi bỏ trống toàn bộ trường bắt buộc | `{ fullName: '', email: '', password: '', confirmPassword: '' }` | `firstError` khác `null`; các lỗi `fullName`, `email`, `password`, `confirmPassword` đều xuất hiện | Chỉ kiểm thử validator, không truy cập DB |
| `UT_REG_02` | Kiểm tra validator báo lỗi khi email sai định dạng | `{ fullName: 'Admin User', email: 'admin@.com', password: 'Password@123', confirmPassword: 'Password@123' }` | `errors.email` được tạo; `firstError` khác `null` | Chỉ kiểm thử validator, không truy cập DB |
| `UT_REG_03` | Kiểm tra validator báo lỗi khi mật khẩu xác nhận không khớp | `{ fullName: 'Admin User', email: 'admin@example.com', password: 'Password@123', confirmPassword: 'Password@456' }` | `errors.confirmPassword = 'Passwords do not match'` | Chỉ kiểm thử validator, không truy cập DB |
| `UT_REG_04` | Kiểm tra validator phải chặn mật khẩu yếu ngay từ phía người dùng | `{ fullName: 'Reader User', email: 'reader@gmail.com', password: '123', confirmPassword: '123' }` | `errors.password` phải được tạo | Test này hiện **fail** vì code validator chưa kiểm tra độ mạnh mật khẩu |
| `UT_REG_05` | Kiểm tra validator phải chặn số điện thoại sai định dạng | `{ fullName: 'Reader User', email: 'reader@gmail.com', password: 'Password@123', confirmPassword: 'Password@123', phoneNumber: 'abc' }` | `errors.phoneNumber` phải được tạo | Test này hiện **fail** vì code validator chưa kiểm tra `phoneNumber` |

### Tệp: [tests/unit/auth.service.register.test.ts](d:/library-management-system-main/library-management-system-main/tests/unit/auth.service.register.test.ts:1)

| Mã Test Case | Mục tiêu kiểm thử | Dữ liệu đầu vào | Kết quả mong đợi | Ghi chú |
|---|---|---|---|---|
| `UT_REG_06` | Kiểm tra service chặn đăng ký khi dữ liệu không hợp lệ ở mức nghiệp vụ | Họ tên không hợp lệ, email sai, mật khẩu yếu, xác nhận mật khẩu sai, số điện thoại sai | Ném ra `ValidationError` chứa danh sách lỗi | CheckDB: không được gọi `prisma.user.findUnique`, `prisma.user.create`; Rollback: không có thay đổi DB thật vì đang mock |
| `UT_REG_07` | Kiểm tra service chặn đăng ký khi email đã tồn tại | Payload hợp lệ nhưng email đã có trong DB | Ném ra `ConflictError('Email already registered')` | CheckDB: có gọi `prisma.user.findUnique`, không gọi `prisma.user.create`; Rollback: không có ghi DB |
| `UT_REG_08` | Kiểm tra service tạo tài khoản thành công với dữ liệu hợp lệ | Payload đăng ký hợp lệ | Trả về user vừa tạo và thông báo thành công | CheckDB: xác minh dữ liệu đã sanitize, password đã hash, role `READER`, status `ACTIVE` được truyền vào `prisma.user.create` |
| `UT_REG_09` | Kiểm tra service đồng bộ tài khoản mới sang Gorse sau khi đăng ký thành công | Payload đăng ký hợp lệ | Gọi `GorseService.createUserPayload` và `GorseService.insertUser` | Hệ thống ngoài được mock |
| `UT_REG_10` | Kiểm tra service vẫn đăng ký thành công khi đồng bộ Gorse bị lỗi | Payload hợp lệ nhưng `GorseService.insertUser` ném lỗi | Vẫn trả về kết quả đăng ký thành công | CheckDB: user vẫn được tạo thành công |
| `UT_REG_11` | Kiểm tra service phải trim email trước khi validate định dạng | Email đầu vào là `'  reader@gmail.com  '` và các trường còn lại hợp lệ | Đăng ký thành công, DB lookup dùng email đã chuẩn hóa là `reader@gmail.com` | Test này hiện **fail** vì code đang validate email trước khi normalize |
| `UT_REG_12` | Kiểm tra service phải lưu `phoneNumber` và `address` toàn khoảng trắng thành `null` | `phoneNumber = '   '`, `address = '   '` | `prisma.user.create` nhận `phoneNumber = null`, `address = null` | Test này hiện **fail** vì code đang lưu chuỗi rỗng `''` |

## 1.4. Project Link

- URL GitHub của unit test script: `Chưa xác định trong workspace hiện tại`
- Ghi chú: workspace hiện tại không chứa metadata `.git` hoặc remote URL, nên cần tự điền link GitHub repo thật trước khi nộp.

## 1.5. Execution Report

### Lệnh thực thi

```powershell
yarn jest tests/unit/register.validators.test.ts tests/unit/auth.service.register.test.ts --runInBand
```

### Kết quả thực thi

- Tổng số test suite: `2`
- Số test suite pass: `0`
- Số test suite fail: `2`
- Tổng số test case: `12`
- Số test case pass: `8`
- Số test case fail: `4`
- Tỷ lệ pass: `66.67%`

### Các test case đang fail

- `UT_REG_04`: validator chưa kiểm tra độ mạnh mật khẩu
- `UT_REG_05`: validator chưa kiểm tra định dạng số điện thoại
- `UT_REG_11`: service validate email trước khi normalize
- `UT_REG_12`: service lưu trường optional toàn khoảng trắng thành chuỗi rỗng thay vì `null`

### Bằng chứng thực thi

- Log thực thi: [reports/register-test-execution.txt](d:/library-management-system-main/library-management-system-main/reports/register-test-execution.txt:1)
- Ảnh chụp màn hình nên chụp:
  - Terminal hiển thị `Tests: 4 failed, 8 passed, 12 total`
  - Terminal hiển thị chi tiết 4 lỗi fail

### Tiêu chí đánh giá Pass/Fail

- `Pass`: kết quả thực tế trùng với kết quả mong đợi của test case
- `Fail`: kết quả thực tế khác kết quả mong đợi, ném sai lỗi, hoặc xử lý DB không đúng như yêu cầu

## 1.6. Code Coverage Report

### Lệnh đo coverage

```powershell
yarn jest tests/unit/register.validators.test.ts tests/unit/auth.service.register.test.ts --runInBand --coverage --collectCoverageFrom=src/lib/validators/auth.ts --collectCoverageFrom=src/services/auth.service.ts
```

### Kết quả coverage

| Tệp | Statements | Branches | Functions | Lines |
|---|---:|---:|---:|---:|
| `src/lib/validators/auth.ts` | `65.71%` | `68.00%` | `50.00%` | `63.33%` |
| `src/services/auth.service.ts` | `39.13%` | `29.50%` | `14.28%` | `39.13%` |
| `Tổng phạm vi register` | `46.45%` | `40.69%` | `22.22%` | `45.08%` |

### Phần chưa được bao phủ

- `src/lib/validators/auth.ts`
  - Nhánh `validateLogin(...)` chưa thuộc phạm vi đo coverage của báo cáo đăng ký
- `src/services/auth.service.ts`
  - Các hàm `login`, `refreshAccessToken`, `logout`, `changePassword`, `cleanupExpiredTokens` chưa nằm trong phạm vi kiểm thử này

### Bằng chứng coverage

- Log coverage: [reports/register-coverage.txt](d:/library-management-system-main/library-management-system-main/reports/register-coverage.txt:1)
- Ảnh chụp màn hình nên chụp:
  - Terminal hiển thị bảng coverage
  - Nếu có HTML report thì chụp từ `coverage/lcov-report/index.html`

## 1.7. Tài liệu tham khảo và danh sách prompt đã dùng

### Tài liệu tham khảo

- Tài liệu do người dùng cung cấp:
  - `https://drive.google.com/file/d/1mcGQTYDVWEl2mBprHM6fjk6zQ99kHnCE/view`
- Tài liệu Jest chính thức:
  - `https://jestjs.io/`
- Tài liệu ts-jest:
  - `https://kulshekhar.github.io/ts-jest/docs/`

### Danh sách prompt đã dùng

1. `ok ngon bây giờ bạn làm test giống thế với chức năng đăng kí ...`
2. `mục 1.3 viết cho tôi thành bảng nhé`
3. `tạo ra những cái test case mà code của tôi chạy false ( lỗi đấy)`
4. `ko cách 2 và 1.3 từ 1-12`
5. `ui bạn ơi phải viết bằng viết tiếng việt`
6. `viết lại cho tôi file test case để phù hợp với 12 cái test này với 8 pass 4 fail`

## Ghi chú về CheckDB và Rollback

- Đây là bộ `unit test`, không phải `integration test`
- `CheckDB` được thực hiện bằng cách xác minh các lời gọi mock của Prisma như:
  - `prisma.user.findUnique`
  - `prisma.user.create`
- `Rollback` được xử lý ở mức unit test bằng cách:
  - không ghi vào cơ sở dữ liệu thật
  - mock toàn bộ thao tác ghi DB
  - reset mock bằng `jest.clearAllMocks()` và `jest.restoreAllMocks()`
- Nếu giảng viên yêu cầu rollback trên DB thật thì cần làm một bộ integration test riêng với transaction hoặc test database riêng
