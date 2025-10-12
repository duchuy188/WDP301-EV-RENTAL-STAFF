import { ApiError } from './auth';

// Types for Contract data
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
    const text = await res.text().catch(() => '');
    throw new ApiError(text || 'Lỗi khi lấy danh sách contracts', res.status);
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
    const text = await res.text().catch(() => '');
    throw new ApiError(text || 'Lỗi khi lấy chi tiết contract', res.status);
  }

  return res.json();
}

