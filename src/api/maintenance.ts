import { ApiError } from './auth';

// Types for Maintenance data
export interface MaintenanceVehicle {
  _id: string;
  license_plate: string;
  name: string;
  model: string;
  type: 'scooter' | 'motorcycle';
}

export interface MaintenanceReporter {
  _id: string;
  fullname: string;
  email: string;
}

export interface MaintenanceReport {
  _id: string;
  code: string;
  vehicle_id: MaintenanceVehicle | null;
  station_id: string | {
    _id: string;
    code: string;
    name: string;
    address: string;
  };
  title: string;
  description: string;
  status: 'reported' | 'fixed';
  reported_by: MaintenanceReporter & {
    role?: string;
    phone?: string;
  };
  notes: string;
  images: string[];
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface MaintenanceReportsResponse {
  success: boolean;
  data: {
    reports: MaintenanceReport[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  };
}

export interface MaintenanceReportDetailResponse {
  success: boolean;
  data: MaintenanceReport;
}

export interface UpdateMaintenanceReportResponse {
  success: boolean;
  message: string;
  data: MaintenanceReport;
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

// API function to get maintenance reports by station
export async function getMaintenanceReportsByStation(params: {
  page?: number;
  limit?: number;
  status?: 'reported' | 'fixed' | 'all';
} = {}): Promise<MaintenanceReportsResponse> {
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.status) queryParams.append('status', params.status);

  const res = await fetch(apiUrl(`/api/maintenance/station?${queryParams.toString()}`), {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(text || 'Lỗi khi lấy báo cáo bảo trì theo trạm', res.status);
  }

  return res.json();
}

// API function to get maintenance report detail by ID
export async function getMaintenanceReportById(id: string): Promise<MaintenanceReportDetailResponse> {
  const res = await fetch(apiUrl(`/api/maintenance/${id}`), {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(text || 'Lỗi khi lấy chi tiết báo cáo bảo trì', res.status);
  }

  return res.json();
}

// API function to update maintenance report status
export async function updateMaintenanceReport(
  id: string,
  data: {
    status: 'reported' | 'fixed';
    notes?: string;
    images?: File[];
  }
): Promise<UpdateMaintenanceReportResponse> {
  const formData = new FormData();
  
  formData.append('status', data.status);
  
  if (data.notes) {
    formData.append('notes', data.notes);
  }
  
  if (data.images && data.images.length > 0) {
    data.images.forEach(image => {
      formData.append('images', image);
    });
  }

  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken') || localStorage.getItem('token');
  const headers: HeadersInit = {};
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn('No authentication token found. Please login again.');
  }

  const res = await fetch(apiUrl(`/api/maintenance/${id}`), {
    method: 'PUT',
    headers,
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(text || 'Lỗi khi cập nhật báo cáo bảo trì', res.status);
  }

  return res.json();
}
