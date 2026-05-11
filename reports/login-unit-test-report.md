# Login Unit Test Report

## 1.1. Tools and Libraries

- Testing framework: `Jest`
- TypeScript test transformer: `ts-jest`
- Test environment: `jest-environment-jsdom`
- Mocking mechanism: `jest.mock(...)`
- Supporting library in test setup: `@testing-library/jest-dom`

## 1.2. Scope of Testing

### Files, functions, and classes tested

- [src/lib/validators/auth.ts](d:/library-management-system-main/library-management-system-main/src/lib/validators/auth.ts:13)
  - `validateLogin(form)`
- [src/services/auth.service.ts](d:/library-management-system-main/library-management-system-main/src/services/auth.service.ts:119)
  - `AuthService.login(credentials)`
- [tests/unit/validators.test.ts](d:/library-management-system-main/library-management-system-main/tests/unit/validators.test.ts:1)
  - Covers `UT_LOG_01`, `UT_LOG_02`
- [tests/unit/auth.service.login.test.ts](d:/library-management-system-main/library-management-system-main/tests/unit/auth.service.login.test.ts:1)
  - Covers `UT_LOG_03` to `UT_LOG_07`

### Files, functions, and classes not tested in this scope

- [src/lib/validators/auth.ts](d:/library-management-system-main/library-management-system-main/src/lib/validators/auth.ts:57)
  - `validateRegister(form)`
  - Reason: outside the requested login scope.
- [src/services/auth.service.ts](d:/library-management-system-main/library-management-system-main/src/services/auth.service.ts:16)
  - `register(userData)`
  - Reason: registration is a separate business flow.
- [src/services/auth.service.ts](d:/library-management-system-main/library-management-system-main/src/services/auth.service.ts:202)
  - `refreshAccessToken(refreshToken)`
  - Reason: token refresh is not part of the login request validation path.
- [src/services/auth.service.ts](d:/library-management-system-main/library-management-system-main/src/services/auth.service.ts:248)
  - `logout(refreshToken)` and `logoutAll(userId)`
  - Reason: logout behavior is independent from login verification.
- [src/services/auth.service.ts](d:/library-management-system-main/library-management-system-main/src/services/auth.service.ts:265)
  - `changePassword(userId, passwordData)`
  - Reason: password update is another feature with different preconditions.
- [src/services/auth.service.ts](d:/library-management-system-main/library-management-system-main/src/services/auth.service.ts:318)
  - `cleanupExpiredTokens()`
  - Reason: maintenance behavior, not user login.
- API route/UI files under `src/app/api/auth/login/route.ts`, `src/app/(auth)/login/page.tsx`, `src/api/auth.api.ts`
  - Reason: this submission focuses on unit tests for validator and service logic, not integration/UI tests.
- Real database, bcrypt, JWT generation, and Gorse sync
  - Reason: these dependencies are mocked to keep the tests isolated and deterministic.

## 1.3. Unit Test Cases

### File: [tests/unit/validators.test.ts](d:/library-management-system-main/library-management-system-main/tests/unit/validators.test.ts:1)

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| `UT_LOG_01` | Validate that login input is rejected when email and password are empty | `{ email: '', password: '' }` | `firstError != null`, `errors.email` defined, `errors.password` defined | Validator only. No DB access. |
| `UT_LOG_02` | Validate that invalid email format is rejected before service execution | `{ email: 'admin@.com', password: 'password123' }` | `errors.email` defined, `errors.password` undefined | Validator only. No DB access. |

### File: [tests/unit/auth.service.login.test.ts](d:/library-management-system-main/library-management-system-main/tests/unit/auth.service.login.test.ts:1)

