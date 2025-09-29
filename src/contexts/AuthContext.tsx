import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { login as apiLogin, logout as apiLogout, getStoredTokens, setStoredTokens, clearStoredTokens, LoginPayload, ApiError } from '../api/auth';

interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface RegisterData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in on app start
    const { token } = getStoredTokens();
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        clearStoredTokens();
      }
    } else {
      // Clear any incomplete auth data
      clearStoredTokens();
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const payload: LoginPayload = { email, password };
      const response = await apiLogin(payload);
      
      // Lưu tokens và user data
      setStoredTokens({
        token: response.token,
        refreshToken: response.refreshToken
      });
      localStorage.setItem('user', JSON.stringify(response.user));
      
      setUser(response.user);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error('Đăng nhập thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<void> => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Here you would typically make an API call to register
      const newUser: User = {
        id: Date.now().toString(),
        email: userData.email,
        fullName: userData.fullName,
        phone: userData.phone,
        role: 'staff' // Default role for staff registration
      };
      
      setUser(newUser);
      localStorage.setItem('user', JSON.stringify(newUser));
    } catch {
      throw new Error('Đăng ký thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const { refreshToken } = getStoredTokens();
      
      // Gọi API logout nếu có refreshToken
      if (refreshToken) {
        await apiLogout({ refreshToken });
      }
    } catch (error) {
      // Log error nhưng vẫn proceed với logout local
      console.error('Logout API failed:', error);
    } finally {
      // Luôn clear local data dù API có lỗi
      setUser(null);
      clearStoredTokens();
    }
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    isLoading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
