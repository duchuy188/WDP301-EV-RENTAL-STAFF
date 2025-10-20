export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    fullName: string;
    phone?: string;
    role: string;
  };
}

export interface LogoutPayload {
  refreshToken: string;
}

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_SWAGGER_URL ||
  '';

const apiUrl = (path: string): string =>
  API_BASE ? `${API_BASE.replace(/\/$/, '')}${path}` : path;

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const res = await fetch(apiUrl('/api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errorMessage = 'Đăng nhập thất bại';
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

export async function logout(payload: LogoutPayload): Promise<void> {
  const res = await fetch(apiUrl('/api/auth/logout'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    let errorMessage = 'Đăng xuất thất bại';
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

  // Logout thành công, không cần return data
}

// Hàm lấy token từ localStorage với type safety
export function getStoredTokens(): { token: string | null; refreshToken: string | null } {
  // Support both legacy keys ('token') and current keys ('accessToken'), and both localStorage/sessionStorage
  const accessTokenLocal = localStorage.getItem('accessToken');
  const accessTokenSession = sessionStorage.getItem('accessToken');
  const legacyToken = localStorage.getItem('token');
  const token = accessTokenLocal || accessTokenSession || legacyToken;

  const refreshTokenLocal = localStorage.getItem('refreshToken');
  const refreshTokenSession = sessionStorage.getItem('refreshToken');
  const refreshToken = refreshTokenLocal || refreshTokenSession || null;

  return { token, refreshToken };
}

// Hàm lưu tokens vào localStorage
export function setStoredTokens(tokens: { token: string; refreshToken: string }): void {
  localStorage.setItem('token', tokens.token);
  localStorage.setItem('refreshToken', tokens.refreshToken);
}

// Hàm clear tokens khỏi localStorage
export function clearStoredTokens(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  // Also clear keys used elsewhere in the app
  localStorage.removeItem('accessToken');
  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('refreshToken');
}

// Hàm check xem user có đăng nhập không
export function isAuthenticated(): boolean {
  const { token } = getStoredTokens();
  return !!token;
}

// Hàm lấy user từ localStorage với type safety
export function getStoredUser(): LoginResponse['user'] | null {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr);
  } catch {
    clearStoredTokens(); // Clear invalid data
    return null;
  }
}

// Hàm tạo headers với Authorization token
export function getAuthHeaders(): HeadersInit {
  const { token } = getStoredTokens();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  return headers;
}

// Profile types based on backend response
export interface ProfileResponse {
  id: string;
  fullname: string;
  email: string;
  role: string;
  avatar: string;
  phone: string;
  address: string;
}

export async function getProfile(): Promise<ProfileResponse> {
  const res = await fetch(apiUrl('/api/auth/profile'), {
    method: 'GET',
    headers: {
      ...getAuthHeaders(),
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    let errorMessage = 'Không thể tải hồ sơ người dùng';
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