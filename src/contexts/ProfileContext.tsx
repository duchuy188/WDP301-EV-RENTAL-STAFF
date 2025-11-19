import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getProfile, ProfileResponse, ApiError } from '../api/auth';

interface ProfileContextType {
  profile: ProfileResponse | null;
  updateProfile: (newProfile: ProfileResponse) => void;
  refreshProfile: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

interface ProfileProviderProps {
  children: ReactNode;
}

export const ProfileProvider: React.FC<ProfileProviderProps> = ({ children }) => {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = (newProfile: ProfileResponse) => {
    setProfile(newProfile);
  };

  const refreshProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getProfile();
      setProfile(data);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Không thể tải hồ sơ';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getProfile();
        if (!isMounted) return;
        setProfile(data);
      } catch (err) {
        const message = err instanceof ApiError ? err.message : 'Không thể tải hồ sơ';
        if (!isMounted) return;
        setError(message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const value: ProfileContextType = {
    profile,
    updateProfile,
    refreshProfile,
    isLoading,
    error
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};
