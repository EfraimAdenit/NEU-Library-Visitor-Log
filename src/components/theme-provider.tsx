'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type RoleTheme = 'student' | 'admin' | null;

interface ThemeContextType {
  roleTheme: RoleTheme;
  setRoleTheme: (role: RoleTheme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [roleTheme, setRoleThemeState] = useState<RoleTheme>(null);

  useEffect(() => {
    // On mount, read from localStorage
    const stored = localStorage.getItem('app_role') as RoleTheme;
    if (stored) {
      setRoleThemeState(stored);
    }
  }, []);

  const setRoleTheme = (role: RoleTheme) => {
    setRoleThemeState(role);
    if (role) {
      localStorage.setItem('app_role', role);
    } else {
      localStorage.removeItem('app_role');
    }
  };

  useEffect(() => {
    // Apply or remove the admin-theme class based on roleTheme
    const html = document.documentElement;
    if (roleTheme === 'admin') {
      html.classList.add('admin-theme');
    } else {
      html.classList.remove('admin-theme');
    }
  }, [roleTheme]);

  return (
    <ThemeContext.Provider value={{ roleTheme, setRoleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
