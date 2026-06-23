import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [userData, setUserData] = useState(() => {
    try {
      const stored = localStorage.getItem('ooms_user_data');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const navigate = useNavigate();

  const login = (token, profile, authMeta = {}) => {
    const newData = { token, ...profile, ...authMeta };
    setUserData(newData);
    localStorage.setItem('ooms_user_data', JSON.stringify(newData));
    navigate('/dashboard');
  };

  const updateProfile = (profile) => {
    if (userData && userData.token) {
      const newData = { ...userData, ...profile };
      setUserData(newData);
      localStorage.setItem('ooms_user_data', JSON.stringify(newData));
      // Optionally navigate to dashboard after switching profile
      navigate('/dashboard');
    }
  };

  const logout = () => {
    setUserData(null);
    localStorage.removeItem('ooms_user_data');
    navigate('/login');
  };

  const openProfileModal = () => setIsProfileModalOpen(true);
  const closeProfileModal = () => setIsProfileModalOpen(false);

  return (
    <AuthContext.Provider
      value={{
        userData,
        login,
        logout,
        updateProfile,
        isProfileModalOpen,
        openProfileModal,
        closeProfileModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
