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
import { RefreshCw } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('dark');
    localStorage.setItem('easyclin_dark_mode', 'false');
  }, []);

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
      <div className="fixed bottom-4 left-4 z-40 bg-surface-container-lowest/95 border border-outline-variant p-2 rounded-2xl shadow-xl flex items-center gap-2 backdrop-blur">
        <button
          onClick={handleHardReset}
          className="p-2 rounded-xl hover:bg-error/10 text-error transition-colors flex items-center gap-1.5 text-xs font-semibold cursor-pointer"
          title="Resetar Banco de Dados Local"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Limpar Dados</span>
        </button>
      </div>

      {/* Main View Router */}
      {!currentUser ? (
        <Auth onLoginSuccess={handleLoginSuccess} />
      ) : currentUser.role === 'super_admin' ? (
        <SuperAdmin currentUser={currentUser} onLogout={handleLogout} />
      ) : (
        <ClinicDashboard 
          currentUser={currentUser} 
          onLogout={handleLogout} 
          onRoleSwitch={handleRoleSwitch}
        />
      )}

    </div>
  );
}
