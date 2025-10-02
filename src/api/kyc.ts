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
  lastKycAt: string;
  createdAt: string;
  updatedAt: string;
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