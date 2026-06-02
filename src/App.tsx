/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from './types';
import { dbObj } from './services/db';
import Auth from './views/Auth';
import SuperAdmin from './views/SuperAdmin';
import ClinicDashboard from './views/ClinicDashboard';
import { Moon, Sun, RefreshCw, Activity, HeartCrack } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    // Check local preferences
    const stored = localStorage.getItem('easyclin_dark_mode');
    return stored ? stored === 'true' : true; // Default to eye-care dark mode
  });

  // Handle active class
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('easyclin_dark_mode', String(darkMode));
  }, [darkMode]);

  // Read active session on launch
  useEffect(() => {
    const sessionUser = localStorage.getItem('easyclin_current_user');
    if (sessionUser) {
      try {
        setCurrentUser(JSON.parse(sessionUser));
      } catch {
        setCurrentUser(null);
      }
    }
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('easyclin_current_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    // Log audit login end
    if (currentUser) {
      dbObj.logAction(
        currentUser.id,
        currentUser.name,
        currentUser.role,
        'Logout do Sistema',
        `Sessão finalizada de forma voluntária pelo usuário.`,
        currentUser.tenantId
      );
    }

    setCurrentUser(null);
    localStorage.removeItem('easyclin_current_user');
  };

  const handleRoleSwitch = (newUser: User) => {
    setCurrentUser(newUser);
    localStorage.setItem('easyclin_current_user', JSON.stringify(newUser));
    
    dbObj.logAction(
      newUser.id,
      newUser.name,
      newUser.role,
      'Troca de Papel Ativa',
      `Simulou papel de ${newUser.role} no workspace operacional de ${dbObj.activeTenant?.name || 'Clínica'}.`,
      newUser.tenantId
    );
  };

  const handleHardReset = () => {
    dbObj.resetDatabase();
    setCurrentUser(null);
    localStorage.removeItem('easyclin_current_user');
    window.location.reload();
  };

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-350`}>
      
      {/* Floating control capsule */}
      <div className="fixed bottom-4 left-4 z-40 bg-surface-container-lowest/95 dark:bg-inverse-surface/95 border border-outline-variant dark:border-outline/40 p-2 rounded-2xl shadow-xl flex items-center gap-2 backdrop-blur">
        {/* Toggle dark mode */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="p-2 rounded-xl hover:bg-surface-container/50 dark:hover:bg-inverse-surface/80 text-on-surface-variant dark:text-on-surface-variant transition-colors cursor-pointer"
          title="Alternar Tema Visual"
        >
          {darkMode ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-indigo-500" />}
        </button>

        <span className="w-[1px] h-4 bg-outline dark:bg-outline-variant"></span>

        {/* Reset Database */}
        <button
          onClick={handleHardReset}
          className="p-2 rounded-xl hover:bg-rose-500/10 text-rose-500 transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
          title="Resetar Banco de Dados Local"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Limpar Dados</span>
        </button>
      </div>

      {/* Main View Router */}
      {!currentUser ? (
        <Auth onLoginSuccess={handleLoginSuccess} darkMode={darkMode} />
      ) : currentUser.role === 'super_admin' ? (
        <SuperAdmin currentUser={currentUser} onLogout={handleLogout} darkMode={darkMode} />
      ) : (
        <ClinicDashboard 
          currentUser={currentUser} 
          onLogout={handleLogout} 
          onRoleSwitch={handleRoleSwitch}
          darkMode={darkMode}
        />
      )}

    </div>
  );
}
