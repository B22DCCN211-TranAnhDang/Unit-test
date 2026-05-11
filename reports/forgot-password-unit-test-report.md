# Báo cáo Unit Test Chức Năng Quên Mật Khẩu

## 1.1. Tools and Libraries

- Framework kiểm thử: `Jest`
- Bộ chuyển đổi TypeScript cho Jest: `ts-jest`
- Môi trường test: `jest-environment-jsdom`
- Thư viện hỗ trợ render component: `@testing-library/react`
- Cơ chế mock: `jest.mock(...)`, `jest.fn()`
- Thư viện hỗ trợ assertion DOM: `@testing-library/jest-dom`

## 1.2. Scope of Testing

### Các hàm, class, tệp được kiểm thử

- [src/app/(auth)/forgot-password/page.tsx](</d:/library-management-system-main/library-management-system-main/src/app/(auth)/forgot-password/page.tsx:1>)
  - Component `ForgotPasswordPage`
  - Bao gồm các bước:
    - gửi OTP bằng email
    - xác thực OTP
    - đặt lại mật khẩu
- [src/app/api/otp/send/route.ts](/d:/library-management-system-main/library-management-system-main/src/app/api/otp/send/route.ts:1)
  - Hàm `POST(request)` cho chức năng gửi OTP quên mật khẩu
- [src/app/api/auth/reset-password/route.ts](/d:/library-management-system-main/library-management-system-main/src/app/api/auth/reset-password/route.ts:1)
  - Hàm `POST(request)` cho chức năng đặt lại mật khẩu sau khi đã xác thực OTP
- [tests/unit/forgot-password.page.test.tsx](/d:/library-management-system-main/library-management-system-main/tests/unit/forgot-password.page.test.tsx:1)
  - Chứa các test case `UT_FP_01` đến `UT_FP_07`
- [tests/unit/forgot-password.routes.test.ts](/d:/library-management-system-main/library-management-system-main/tests/unit/forgot-password.routes.test.ts:1)
  - Chứa các test case `UT_FP_08` đến `UT_FP_12`

### Các hàm, class, tệp không kiểm thử trong phạm vi này

- [src/app/api/otp/verify/forgot-password/route.ts](/d:/library-management-system-main/library-management-system-main/src/app/api/otp/verify/forgot-password/route.ts:1)
  - Lý do: báo cáo này tập trung vào bước gửi OTP và đặt lại mật khẩu; verify route chưa được tách thành bộ test riêng trong phạm vi hiện tại.
- [src/api/otp.api.ts](/d:/library-management-system-main/library-management-system-main/src/api/otp.api.ts:1)
  - Lý do: các lời gọi client API đã được mock trong page test để giữ phạm vi là unit test cho UI logic.
- [src/api/password.api.ts](/d:/library-management-system-main/library-management-system-main/src/api/password.api.ts:1)
  - Lý do: được mock ở mức component test, không kiểm thử như integration test.
- [src/services/otp.service.ts](/d:/library-management-system-main/library-management-system-main/src/services/otp.service.ts:1)
  - Lý do: service thật được mock khi test API route để tránh phụ thuộc DB và email queue.
- Hệ thống email thật, DB thật, Prisma thật
  - Lý do: tất cả đều được mock để bảo đảm test chạy nhanh, độc lập và có thể lặp lại.

## 1.3. Bảng Unit Test Cases

- Tổng số test case trong phạm vi báo cáo: `12`
- Kết quả hiện tại: `8 pass`, `4 fail`
- Các test fail được giữ nguyên trong cùng bảng test case để chứng minh hệ thống hiện vẫn còn lỗi cần phát hiện.

### Tệp: [tests/unit/forgot-password.page.test.tsx](/d:/library-management-system-main/library-management-system-main/tests/unit/forgot-password.page.test.tsx:1)

