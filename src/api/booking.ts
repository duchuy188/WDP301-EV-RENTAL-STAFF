import { ApiError } from './auth';

// Types for booking data
export interface User {
  _id: string;
  fullname: string;
  email: string;
  phone: string;
  kycStatus: string;
}

export interface Vehicle {
  _id: string;
  license_plate: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  price_per_day: number;
  images: string[];
}

export interface Station {
  _id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  opening_time: string;
  closing_time: string;
}

export interface StaffUser {
  _id: string;
  fullname: string;
}

export interface Booking {
  _id: string;
  code: string;
  user_id: string | User;
  vehicle_id: string | Vehicle;
  station_id: string | Station;
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
  cancelled_by?: string | StaffUser;
  confirmed_at?: string;
  confirmed_by?: string | StaffUser;
  qr_code?: string;
  qr_expires_at?: string;
  qr_used_at?: string;
  created_by: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
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
  startDate?: string; // YYYY-MM-DD format
  endDate?: string; // YYYY-MM-DD format
  dateType?: 'booking' | 'pickup' | 'return'; // Loại ngày để lọc
}

export interface BookingDetailResponse {
  message: string;
  booking: Booking;
  canCancel?: boolean;
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
  if (params?.startDate) {
    searchParams.append('startDate', params.startDate);
  }
  if (params?.endDate) {
    searchParams.append('endDate', params.endDate);
  }
  if (params?.dateType) {
    searchParams.append('dateType', params.dateType);
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
export async function getBookingDetails(bookingId: string): Promise<BookingDetailResponse> {
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
  mileage?: number; // Số km đã đi (theo API spec)
  battery_level?: number; // Mức pin (%)
  exterior_condition?: string; // Tình trạng ngoại thất
  interior_condition?: string; // Tình trạng nội thất
  notes?: string; // Ghi chú về tình trạng xe
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
  payment?: Payment;
  rental?: Rental;
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
  const res = await fetch(apiUrl(`/api/bookings/${bookingId}`), {
    method: 'DELETE',
    headers: getAuthHeaders(),
    body: JSON.stringify({ reason }),
  });

  if (!res.ok) {
    let errorMessage = 'Lỗi khi hủy đặt xe';
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

  const data = await res.json();
  // API có thể trả về { message, booking } hoặc chỉ booking object
  return data.booking || data;
}

// Types for walk-in booking
export interface WalkInBookingRequest {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_cmnd: string;
  model: string;
  color: string;
  start_date: string; // YYYY-MM-DD format
  end_date: string; // YYYY-MM-DD format
  pickup_time: string; // HH:mm format
  return_time: string; // HH:mm format
  special_requests?: string;
  notes?: string;
}

export interface WalkInBookingResponse {
  success: boolean;
  message: string;
  data: {
    booking: {
      id: string;
      code: string;
      customer: {
        name: string;
        phone: string;
        email: string;
      };
      vehicle: {
        name: string;
        model: string;
        color: string;
        license_plate: string;
      };
      station: string;
      start_date: string;
      end_date: string;
      total_price: number;
      deposit_amount: number;
      qr_code: string;
      qr_expires_at: string;
    };
    next_steps: string[];
  };
}

// API function to create walk-in booking
export async function createWalkInBooking(
  data: WalkInBookingRequest
): Promise<WalkInBookingResponse> {
  const res = await fetch(apiUrl('/api/bookings/walk-in'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(text || 'Lỗi khi tạo booking walk-in', res.status);
  }

  return res.json();
}

// Types for scan QR API
export interface ScanQRRequest {
  qr_code: string;
}

export interface ScanQRResponse {
  message: string;
  booking: {
    _id: string;
    code: string;
    user: {
      _id: string;
      fullname: string;
      email: string;
      phone: string;
    };
    vehicle: {
      _id: string;
      license_plate: string;
      name: string;
      brand: string;
      model: string;
      color: string;
    };
    station: {
      _id: string;
      name: string;
      address: string;
      phone: string;
    };
    start_date: string;
    end_date: string;
    pickup_time: string;
    return_time: string;
    status: string;
    qr_expires_at: string;
    qr_used_at?: string;
    isCheckedIn: boolean;
  };
}

// API function to scan QR code
export async function scanQRCode(qrCode: string): Promise<ScanQRResponse> {
  const res = await fetch(apiUrl('/api/bookings/scan-qr'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ qr_code: qrCode }),
  });

  if (!res.ok) {
    let errorMessage = 'Lỗi khi quét mã QR';
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