import { useState, useEffect } from 'react';
import { getStaffVehicles } from '@/api/vehicles';
import { getStaffRentals } from '@/api/rentals';
import { getPayments } from '@/api/payments';

export interface KPIData {
  availableVehicles: number;
  todayHandovers: number;
  stationRevenue: number;
  activeRentals: number;
  availableVehiclesChange: string;
  handoversChange: string;
  revenueChange: string;
  rentalsChange: string;
}

interface UseKPIReturn {
  data: KPIData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDashboardKPI(): UseKPIReturn {
  const [data, setData] = useState<KPIData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKPI = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Fetch data parallel từ 3 API
      const [vehiclesResponse, activeRentalsResponse, allRentalsResponse, paymentsResponse] = await Promise.all([
        getStaffVehicles({ page: 1, limit: 1 }).catch(() => ({ vehicles: [], statistics: { available: 0, rented: 0, maintenance: 0, reserved: 0 }, pagination: { total: 0, page: 1, limit: 1, pages: 0 } })),
        getStaffRentals({ status: 'active', page: 1, limit: 1 }).catch(() => ({ success: true, data: { rentals: [], pagination: { page: 1, limit: 1, total: 0, pages: 0 } } })),
        getStaffRentals({ page: 1, limit: 100 }).catch(() => ({ success: true, data: { rentals: [], pagination: { page: 1, limit: 1, total: 0, pages: 0 } } })),
        // Tăng limit lên 500 để lấy đủ payments trong ngày
        getPayments({ status: 'completed', page: 1, limit: 500 }).catch(() => ({ payments: [], summary: { totalAmount: 0, paidAmount: 0, pendingAmount: 0, refundAmount: 0, paymentTypes: {}, paymentMethods: {} }, pagination: { total: 0, page: 1, limit: 1, pages: 0, timestamp: '' } }))
      ]);

      // Filter today's data on client side
      const todayRentals = allRentalsResponse.data.rentals.filter(rental => {
        const rentalDate = new Date(rental.actual_start_time);
        return rentalDate >= today && rentalDate < tomorrow;
      });

      // Filter payments: chỉ lấy payments hôm nay và KHÔNG phải refund
      const todayPayments = paymentsResponse.payments.filter(payment => {
        // Sử dụng createdAt hoặc created_at
        const dateString = payment.createdAt || payment.created_at;
        if (!dateString) return false;
        
        // Parse date - xử lý cả format DD/MM/YYYY và ISO
        let paymentDate: Date;
        if (dateString.includes('/')) {
          // Format: DD/MM/YYYY HH:mm:ss
          const [datePart] = dateString.split(' ');
          const [day, month, year] = datePart.split('/');
          paymentDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else {
          // Format ISO
          paymentDate = new Date(dateString);
        }
        
        // Check if payment is today and NOT a refund
        const isToday = paymentDate >= today && paymentDate < tomorrow;
        const isNotRefund = payment.payment_type !== 'refund';
        
        return isToday && isNotRefund;
      });

      // Tính doanh thu (không bao gồm refund)
      const todayRevenue = todayPayments.reduce((sum, payment) => {
        return sum + payment.amount;
      }, 0);

      // Calculate KPI values
      const availableVehicles = vehiclesResponse.statistics.available;
      const activeRentals = activeRentalsResponse.data.pagination.total;
      const todayHandovers = todayRentals.length;
      const stationRevenue = todayRevenue;

      // Calculate changes
      const availableChange = vehiclesResponse.statistics.rented > 0 
        ? `${vehiclesResponse.statistics.rented} xe đang được thuê` 
        : 'Tất cả xe sẵn sàng';

      const handoversChange = todayHandovers > 0
        ? `${todayHandovers} lượt giao/nhận hôm nay`
        : 'Chưa có lượt giao/nhận';

      const revenueChange = todayPayments.length > 0
        ? `${todayPayments.length} giao dịch hôm nay`
        : 'Chưa có giao dịch';

      const rentalsChange = activeRentals > 0
        ? `${activeRentals} hợp đồng đang hoạt động`
        : 'Không có hợp đồng nào';

      setData({
        availableVehicles,
        todayHandovers,
        stationRevenue,
        activeRentals,
        availableVehiclesChange: availableChange,
        handoversChange,
        revenueChange,
        rentalsChange
      });
    } catch (err) {
      console.error('Error fetching KPI data:', err);
      setError('Không thể tải dữ liệu thống kê');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKPI();
  }, []);

  return { data, isLoading, error, refetch: fetchKPI };
}

