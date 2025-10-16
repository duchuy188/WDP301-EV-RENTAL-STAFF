import { ApiError } from './auth';

// Types for Contract data
// Payment interfaces
export interface Payment {
  _id: string;
  code: string;
  rental_id: string;
  user_id: string;
  booking_id: string;
  amount: number;
  payment_method: string;
  status: string;
  payment_type: string;
  reason: string;
  transaction_id: string;
  payment_gateway: string;
  qr_code_data: string;
  vnpay_url: string;
  vnpay_transaction_no: string;
  vnpay_bank_code: string;
  refund_amount: number;
  refund_reason: string;
  refunded_at: string | null;
  refunded_by: string | null;
  notes: string;
  processed_by: string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Contract {
  _id: string;
  code: string;
  title: string;
  status: 'pending' | 'signed' | 'expired' | 'cancelled';
  statusText: string;
  valid_from: string;
  valid_until: string;
  special_conditions: string;
  notes: string;
  contract_file_url: string;
  staff_signature: string;      // base64 string
  customer_signature: string;   // base64 string
  customer_signed_at: string | null;
  staff_signed_at: string | null;
  created_at: string;
  updated_at: string;
  rental: {
    _id: string;
    code: string;
  } | null;
  customer: {
    _id: string;
    fullname: string;
    email: string;
    phone: string;
  };
  vehicle: {
    _id: string;
    name: string;
    license_plate: string;
    model: string;
    color: string;
  };
  station: {
    _id: string;
    name: string;
    address: string;
  };
  template: {
    _id: string;
    name: string;
    title: string;
  };
  staff_signed_by: {
    _id: string;
    fullname: string;
    email: string;
  } | null;
  customer_signed_by: {
    _id: string;
    fullname: string;
    email: string;
  } | null;
  rental_details?: {
    rental_code: string;
    rental_status: string;
    booking_code: string;
    start_date: string;
    end_date: string;
    pickup_time: string;
    return_time: string;
    total_days: number;
    price_per_day: number;
    total_price: number;
    deposit_amount: number;
  };
  payment_summary?: {
    deposit_payment: Payment | null;
    rental_fee_payment: Payment | null;
    additional_fee_payments: Payment[];
  };
}

export interface ContractsResponse {
  success: boolean;
  message: string;
  data: {
    contracts: Contract[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

export interface ContractDetailResponse {
  success: boolean;
  message: string;
  data: {
    contract: Contract;
  };
}

export interface CreateContractRequest {
  rental_id: string;
  notes?: string;
  template_id?: string;
  special_conditions?: string;
}

export interface CreateContractResponse {
  success: boolean;
  message: string;
  data: {
    contract: Contract;
  };
}

export interface SignContractRequest {
  signature: string; // base64 string
  signature_type: 'staff' | 'customer';
}

export interface SignContractResponse {
  success: boolean;
  message: string;
  data: {
    contract: Contract;
  };
}

export interface CancelContractRequest {
  reason: string;
}

export interface CancelContractResponse {
  success: boolean;
  message: string;
  data: {
    contract: Contract;
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

// API function to get contracts with filters
export async function getContracts(params: {
  page?: number;
  limit?: number;
  status?: string;
  station_id?: string;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
} = {}): Promise<ContractsResponse> {
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.status) queryParams.append('status', params.status);
  if (params.station_id) queryParams.append('station_id', params.station_id);
  if (params.search) queryParams.append('search', params.search);
  if (params.sort) queryParams.append('sort', params.sort);
  if (params.order) queryParams.append('order', params.order);

  const res = await fetch(apiUrl(`/api/contracts?${queryParams.toString()}`), {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    let errorMessage = 'Lỗi khi lấy danh sách contracts';
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

// API function to get contract detail by ID
export async function getContractById(id: string): Promise<ContractDetailResponse> {
  const res = await fetch(apiUrl(`/api/contracts/${id}`), {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    let errorMessage = 'Lỗi khi lấy chi tiết contract';
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

// API function to create new contract from rental
export async function createContract(data: CreateContractRequest): Promise<CreateContractResponse> {
  const res = await fetch(apiUrl('/api/contracts'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    const errorMessage = errorData?.message || 'Lỗi khi tạo contract';
    throw new ApiError(errorMessage, res.status);
  }

  return res.json();
}

// API function to sign contract (staff or customer)
export async function signContract(id: string, data: SignContractRequest): Promise<SignContractResponse> {
  const res = await fetch(apiUrl(`/api/contracts/${id}/sign`), {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    const errorMessage = errorData?.message || 'Lỗi khi ký contract';
    throw new ApiError(errorMessage, res.status);
  }

  return res.json();
}

// API function to download contract PDF
export async function downloadContractPdf(id: string): Promise<void> {
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  
  const headers: HeadersInit = {
    'Accept': 'application/pdf',
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(apiUrl(`/api/contracts/${id}/pdf`), {
    method: 'GET',
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    const errorMessage = errorData?.message || 'Lỗi khi tải PDF contract';
    throw new ApiError(errorMessage, res.status);
  }

  // Get the blob from response
  const blob = await res.blob();
  
  // Get filename from Content-Disposition header
  const contentDisposition = res.headers.get('Content-Disposition');
  let filename = 'contract.pdf';
  
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename="(.+)"/);
    if (filenameMatch) {
      filename = filenameMatch[1];
    }
  }
  
  // Create a temporary URL for the blob
  const url = window.URL.createObjectURL(blob);
  
  // Create a temporary anchor element and trigger download
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  
  // Cleanup
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

// API function to cancel contract
export async function cancelContract(id: string, data: CancelContractRequest): Promise<CancelContractResponse> {
  const res = await fetch(apiUrl(`/api/contracts/${id}/cancel`), {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    const errorMessage = errorData?.message || 'Lỗi khi hủy contract';
    throw new ApiError(errorMessage, res.status);
  }

  return res.json();
}