| Test Case ID | Test Objective | Input | Expected Output | Notes |
|---|---|---|---|---|
| `UT_LOG_03` | Block login when email does not exist | `email: 'not_exist@gmail.com', password: 'password123'` | Throw `UnauthorizedError('Invalid email or password')` | CheckDB: assert `prisma.user.findUnique` called. Rollback: no write occurs because DB is mocked. |
| `UT_LOG_04` | Block login when user is soft deleted | Existing user with `isDeleted = true` | Throw `UnauthorizedError('Invalid email or password')` | CheckDB: assert login stops before password compare. Rollback: no write occurs. |
| `UT_LOG_05` | Block login when account is inactive | Existing user with `status = INACTIVE` | Throw `UnauthorizedError('Account is inactive. Please contact administrator.')` | CheckDB: assert no token creation. Rollback: no write occurs. |
| `UT_LOG_06` | Block login when password is incorrect | Existing active user, `password = 'wrongpass'` | Throw `UnauthorizedError('Invalid email or password')` | CheckDB: assert `PasswordUtils.compare` called, but no token storage or `firstLoginAt` update. |
| `UT_LOG_07` | Login successfully on first login and update `firstLoginAt` | Existing active user with `firstLoginAt = null` | Return `userId`, `accessToken`, `refreshToken`, `isFirstLogin = true` | CheckDB: assert `prisma.refreshToken.create` and `prisma.user.update` are called. Rollback: mocked DB state resets after each test. |

## 1.4. Project Link

- GitHub URL of the unit test scripts: `N/A in current workspace`
- Note: the provided workspace does not include `.git` metadata or a remote URL, so the actual GitHub repository link needs to be inserted manually before submission.

## 1.5. Execution Report

### Commands executed

```powershell
yarn jest tests/unit/validators.test.ts tests/unit/auth.service.login.test.ts --runInBand
```

### Result summary

- Total test suites: `2`
- Passed test suites: `2`
- Failed test suites: `0`
- Total test cases: `7`
- Passed test cases: `7`
- Failed test cases: `0`
- Pass rate: `100%`

### Evidence

- Execution log: [reports/login-test-execution.txt](d:/library-management-system-main/library-management-system-main/reports/login-test-execution.txt:1)
- Suggested screenshot evidence:
  - Screenshot 1: terminal showing `2 passed, 2 total`
  - Screenshot 2: terminal showing `7 passed, 7 total`

### Pass/Fail criteria

- `Pass`: actual result matches expected output exactly.
- `Fail`: actual result differs from expected output, an unexpected exception occurs, or required DB interaction is missing/incorrect.

## 1.6. Code Coverage Report

### Command executed

```powershell
yarn jest tests/unit/validators.test.ts tests/unit/auth.service.login.test.ts --runInBand --coverage --collectCoverageFrom=src/lib/validators/auth.ts --collectCoverageFrom=src/services/auth.service.ts
```

### Coverage summary

| File | Statements | Branches | Functions | Lines |
|---|---:|---:|---:|---:|
| `src/lib/validators/auth.ts` | `42.85%` | `24.00%` | `50.00%` | `46.66%` |
| `src/services/auth.service.ts` | `29.34%` | `24.59%` | `14.28%` | `29.34%` |
| `All files in login scope` | `33.07%` | `24.41%` | `22.22%` | `33.60%` |

### Uncovered areas

- `src/lib/validators/auth.ts`
  - Register validation branch is not covered because this report focuses on login only.
- `src/services/auth.service.ts`
  - Register flow, refresh token flow, logout flow, change password flow, and cleanup flow are not covered because they are outside login scope.

### Evidence

- Coverage log: [reports/login-coverage.txt](d:/library-management-system-main/library-management-system-main/reports/login-coverage.txt:1)
- Suggested screenshot evidence:
  - Screenshot 3: terminal showing the coverage table
  - Screenshot 4: coverage folder/report if exported from your IDE or browser

## Notes on CheckDB and Rollback

- This submission is a `unit test` package, not an integration test package.
- `CheckDB` is implemented by verifying database access through mocked Prisma calls such as:
  - `prisma.user.findUnique`
  - `prisma.refreshToken.create`
  - `prisma.user.update`
- `Rollback` is handled at unit-test level by:
  - not writing to a real database
  - using mocks for all database mutations
  - resetting mock state with `jest.clearAllMocks()` before each test
- If your instructor requires real DB rollback, that requirement belongs to integration testing and would need a separate transaction-based or seeded test database strategy.
