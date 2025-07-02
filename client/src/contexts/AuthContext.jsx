import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      if (!token) {
        setLoading(false);
        return;
      }

      // Vérifier le token avec le backend
      const response = await authService.getProfile();
      if (response.success) {
        setUser(response.data.user);
        setIsAuthenticated(true);
      } else {
        // Token invalide, nettoyer le localStorage
        localStorage.removeItem('auth-token');
        localStorage.removeItem('velocitaleads-auth');
      }
    } catch (error) {
      console.error('Erreur vérification auth:', error);
      // Token invalide, nettoyer le localStorage
      localStorage.removeItem('auth-token');
      localStorage.removeItem('velocitaleads-auth');
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      if (response.success) {
        // Stocker le token dans localStorage
        if (response.data && response.data.accessToken) {
          localStorage.setItem('auth-token', response.data.accessToken);
        }
        setUser(response.data.user);
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, error: response.error };
    } catch (error) {
      console.error('Erreur login:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Erreur de connexion' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await authService.register(userData);
      if (response.success) {
        setUser(response.user);
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, error: response.error };
    } catch (error) {
      console.error('Erreur inscription:', error);
      return { 
        success: false, 
        error: error.response?.data?.error || 'Erreur d\'inscription' 
      };
    }
  };

  const logout = async () => {
    try {
      // Supprimer le token du localStorage
      localStorage.removeItem('auth-token');
      localStorage.removeItem('velocitaleads-auth');
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Erreur logout:', error);
    }
  };

  const updateUser = (userData) => {
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    updateUser,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};