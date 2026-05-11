# Báo cáo Unit Test Kiểm Tra Bảo Mật Hệ Thống

## 1.1. Tools and Libraries

- Framework kiểm thử: `Jest`
- Bộ chuyển đổi TypeScript cho Jest: `ts-jest`
- Môi trường test: `jest-environment-jsdom`
- Cơ chế mock: `jest.mock(...)`, `jest.fn()`
- Thư viện hỗ trợ assertion DOM: `@testing-library/jest-dom`

## 1.2. Scope of Testing

### Các hàm, class, tệp được kiểm thử

- [src/middleware/auth.middleware.ts](/d:/library-management-system-main/library-management-system-main/src/middleware/auth.middleware.ts:1)
  - `authenticateToken(request)`
  - `authorizeRoles(allowedRoles)`
  - `withAuth(handler, options)`
- [src/app/api/auth/logout/route.ts](/d:/library-management-system-main/library-management-system-main/src/app/api/auth/logout/route.ts:1)
  - `POST(request)`
- [src/app/api/reviews/route.ts](/d:/library-management-system-main/library-management-system-main/src/app/api/reviews/route.ts:1)
  - `POST(request)`
- [tests/unit/auth.security.test.ts](/d:/library-management-system-main/library-management-system-main/tests/unit/auth.security.test.ts:1)
  - Chứa các test case `SE_01` đến `SE_04`
- [tests/unit/route.security.test.ts](/d:/library-management-system-main/library-management-system-main/tests/unit/route.security.test.ts:1)
  - Chứa các test case `SE_05` đến `SE_08`

### Các hàm, class, tệp không kiểm thử trong phạm vi này

- Các kiểm thử bảo mật UI thủ công như kiểm tra redirect trang `/dashboard` khi chưa login
  - Lý do: báo cáo này là `unit test`, không phải E2E/browser test.
- Toàn bộ DB thật, cookie trình duyệt thật, request thật từ browser
  - Lý do: được mock để kiểm thử cô lập logic bảo mật ở mức code.
- Các route bảo mật khác ngoài phạm vi đã chọn
  - Lý do: tập trung vào 4 nhóm chính: xác thực, phân quyền, logout session, và kiểm soát đầu vào review.

## 1.3. Unit Test Cases

- Tổng số test case trong phạm vi báo cáo: `8`
- Kết quả hiện tại: `6 pass`, `2 fail`
- Bảng dưới đây được viết theo dạng TSV để có thể copy trực tiếp vào Excel.

```tsv
Mã Test Case	Mục tiêu kiểm thử	Dữ liệu đầu vào	Kết quả mong đợi	Ghi chú
SE_01	Kiểm tra chặn truy cập vào handler được bảo vệ khi chưa có Authorization header	Request không có token	Handler bị chặn và trả về mã 401	Kết quả hiện tại: Pass. Kiểm thử middleware xác thực
SE_02	Kiểm tra phân quyền từ chối người dùng READER với thao tác chỉ dành cho ADMIN	Token hợp lệ của user role = READER, handler yêu cầu role ADMIN	Request bị từ chối với mã 403	Kết quả hiện tại: Pass. Kiểm thử role-based access control
SE_03	Kiểm tra bộ kiểm tra role hoạt động đúng với vai trò hợp lệ và không hợp lệ	allowedRoles = [ADMIN, LIBRARIAN], user.role lần lượt là ADMIN và READER	ADMIN được phép, READER bị từ chối	Kết quả hiện tại: Pass. Chỉ kiểm thử authorizeRoles
SE_04	Kiểm tra middleware phải từ chối user có trạng thái INACTIVE	Token hợp lệ của user status = INACTIVE	authenticateToken phải trả success = false và lỗi User not found or inactive	Kết quả hiện tại: Fail. Middleware hiện tại vẫn cho user INACTIVE đi qua
SE_05	Kiểm tra logout thu hồi refresh token và xóa cookie phiên	Request có cookie refreshToken = refresh-token-123	Gọi AuthService.logout và xóa các cookie refreshToken, accessToken, userId	Kết quả hiện tại: Pass. CheckDB: xác minh lời gọi logout; Rollback: mock
SE_06	Kiểm tra logout vẫn xóa cookie ngay cả khi service logout bị lỗi	Request có refreshToken nhưng AuthService.logout ném lỗi	Hệ thống vẫn trả Logout successful và xóa toàn bộ cookie phiên	Kết quả hiện tại: Pass. Giúp bảo đảm thu hồi phiên phía client
SE_07	Kiểm tra route tạo review có sanitize dữ liệu nhập để giảm rủi ro XSS	reviewText = <script>alert('xss')</script>	Dữ liệu lưu xuống DB phải là chuỗi đã được sanitize, không còn ký tự < >	Kết quả hiện tại: Pass. CheckDB: xác minh prisma.review.create nhận reviewText đã sanitize
SE_08	Kiểm tra route tạo review không cho phép người dùng tạo review thay mặt tài khoản khác	request.user.id = 7 nhưng body.userId = 999	Route phải từ chối request, không được tạo review trong DB	Kết quả hiện tại: Fail. API hiện tại chưa đối chiếu body.userId với request.user.id
```

