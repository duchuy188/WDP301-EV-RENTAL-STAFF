import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getStationBookings } from '@/api/booking';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  time: string;
  read: boolean;
  bookingId?: string; // Link to booking
  createdAt: Date;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [lastCheckedBookings, setLastCheckedBookings] = useState<Set<string>>(new Set());

  // Tính số thông báo chưa đọc
  const unreadCount = notifications.filter(n => !n.read).length;

  // Hàm helper: chuyển timestamp thành "X phút trước"
  const getRelativeTime = (dateString: string): string => {
    if (!dateString) return 'Vừa xong';
    
    const now = new Date();
    const date = new Date(dateString);
    
    // Kiểm tra date hợp lệ
    if (isNaN(date.getTime())) {
      return 'Vừa xong';
    }
    
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // seconds

    // Xử lý thời gian trong tương lai hoặc âm
    if (diff < 0) return 'Vừa xong';
    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    
    const days = Math.floor(diff / 86400);
    return `${days} ngày trước`;
  };

  // Hàm check booking mới
  const checkNewBookings = async () => {
    try {
      const response = await getStationBookings({ 
        status: 'pending',
        page: 1,
        limit: 10 
      });

      // Lọc booking mới (chưa thấy trước đó)
      const newBookings = response.bookings.filter(
        booking => !lastCheckedBookings.has(booking._id)
      );

      if (newBookings.length > 0) {
        // Tạo notification cho mỗi booking mới
        const newNotifications: Notification[] = newBookings.map(booking => {
          const userName = typeof booking.user_id === 'object' 
            ? booking.user_id.fullname 
            : 'Khách hàng';
          
          const vehicleName = typeof booking.vehicle_id === 'object'
            ? `${booking.vehicle_id.brand} ${booking.vehicle_id.model}`
            : 'Xe';

          return {
            id: `booking-${booking._id}-${Date.now()}`,
            title: '🚗 Đơn đặt xe mới',
            message: `${userName} đặt ${vehicleName} (${booking.code})`,
            type: 'info' as const,
            time: getRelativeTime(booking.created_at),
            read: false,
            bookingId: booking._id,
            createdAt: new Date(booking.created_at)
          };
        });

        // Thêm notification mới vào đầu danh sách
        setNotifications(prev => [...newNotifications, ...prev]);

        // Cập nhật danh sách booking đã check
        setLastCheckedBookings(prev => {
          const newSet = new Set(prev);
          newBookings.forEach(b => newSet.add(b._id));
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error checking new bookings:', error);
    }
  };

  // Polling mỗi 30 giây
  useEffect(() => {
    // Check ngay khi mount
    checkNewBookings();

    // Sau đó polling mỗi 30 giây
    const interval = setInterval(checkNewBookings, 30000); // 30s

    return () => clearInterval(interval);
  }, []);

  // Đánh dấu đã đọc
  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  // Đánh dấu tất cả đã đọc
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // Xóa notification
  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Refresh notifications manually
  const refreshNotifications = async () => {
    await checkNewBookings();
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotification,
        refreshNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

