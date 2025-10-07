import { ApiError } from './auth';

// Types for Rental data
export interface VehicleCondition {
  mileage: number | null;
  battery_level: number | null;
  exterior_condition: 'excellent' | 'good' | 'fair' | 'poor' | null;
  interior_condition: 'excellent' | 'good' | 'fair' | 'poor' | null;
  notes: string;
}

export interface Rental {
  _id: string;
  code: string;
  booking_id: string;
  user_id: {
    _id: string;
    fullname: string;
    email: string;
    phone: string;
  };
  vehicle_id: {
    _id: string;
    license_plate: string;
    name: string;
    model: string;
  };
  station_id: {
    _id: string;
    name: string;
    address: string;
  };
  actual_start_time: string;
  actual_end_time: string | null;
  pickup_staff_id: {
    _id: string;
    fullname: string;
  } | null;
  return_staff_id: {
    _id: string;
    fullname: string;
  } | null;
  vehicle_condition_before: VehicleCondition;
  vehicle_condition_after: VehicleCondition;
  images_before: string[];
  images_after: string[];
  status: 'active' | 'pending_payment' | 'completed';
  late_fee: number;
  damage_fee: number;
  other_fees: number;
  total_fees: number;
  staff_notes: string;
  customer_notes: string;
  created_by: string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RentalsResponse {
  success: boolean;
  data: {
    rentals: Rental[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

// Type for detailed rental (from GET /api/rentals/{id})
export interface RentalDetail {
  _id: string;
  code: string;
  booking_id: {
    _id: string;
    start_date: string;
    end_date: string;
    total_price: number;
  };
  user_id: {
    _id: string;
    fullname: string;
    email: string;
    phone: string;
  };
  vehicle_id: {
    _id: string;
    license_plate: string;
    name: string;
    model: string;
    battery_capacity: number;
  };
  station_id: {
    _id: string;
    name: string;
    address: string;
  };
  actual_start_time: string;
  actual_end_time: string | null;
  pickup_staff_id: {
    _id: string;
    fullname: string;
  } | null;
  return_staff_id: {
    _id: string;
    fullname: string;
  } | null;
  vehicle_condition_before: VehicleCondition;
  vehicle_condition_after: VehicleCondition;
  images_before: string[];
  images_after: string[];
  status: 'active' | 'pending_payment' | 'completed';
  late_fee: number;
  damage_fee: number;
  other_fees: number;
  total_fees: number;
  staff_notes: string;
  customer_notes: string;
  created_by: string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RentalDetailResponse {
  success: boolean;
  data: RentalDetail;
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
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
}

// API function to get staff rentals
export async function getStaffRentals(params: {
  status?: 'active' | 'pending_payment' | 'completed';
  page?: number;
  limit?: number;
} = {}): Promise<RentalsResponse> {
  const queryParams = new URLSearchParams();
  
  if (params.status) queryParams.append('status', params.status);
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());

  const res = await fetch(apiUrl(`/api/rentals/staff?${queryParams.toString()}`), {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(text || 'Lỗi khi lấy danh sách rentals', res.status);
  }

  return res.json();
}

// API function to get rental detail by ID
export async function getRentalById(id: string): Promise<RentalDetailResponse> {
  const res = await fetch(apiUrl(`/api/rentals/${id}`), {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(text || 'Lỗi khi lấy chi tiết rental', res.status);
  }

  return res.json();
}

