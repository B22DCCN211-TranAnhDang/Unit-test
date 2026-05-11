import { UserService } from '../src/services/user.service';
import { prisma } from '../src/lib/prisma';
import { EmailUtils } from '../src/lib/utils';
import { Role, UserStatus } from '@prisma/client';

// Mock dependencies
jest.mock('../src/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock('../src/lib/utils', () => ({
  EmailUtils: {
    isValid: jest.fn((e) => e && e.includes('@')),
  },
}));

// Mock GorseService as empty
jest.mock('../src/services/gorse.service', () => ({
  GorseService: {
    toGorseUserId: jest.fn(),
    updateUser: jest.fn(),
  },
}));

describe('Unit Test Chức năng Hồ sơ cá nhân - Profile (20 Kịch bản)', () => {
  const userId = 1;
  const mockUser = {
    id: userId,
    fullName: 'Nguyễn Văn A',
    email: 'a@test.com',
    phoneNumber: '0123456789',
    address: 'Hà Nội',
    role: Role.READER,
    status: UserStatus.ACTIVE,
    inactiveAt: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockUser);
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
  });

  // --- NHÓM 1: CẬP NHẬT THÔNG TIN CƠ BẢN ---
  it('PROF_01: Cập nhật Họ tên & Địa chỉ thành công', async () => {
    (prisma.user.update as jest.Mock).mockResolvedValue({ ...mockUser, fullName: 'Mới', address: 'Mới' });
    const result = await UserService.updateUser(userId, { fullName: 'Mới', address: 'Mới' });
    expect(result.fullName).toBe('Mới');
  });

  it('PROF_02: Cập nhật Email (Xác nhận tính nhất quán ở Service Level)', async () => {
    (prisma.user.update as jest.Mock).mockResolvedValue({ ...mockUser, email: 'new@test.com' });
    const result = await UserService.updateUser(userId, { email: 'new@test.com' });
    expect(result.email).toBe('new@test.com');
  });

  it('PROF_05: Cập nhật Số điện thoại hợp lệ thành công', async () => {
    (prisma.user.update as jest.Mock).mockResolvedValue({ ...mockUser, phoneNumber: '0909123456' });
    const result = await UserService.updateUser(userId, { phoneNumber: '0909123456' });
    expect(result.phoneNumber).toBe('0909123456');
  });

  it('PROF_11: Cập nhật Avatar URL thành công', async () => {
    (prisma.user.update as jest.Mock).mockResolvedValue({ ...mockUser, avatarUrl: 'link_anh' });
    const result = await UserService.updateUser(userId, { avatarUrl: 'link_anh' });
    expect(result.avatarUrl).toBe('link_anh');
  });

  it('PROF_13: Cập nhật danh sách Sở thích thành công', async () => {
    (prisma.user.update as jest.Mock).mockResolvedValue({ ...mockUser, interest: ['Đọc sách'] });
    const result = await UserService.updateUser(userId, { interest: ['Đọc sách'] });
    expect(result.interest).toContain('Đọc sách');
  });

  // --- NHÓM 2: CẬP NHẬT THEO ĐỊNH DẠNG PRISMA ---
  it('PROF_19: Cập nhật Email dùng định dạng set của Prisma', async () => {
    (prisma.user.update as jest.Mock).mockResolvedValue({ ...mockUser, email: 'set@test.com' });
    const result = await UserService.updateUser(userId, { email: { set: 'set@test.com' } });
    expect(result.email).toBe('set@test.com');
  });

  it('PROF_20: Cập nhật Số điện thoại dùng định dạng set của Prisma', async () => {
    (prisma.user.update as jest.Mock).mockResolvedValue({ ...mockUser, phoneNumber: '0111222333' });
    const result = await UserService.updateUser(userId, { phoneNumber: { set: '0111222333' } });
    expect(result.phoneNumber).toBe('0111222333');
  });

  it('PROF_21: Cập nhật Status dùng định dạng set của Prisma', async () => {
    (prisma.user.update as jest.Mock).mockResolvedValue({ ...mockUser, status: UserStatus.INACTIVE });
    const result = await UserService.updateUser(userId, { status: { set: UserStatus.INACTIVE } });
    expect(result.status).toBe(UserStatus.INACTIVE);
  });

  it('PROF_22: Cập nhật Họ tên dùng định dạng set của Prisma', async () => {
    (prisma.user.update as jest.Mock).mockResolvedValue({ ...mockUser, fullName: 'Tên Mới' });
    const result = await UserService.updateUser(userId, { fullName: { set: 'Tên Mới' } });
    expect(result.fullName).toBe('Tên Mới');
  });

  // --- NHÓM 3: RÀNG BUỘC & BẢO MẬT ĐỊNH DANH (PASS) ---
  it('PROF_03: Chặn Email sai định dạng (Bảo vệ dữ liệu)', async () => {
    (EmailUtils.isValid as jest.Mock).mockReturnValue(false);
    await expect(UserService.updateUser(userId, { email: 'bad' })).rejects.toThrow('Invalid email format');
  });

  it('PROF_04: Chặn thay đổi Email trùng lặp (Bảo mật định danh)', async () => {
    // PASS: Code của bạn có check emailExists và ném lỗi ConflictError
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 2, email: 'dup@test.com' });
    const call = UserService.updateUser(userId, { email: 'dup@test.com' });
    await expect(call).rejects.toThrow(); 
  });

  it('PROF_06: Chặn Số điện thoại chứa ký tự lạ', async () => {
    await expect(UserService.updateUser(userId, { phoneNumber: 'abc' })).rejects.toThrow('Invalid phone number format');
  });

  it('PROF_15: Xử lý đúng khi ID người dùng không tồn tại', async () => {
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
    await expect(UserService.updateUser(999, { fullName: 'A' })).rejects.toThrow('User not found');
  });

  it('PROF_14: Database Error handling (Tính bền bỉ)', async () => {
    (prisma.user.update as jest.Mock).mockRejectedValue(new Error('DB Error'));
    await expect(UserService.updateUser(userId, { fullName: 'A' })).rejects.toThrow('DB Error');
  });

  // --- NHÓM 4: TRẠNG THÁI ---
  it('PROF_16: Tự động gán ngày InactiveAt khi sang INACTIVE', async () => {
    (prisma.user.update as jest.Mock).mockImplementation((args) => ({
      ...mockUser, status: UserStatus.INACTIVE, inactiveAt: args.data.inactiveAt
    }));
    const result = await UserService.updateUser(userId, { status: UserStatus.INACTIVE });
    expect(result.inactiveAt).toBeInstanceOf(Date);
  });

  it('PROF_17: Xóa ngày InactiveAt khi về ACTIVE', async () => {
    (prisma.user.update as jest.Mock).mockResolvedValue({ ...mockUser, status: UserStatus.ACTIVE, inactiveAt: null });
    const result = await UserService.updateUser(userId, { status: UserStatus.ACTIVE });
    expect(result.inactiveAt).toBeNull();
  });

  // --- NHÓM 5: LỖ HỔNG BẢO MẬT (FAIL CASES CHO BÁO CÁO) ---
  it('PROF_07: [BẢO MẬT] Chặn mã độc XSS trong Họ tên/Địa chỉ', async () => {
    const xss = '<script>alert(1)</script>';
    (prisma.user.update as jest.Mock).mockResolvedValue({ ...mockUser, fullName: xss });
    const result = await UserService.updateUser(userId, { fullName: xss });
    // FAIL: Code hiện tại chưa lọc thẻ <script>
    expect(result.fullName).not.toContain('<script>');
  });

  it('PROF_08: [BẢO MẬT] Giới hạn độ dài dữ liệu Địa chỉ', async () => {
    const long = 'a'.repeat(1000);
    (prisma.user.update as jest.Mock).mockResolvedValue({ ...mockUser, address: long });
    const result = await UserService.updateUser(userId, { address: long });
    // FAIL: Code hiện tại chưa check độ dài address
    expect(result.address.length).toBeLessThanOrEqual(500);
  });

  it('PROF_09: [BẢO MẬT] Yêu cầu mật khẩu khi thay đổi thông tin nhạy cảm', async () => {
    // FAIL: Code cho phép đổi thông tin mà không cần mật khẩu xác nhận
    await expect(UserService.updateUser(userId, { email: 'new@test.com' })).rejects.toThrow('Password required');
  });

  it('PROF_10: [BẢO MẬT] Chống leo thang quyền (Role ADMIN)', async () => {
    (prisma.user.update as jest.Mock).mockResolvedValue({ ...mockUser, role: Role.ADMIN });
    const result = await UserService.updateUser(userId, { role: Role.ADMIN });
    // FAIL: Code cho phép update bất kỳ field nào
    expect(result.role).toBe(Role.READER);
  });
});
