/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { dbObj } from '../services/db';
import { User, UserRole, SubscriptionStatus } from '../types';
import { Button, Card, EasyClinMark, Input } from '../components/ui';

interface AuthProps {
  onLoginSuccess: (user: User) => void;
}

export default function Auth({ onLoginSuccess }: AuthProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const preConfiguredUsers = dbObj.getUsers();

  const handlePresetLogin = (user: User) => {
    const tenant = dbObj.getTenants().find(t => t.id === user.tenantId);
    dbObj.logAction(
      user.id,
      user.name,
      user.role,
      'Login Efetuado',
      `Login simulado como ${user.role} no tenant ${tenant ? tenant.name : 'System'}`,
      user.tenantId
    );

    dbObj.currentUser = user;
    
    setMessage({ type: 'success', text: `Bem vindo, ${user.name}! Redirecionando...` });
    setTimeout(() => {
      onLoginSuccess(user);
    }, 800);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setMessage({ type: 'error', text: 'Preencha o e-mail!' });
      return;
    }

    if (isRegistering) {
      if (!name || !clinicName) {
        setMessage({ type: 'error', text: 'Preencha todos os campos para registrar!' });
        return;
      }

      // Create new Tenant
      const newTenantId = `tenant_${Math.random().toString(36).substring(2, 9)}`;
      const newTenant = {
        id: newTenantId,
        name: clinicName,
        ownerName: name,
        ownerEmail: email,
        status: 'trial' as SubscriptionStatus,
        planId: 'plan_bronze',
        createdAt: new Date().toISOString(),
        trialEndsAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 dias de trial
        nextBillingAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        balance: 0
      };

      // Create new User
      const newUserId = `user_${Math.random().toString(36).substring(2, 9)}`;
      const newUser: User = {
        id: newUserId,
        tenantId: newTenantId,
        name,
        email,
        role: 'clinic_admin', // Dono que se registrou é admin
        status: 'active'
      };

      dbObj.saveTenant(newTenant);
      dbObj.saveUser(newUser);

      // Audit Log
      dbObj.logAction(
        newUserId,
        name,
        'clinic_admin',
        'Registro de Clínica',
        `Criação do Tenant ${clinicName} plano Trial de 15 dias.`,
        newTenantId
      );

      dbObj.currentUser = newUser;
      setMessage({ type: 'success', text: 'Clínica cadastrada com sucesso! Iniciando seu trial...' });
      setTimeout(() => {
        onLoginSuccess(newUser);
      }, 1000);
    } else {
      // Find matching user by email
      const matchedUser = dbObj.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
      if (matchedUser) {
        handlePresetLogin(matchedUser);
      } else {
        // Create an on-the-fly professional user
        const newUser: User = {
          id: `user_${Math.random().toString(36).substring(2, 9)}`,
          tenantId: 'tenant_odonto_premium', // Default to existing active clinic
          name: email.split('@')[0].toUpperCase(),
          email,
          role: 'health_professional',
          status: 'active',
          specialty: 'Clínica Geral'
        };
        dbObj.saveUser(newUser);
        handlePresetLogin(newUser);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 soft-gradient transition-colors duration-300">
      
      <main className="w-full max-w-110 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Logo Header */}
        <div className="flex flex-col items-center mb-6 space-y-3">
          <Card className="w-20 h-20 flex items-center justify-center p-2 border-outline-variant/30">
            <EasyClinMark />
          </Card>
          <div className="text-center">
            <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">EasyClin</h1>
            <p className="font-body-md text-body-md text-outline">Gestão inteligente para sua clínica</p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="glass-card p-8 shadow-lg">
          <h2 className="font-title-md text-title-md text-on-surface mb-6">
            {isRegistering ? 'Crie sua conta clínica' : 'Acesse sua conta'}
          </h2>

          {/* Quick Preset Selector for Demo Users */}
          {!isRegistering && (
            <div className="border border-primary/20 bg-primary/5 rounded-xl p-3 mb-6">
              <button 
                type="button" 
                onClick={() => setShowPresets(!showPresets)} 
                className="w-full flex items-center justify-between text-xs font-semibold text-primary cursor-pointer focus:outline-none"
              >
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base">bolt</span>
                  <span>Acesso de Homologação (Pilotos Demo)</span>
                </div>
                <span className="material-symbols-outlined text-base transition-transform duration-200" style={{ transform: showPresets ? 'rotate(180deg)' : 'none' }}>
                  expand_more
                </span>
              </button>
              {showPresets && (
                <div className="grid grid-cols-2 gap-2 mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  {preConfiguredUsers.slice(0, 4).map((u) => {
                    let roleLabel = '';
                    let iconName = 'medical_services';
                    if (u.role === 'super_admin') {
                      roleLabel = 'Plataforma';
                      iconName = 'shield';
                    } else if (u.role === 'clinic_admin') {
                      roleLabel = 'Dono Clínica';
                      iconName = 'home_clinic';
                    } else if (u.role === 'receptionist') {
                      roleLabel = 'Recepção';
                      iconName = 'support_agent';
                    } else {
                      roleLabel = 'Médico/Dentista';
                      iconName = 'stethoscope';
                    }

                    const tenantName = u.tenantId === 'system' ? 'EasyClin Cloud' : 'OdontoPremium';

                    return (
                      <button
                        key={u.id}
                        onClick={() => handlePresetLogin(u)}
                        type="button"
                        className="text-left p-2 rounded-lg border border-outline-variant/60 bg-surface-container-lowest text-xs transition-all hover:scale-[1.02] active:scale-98 cursor-pointer shadow-sm hover:shadow-md focus:outline-none"
                      >
                        <div className="flex items-center gap-1.5 font-semibold text-on-surface mb-0.5">
                          <span className="material-symbols-outlined text-sm text-primary">{iconName}</span>
                          <span className="truncate">{u.name}</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-on-surface-variant">
                          <span>{roleLabel}</span>
                          <span className="max-w-17.5 truncate">{tenantName}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Alert Notification */}
          {message && (
                <div className={`p-4 rounded-xl text-sm flex gap-2 border mb-6 ${
              message.type === 'error' 
                ? 'bg-error/10 border-error/20 text-error' 
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
            }`}>
              <span className="material-symbols-outlined text-base">
                {message.type === 'error' ? 'error' : 'check_circle'}
              </span>
              <span>{message.text}</span>
            </div>
          )}

          {/* Auth form input panels */}
          <form onSubmit={handleManualSubmit} className="space-y-6">
            
            {isRegistering && (
              <>
                <div className="space-y-2">
                  <label className="font-label-md text-label-md text-on-surface-variant block uppercase tracking-wider" htmlFor="name">Nome Completo</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">person</span>
                    </div>
                    <Input
                      id="name"
                      type="text"
                      required
                      placeholder="Dr. Arthur Mendes"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 pr-4 py-3 bg-surface-container-lowest rounded-lg font-body-md text-body-md focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-label-md text-label-md text-on-surface-variant block uppercase tracking-wider" htmlFor="clinicName">Nome da Clínica</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">home_clinic</span>
                    </div>
                    <Input
                      id="clinicName"
                      type="text"
                      required
                      placeholder="Ex: Clínica OdontoPremium"
                      value={clinicName}
                      onChange={(e) => setClinicName(e.target.value)}
                      className="pl-10 pr-4 py-3 bg-surface-container-lowest rounded-lg font-body-md text-body-md focus:ring-primary focus:border-primary"
                    />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-2">
              <label className="font-label-md text-label-md text-on-surface-variant block uppercase tracking-wider" htmlFor="email">Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">mail</span>
                </div>
                <Input
                  id="email"
                  type="email"
                  required
                  placeholder="exemplo@clinica.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 pr-4 py-3 bg-surface-container-lowest rounded-lg font-body-md text-body-md focus:ring-primary focus:border-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-label-md text-label-md text-on-surface-variant block uppercase tracking-wider" htmlFor="password">Senha</label>
                {!isRegistering && (
                  <button type="button" className="font-label-md text-label-md text-primary hover:underline transition-all bg-transparent border-none cursor-pointer focus:outline-none">
                    Esqueci minha senha
                  </button>
                )}
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-outline group-focus-within:text-primary transition-colors">lock</span>
                </div>
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-12 py-3 bg-surface-container-lowest rounded-lg font-body-md text-body-md focus:ring-primary focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-primary transition-colors cursor-pointer focus:outline-none"
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* CTA Button */}
            <Button 
              type="submit"
              size="lg"
              className="w-full py-3.5 font-title-md text-title-md rounded-lg active:scale-95 shadow-md group"
            >
              <span>{isRegistering ? 'Criar minha conta' : 'Entrar'}</span>
              <span className="material-symbols-outlined ml-2 group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </Button>
          </form>

          {/* Bottom Action Form Switcher */}
          <div className="mt-8 pt-6 border-t border-outline-variant text-center">
            {isRegistering ? (
              <p className="font-body-md text-body-md text-on-surface-variant">
                Já possui uma conta EasyClin?{' '}
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="text-primary font-semibold hover:underline bg-transparent border-none cursor-pointer focus:outline-none"
                >
                  Acesse sua conta
                </button>
              </p>
            ) : (
              <p className="font-body-md text-body-md text-on-surface-variant">
                Primeiro acesso?{' '}
                <button
                  type="button"
                  onClick={() => setIsRegistering(true)}
                  className="text-primary font-semibold hover:underline bg-transparent border-none cursor-pointer focus:outline-none"
                >
                  Crie sua conta
                </button>
              </p>
            )}
          </div>
        </Card>

        {/* Footer / Legal */}
        <footer className="mt-8 text-center space-y-4">
          <div className="flex justify-center space-x-6">
            <a className="font-label-md text-label-md text-outline hover:text-primary transition-colors" href="#">Termos de Uso</a>
            <a className="font-label-md text-label-md text-outline hover:text-primary transition-colors" href="#">Privacidade</a>
            <a className="font-label-md text-label-md text-outline hover:text-primary transition-colors" href="#">Suporte</a>
          </div>
          <p className="font-label-md text-label-md text-outline opacity-60">© 2026 EasyClin Health Management System</p>
        </footer>

      </main>

    </div>
  );
}
