import { useState, useEffect } from 'react';
import { getStaffRentals } from '@/api/rentals';

export interface ChartData {
  hour: string;
  rentals: number;
}

interface UseChartReturn {
  data: ChartData[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDashboardChart(): UseChartReturn {
  const [data, setData] = useState<ChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchChartData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Fetch all rentals
      const response = await getStaffRentals({ 
        page: 1,
        limit: 100
      }).catch(() => ({ 
        success: true, 
        data: { 
          rentals: [], 
          pagination: { page: 1, limit: 1, total: 0, pages: 0 } 
        } 
      }));

      // Initialize hourly data (0-23)
      const hourlyData: ChartData[] = Array.from({ length: 24 }, (_, i) => ({
        hour: `${i.toString().padStart(2, '0')}:00`,
        rentals: 0
      }));

      // Group rentals by hour (only today's rentals)
      response.data.rentals.forEach(rental => {
        try {
          const startDate = new Date(rental.actual_start_time);
          if (!isNaN(startDate.getTime()) && startDate >= today && startDate < tomorrow) {
            const hour = startDate.getHours();
            if (hour >= 0 && hour < 24) {
              hourlyData[hour].rentals++;
            }
          }
        } catch (e) {
          console.warn('Invalid rental date:', rental.actual_start_time);
        }
      });

      // Filter to show only business hours (6:00 - 22:00)
      const filteredData = hourlyData.filter((_, index) => index >= 6 && index <= 22);
      
      setData(filteredData);
    } catch (err) {
      console.error('Error fetching chart data:', err);
      setError('Không thể tải dữ liệu biểu đồ');
      
      // Fallback to empty data for business hours
      setData(Array.from({ length: 17 }, (_, i) => ({
        hour: `${(i + 6).toString().padStart(2, '0')}:00`,
        rentals: 0
      })));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChartData();
  }, []);

  return { data, isLoading, error, refetch: fetchChartData };
}