## 1.4. Project Link

- URL GitHub của unit test script: `Chưa xác định trong workspace hiện tại`
- Ghi chú: workspace hiện tại không chứa metadata `.git` hoặc remote URL, nên cần tự điền link GitHub repo thật trước khi nộp.

## 1.5. Execution Report

### Lệnh thực thi

```powershell
yarn jest tests/unit/auth.security.test.ts tests/unit/route.security.test.ts --runInBand
```

### Kết quả thực thi

- Tổng số test suite: `2`
- Số test suite pass: `0`
- Số test suite fail: `2`
- Tổng số test case: `8`
- Số test case pass: `6`
- Số test case fail: `2`
- Tỷ lệ pass: `75.00%`

### Các test case đang fail

- `SE_04`: middleware xác thực chưa chặn user có trạng thái `INACTIVE`
- `SE_08`: route review chưa chặn hành vi impersonation qua `body.userId`

### Bằng chứng thực thi

- Log thực thi: [reports/security-test-execution.txt](/d:/library-management-system-main/library-management-system-main/reports/security-test-execution.txt:1)
- Ảnh chụp màn hình nên chụp:
  - Terminal hiển thị `Tests: 2 failed, 6 passed, 8 total`
  - Terminal hiển thị chi tiết 2 lỗi fail

### Tiêu chí đánh giá Pass/Fail

- `Pass`: cơ chế bảo mật hoạt động đúng như mong đợi
- `Fail`: request nguy hiểm hoặc user không hợp lệ vẫn vượt qua lớp kiểm soát

## 1.6. Code Coverage Report

### Lệnh đo coverage

```powershell
yarn jest tests/unit/auth.security.test.ts tests/unit/route.security.test.ts --runInBand --coverage --collectCoverageFrom=src/middleware/auth.middleware.ts --collectCoverageFrom=src/app/api/auth/logout/route.ts --collectCoverageFrom=src/app/api/reviews/route.ts
```

### Kết quả coverage

| Tệp | Statements | Branches | Functions | Lines |
|---|---:|---:|---:|---:|
| `src/app/api/auth/logout/route.ts` | `100.00%` | `66.66%` | `100.00%` | `100.00%` |
| `src/app/api/reviews/route.ts` | `44.28%` | `35.71%` | `50.00%` | `44.28%` |
| `src/middleware/auth.middleware.ts` | `78.72%` | `76.47%` | `50.00%` | `76.19%` |
| `Tổng phạm vi security` | `63.70%` | `50.00%` | `53.84%` | `62.30%` |

### Phần chưa được bao phủ

- `src/app/api/reviews/route.ts`
  - Nhiều nhánh validation khác như rating sai, book không tồn tại, user không tồn tại, duplicate review chưa được phủ hết.
- `src/middleware/auth.middleware.ts`
  - Một số helper wrapper như `requireAdmin`, `requireReader`, `optionalAuth` chưa được test riêng đầy đủ.
- `src/app/api/auth/logout/route.ts`
  - Nhánh không có `refreshToken` mới được phủ một phần gián tiếp, chưa có test riêng tách biệt.

### Bằng chứng coverage

- Log coverage: [reports/security-coverage.txt](/d:/library-management-system-main/library-management-system-main/reports/security-coverage.txt:1)
- Ảnh chụp màn hình nên chụp:
  - Terminal hiển thị bảng coverage
  - Nếu có HTML report thì chụp từ thư mục `coverage`

## 1.7. Tài liệu tham khảo và danh sách prompt đã dùng

### Tài liệu tham khảo

- Mẫu test case `KIỂM TRA BẢO MẬT HỆ THỐNG (SECURITY TESTING)` do người dùng cung cấp
- Tài liệu Jest chính thức:
  - `https://jestjs.io/`

### Danh sách prompt đã dùng

1. `nốt cái này đi`

## Ghi chú về CheckDB và Rollback

- Đây là bộ `unit test`, không phải `penetration test` hay `integration test`
- `CheckDB` được thực hiện bằng cách xác minh các lời gọi mock như:
  - `AuthService.logout`
  - `prisma.review.create`
- `Rollback` được xử lý ở mức unit test bằng cách:
  - không sử dụng DB thật
  - không tạo request thật ra ngoài
  - mock toàn bộ cookie/session/service liên quan
