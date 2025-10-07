import { ApiError } from './auth';

// Types for KYC data
export interface PendingKycUser {
  _id: string;
  userId: string;
  email: string;
  fullname: string;
  status: string;
  rejectionReason: string;
  verificationMethod: string;
  autoApproved: boolean;
  
  // Identity Card Information
  identityCard: string;
  identityCardType: string;
  identityCardFrontImage: string;
  identityCardBackImage: string;
  identityCardFrontUploaded: boolean;
  identityCardBackUploaded: boolean;
  identityName: string;
  identityDob: string;
  identityHome: string;
  identityAddress: string;
  identitySex: string;
  identityNationality: string;
  identityDoe: string;
  identityIssueDate: string;
  identityIssueLoc: string;
  identityFeatures: string;
  identityReligion: string;
  identityEthnicity: string;
  
  // License Information
  licenseNumber: string;
  licenseImage: string;
  licenseBackImage: string;
  licenseFrontUploaded: boolean;
  licenseBackUploaded: boolean;
  licenseUploaded: boolean;
  licenseTypeOcr: string;
  licenseName: string;
  licenseDob: string;
  licenseNation: string;
  licenseAddress: string;
  licensePlaceIssue: string;
  licenseIssueDate: string;
  licenseClass: string;
  licenseClassList: string[];
  
  // OCR Data
  identityOcr?: {
    front?: {
      overall_score: string;
      id: string;
      name: string;
      dob: string;
      sex: string;
      nationality: string;
      address: string;
      [key: string]: unknown;
    };
    back?: {
      overall_score: string;
      features: string;
      issue_date: string;
      issue_loc: string;
      [key: string]: unknown;
    };
  };
  
  licenseOcr?: {
    front?: {
      overall_score: string;
      name: string;
      dob: string;
      class: string;
      [key: string]: unknown;
    };
  };
  
  // Timestamps
  lastUpdatedAt: string;
  createdAt: string;
  updatedAt: string;
  lastKycAt?: string; // Keep for backward compatibility
}

export interface PendingKycResponse {
  count: number;
  users: PendingKycUser[];
}

export interface KycVerifyResponse {
  message: string;
  user: {
    id: string;
    email: string;
    fullname: string;
    kycStatus: string;
  };
}

export interface StaffUploadResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      email: string;
      fullname: string;
    };
    identityCard: {
      id: string;
      name: string;
      dob: string;
      address: string;
      frontImage: string;
    };
    kycStatus: string;
    needsBackImage: boolean;
    validation: {
      nameComparison: {
        match: boolean;
        score: number;
        message: string;
      };
      validationNotes: string;
    };
  };
}

export interface StaffUploadLicenseResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      email: string;
      fullname: string;
    };
    license: {
      id: string;
      name: string;
      class: string;
      image: string;
    };
    kycStatus: string;
    needsBackImage: boolean;
    validation: {
      licenseClassValid: boolean;
      licenseClassMessage: string;
      nameComparison: {
        match: boolean;
        score: number;
        message: string;
      };
      validationNotes: string;
    };
  };
}

export interface StaffUploadLicenseBackResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      id: string;
      email: string;
      fullname: string;
    };
    license: {
      backImage: string;
    };
    kycStatus: string;
    needsFrontImage: boolean;
    validation: {
      nameComparison: {
        match: boolean;
        score: number;
        message: string;
      };
      validationNotes: string;
    };
  };
}

export interface UserNotSubmittedKyc {
  id: string;
  fullname: string;
  email: string;
  phone: string;
  kycStatus: string;
  kycInfo: {
    identityUploaded: boolean;
    licenseUploaded: boolean;
    staffUploaded: boolean;
  };
  createdAt?: string;
  lastLoginAt?: string;
}

