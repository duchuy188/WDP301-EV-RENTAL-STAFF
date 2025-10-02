import { ApiError } from './auth';

// Types for booking data
export interface Booking {
  _id: string;
  code: string;
  user_id: string;
  vehicle_id: string;
  station_id: string;
  start_date: string;
  end_date: string;
  pickup_time: string;
  return_time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'checked_in' | 'in_progress' | 'completed';
  booking_type: 'online' | 'onsite';
  price_per_day: number;
  total_days: number;
  total_price: number;
  deposit_amount: number;
  late_fee: number;
  damage_fee: number;
  other_fees: number;
  final_amount: number;
  special_requests?: string;
  notes?: string;
  cancellation_reason?: string;
  cancelled_at?: string;
  cancelled_by?: string;
  confirmed_at?: string;
  confirmed_by?: string;
  qr_code?: string;
  qr_expires_at?: string;
  qr_used_at?: string;
  created_by: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BookingListResponse {
  message: string;
  bookings: Booking[];
  pagination: {
    current: number;
    total: number;
    count: number;
    totalRecords: number;
  };
}

export interface BookingListParams {
  status?: 'pending' | 'confirmed' | 'cancelled' | 'checked_in' | 'in_progress' | 'completed';
  page?: number;
  limit?: number;
  search?: string;
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

// API function to get booking list by station
export async function getStationBookings(params?: BookingListParams): Promise<BookingListResponse> {
  const searchParams = new URLSearchParams();
  
  if (params?.status) {
    searchParams.append('status', params.status);
  }
  if (params?.page) {
    searchParams.append('page', params.page.toString());
  }
  if (params?.limit) {
    searchParams.append('limit', params.limit.toString());
  }
  if (params?.search) {
    searchParams.append('search', params.search);
  }

  const queryString = searchParams.toString();
  const url = queryString 
    ? `${apiUrl('/api/bookings/station/list')}?${queryString}`
    : apiUrl('/api/bookings/station/list');

  const res = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(text || 'Lỗi khi lấy danh sách đặt xe', res.status);
  }

  return res.json();
}

// API function to get booking details
export async function getBookingDetails(bookingId: string): Promise<Booking> {
  const res = await fetch(apiUrl(`/api/bookings/${bookingId}`), {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(text || 'Lỗi khi lấy thông tin đặt xe', res.status);
  }

  return res.json();
}

// API function to update booking status
export async function updateBookingStatus(
  bookingId: string, 
  status: Booking['status'], 
  reason?: string
): Promise<Booking> {
  const payload: { status: Booking['status']; reason?: string } = { status };
  if (reason) {
    payload.reason = reason;
  }

  const res = await fetch(apiUrl(`/api/bookings/${bookingId}/status`), {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(text || 'Lỗi khi cập nhật trạng thái đặt xe', res.status);
  }

  return res.json();
}

// Types for confirm booking API
export interface VehicleCondition {
  battery_level?: number;
  odometer?: number;
  fuel_level?: number;
  exterior_condition?: string;
  interior_condition?: string;
  issues?: string[];
}

export interface ConfirmBookingRequest {
  vehicle_condition_before: VehicleCondition;
  staff_notes: string;
  files: File[]; // Max 5 images
}

export interface Payment {
  _id: string;
  code: string;
  amount: number;
  payment_method: string;
  payment_type: string;
  status: string;
  reason?: string;
  transaction_id?: string;
  qr_code_data?: string;
  qr_code_image?: string;
  vnpay_url?: string;
  vnpay_transaction_no?: string;
  vnpay_bank_code?: string;
  notes?: string;
  refund_amount: number;
  refund_reason?: string;
  refunded_at?: string;
  refunded_by?: string;
  user_id: string;
  booking_id: string;
  rental_id?: string;
  processed_by?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Rental {
  _id: string;
  code: string;
  images_before: string[];
  vehicle_condition_before: VehicleCondition;
  staff_notes: string;
}

export interface ConfirmBookingResponse {
  message: string;
  booking: Booking;
  payment: Payment;
  rental: Rental;
}

// API function to confirm booking with multipart form data
export async function confirmBooking(
  bookingId: string, 
  data: ConfirmBookingRequest
): Promise<ConfirmBookingResponse> {
  // Create FormData for multipart/form-data
  const formData = new FormData();
  
  // Add vehicle condition as JSON string
  formData.append('vehicle_condition_before', JSON.stringify(data.vehicle_condition_before));
  
  // Add staff notes
  formData.append('staff_notes', data.staff_notes);
  
  // Add files (max 5)
  data.files.slice(0, 5).forEach((file) => {
    formData.append('files', file);
  });

  // Get auth headers but remove Content-Type to let browser set it with boundary
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  const headers: HeadersInit = {};
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(apiUrl(`/api/bookings/${bookingId}/confirm`), {
    method: 'PUT',
    headers,
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(text || 'Lỗi khi xác nhận đặt xe', res.status);
  }

  return res.json();
}

// API function to cancel booking
export async function cancelBooking(bookingId: string, reason: string): Promise<Booking> {
  const res = await fetch(apiUrl(`/api/bookings/${bookingId}/cancel`), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ reason }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(text || 'Lỗi khi hủy đặt xe', res.status);
  }

  return res.json();
}