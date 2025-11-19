import { useState, useEffect } from 'react';
import { getStaffVehicles } from '@/api/vehicles';
import { getStationBookings } from '@/api/booking';
import { getPayments } from '@/api/payments';

export interface DashboardStats {
  maintenanceVehicles: number;
  pendingBookings: number;
  completedPaymentsToday: number;
}

interface UseStatsReturn {
  data: DashboardStats | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDashboardStats(): UseStatsReturn {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Fetch parallel
      const [vehiclesResponse, bookingsResponse, paymentsResponse] = await Promise.all([
        getStaffVehicles({ status: 'maintenance', page: 1, limit: 1 }).catch(() => ({ vehicles: [], statistics: { available: 0, rented: 0, maintenance: 0, reserved: 0 }, pagination: { total: 0, page: 1, limit: 1, pages: 0 } })),
        getStationBookings({ status: 'pending', page: 1, limit: 1 }).catch(() => ({ message: '', bookings: [], pagination: { current: 1, total: 0, count: 0, totalRecords: 0 } })),
        getPayments({ status: 'completed', page: 1, limit: 100 }).catch(() => ({ payments: [], summary: { totalAmount: 0, paidAmount: 0, pendingAmount: 0, refundAmount: 0, paymentTypes: {}, paymentMethods: {} }, pagination: { total: 0, page: 1, limit: 1, pages: 0, timestamp: '' } }))
      ]);

      // Filter today's payments
      const todayPayments = paymentsResponse.payments.filter(payment => {
        const paymentDate = new Date(payment.createdAt);
        return paymentDate >= today && paymentDate < tomorrow;
      });

      setData({
        maintenanceVehicles: vehiclesResponse.statistics.maintenance || vehiclesResponse.pagination.total || 0,
        pendingBookings: bookingsResponse.pagination.totalRecords || 0,
        completedPaymentsToday: todayPayments.length
      });
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Không thể tải thống kê');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return { data, isLoading, error, refetch: fetchStats };
}