export interface UsersNotSubmittedResponse {
  success: boolean;
  message: string;
  data: {
    users: UserNotSubmittedKyc[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    stats: {
      total: number;
      notSubmitted: number;
      rejected: number;
    };
  };
}

export interface CompletedKycUser {
  _id: string;
  userId?: {
    _id: string;
    email: string;
    fullname: string;
    phone: string;
  };
  identityCard: string;
  identityName: string;
  identityDob: string;
  identityAddress: string;
  identitySex: string;
  identityNationality: string;
  identityIssueDate: string;
  identityIssueLoc: string;
  identityFeatures: string;
  identityReligion: string;
  identityEthnicity: string;
  identityCardFrontImage: string;
  identityCardBackImage: string;
  licenseNumber: string;
  licenseName: string;
  licenseDob: string;
  licenseClass: string;
  licenseExpiry: string;
  licenseExpiryText: string;
  licenseImage: string;
  licenseBackImage: string;
  status: string;
  validationScore: number;
  nameComparison: {
    match: boolean;
    score: number;
    message: string;
  };
  validationNotes: string;
  approvedAt: string;
  approvedBy?: {
    _id: string;
    fullname: string;
    email: string;
  };
  lastUpdatedAt: string;
}

export interface CompletedKycResponse {
  success: boolean;
  message: string;
  data: {
    kycs: CompletedKycUser[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
    stats: {
      approved: number;
      rejected: number;
      pending: number;
      total: number;
    };
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

// Helper function to get auth headers for file upload
function getAuthHeadersForUpload(): HeadersInit {
  const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
  const headers: HeadersInit = {};
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
}

// API function to get pending KYC requests
export async function getPendingKyc(): Promise<PendingKycResponse> {
  const res = await fetch(apiUrl('/api/kyc/pending'), {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(text || 'Lỗi khi lấy danh sách KYC đang chờ xử lý', res.status);
  }

  return res.json();
}

// API function to approve/reject KYC requests
export async function updateKycStatus(userId: string, approved: boolean, rejectionReason?: string): Promise<KycVerifyResponse> {
  const res = await fetch(apiUrl('/api/kyc/verify'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      userId: userId,
      action: approved ? 'approve' : 'reject',
      rejectionReason: rejectionReason || '',
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(text || 'Lỗi khi cập nhật trạng thái KYC', res.status);
  }

  return res.json();
}

// API function for staff to upload identity card front image
export async function staffUploadIdentityCardFront(userId: string, imageFile: File): Promise<StaffUploadResponse> {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('userId', userId);

  const res = await fetch(apiUrl('/api/kyc/staff/identity-card/front'), {
    method: 'POST',
    headers: getAuthHeadersForUpload(),
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(text || 'Lỗi khi tải lên mặt trước CCCD', res.status);
  }

  return res.json();
}

// API function for staff to upload identity card back image
export async function staffUploadIdentityCardBack(userId: string, imageFile: File): Promise<StaffUploadResponse> {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('userId', userId);

  const res = await fetch(apiUrl('/api/kyc/staff/identity-card/back'), {
    method: 'POST',
    headers: getAuthHeadersForUpload(),
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(text || 'Lỗi khi tải lên mặt sau CCCD', res.status);
  }

  return res.json();
}

// API function for staff to upload license image
export async function staffUploadLicense(userId: string, imageFile: File): Promise<StaffUploadResponse> {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('userId', userId);

  const res = await fetch(apiUrl('/api/kyc/staff/license'), {
    method: 'POST',
    headers: getAuthHeadersForUpload(),
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(text || 'Lỗi khi tải lên GPLX', res.status);
  }

  return res.json();
}

// API function for staff to upload license front image
export async function staffUploadLicenseFront(userId: string, imageFile: File): Promise<StaffUploadLicenseResponse> {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('userId', userId);

  const res = await fetch(apiUrl('/api/kyc/staff/license/front'), {
    method: 'POST',
    headers: getAuthHeadersForUpload(),
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(text || 'Lỗi khi tải lên mặt trước GPLX', res.status);
  }

  return res.json();
}

// API function for staff to upload license back image
export async function staffUploadLicenseBack(userId: string, imageFile: File): Promise<StaffUploadLicenseBackResponse> {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('userId', userId);

  const res = await fetch(apiUrl('/api/kyc/staff/license/back'), {
    method: 'POST',
    headers: getAuthHeadersForUpload(),
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(text || 'Lỗi khi tải lên mặt sau GPLX', res.status);
  }

  return res.json();
}

// API function to get users who haven't submitted KYC
export async function getUsersNotSubmittedKyc(params: {
  page?: number;
  limit?: number;
  search?: string;
  kycStatus?: 'all' | 'not_submitted' | 'rejected';
  sortBy?: 'createdAt' | 'lastLoginAt' | 'fullname';
  sortOrder?: 'asc' | 'desc';
} = {}): Promise<UsersNotSubmittedResponse> {
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.search) queryParams.append('search', params.search);
  if (params.kycStatus) queryParams.append('kycStatus', params.kycStatus);
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

  const res = await fetch(apiUrl(`/api/kyc/users-not-submitted?${queryParams.toString()}`), {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(text || 'Lỗi khi lấy danh sách users chưa submit KYC', res.status);
  }

  return res.json();
}

// API function to get completed KYC requests
export async function getCompletedKyc(params: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'approvedAt' | 'lastUpdatedAt' | 'identityName' | 'identityCard' | 'licenseNumber';
  sortOrder?: 'asc' | 'desc';
} = {}): Promise<CompletedKycResponse> {
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.search) queryParams.append('search', params.search);
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

  const res = await fetch(apiUrl(`/api/kyc/completed?${queryParams.toString()}`), {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new ApiError(text || 'Lỗi khi lấy danh sách KYC đã completed', res.status);
  }

  return res.json();
}