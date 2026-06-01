/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { dbObj } from '../services/db';
import { User, UserRole, SubscriptionStatus } from '../types';
import { Shield, Sparkles, Building2, Stethoscope, UserCheck, CheckCircle2, Lock, ArrowRight, Activity } from 'lucide-react';

interface AuthProps {
  onLoginSuccess: (user: User) => void;
  darkMode: boolean;
}

export default function Auth({ onLoginSuccess, darkMode }: AuthProps) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [role, setRole] = useState<UserRole>('clinic_admin');
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const preConfiguredUsers = dbObj.getUsers();

  const handlePresetLogin = (user: User) => {
    // Audit log integration
    const tenant = dbObj.getTenants().find(t => t.id === user.tenantId);
    dbObj.logAction(
      user.id,
      user.name,
      user.role,
      'Login Efetuado',
      `Login simulado como ${user.role} no tenant ${tenant ? tenant.name : 'System'}`,
      user.tenantId
    );

    // Save session
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
    <div className={`min-h-screen flex transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Visual Banner Left */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 p-12 text-white flex-col justify-between relative overflow-hidden">
        
        {/* Abstract Background Design Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -ml-20 -mb-20"></div>

        {/* Brand Header */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="bg-white text-blue-700 p-2.5 rounded-xl shadow-lg">
            <Activity className="h-6 w-6 stroke-[2.5]" />
          </div>
          <span className="text-2xl font-bold tracking-tight">Easy<span className="text-blue-300">Clin</span></span>
          <span className="text-xs bg-blue-600/50 text-blue-200 border border-blue-500 px-2 py-0.5 rounded-full font-mono">SaaS MVP v1.0</span>
        </div>

        {/* Hero Features Block */}
        <div className="max-w-md relative z-10 my-auto">
          <h1 className="text-4xl font-extrabold tracking-tight leading-tight mb-6">
            A convergência entre <br />
            <span className="text-blue-300 underline decoration-blue-400 decoration-wavy underline-offset-4">lucro real</span> e <span className="text-cyan-300">eficiência clínica</span>.
          </h1>
          <p className="text-blue-100 mb-8 text-md leading-relaxed">
            Unimos a robustez operacional do Simples Dental com a inteligência mercadológica de margens líquidas reais do QiDent. O controle absoluto nas suas mãos.
          </p>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-1 px-1.5 bg-blue-600/60 rounded-full text-blue-300 mt-0.5 border border-blue-500">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-white">Precificação e Lucro Real</h4>
                <p className="text-xs text-blue-200">Defina o custo operacional do consultório, insumos e comissão para calcular a margem de cada tratamento.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-1 px-1.5 bg-blue-600/60 rounded-full text-blue-300 mt-0.5 border border-blue-500">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-white">Agenda, CRM e Prontuários</h4>
                <p className="text-xs text-blue-200">Lembretes integrados, evolução médica blindada para LGPD e fluxos de atendimento sem atritos.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-1 px-1.5 bg-blue-600/60 rounded-full text-blue-300 mt-0.5 border border-blue-500">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-white">Multi-tenant Segregado</h4>
                <p className="text-xs text-blue-200">Preparado para hospedar desde profissionais autônomos até franquias robustas com auditoria transparente.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-blue-200 border-t border-blue-600/40 pt-4 relative z-10">
          <span>EasyClin © 2026 - Versão de Teste Completa</span>
          <div className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            <span>LGPD Compliance</span>
          </div>
        </div>
      </div>

      {/* Screen Forms Right */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 md:px-20 py-12 relative overflow-y-auto">
        <div className="max-w-md w-full mx-auto space-y-8">
          
          {/* Main heading */}
          <div>
            <div className="flex items-center gap-2 lg:hidden mb-6">
              <div className="bg-blue-600 text-white p-2 rounded-xl">
                <Activity className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight">EasyClin</span>
            </div>
            <h2 className="text-3xl font-bold tracking-tight">
              {isRegistering ? 'Crie sua conta clínica' : 'Bem-vindo ao EasyClin'}
            </h2>
            <p className="text-sm mt-2 text-slate-500 dark:text-slate-400">
              {isRegistering 
                ? 'Comece agora a calcular seus lucros reais e organizar sua agenda.' 
                : 'Acesse o painel do seu consultório ou utilize logins de demonstração.'}
            </p>
          </div>

          {/* Quick Preset Selector for Demo Users */}
          {!isRegistering && (
            <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-blue-50/50 border-blue-100'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">Piloto Automático (Selecione um papel para testar)</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {preConfiguredUsers.slice(0, 4).map((u) => {
                  let roleLabel = '';
                  let icon = <Stethoscope className="h-3.5 w-3.5" />;
                  if (u.role === 'super_admin') {
                    roleLabel = 'Plataforma';
                    icon = <Shield className="h-3.5 w-3.5 text-orange-500" />;
                  } else if (u.role === 'clinic_admin') {
                    roleLabel = 'Dono Clínica';
                    icon = <Building2 className="h-3.5 w-3.5 text-blue-500" />;
                  } else if (u.role === 'receptionist') {
                    roleLabel = 'Recepção';
                    icon = <UserCheck className="h-3.5 w-3.5 text-emerald-500" />;
                  } else {
                    roleLabel = 'Médico/Dentista';
                    icon = <Stethoscope className="h-3.5 w-3.5 text-purple-500" />;
                  }

                  const tenantName = u.tenantId === 'system' ? 'EasyClin Cloud' : 'OdontoPremium';

                  return (
                    <button
                      key={u.id}
                      onClick={() => handlePresetLogin(u)}
                      type="button"
                      className={`text-left p-2 rounded-lg border text-xs transition-all hover:-translate-y-0.5 hover:shadow-sm ${
                        darkMode 
                          ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-slate-600' 
                          : 'bg-white border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1 font-medium mb-0.5">
                        {icon}
                        <span className="truncate">{u.name}</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>{roleLabel}</span>
                        <span className="max-w-[70px] truncate">{tenantName}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Alert Notification */}
          {message && (
            <div className={`p-4 rounded-xl text-sm flex gap-2 border ${
              message.type === 'error' 
                ? 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400' 
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
            }`}>
              {message.type === 'error' ? '❌' : '✓'}
              <span>{message.text}</span>
            </div>
          )}

          {/* Auth form input panels */}
          <form onSubmit={handleManualSubmit} className="space-y-4">
            
            {isRegistering && (
              <>
                <div>
                  <label className="block text-xs font-semibold mb-1 uppercase tracking-wider text-slate-500">Nome Completo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Dr. Arthur Mendes"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 uppercase tracking-wider text-slate-500">Nome da Clínica ou Consultório</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Clínica Belo Sorriso ou Odonto Mais"
                    value={clinicName}
                    onChange={(e) => setClinicName(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                    }`}
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold mb-1 uppercase tracking-wider text-slate-500">Endereço de E-mail</label>
              <input
                type="email"
                required
                placeholder="nome@dominio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}
              />
            </div>

            <div className="relative">
              <div className="flex justify-between items-center mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <label>Senha de Acesso</label>
                {!isRegistering && (
                  <span className="text-blue-600 hover:underline cursor-pointer normal-case">Esqueceu a senha?</span>
                )}
              </div>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                />
                <Lock className="absolute right-3.5 top-3 w-4 h-4 text-slate-400" />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm py-3 px-4 rounded-xl shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-all mt-4"
            >
              <span>{isRegistering ? 'Cadastrar e Iniciar Teste de 15 Dias' : 'Acessar EasyClin'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Form Switcher */}
          <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2">
            {isRegistering ? (
              <p>
                Já possui uma conta EasyClin?{' '}
                <button
                  type="button"
                  onClick={() => setIsRegistering(false)}
                  className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
                >
                  Faça login!
                </button>
              </p>
            ) : (
              <p>
                Ainda não gerencia sua clínica aqui?{' '}
                <button
                  type="button"
                  onClick={() => setIsRegistering(true)}
                  className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer"
                >
                  Crie sua conta grátis agora!
                </button>
              </p>
            )}
          </div>

          {/* Admin Demo Helper Box */}
          <div className={`p-3.5 rounded-xl border border-dashed flex gap-3 ${
            darkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-600'
          }`}>
            <Shield className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">Dica de Demonstração</span>
              Selecione o <strong>Sérgio Ramos</strong> para acessar o <strong>Super Admin / SaaS Owner</strong> da plataforma e simular bloqueios, faturamentos, trials e auditoria geral de conformidade (LGPD) em todas as clínicas!
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
