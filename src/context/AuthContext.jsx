import React, { createContext, useContext, useState, useEffect } from 'react';
import { getApiUrl } from '../lib/api.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('polimdo_token') || null);
  const [loading, setLoading] = useState(true);

  // Validate stored session on startup
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('polimdo_token');
      const storedUser = localStorage.getItem('polimdo_user');

      if (storedToken) {
        try {
          const res = await fetch(getApiUrl('/api/auth/me'), {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          });
          const data = await res.json();

          if (res.ok && data.success && data.user) {
            setUser(data.user);
            setToken(storedToken);
          } else {
            // Token is invalid or expired -> clean up
            console.warn("Session expired or invalid, logging out.");
            logout();
          }
        } catch (e) {
          // If network error, still allow offline user if available
          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser));
            } catch (err) {
              logout();
            }
          }
        }
      } else {
        logout();
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const res = await fetch(getApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      // Guard: check response is actually JSON before parsing
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server tidak merespons. Pastikan server backend sudah berjalan (npm run server).');
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Login gagal. Periksa username & password.');
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('polimdo_token', data.token);
      localStorage.setItem('polimdo_user', JSON.stringify(data.user));
      return { success: true, user: data.user, message: data.message };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('polimdo_token');
    localStorage.removeItem('polimdo_user');
  };

  const isAuthenticated = Boolean(user && token);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
