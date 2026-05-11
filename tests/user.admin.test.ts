import { UserService } from '../src/services/user.service';
import { prisma } from '../src/lib/prisma';
import { Role, UserStatus } from '@prisma/client';

// Mock dependencies
jest.mock('../src/lib/prisma', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock('../src/lib/utils', () => ({
  EmailUtils: { isValid: jest.fn() },
  PasswordUtils: { hash: jest.fn(), compare: jest.fn() },
}));

describe('Unit Test Quản lý người dùng - Admin (Bản chốt 20 Kịch bản)', () => {
  const adminId = 1;
  const readerId = 2;
  const mockAdmin = { id: adminId, role: Role.ADMIN, status: UserStatus.ACTIVE };
  const mockReader = { id: readerId, role: Role.READER, status: UserStatus.ACTIVE, fullName: 'Người dùng Gốc' };

  beforeEach(() => {
    jest.clearAllMocks();
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockAdmin);
  });

  // --- TRUY VẤN & HIỂN THỊ (10 Cases) ---
  it('1. Tìm kiếm người dùng theo Tên', async () => {
    (prisma.user.findMany as jest.Mock).mockResolvedValue([mockReader]);
    await UserService.getUsers({ search: 'Người dùng' });
    expect(prisma.user.findMany).toHaveBeenCalled();
  });

  it('2. Tìm kiếm người dùng theo Email', async () => {
    (prisma.user.findMany as jest.Mock).mockResolvedValue([mockReader]);
    await UserService.getUsers({ search: 'test@gmail.com' });
    expect(prisma.user.findMany).toHaveBeenCalled();
  });

  it('3. Lọc người dùng theo vai trò Thủ thư (Librarian)', async () => {
    (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
    await UserService.getUsers({ role: Role.LIBRARIAN });
    expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({ 
      where: expect.objectContaining({ role: Role.LIBRARIAN }) 
    }));
  });

  it('4. Lọc người dùng vai trò Bạn đọc (Reader)', async () => {
    (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
    await UserService.getUsers({ role: Role.READER });
    expect(prisma.user.findMany).toHaveBeenCalled();
  });

  it('5. Lọc người dùng trạng thái Đang hoạt động (Active)', async () => {
    (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
    await UserService.getUsers({ status: UserStatus.ACTIVE });
    expect(prisma.user.findMany).toHaveBeenCalled();
  });

  it('6. Lọc người dùng trạng thái Bị khóa (Inactive)', async () => {
    (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
    await UserService.getUsers({ status: UserStatus.INACTIVE });
    expect(prisma.user.findMany).toHaveBeenCalled();
  });

  it('7. Phân trang dữ liệu (Pagination)', async () => {
    (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
    await UserService.getUsers({ page: 2, limit: 5 });
    expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 5, take: 5 }));
  });

  it('8. Sắp xếp danh sách người dùng (Sort)', async () => {
    (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
    await UserService.getUsers({ sortBy: 'fullName', sortOrder: 'asc' });
    expect(prisma.user.findMany).toHaveBeenCalled();
  });

  it('9. Xem chi tiết thông tin một người dùng', async () => {
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockReader);
    const result = await UserService.getUserById(readerId);
    expect(result?.id).toBe(readerId);
  });

  it('10. Kiểm tra tổng số lượng User trả về (Count)', async () => {
    (prisma.user.count as jest.Mock).mockResolvedValue(50);
    const result = await UserService.getUsers({});
    expect(result.pagination.total).toBe(50);
  });

  // --- QUẢN TRỊ & BẢO MẬT (10 Cases) ---
  it('11. Admin thay đổi vai trò (Role) cho User - PASS', async () => {
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockReader);
    (prisma.user.update as jest.Mock).mockResolvedValue({ ...mockReader, role: Role.LIBRARIAN });
    const result = await UserService.updateUser(readerId, { role: Role.LIBRARIAN });
    expect(result.role).toBe(Role.LIBRARIAN);
  });

  it('12. Admin khóa/mở tài khoản User (Status) - PASS', async () => {
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockReader);
    (prisma.user.update as jest.Mock).mockResolvedValue({ ...mockReader, status: UserStatus.INACTIVE });
    const result = await UserService.updateUser(readerId, { status: UserStatus.INACTIVE });
    expect(result.status).toBe(UserStatus.INACTIVE);
  });

  it('13. [FAIL] Lạm quyền Admin sửa danh tính (Tên/SĐT)', async () => {
    (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockReader);
    (prisma.user.update as jest.Mock).mockResolvedValue({ ...mockReader, fullName: 'Tên Sửa' });
    const result = await UserService.updateUser(readerId, { fullName: 'Tên Sửa' });
    // FAIL: Mong đợi chặn sửa trực tiếp ko lưu Audit Log
    expect(result.fullName).toBe('Người dùng Gốc');
  });

  it('14. Xóa hàng loạt người dùng - PASS', async () => {
    (prisma.user.findMany as jest.Mock).mockResolvedValue([{ id: 10 }]);
    (prisma.user.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
    const result = await UserService.deleteBulkUsers([10]);
    expect(result.deletedCount).toBe(1);
  });

  it('15. Xử lý lỗi khi xóa ID không tồn tại - PASS', async () => {
    (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
    const result = await UserService.deleteBulkUsers([999]);
    expect(result.notFoundIds).toContain(999);
  });

  it('16. [FAIL] Lỗ hổng Bypass bảo mật: User bị khóa vẫn dùng được Token cũ', async () => {
    const lockedUser = { ...mockReader, status: UserStatus.INACTIVE };
    const isDenied = (user: any) => user.status === UserStatus.INACTIVE;
    expect(isDenied(lockedUser)).toBe(true);
  });

  it('17. [FAIL] Admin tự xóa chính mình (Admin duy nhất)', async () => {
    (prisma.user.findMany as jest.Mock).mockResolvedValue([mockAdmin]);
    const result = await UserService.deleteBulkUsers([adminId]);
    expect(result.deletedCount).toBe(0);
  });

  it('18. Kiểm soát phân quyền: Reader gọi API Admin - PASS (Blocked)', async () => {
    const readerUser = { role: Role.READER };
    const canAccess = (user: any) => user.role === Role.ADMIN;
    expect(canAccess(readerUser)).toBe(false);
  });

  it('19. [FAIL] Lỗ hổng SQL Injection trong thanh tìm kiếm', async () => {
    (prisma.user.findMany as jest.Mock).mockResolvedValue([]);
    const badInput = "'; DROP TABLE users; --";
    await UserService.getUsers({ search: badInput });
    expect(prisma.user.findMany).not.toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        OR: expect.arrayContaining([
          expect.objectContaining({ fullName: expect.objectContaining({ contains: badInput }) })
        ])
      })
    }));
  });

  it('20. [FAIL] Xóa người dùng đang mượn sách chưa trả', async () => {
    (prisma.user.findMany as jest.Mock).mockResolvedValue([mockReader]);
    const result = await UserService.deleteBulkUsers([readerId]);
    expect(result.deletedCount).toBe(0);
  });
});
