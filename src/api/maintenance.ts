import { getAuthHeaders } from './auth';

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_SWAGGER_URL ||
  '';

const apiUrl = (path: string): string =>
  API_BASE ? `${API_BASE.replace(/\/$/, '')}${path}` : path;

// Types based on API response
export interface MaintenanceVehicle {
  _id: string;
  license_plate: string;
  name: string;
  model: string;
  type: string;
}

export interface MaintenanceVehicleDetail extends MaintenanceVehicle {
  brand: string;
  year: number;
  color: string;
  current_battery: number;
  current_mileage: number;
}

export interface MaintenanceStation {
  _id: string;
  name: string;
  address: string;
}

export interface MaintenanceStationDetail extends MaintenanceStation {
  code: string;
}

export interface MaintenanceReporter {
  _id: string;
  fullname: string;
  email: string;
}

export interface MaintenanceReporterDetail extends MaintenanceReporter {
  role: string;
  phone: string;
}

export type MaintenanceType = 'low_battery' | 'poor_condition' | 'other';
export type MaintenanceStatus = 'reported' | 'fixed' | 'in_progress' | 'cancelled';

export interface MaintenanceReport {
  _id: string;
  code: string;
  vehicle_id: MaintenanceVehicle | null;
  station_id: MaintenanceStation | string;
  maintenance_type?: MaintenanceType;
  title: string;
  description: string;
  status: MaintenanceStatus;
  reported_by: MaintenanceReporter;
  notes: string;
  images: string[];
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface MaintenanceReportDetail {
  _id: string;
  code: string;
  vehicle_id: MaintenanceVehicleDetail | null;
  station_id: MaintenanceStationDetail;
  maintenance_type?: MaintenanceType;
  title: string;
  description: string;
  status: MaintenanceStatus;
  reported_by: MaintenanceReporterDetail;
  notes: string;
  images: string[];
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  __v?: number;
}

export interface MaintenancePagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface GetMaintenanceReportsResponse {
  success: boolean;
  data: {
    reports: MaintenanceReport[];
    pagination: MaintenancePagination;
  };
}

export interface GetMaintenanceReportDetailResponse {
  success: boolean;
  data: MaintenanceReportDetail;
}

export interface GetMaintenanceReportsParams {
  page?: number;
  limit?: number;
  status?: string;
}

export interface UpdateMaintenanceReportPayload {
  status: MaintenanceStatus;
  battery_level?: number;
  // notes and images removed - only for admin handling poor_condition
}

export interface UpdateMaintenanceReportResponse {
  success: boolean;
  message: string;
  data: MaintenanceReportDetail;
}

export class MaintenanceApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

/**
 * Get maintenance reports for the current station (Station Staff)
 * @param params - Query parameters for pagination and filtering
 * @returns Promise with maintenance reports and pagination data
 */
export async function getMaintenanceReports(
  params: GetMaintenanceReportsParams = {}
): Promise<GetMaintenanceReportsResponse> {
  const { page = 1, limit = 25, status = 'all' } = params;

  // Build query string
  const queryParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    status: status,
  });

  const res = await fetch(apiUrl(`/api/maintenance/station?${queryParams}`), {
    method: 'GET',
    headers: {
      ...getAuthHeaders(),
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    let errorMessage = 'Không thể tải báo cáo bảo trì';
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
    throw new MaintenanceApiError(errorMessage, res.status);
  }

  return res.json();
}

/**
 * Get maintenance report detail by ID
 * @param id - Maintenance report ID
 * @returns Promise with detailed maintenance report data
 */
export async function getMaintenanceReportById(
  id: string
): Promise<GetMaintenanceReportDetailResponse> {
  const res = await fetch(apiUrl(`/api/maintenance/${id}`), {
    method: 'GET',
    headers: {
      ...getAuthHeaders(),
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    let errorMessage = 'Không thể tải chi tiết báo cáo bảo trì';
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
    throw new MaintenanceApiError(errorMessage, res.status);
  }

  return res.json();
}

/**
 * Update maintenance report status and details (Staff - Low Battery Fix)
 * Staff can only fix maintenance_type = "low_battery" and must charge battery to >= 80%
 * @param id - Maintenance report ID
 * @param payload - Update data including status and battery_level
 * @returns Promise with updated maintenance report data
 */
export async function updateMaintenanceReport(
  id: string,
  payload: UpdateMaintenanceReportPayload
): Promise<UpdateMaintenanceReportResponse> {
  const formData = new FormData();
  
  // Add required status field
  formData.append('status', payload.status);
  
  // Add battery_level (required for staff fixing low_battery, must be >= 80%)
  if (payload.battery_level !== undefined) {
    formData.append('battery_level', payload.battery_level.toString());
  }

  // Get auth headers but remove Content-Type to let browser set it for FormData
  const { token } = await import('./auth').then(m => m.getStoredTokens());
  const headers: HeadersInit = {
    Accept: 'application/json',
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(apiUrl(`/api/maintenance/${id}`), {
    method: 'PUT',
    headers,
    body: formData,
  });

  if (!res.ok) {
    let errorMessage = 'Không thể cập nhật báo cáo bảo trì';
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
    throw new MaintenanceApiError(errorMessage, res.status);
  }

  return res.json();
}
