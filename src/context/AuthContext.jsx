import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('netflix_user');
      return saved ? JSON.parse(saved) : { name: 'User', authenticated: true };
    } catch {
      return { name: 'User', authenticated: true };
    }
  });

  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('netflix_profile');
      return saved ? JSON.parse(saved) : { name: 'Manthan', avatar: 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png' };
    } catch {
      return { name: 'Manthan', avatar: 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png' };
    }
  });

  useEffect(() => {
    localStorage.setItem('netflix_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('netflix_profile', JSON.stringify(profile));
  }, [profile]);

  const login = (userData) => setUser(userData);
  const logout = () => {
    setUser(null);
    setProfile(null);
    localStorage.removeItem('netflix_user');
    localStorage.removeItem('netflix_profile');
    window.location.reload(); 
  };

  const clearProfile = () => {
    setProfile(null);
    localStorage.removeItem('netflix_profile');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, profile, setProfile, clearProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
