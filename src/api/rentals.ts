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
  contract?: {
    status: 'pending' | 'signed' | 'cancelled' | 'expired';
    code: string;
    staff_signed_at: string | null;
    customer_signed_at: string | null;
    staff_signed_by: string | null;
    customer_signed_by: string | null;
    is_signed: boolean;
  } | null;
}

export interface RentalDetailResponse {
  success: boolean;
  data: RentalDetail;
}

// Type for checkout info (from GET /api/rentals/{id}/checkout-info)
export interface CheckoutInfo {
  rental: {
    id: string;
    code: string;
    actual_start_time: string;
    vehicle_condition_before: VehicleCondition;
    images_before: string[];
    rental_duration_hours: number;
  };
  customer: {
    id: string;
    fullname: string;
    email: string;
    phone: string;
  };
  vehicle: {
    id: string;
    name: string;
    license_plate: string;
    model: string;
    battery_capacity: number;
  };
  station: {
    id: string;
    name: string;
    address: string;
  };
  pickup_staff: {
    id: string;
    fullname: string;
  };
}

export interface CheckoutInfoResponse {
  success: boolean;
  data: CheckoutInfo;
}

// Type for checkout normal response
export interface CheckoutNormalResponse {
  success: boolean;
  message: string;
  data: {
    rental: {
      id: string;
      code: string;
      actual_end_time: string;
      total_fees: number;
      status: string;
    };
    fee_breakdown: {
      late_fee: number;
      damage_fee: number;
      other_fees: number;
      total_fees: number;
    };
    payments: Array<{
      id: string;
      type: string;
      amount: number;
      status: string;
      payment_method?: string;
      description?: string;
    }>;
    total_paid: number;
    vehicle_status: string;
    images: {
      uploaded: string[];
    } | null;
    checkout_info: {
      rental_days: number;
      payment_required: boolean;
      status_reason: string;
    };
  };
}

// Type for checkout fees response
export interface CheckoutFeesResponse {
  success: boolean;
  message: string;
  data: {
    rental: {
      id: string;
      code: string;
      actual_end_time: string;
      total_fees: number;
      status: string;
    };
    fee_breakdown: {
      late_fee: number;
      damage_fee: number;
      other_fees: number;
      total_fees: number;
    };
    payments: Array<{
      id: string;
      type: string;
      amount: number;
      status: string;
      payment_method?: string;
      description?: string;
    }>;
    total_paid: number;
    vehicle_status: string;
    payment_urls?: {
      [key: string]: {
        paymentUrl: string;
        orderId: string;
        amount: number;
        paymentType: string;
      };
    };
    images: {
      uploaded: string[];
    } | null;
  };
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

// API function to get checkout info
export async function getCheckoutInfo(id: string): Promise<CheckoutInfoResponse> {
  const res = await fetch(apiUrl(`/api/rentals/${id}/checkout-info`), {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(text || 'Lỗi khi lấy thông tin checkout', res.status);
  }

  return res.json();
}

// API function for normal checkout
export async function checkoutNormal(
  id: string,
  data: {
    photos: File[];
    mileage: number;
    battery_level: number;
    exterior_condition: string;
    interior_condition: string;
    inspection_notes?: string;
    damage_description?: string;
    payment_method?: string;
    customer_notes?: string;
  }
): Promise<CheckoutNormalResponse> {
  const formData = new FormData();
  
  // Add files
  data.photos.forEach((photo) => {
    formData.append('photos', photo);
  });
  
  // Add other fields
  formData.append('mileage', data.mileage.toString());
  formData.append('battery_level', data.battery_level.toString());
  formData.append('exterior_condition', data.exterior_condition);
  formData.append('interior_condition', data.interior_condition);
  
  if (data.inspection_notes) formData.append('inspection_notes', data.inspection_notes);
  if (data.damage_description) formData.append('damage_description', data.damage_description);
  if (data.payment_method) formData.append('payment_method', data.payment_method);
  if (data.customer_notes) formData.append('customer_notes', data.customer_notes);

  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  const headers: HeadersInit = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(apiUrl(`/api/rentals/${id}/checkout-normal`), {
    method: 'PUT',
    headers,
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(text || 'Lỗi khi thực hiện checkout', res.status);
  }

  return res.json();
}

// API function for checkout with fees
export async function checkoutFees(
  id: string,
  data: {
    photos: File[];
    mileage: number;
    battery_level: number;
    exterior_condition: string;
    interior_condition: string;
    inspection_notes?: string;
    damage_description?: string;
    payment_method?: string;
    customer_notes?: string;
    late_fee?: number;
    damage_fee?: number;
    other_fees?: number;
  }
): Promise<CheckoutFeesResponse> {
  const formData = new FormData();
  
  // Add files
  data.photos.forEach((photo) => {
    formData.append('photos', photo);
  });
  
  // Add other fields
  formData.append('mileage', data.mileage.toString());
  formData.append('battery_level', data.battery_level.toString());
  formData.append('exterior_condition', data.exterior_condition);
  formData.append('interior_condition', data.interior_condition);
  
  if (data.inspection_notes) formData.append('inspection_notes', data.inspection_notes);
  if (data.damage_description) formData.append('damage_description', data.damage_description);
  if (data.payment_method) formData.append('payment_method', data.payment_method);
  if (data.customer_notes) formData.append('customer_notes', data.customer_notes);
  
  // Add fee fields
  if (data.late_fee !== undefined) formData.append('late_fee', data.late_fee.toString());
  if (data.damage_fee !== undefined) formData.append('damage_fee', data.damage_fee.toString());
  if (data.other_fees !== undefined) formData.append('other_fees', data.other_fees.toString());

  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  const headers: HeadersInit = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(apiUrl(`/api/rentals/${id}/checkout-fees`), {
    method: 'PUT',
    headers,
    body: formData,
  });

  if (!res.ok) {
    let errorMessage = 'Lỗi khi thực hiện checkout có phí';
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

