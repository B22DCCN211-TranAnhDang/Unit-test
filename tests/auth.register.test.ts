import { AuthService } from '../src/services/auth.service';
import { prisma } from '../src/lib/prisma';
import { EmailUtils, PasswordUtils, ValidationUtils } from '../src/lib/utils';
import { GorseService } from '../src/services/gorse.service';
import { Role, UserStatus } from '@prisma/client';

// Mock lib/utils
jest.mock('../src/lib/utils', () => ({
  EmailUtils: { 
    isValid: jest.fn(), 
    normalize: (e: string) => e.toLowerCase().trim() 
  },
  PasswordUtils: { 
    hash: jest.fn().mockResolvedValue('hashed_password'),
    validate: jest.fn() 
  },
  ValidationUtils: { 
    validateFullName: jest.fn(),
    validatePhoneNumber: jest.fn(),
    sanitizeString: jest.fn((s) => s.replace(/<[^>]*>?/gm, '')) 
  },
}));

// Mock services & prisma
jest.mock('../src/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

jest.mock('../src/services/gorse.service', () => ({
  GorseService: {
    insertUser: jest.fn(),
    createUserPayload: jest.fn(),
  },
}));

describe('AuthService.register Comprehensive Test (14 Cases)', () => {
  const validData = {
    fullName: 'Nguyễn Văn A',
    email: 'new@test.com',
    password: 'Password@123',
    confirmPassword: 'Password@123',
    phoneNumber: '0987654321',
    address: 'Hà Nội'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (ValidationUtils.validateFullName as jest.Mock).mockReturnValue({ isValid: true });
    (EmailUtils.isValid as jest.Mock).mockReturnValue(true);
    (PasswordUtils.validate as jest.Mock).mockReturnValue({ isValid: true });
    (ValidationUtils.validatePhoneNumber as jest.Mock).mockReturnValue({ isValid: true });
  });

  it('REG_01: Đăng ký READER thành công', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockResolvedValue({ id: 1, email: 'new@test.com', role: Role.READER });
    const result = await AuthService.register(validData);
    expect(result.user.id).toBe(1);
  });

  it('REG_02: Email sai định dạng', async () => {
    (EmailUtils.isValid as jest.Mock).mockReturnValue(false);
    await expect(AuthService.register(validData)).rejects.toThrow('Invalid email format');
  });

  it('REG_03: Mật khẩu quá ngắn', async () => {
    (PasswordUtils.validate as jest.Mock).mockReturnValue({ isValid: false, errors: ['Password too short'] });
    await expect(AuthService.register(validData)).rejects.toThrow('Password too short');
  });

  it('REG_04: Mật khẩu thiếu độ phức tạp', async () => {
    (PasswordUtils.validate as jest.Mock).mockReturnValue({ isValid: false, errors: ['Missing special char'] });
    await expect(AuthService.register(validData)).rejects.toThrow('Missing special char');
  });

  it('REG_05: Xác nhận mật khẩu không khớp', async () => {
    await expect(AuthService.register({ ...validData, confirmPassword: 'wrong' }))
      .rejects.toThrow('Passwords do not match');
  });

  it('REG_06: Email đã tồn tại (Conflict)', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
    await expect(AuthService.register(validData)).rejects.toThrow('Email already registered');
  });

  it('REG_07: Họ tên không hợp lệ', async () => {
    (ValidationUtils.validateFullName as jest.Mock).mockReturnValue({ isValid: false, errors: ['Invalid name'] });
    await expect(AuthService.register(validData)).rejects.toThrow('Invalid name');
  });

  it('REG_08: Số điện thoại không hợp lệ', async () => {
    (ValidationUtils.validatePhoneNumber as jest.Mock).mockReturnValue({ isValid: false, errors: ['Invalid phone'] });
    await expect(AuthService.register(validData)).rejects.toThrow('Invalid phone');
  });

  it('REG_09: Resilience - Gorse AI Down', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockResolvedValue({ id: 1, role: Role.READER });
    (GorseService.insertUser as jest.Mock).mockRejectedValue(new Error('Gorse Down'));
    const result = await AuthService.register(validData);
    expect(result.user.id).toBe(1);
  });

  it('REG_10: Sanitization - Họ tên', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockResolvedValue({ id: 1 });
    await AuthService.register({ ...validData, fullName: '<b>Name</b>' });
    expect(ValidationUtils.sanitizeString).toHaveBeenCalledWith('<b>Name</b>');
  });

  it('REG_11: [VULNERABILITY] Chặn địa chỉ quá dài (Expert Standard)', async () => {
    const longAddress = 'A'.repeat(2001);
    // KỲ VỌNG: Hệ thống chuẩn Expert phải chặn địa chỉ quá dài
    // THỰC TẾ: Code hiện tại không chặn, nên bài test này sẽ bị FAIL (đúng ý bạn)
    const registerCall = AuthService.register({ ...validData, address: longAddress });
    
    // Chúng ta "mong đợi" nó phải ném lỗi "Address too long"
    // Nếu nó KHÔNG ném lỗi (tức là code hiện tại), Jest sẽ đánh dấu là FAIL
    await expect(registerCall).rejects.toThrow('Address is too long');
  });

  it('REG_12: Bỏ trống địa chỉ (Optional)', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockResolvedValue({ id: 1 });
    const result = await AuthService.register({ ...validData, address: '' });
    expect(result.user).toBeDefined();
  });

  it('REG_13: [VULNERABILITY] Xác thực Email (Expert Standard)', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    (prisma.user.create as jest.Mock).mockResolvedValue({ id: 1, status: UserStatus.ACTIVE });
    
    const result = await AuthService.register(validData);
    
    // KỲ VỌNG: Hệ thống chuẩn phải tạo user với trạng thái PENDING
    // THỰC TẾ: Code bạn set ACTIVE ngay, nên bài test này sẽ FAIL (đúng ý bạn)
    expect(result.user.status).toBe(UserStatus.PENDING); 
  });

  it('REG_14: Lỗi Database bất ngờ', async () => {
    (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));
    await expect(AuthService.register(validData)).rejects.toThrow('Database error');
  });
});