| Mã Test Case | Mục tiêu kiểm thử | Dữ liệu đầu vào | Kết quả mong đợi | Ghi chú |
|---|---|---|---|---|
| `UT_FP_01` | Kiểm tra giao diện mặc định của màn hình quên mật khẩu ở bước 1 | Render trang lần đầu | Hiển thị tiêu đề, mô tả bước 1, ô nhập email và nút `Send OTP Code` | Kết quả hiện tại: `Pass`. Chỉ kiểm thử UI, không truy cập DB |
| `UT_FP_02` | Kiểm tra bước 1 chặn gửi OTP khi email để trống | `email = ''`, nhấn `Send OTP Code` | Hiển thị lỗi `Email is required`, không gọi API gửi OTP | Kết quả hiện tại: `Pass`. CheckDB: không áp dụng |
| `UT_FP_03` | Kiểm tra bước 1 chặn email sai định dạng | `email = 'reader@.com'` | Hiển thị lỗi `Invalid email format`, không gọi API gửi OTP | Kết quả hiện tại: `Pass`. CheckDB: không áp dụng |
| `UT_FP_04` | Kiểm tra gửi OTP thành công và chuyển sang bước 2 | `email = 'reader@gmail.com'` | Gọi `OTPApi.sendOTPForPasswordReset`, hiển thị UI bước nhập OTP | Kết quả hiện tại: `Pass`. API ngoài được mock |
| `UT_FP_05` | Kiểm tra hoàn tất luồng quên mật khẩu thành công | `email = 'reader@gmail.com'`, `otp = '123456'`, `newPassword = 'Password@123'`, `confirmPassword = 'Password@123'` | Xác thực OTP thành công, gọi `PasswordApi.resetPassword`, sau đó điều hướng về trang login | Kết quả hiện tại: `Pass`. API ngoài được mock |
| `UT_FP_06` | Kiểm tra email có khoảng trắng đầu/cuối vẫn phải được trim trước khi validate và gửi OTP | `email = '  reader@gmail.com  '` | Vẫn gửi OTP thành công với email chuẩn hóa `reader@gmail.com` và chuyển sang bước 2 | Kết quả hiện tại: `Fail`. Code hiện tại validate email trước khi trim nên không qua bước 1 |
| `UT_FP_07` | Kiểm tra bước đặt lại mật khẩu phải chặn mật khẩu yếu theo đúng hướng dẫn UI | `newPassword = 'abcdefgh'`, `confirmPassword = 'abcdefgh'` | Không gọi `PasswordApi.resetPassword`, hiển thị lỗi về độ mạnh mật khẩu | Kết quả hiện tại: `Fail`. Code hiện tại chỉ kiểm tra độ dài tối thiểu 8 ký tự |

### Tệp: [tests/unit/forgot-password.routes.test.ts](/d:/library-management-system-main/library-management-system-main/tests/unit/forgot-password.routes.test.ts:1)

| Mã Test Case | Mục tiêu kiểm thử | Dữ liệu đầu vào | Kết quả mong đợi | Ghi chú |
|---|---|---|---|---|
| `UT_FP_08` | Kiểm tra API route gửi OTP xử lý thành công với email hợp lệ | `{ type: 'PASSWORD_RESET', email: 'reader@gmail.com' }` | Gọi `OTPService.sendOTPEmail` và trả về response thành công có `expiresIn` | Kết quả hiện tại: `Pass`. CheckDB: không áp dụng |
| `UT_FP_09` | Kiểm tra API route reset password cập nhật mật khẩu thành công sau khi OTP đã xác thực | `{ email: 'reader@gmail.com', newPassword: 'Password@123' }` | Gọi `prisma.user.findUnique`, `prisma.user.update`, `OTPService.invalidateOTPs` và trả về response thành công | Kết quả hiện tại: `Pass`. CheckDB: xác minh đúng lời gọi đọc/cập nhật DB; Rollback: DB đang mock |
| `UT_FP_10` | Kiểm tra API route reset password chặn thao tác khi chưa có OTP hợp lệ gần đây | `{ email: 'reader@gmail.com', newPassword: 'Password@123' }`, `hasRecentVerifiedOTP = false` | Trả về lỗi qua `handleRouteError`, không cập nhật mật khẩu trong DB | Kết quả hiện tại: `Pass`. CheckDB: `prisma.user.update` không được gọi |
| `UT_FP_11` | Kiểm tra API route gửi OTP phải chuẩn hóa email trước khi validate | `{ type: 'PASSWORD_RESET', email: '  reader@gmail.com  ' }` | Vẫn gửi OTP thành công với email chuẩn hóa `reader@gmail.com` | Kết quả hiện tại: `Fail`. Route hiện tại validate email trước khi chuẩn hóa nên không gọi `OTPService.sendOTPEmail` |
| `UT_FP_12` | Kiểm tra API route reset password phải chuẩn hóa email trước khi validate và tra cứu DB | `{ email: '  reader@gmail.com  ', newPassword: 'Password@123' }` | `prisma.user.findUnique` phải nhận email `reader@gmail.com` và reset password thành công | Kết quả hiện tại: `Fail`. Route hiện tại validate email trước khi normalize nên dừng sớm |

## 1.4. Project Link

- URL GitHub của unit test script: `Chưa xác định trong workspace hiện tại`
- Ghi chú: workspace hiện tại không chứa metadata `.git` hoặc remote URL, nên cần tự điền link GitHub repo thật trước khi nộp.

## 1.5. Execution Report

### Lệnh thực thi

