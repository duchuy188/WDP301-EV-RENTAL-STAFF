import { ApiError } from './auth';

// Types for payment data
export interface User {
  _id: string;
  fullname: string;
  email: string;
  phone: string;
}

export interface Booking {
  _id: string;
  code: string;
  start_date: string;
  end_date: string;
}

export interface Rental {
  _id: string;
  code: string;
  status: string;
}

export interface ProcessedBy {
  _id: string;
  fullname: string;
  email: string;
}

export interface Payment {
  _id: string;
  code: string;
  amount: number;
  payment_method: 'cash' | 'qr_code' | 'bank_transfer' | 'vnpay';
  payment_type: 'deposit' | 'rental_fee' | 'additional_fee' | 'refund';
  status: 'pending' | 'completed' | 'cancelled';
  reason?: string;
  transaction_id?: string;
  qr_code_data?: string;
  qr_code_image?: string;
  vnpay_url?: string;
  vnpay_transaction_no?: string;
  vnpay_bank_code?: string;
  notes?: string;
  refund_amount?: number;
  refund_reason?: string;
  refunded_at?: string;
  refunded_by?: string | ProcessedBy;
  user_id: string | User;
  booking_id: string | Booking;
  rental_id?: string | Rental | null;
  processed_by?: string | ProcessedBy;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaymentListParams {
  page?: number;
  limit?: number;
  status?: 'pending' | 'completed' | 'cancelled';
  payment_type?: 'deposit' | 'rental_fee' | 'additional_fee' | 'refund';
  payment_method?: 'cash' | 'qr_code' | 'bank_transfer' | 'vnpay';
  search?: string;
  sort?: 'createdAt' | 'updatedAt' | 'amount';
  order?: 'asc' | 'desc';
}

export interface PaymentSummary {
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  refundAmount: number;
  paymentTypes: Record<string, number>;
  paymentMethods: Record<string, number>;
}

export interface PaymentListResponse {
  message?: string;
  payments: Payment[];
  summary?: PaymentSummary;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    timestamp: string;
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

// API function to get payments list
export async function getPayments(params?: PaymentListParams): Promise<PaymentListResponse> {
  const searchParams = new URLSearchParams();
  
  if (params?.page) {
    searchParams.append('page', params.page.toString());
  }
  if (params?.limit) {
    searchParams.append('limit', params.limit.toString());
  }
  if (params?.status) {
    searchParams.append('status', params.status);
  }
  if (params?.payment_type) {
    searchParams.append('payment_type', params.payment_type);
  }
  if (params?.payment_method) {
    searchParams.append('payment_method', params.payment_method);
  }
  if (params?.search) {
    searchParams.append('search', params.search);
  }
  if (params?.sort) {
    searchParams.append('sort', params.sort);
  }
  if (params?.order) {
    searchParams.append('order', params.order);
  }

  const queryString = searchParams.toString();
  const url = queryString 
    ? `${apiUrl('/api/payments')}?${queryString}`
    : apiUrl('/api/payments');

  const res = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(text || 'Lỗi khi lấy danh sách payments', res.status);
  }

  return res.json();
}

// API function to get payment details
export async function getPaymentDetails(paymentId: string): Promise<{ message: string; payment: Payment }> {
  const res = await fetch(apiUrl(`/api/payments/${paymentId}`), {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(text || 'Lỗi khi lấy thông tin payment', res.status);
  }

  return res.json();
}

// Types for create payment
export interface CreatePaymentRequest {
  booking_id: string;
  payment_type: 'deposit' | 'rental_fee' | 'additional_fee' | 'refund';
  payment_method: 'cash' | 'qr_code' | 'bank_transfer' | 'vnpay';
  rental_id?: string;
  amount?: number;
  reason?: string;
  notes?: string;
}

export interface QRData {
  qrData: string;
  qrImageUrl: string;
  qrText: string;
  vnpayData?: {
    paymentUrl: string;
    orderId: string;
    txnRef: string;
    orderInfo: string;
    amount: number;
    createDate: string;
    expireDate: string;
    params: Record<string, string>;
  };
}

export interface CreatePaymentResponse {
  message: string;
  payment: Payment;
  qrData?: QRData;
}

// API function to create payment
export async function createPayment(data: CreatePaymentRequest): Promise<CreatePaymentResponse> {
  const res = await fetch(apiUrl('/api/payments'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(text || 'Lỗi khi tạo payment', res.status);
  }

  return res.json();
}
