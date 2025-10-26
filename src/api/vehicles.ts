import { ApiError } from './auth';

// Types for Vehicle data
export interface Station {
  _id: string;
  code: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
}

export interface Vehicle {
  _id: string;
  license_plate: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  type: 'scooter' | 'motorcycle';
  battery_capacity: number;
  max_range: number;
  current_battery: number;
  current_mileage?: number;
  price_per_day: number;
  deposit_percentage: number;
  status: 'available' | 'rented' | 'maintenance' | 'reserved';
  technical_status: 'excellent' | 'good' | 'fair' | 'poor';
  images: string[];
  station_id: Station;
  has_license_plate: boolean;
  created_by?: string;
  is_active?: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface VehiclesResponse {
  vehicles: Vehicle[];
  statistics: {
    available: number;
    rented: number;
    maintenance?: number;
    reserved?: number;
  };
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    timestamp?: string;
  };
}

export interface Maintenance {
  code: string;
  vehicle_id: string;
  station_id: string;
  title: string;
  description: string;
  status: string;
  reported_by: string;
  notes: string;
  images: string[];
  is_active: boolean;
  _id: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

// Add new interfaces for the staff vehicle detail response
export interface StaffInfo {
  can_update: boolean;
  can_change_status: boolean;
  can_report_maintenance: boolean;
  can_delete: boolean;
}

export interface VehicleDetail extends Omit<Vehicle, 'created_by'> {
  created_by: {
    _id: string;
    fullname: string;
    email: string;
  };
  staff_info: StaffInfo;
}

export interface VehicleDetailResponse {
  vehicle: VehicleDetail;
}

// API configuration
const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_SWAGGER_URL ||
  '';

const apiUrl = (path: string): string =>
  API_BASE ? `${API_BASE.replace(/\/$/, '')}${path}` : path;

// Helper function to get auth headers
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken') || localStorage.getItem('token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn('No authentication token found. Please login again.');
  }
  
  return headers;
}

// API function to get staff vehicles
export async function getStaffVehicles(params: {
  page?: number;
  limit?: number;
  status?: 'available' | 'rented' | 'maintenance' | 'reserved';
  color?: string;
  type?: 'scooter' | 'motorcycle';
} = {}): Promise<VehiclesResponse> {
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.status) queryParams.append('status', params.status);
  if (params.color) queryParams.append('color', params.color);
  if (params.type) queryParams.append('type', params.type);

  const res = await fetch(apiUrl(`/api/vehicles/staff?${queryParams.toString()}`), {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    let errorMessage = 'Lỗi khi lấy danh sách xe';
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      const text = await res.text().catch(() => '');
      if (text) {
        try {
          const parsedError = JSON.parse(text);
          errorMessage = parsedError.message || parsedError.error || errorMessage;
        } catch {
          errorMessage = text || errorMessage;
        }
      }
    }
    throw new ApiError(errorMessage, res.status);
  }

  return res.json();
}

// API function to get vehicle by ID
export async function getVehicleById(id: string): Promise<{ success: boolean; data: Vehicle }> {
  const res = await fetch(apiUrl(`/api/vehicles/${id}`), {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    let errorMessage = 'Lỗi khi lấy thông tin xe';
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      const text = await res.text().catch(() => '');
      if (text) {
        try {
          const parsedError = JSON.parse(text);
          errorMessage = parsedError.message || parsedError.error || errorMessage;
        } catch {
          errorMessage = text || errorMessage;
        }
      }
    }
    throw new ApiError(errorMessage, res.status);
  }

  return res.json();
}


// API function to update vehicle technical status
export async function updateVehicleTechnicalStatus(
  id: string, 
  technical_status: 'excellent' | 'good' | 'fair' | 'poor'
): Promise<{ success: boolean; message: string; data: Vehicle }> {
  const res = await fetch(apiUrl(`/api/vehicles/${id}/technical-status`), {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ technical_status }),
  });

  if (!res.ok) {
    let errorMessage = 'Lỗi khi cập nhật tình trạng kỹ thuật xe';
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      const text = await res.text().catch(() => '');
      if (text) {
        try {
          const parsedError = JSON.parse(text);
          errorMessage = parsedError.message || parsedError.error || errorMessage;
        } catch {
          errorMessage = text || errorMessage;
        }
      }
    }
    throw new ApiError(errorMessage, res.status);
  }

  return res.json();
}

// API function to update vehicle battery
export async function updateVehicleBattery(
  id: string, 
  current_battery: number
): Promise<{ message: string; vehicle: Vehicle }> {
  const res = await fetch(apiUrl(`/api/vehicles/${id}/battery`), {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ current_battery }),
  });

  if (!res.ok) {
    let errorMessage = 'Lỗi khi cập nhật pin xe';
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      const text = await res.text().catch(() => '');
      if (text) {
        try {
          const parsedError = JSON.parse(text);
          errorMessage = parsedError.message || parsedError.error || errorMessage;
        } catch {
          errorMessage = text || errorMessage;
        }
      }
    }
    throw new ApiError(errorMessage, res.status);
  }

  return res.json();
}

// API function to report vehicle maintenance
export async function reportVehicleMaintenance(
  id: string, 
  reason: string,
  images?: File[]
): Promise<{ message: string; maintenance: Maintenance }> {
  const formData = new FormData();
  formData.append('reason', reason);
  
  if (images && images.length > 0) {
    images.forEach(image => {
      formData.append('images', image);
    });
  }

  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken') || localStorage.getItem('token');
  const headers: HeadersInit = {};
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(apiUrl(`/api/vehicles/${id}/maintenance`), {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!res.ok) {
    let errorMessage = 'Lỗi khi báo cáo bảo trì xe';
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorMessage;
    } catch {
      const text = await res.text().catch(() => '');
      errorMessage = text || errorMessage;
    }
    throw new ApiError(errorMessage, res.status);
  }

  return res.json();
}

// API function to get vehicle details for staff
export async function getStaffVehicleById(id: string): Promise<VehicleDetailResponse> {
  const res = await fetch(apiUrl(`/api/vehicles/staff/${id}`), {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    let errorMessage = 'Lỗi khi lấy chi tiết xe';
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      const text = await res.text().catch(() => '');
      if (text) {
        try {
          const parsedError = JSON.parse(text);
          errorMessage = parsedError.message || parsedError.error || errorMessage;
        } catch {
          errorMessage = text || errorMessage;
        }
      }
    }
    throw new ApiError(errorMessage, res.status);
  }

  return res.json();
}