```powershell
yarn jest tests/unit/forgot-password.page.test.tsx tests/unit/forgot-password.routes.test.ts --runInBand
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

- `UT_FP_06`: component quên mật khẩu chưa trim email trước khi validate ở bước gửi OTP
- `UT_FP_07`: bước reset password trên UI chưa kiểm tra đủ độ mạnh mật khẩu theo mô tả hiển thị
- `UT_FP_11`: API route gửi OTP chưa normalize email trước khi validate
- `UT_FP_12`: API route reset password chưa normalize email trước khi validate và tra cứu DB

### Bằng chứng thực thi

- Log thực thi: [reports/forgot-password-test-execution.txt](/d:/library-management-system-main/library-management-system-main/reports/forgot-password-test-execution.txt:1)
- Ảnh chụp màn hình nên chụp:
  - Terminal hiển thị `Tests: 4 failed, 8 passed, 12 total`
  - Terminal hiển thị chi tiết 4 lỗi fail

### Tiêu chí đánh giá Pass/Fail

- `Pass`: kết quả thực tế trùng với kết quả mong đợi của test case
- `Fail`: kết quả thực tế khác kết quả mong đợi, xử lý sai validation, hoặc luồng DB/API không đúng như yêu cầu

## 1.6. Code Coverage Report

### Lệnh đo coverage

```powershell
yarn jest tests/unit/forgot-password.page.test.tsx tests/unit/forgot-password.routes.test.ts --runInBand --coverage --collectCoverageFrom=src/app/*/forgot-password/page.tsx --collectCoverageFrom=src/app/api/otp/send/route.ts --collectCoverageFrom=src/app/api/auth/reset-password/route.ts
```

### Kết quả coverage

| Tệp | Statements | Branches | Functions | Lines |
|---|---:|---:|---:|---:|
| `src/app/(auth)/forgot-password/page.tsx` | `75.49%` | `65.51%` | `75.00%` | `78.12%` |
| `src/app/api/otp/send/route.ts` | `85.71%` | `62.50%` | `100.00%` | `85.71%` |
| `src/app/api/auth/reset-password/route.ts` | `89.28%` | `75.00%` | `100.00%` | `89.28%` |
| `Tổng phạm vi forgot password` | `79.47%` | `66.66%` | `77.27%` | `81.37%` |

### Phần chưa được bao phủ

- `src/app/(auth)/forgot-password/page.tsx`
  - Một số nhánh lỗi như resend OTP fail, verify OTP fail, back button, và một số trạng thái hiển thị chưa được phủ hết.
- `src/app/api/otp/send/route.ts`
  - Các nhánh lỗi như thiếu `type`, thiếu `email`, hoặc `type` không hợp lệ chưa được phủ hết.
- `src/app/api/auth/reset-password/route.ts`
  - Một số nhánh lỗi như thiếu field, password không hợp lệ, user không tồn tại chưa được phủ hết.

### Bằng chứng coverage

- Log coverage: [reports/forgot-password-coverage.txt](/d:/library-management-system-main/library-management-system-main/reports/forgot-password-coverage.txt:1)
- Ảnh chụp màn hình nên chụp:
  - Terminal hiển thị bảng coverage
  - Nếu có HTML report thì chụp từ thư mục `coverage`

## 1.7. Tài liệu tham khảo và danh sách prompt đã dùng

### Tài liệu tham khảo

- Tài liệu do người dùng cung cấp ở phần mẫu test case:
  - hình ảnh mẫu kiểm thử chức năng `Quên mật khẩu`
- Tài liệu Jest chính thức:
  - `https://jestjs.io/`
- Tài liệu Testing Library:
  - `https://testing-library.com/docs/react-testing-library/intro/`

### Danh sách prompt đã dùng

1. `tốt lắm bạn giờ làm đến chức năng này đi nhớ là test 1.3 test lỗi vẫn thêm vào bình thường nhé đừng tách riêng phải có lỗi ms kiểm tra đc hệ thống chứ làm tương tụ như trên nhé`

## Ghi chú về CheckDB và Rollback

- Đây là bộ `unit test`, không phải `integration test`
- `CheckDB` được thực hiện bằng cách xác minh các lời gọi mock như:
  - `prisma.user.findUnique`
  - `prisma.user.update`
  - `OTPService.invalidateOTPs`
- `Rollback` được xử lý ở mức unit test bằng cách:
  - không ghi vào cơ sở dữ liệu thật
  - mock toàn bộ thao tác DB và service ngoài
  - reset mock bằng `jest.clearAllMocks()` trước mỗi test
- Với các test ở mức component UI thì `CheckDB` và `Rollback` không áp dụng trực tiếp vì chỉ kiểm thử logic giao diện.
