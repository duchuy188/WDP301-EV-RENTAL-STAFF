import { useState, useEffect, useMemo } from 'react';

export interface ShiftInfo {
  name: 'Ca sáng' | 'Ca chiều' | 'Ngoài giờ';
  start: string;
  end: string;
  isActive: boolean;
  color: string;
}

export interface UseShiftReturn {
  morningShift: ShiftInfo;
  afternoonShift: ShiftInfo;
  currentShift: ShiftInfo | null;
  progress: number;
  currentTime: Date;
}

export function useDashboardShift(): UseShiftReturn {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // 60 seconds
    
    return () => clearInterval(interval);
  }, []);
  
  // Memoize shift calculations
  const shifts = useMemo(() => {
    const hour = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    const totalMinutes = hour * 60 + minutes;
    
    const morningStart = 6 * 60; // 06:00 = 360 minutes
    const morningEnd = 14 * 60;   // 14:00 = 840 minutes
    const afternoonEnd = 22 * 60; // 22:00 = 1320 minutes
    
    const morningShift: ShiftInfo = {
      name: 'Ca sáng',
      start: '06:00',
      end: '14:00',
      isActive: totalMinutes >= morningStart && totalMinutes < morningEnd,
      color: 'text-gray-600'
    };
    
    const afternoonShift: ShiftInfo = {
      name: 'Ca chiều',
      start: '14:00',
      end: '22:00',
      isActive: totalMinutes >= morningEnd && totalMinutes < afternoonEnd,
      color: 'text-green-600'
    };
    
    // Determine current shift
    let currentShift: ShiftInfo | null = null;
    let progress = 0;
    
    if (morningShift.isActive) {
      currentShift = morningShift;
      progress = ((totalMinutes - morningStart) / (morningEnd - morningStart)) * 100;
    } else if (afternoonShift.isActive) {
      currentShift = afternoonShift;
      progress = ((totalMinutes - morningEnd) / (afternoonEnd - morningEnd)) * 100;
    }
    
    return {
      morningShift,
      afternoonShift,
      currentShift,
      progress: Math.min(Math.max(progress, 0), 100)
    };
  }, [currentTime]);
  
  return {
    ...shifts,
    currentTime
  };
}

