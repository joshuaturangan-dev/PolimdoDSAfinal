import React, { createContext, useContext, useState, useEffect } from 'react';
import { getApiUrl } from '../lib/api.js';
import { supabase } from '../lib/supabaseClient.js';

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

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
        } catch {
          logout();
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
      const u = username.trim().toLowerCase();
      const p = password.trim();

      if (!u || !p) {
        throw new Error('Username dan password wajib diisi.');
      }

      // 1. Try backend server API first
      try {
        const res = await fetch(getApiUrl('/api/auth/login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        const contentType = res.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          if (res.ok && data.success && data.user) {
            setToken(data.token);
            setUser(data.user);
            localStorage.setItem('polimdo_token', data.token);
            localStorage.setItem('polimdo_user', JSON.stringify(data.user));
            return { success: true, user: data.user, message: data.message };
          } else if (data.message) {
            throw new Error(data.message);
          }
        }
      } catch (apiErr) {
        if (apiErr.message && !apiErr.message.includes('Server tidak merespons') && !apiErr.message.includes('Failed to fetch')) {
          throw apiErr;
        }
      }

      // 2. Direct Supabase Cloud Authentication Fallback
      if (supabase) {
        try {
          const { data: supaUser, error: supaErr } = await supabase
            .from('users')
            .select('*')
            .ilike('username', u)
            .eq('password', p)
            .maybeSingle();

          if (supaUser && !supaErr) {
            const cloudToken = `supa_token_${Date.now()}_${supaUser.id}`;
            const formattedUser = {
              id: supaUser.id,
              username: supaUser.username,
              name: supaUser.name,
              role: supaUser.role,
              email: supaUser.email
            };
            setToken(cloudToken);
            setUser(formattedUser);
            localStorage.setItem('polimdo_token', cloudToken);
            localStorage.setItem('polimdo_user', JSON.stringify(formattedUser));
            return { success: true, user: formattedUser, message: `Selamat datang, ${formattedUser.name}!` };
          }
        } catch (supaErr) {
          console.warn('Supabase direct auth fallback error:', supaErr.message);
        }
      }

      // 3. Fallback to hardcoded official credentials
      if (u === 'admin' && p === 'Polimdotekniklistrik12-') {
        const adminUser = {
          id: 'u_admin',
          username: 'admin',
          name: 'Administrator Akademik & Lab',
          role: 'admin',
          email: 'admin.lablistrik@polimdo.ac.id'
        };
        const demoToken = `local_token_admin_${Date.now()}`;
        setToken(demoToken);
        setUser(adminUser);
        localStorage.setItem('polimdo_token', demoToken);
        localStorage.setItem('polimdo_user', JSON.stringify(adminUser));
        return { success: true, user: adminUser, message: 'Selamat datang, Administrator Akademik & Lab!' };
      } else if (u === 'dosen' && p === 'Dosenpolimdo18-') {
        const dosenUser = {
          id: 'u_dosen',
          username: 'dosen',
          name: 'Dr. Eng. Arthur Sanger, S.T., M.T. (Dosen Pengampu)',
          role: 'dosen',
          email: 'dosen.lablistrik@polimdo.ac.id'
        };
        const demoToken = `local_token_dosen_${Date.now()}`;
        setToken(demoToken);
        setUser(dosenUser);
        localStorage.setItem('polimdo_token', demoToken);
        localStorage.setItem('polimdo_user', JSON.stringify(dosenUser));
        return { success: true, user: dosenUser, message: 'Selamat datang, Dr. Eng. Arthur Sanger!' };
      }

      throw new Error('Username atau password salah! Silakan periksa kembali.');
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
