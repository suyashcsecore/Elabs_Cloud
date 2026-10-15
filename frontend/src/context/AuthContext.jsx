import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check current session on mount via GET /api/auth/me
  useEffect(() => {
    async function loadUser() {
      try {
        const res = await api.get('/api/auth/me');
        setUser(res.data?.data?.user || null);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  const login = async (credentials) => {
    const res = await api.post('/api/auth/login', credentials);
    const loggedUser = res.data?.data?.user;
    setUser(loggedUser);
    return loggedUser;
  };

  const register = async (userData) => {
    const res = await api.post('/api/auth/register', userData);
    const newUser = res.data?.data?.user;
    setUser(newUser);
    return newUser;
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        isStudent: user?.role === 'STUDENT',
        isOrganizer: user?.role === 'ORGANIZER',
        isAdmin: user?.role === 'ADMIN',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
