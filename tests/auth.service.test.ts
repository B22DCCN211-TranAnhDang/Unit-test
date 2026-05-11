import { AuthService } from '../src/services/auth.service';
import { prisma } from '../src/lib/prisma';
import { EmailUtils, JWTUtils, PasswordUtils } from '../src/lib/utils';
import { UserStatus } from '@prisma/client';

// Mock lib/utils
jest.mock('../src/lib/utils', () => ({
  EmailUtils: { 
    isValid: jest.fn((e) => e && e.includes('@')), // Mock logic thực tế hơn
    normalize: (e: string) => e.toLowerCase().trim() 
  },
  JWTUtils: { 
    generateAccessToken: jest.fn(), 
    generateRefreshToken: jest.fn(),
    verifyRefreshToken: jest.fn() 
  },
  PasswordUtils: { compare: jest.fn() },
  ValidationUtils: { validateLogin: jest.fn() },
}));

// Mock prisma
jest.mock('../src/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

describe('AuthService Comprehensive Unit Test (14 Cases)', () => {
  const mockUser = { id: 1, email: 'test@test.com', role: 'READER', status: UserStatus.ACTIVE, isDeleted: false, firstLoginAt: new Date() };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- LOGIN CASES (9 CASES) ---
  it('AUTH_01: Đăng nhập ADMIN thành công', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ ...mockUser, role: 'ADMIN' });
    (PasswordUtils.compare as jest.Mock).mockResolvedValue(true);
    const result = await AuthService.login({ email: 'admin@test.com', password: '123' });
    expect(result.userId).toBe(1);
  });

  it('AUTH_02: Đăng nhập LIBRARIAN thành công', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ ...mockUser, role: 'LIBRARIAN' });
    (PasswordUtils.compare as jest.Mock).mockResolvedValue(true);
    const result = await AuthService.login({ email: 'lib@test.com', password: '123' });
    expect(result.userId).toBe(1);
  });

  it('AUTH_03: Đăng nhập READER thành công', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (PasswordUtils.compare as jest.Mock).mockResolvedValue(true);
    const result = await AuthService.login({ email: 'user@test.com', password: '123' });
    expect(result.userId).toBe(1);
  });

  it('AUTH_04: Bỏ trống ô Email', async () => {
    // Với email rỗng, EmailUtils.isValid sẽ trả về false (do mock ở trên)
    await expect(AuthService.login({ email: '', password: '123' })).rejects.toThrow('Invalid email format');
  });

  it('AUTH_05: Bỏ trống ô Mật khẩu', async () => {
    await expect(AuthService.login({ email: 'test@test.com', password: '' })).rejects.toThrow('Password is required');
  });

  it('AUTH_06: Sai mật khẩu', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
    (PasswordUtils.compare as jest.Mock).mockResolvedValue(false);
    await expect(AuthService.login({ email: 'test@test.com', password: 'wrong' })).rejects.toThrow('Invalid email or password');
  });

  it('AUTH_07: Email không tồn tại', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    await expect(AuthService.login({ email: 'none@test.com', password: '123' })).rejects.toThrow('Invalid email or password');
  });

  it('AUTH_08: Tài khoản bị khóa (INACTIVE)', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ ...mockUser, status: UserStatus.INACTIVE });
    await expect(AuthService.login({ email: 'locked@test.com', password: '123' })).rejects.toThrow('Account is inactive');
  });

  it('AUTH_09: Tài khoản bị xóa (Soft Delete)', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ ...mockUser, isDeleted: true });
    await expect(AuthService.login({ email: 'deleted@test.com', password: '123' })).rejects.toThrow('Invalid email or password');
  });

  // --- TOKEN CASES (3 CASES) ---
  it('AUTH_10: Gia hạn (Refresh) thành công', async () => {
    (JWTUtils.verifyRefreshToken as jest.Mock).mockReturnValue({ userId: 1 });
    (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue({ 
      id: 'token-id', 
      token: 'valid-token',
      user: mockUser // Bổ sung user để không bị lỗi undefined status
    });
    const result = await AuthService.refreshAccessToken('valid-token');
    expect(result).toHaveProperty('accessToken');
  });

  it('AUTH_11: Token hết hạn hoặc giả mạo', async () => {
    (JWTUtils.verifyRefreshToken as jest.Mock).mockImplementation(() => { throw new Error('Invalid or expired refresh token'); });
    await expect(AuthService.refreshAccessToken('fake-token')).rejects.toThrow('Invalid or expired refresh token');
  });

  it('AUTH_12: [VULNERABILITY] Tấn công Replay (Chặn dùng lại token)', async () => {
    (JWTUtils.verifyRefreshToken as jest.Mock).mockReturnValue({ userId: 1, jti: 'token-id' });
    (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue({ 
      id: 'token-id', 
      token: 'used-token',
      user: mockUser 
    });
    
    await AuthService.refreshAccessToken('used-token');
    
    // KỲ VỌNG: Hệ thống chuẩn Expert phải xóa Token cũ ngay sau khi dùng (Rotation)
    // THỰC TẾ: Code của bạn không gọi lệnh delete này, nên expect này sẽ làm bài test bị FAIL
    expect(prisma.refreshToken.delete).toHaveBeenCalledWith({
      where: { token: 'used-token' }
    });
  });

  // --- LOGOUT CASES (2 CASES) ---
  it('AUTH_13: Đăng xuất phiên hiện tại', async () => {
    (JWTUtils.verifyRefreshToken as jest.Mock).mockReturnValue({ userId: 1, jti: 'token-id' });
    await AuthService.logout('valid-token');
    expect(prisma.refreshToken.delete).toHaveBeenCalled();
  });

  it('AUTH_14: Đăng xuất tất cả thiết bị', async () => {
    await AuthService.logoutAll(1);
    expect(prisma.refreshToken.deleteMany).toHaveBeenCalledWith({ where: { userId: 1 } });
  });
});
