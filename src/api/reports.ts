import { ApiError } from './auth';

export interface Report {
  _id: string;
  code: string;
  rental_id: {
    _id: string;
    code: string;
    vehicle_condition_before?: {
      mileage: number;
      battery_level: number;
      exterior_condition: string;
      interior_condition: string;
      notes: string;
    };
    actual_start_time?: string;
    status?: string;
  };
  booking_id: string | {
    _id: string;
    code: string;
    start_date: string;
    end_date: string;
    total_price: number;
    deposit_amount: number;
  };
  user_id: {
    _id: string;
    email: string;
    phone: string;
    avatar?: string;
  };
  vehicle_id: {
    _id: string;
    license_plate: string;
    name: string;
    brand?: string;
    model?: string;
    color?: string;
    type?: string;
    current_battery?: number;
    current_mileage?: number;
  };
  station_id: {
    _id: string;
    name: string;
    address: string;
    phone?: string;
  };
  issue_type: 'battery_issue' | 'vehicle_breakdown' | 'accident' | string;
  description: string;
  images: string[];
  status: 'pending' | 'resolved';
  resolution_notes: string;
  resolved_at: string | null;
  resolved_by: {
    _id: string;
    email?: string;
  } | null;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface GetReportsParams {
  status?: string;
  issue_type?: string;
  station_id?: string;
  page?: number;
  limit?: number;
}

export interface GetReportsResponse {
  success: boolean;
  data: Report[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
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

// API function to get reports
export async function getReports(params?: GetReportsParams): Promise<GetReportsResponse> {
  const searchParams = new URLSearchParams();

  if (params?.status) {
    searchParams.append('status', params.status);
  }
  if (params?.issue_type) {
    searchParams.append('issue_type', params.issue_type);
  }
  if (params?.station_id) {
    searchParams.append('station_id', params.station_id);
  }
  if (params?.page) {
    searchParams.append('page', params.page.toString());
  }
  if (params?.limit) {
    searchParams.append('limit', params.limit.toString());
  }

  const queryString = searchParams.toString();
  const url = queryString
    ? `${apiUrl('/api/reports')}?${queryString}`
    : apiUrl('/api/reports');

  const res = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(text || 'Lỗi khi lấy danh sách báo cáo', res.status);
  }

  return res.json();
}

// API function to get report by ID
export async function getReportById(id: string): Promise<{ success: boolean; data: Report }> {
  const url = apiUrl(`/api/reports/${id}`);

  const res = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(text || 'Lỗi khi lấy chi tiết báo cáo', res.status);
  }

  return res.json();
}

// API function to get reports statistics
export interface ReportStats {
  total: number;
  pending: number;
  resolved: number;
  byType: Array<{
    _id: string;
    count: number;
  }>;
}

export async function getReportStats(station_id?: string): Promise<{ success: boolean; data: ReportStats }> {
  const searchParams = new URLSearchParams();
  
  if (station_id) {
    searchParams.append('station_id', station_id);
  }

  const queryString = searchParams.toString();
  const url = queryString
    ? `${apiUrl('/api/reports/stats')}?${queryString}`
    : apiUrl('/api/reports/stats');

  const res = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(text || 'Lỗi khi lấy thống kê báo cáo', res.status);
  }

  return res.json();
}

// API function to resolve report
export interface ResolveReportRequest {
  resolution_notes: string;
}

export async function resolveReport(
  id: string,
  data: ResolveReportRequest
): Promise<{ success: boolean; message: string; data: Report }> {
  const url = apiUrl(`/api/reports/${id}/resolve`);

  const res = await fetch(url, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(text || 'Lỗi khi giải quyết báo cáo', res.status);
  }

  return res.json();
}
