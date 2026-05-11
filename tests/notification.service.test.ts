import { NotificationService } from '@/services/notification.service';
import { prisma } from '@/lib/prisma';
import { NotificationStatus, NotificationType } from '@prisma/client';

// Mock Prisma hoàn toàn để không phụ thuộc vào Database thật
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    notification: {
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

// Mock Queue để bỏ qua phần khó (BullMQ/Redis)
jest.mock('@/queues/notification.queue', () => ({
  addNotificationToQueue: jest.fn(),
  addUrgentNotificationToQueue: jest.fn(),
  addBulkNotificationsToQueue: jest.fn(),
}));

describe('NotificationService Unit Tests (Core Logic)', () => {
  const mockUser = { id: 1, email: 'test@example.com', fullName: 'Test User' };
  const mockNotice = {
    id: 101,
    userId: 1,
    title: 'Test Title',
    message: 'Test Message',
    type: NotificationType.SYSTEM,
    status: NotificationStatus.UNREAD,
    isDeleted: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- TEST HÀM TẠO THÔNG BÁO ---
  describe('createNotification', () => {
    it('nên tạo thông báo thành công khi dữ liệu chuẩn', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.notification.create as jest.Mock).mockResolvedValue(mockNotice);

      const result = await NotificationService.createNotification({
        userId: 1,
        title: 'Chào mừng',
        message: 'Nội dung thông báo',
        type: NotificationType.SYSTEM
      });

      expect(result.id).toBe(101);
      expect(prisma.notification.create).toHaveBeenCalled();
    });

    it('nên báo lỗi nếu User ID <= 0', async () => {
      await expect(NotificationService.createNotification({
        userId: 0, title: 'T', message: 'M', type: NotificationType.SYSTEM
      })).rejects.toThrow('Invalid user ID');
    });

    it('nên báo lỗi nếu User không tồn tại trong DB', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(NotificationService.createNotification({
        userId: 999, title: 'T', message: 'M', type: NotificationType.SYSTEM
      })).rejects.toThrow('User not found');
    });

    it('nên báo lỗi nếu thiếu tiêu đề', async () => {
      await expect(NotificationService.createNotification({
        userId: 1,
        title: '',
        message: 'Nội dung',
        type: NotificationType.SYSTEM
      })).rejects.toThrow('Notification title is required');
    });

    it('nên báo lỗi nếu tin nhắn trống', async () => {
      await expect(NotificationService.createNotification({
        userId: 1, title: 'Tiêu đề', message: '  ', type: NotificationType.SYSTEM
      })).rejects.toThrow('Notification message is required');
    });
  });

  // --- TEST HÀM ĐỌC THÔNG BÁO ---
  describe('markAsRead', () => {
    it('nên chuyển trạng thái sang READ thành công', async () => {
      (prisma.notification.findFirst as jest.Mock).mockResolvedValue(mockNotice);
      
      await NotificationService.markAsRead(101, 1);
      
      expect(prisma.notification.update).toHaveBeenCalled();
    });

    it('nên báo lỗi nếu không tìm thấy thông báo để đánh dấu', async () => {
      (prisma.notification.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(NotificationService.markAsRead(999, 1)).rejects.toThrow('Notification not found');
    });

    it('không gọi DB nếu thông báo đã đọc rồi', async () => {
      (prisma.notification.findFirst as jest.Mock).mockResolvedValue({
        ...mockNotice,
        status: NotificationStatus.READ
      });
      
      await NotificationService.markAsRead(101, 1);
      
      expect(prisma.notification.update).not.toHaveBeenCalled();
    });
  });

  // --- TEST CÁC HÀM HÀNG ĐỢI (QUEUE) ---
  describe('Queueing Functions', () => {
    it('queueNotification nên đẩy vào hàng đợi thành công', async () => {
      const notificationQueue = require('@/queues/notification.queue');
      notificationQueue.addNotificationToQueue.mockResolvedValue('job_id_123');

      const result = await NotificationService.queueNotification({
        userId: 1,
        title: 'Queue Test',
        message: 'Nội dung hàng đợi',
        type: NotificationType.SYSTEM
      });

      expect(result.success).toBe(true);
    });

    it('queueNotification nên báo lỗi nếu thiếu dữ liệu', async () => {
      const result = await NotificationService.queueNotification({
        userId: 1, title: '', message: '', type: NotificationType.SYSTEM
      });
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('queueUrgentNotification nên gửi tin khẩn cấp', async () => {
      const notificationQueue = require('@/queues/notification.queue');
      notificationQueue.addUrgentNotificationToQueue.mockResolvedValue('urgent_id');

      const result = await NotificationService.queueUrgentNotification({
        userId: 1,
        title: 'Khẩn cấp',
        message: 'Cháy nhà!',
        type: NotificationType.SYSTEM
      });

      expect(result.success).toBe(true);
    });

    it('queueBulkNotifications nên gửi cho nhiều người', async () => {
      const notificationQueue = require('@/queues/notification.queue');
      notificationQueue.addBulkNotificationsToQueue.mockResolvedValue(['id1', 'id2']);

      const result = await NotificationService.queueBulkNotifications([1, 2], {
        title: 'Bulk',
        message: 'Gửi hàng loạt',
        type: NotificationType.SYSTEM
      });

      expect(result.success).toBe(true);
    });
  });

  // --- TEST HÀM QUẢN LÝ (LIST/COUNT/DELETE) ---
  describe('Management Functions', () => {
    it('markAllAsRead nên cập nhật hàng loạt thành công', async () => {
      (prisma.notification.updateMany as jest.Mock).mockResolvedValue({ count: 10 });
      const count = await NotificationService.markAllAsRead(1);
      expect(count).toBe(10);
    });

    it('getUserNotifications nên lấy đúng danh sách', async () => {
      (prisma.notification.findMany as jest.Mock).mockResolvedValue([mockNotice]);
      const list = await NotificationService.getUserNotifications(1);
      expect(list).toHaveLength(1);
    });

    it('getUnreadCount nên đếm đúng số chưa đọc', async () => {
      (prisma.notification.count as jest.Mock).mockResolvedValue(5);
      const count = await NotificationService.getUnreadCount(1);
      expect(count).toBe(5);
    });

    it('deleteNotification nên báo lỗi nếu không tìm thấy thông báo', async () => {
      (prisma.notification.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(NotificationService.deleteNotification(999, 1)).rejects.toThrow('Notification not found');
    });

    it('deleteNotification nên thực hiện xóa mềm (soft delete)', async () => {
      (prisma.notification.findFirst as jest.Mock).mockResolvedValue(mockNotice);
      await NotificationService.deleteNotification(101, 1);
      expect(prisma.notification.update).toHaveBeenCalled();
    });
  });
});
