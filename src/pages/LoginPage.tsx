import React, { useState } from 'react';
import { api } from '../services/api';
import { GoogleLogin } from '@react-oauth/google';

interface LoginPageProps {
  onLogin: (user: any) => void;
  onForgotPassword: () => void;
  onNotify: (notification: { type: 'success' | 'error' | 'info' | 'warning'; message: string }) => void;
  allowRegister?: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onForgotPassword, onNotify, allowRegister = false }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isRegistering ? '/register' : '/login';
      const payload = isRegistering ? formData : { email: formData.email, password: formData.password };

      const response = await api.post(endpoint, payload);

      if (isRegistering) {
        // Registration success
        setIsRegistering(false);
        onNotify({ type: 'success', message: 'Cadastro realizado com sucesso! Por favor, faça login.' });
        setFormData({ name: '', email: '', password: '' });
      } else {
        // Login success
        if (response.auth) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          onLogin(response.user);
        }
      }
    } catch (err: any) {
      onNotify({ type: 'error', message: err.message || 'Erro ao autenticar.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-[#101922] font-display">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 h-screen overflow-y-auto">
        <div className="w-full max-w-md">
          <header className="mb-6">
            <div className="flex items-center space-x-3">
              <span className="material-symbols-outlined text-[#137fec] text-4xl">inventory_2</span>
              <span className="text-2xl font-bold text-[#111418] dark:text-white">StockFlowAI</span>
            </div>
          </header>

          <main>
            <h1 className="text-3xl font-bold text-[#111418] dark:text-white mb-2">
              {isRegistering ? 'Crie sua conta' : 'Acesse sua conta'}
            </h1>
            <p className="text-gray-500 mb-6">
              {isRegistering ? 'Preencha os dados abaixo para começar.' : 'Bem-vindo de volta! Por favor, insira seus dados.'}
            </p>



            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegistering && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="name">Nome</label>
                  <input
                    className="w-full px-4 py-2.5 bg-[#f6f7f8] dark:bg-[#1f2937] border-transparent rounded-lg focus:ring-2 focus:ring-[#137fec] focus:border-[#137fec] text-[#111418] dark:text-white placeholder:text-gray-400 outline-none transition-all"
                    id="name"
                    name="name"
                    placeholder="Seu nome completo"
                    type="text"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="email">Email</label>
                <input
                  className="w-full px-4 py-2.5 bg-[#f6f7f8] dark:bg-[#1f2937] border-transparent rounded-lg focus:ring-2 focus:ring-[#137fec] focus:border-[#137fec] text-[#111418] dark:text-white placeholder:text-gray-400 outline-none transition-all"
                  id="email"
                  name="email"
                  placeholder="Insira seu email"
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2" htmlFor="password">Senha</label>
                <div className="relative">
                  <input
                    className="w-full px-4 py-2.5 bg-[#f6f7f8] dark:bg-[#1f2937] border-transparent rounded-lg focus:ring-2 focus:ring-[#137fec] focus:border-[#137fec] text-[#111418] dark:text-white placeholder:text-gray-400 outline-none transition-all"
                    id="password"
                    name="password"
                    placeholder="Insira sua senha"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    required
                  />
                  <button
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 focus:outline-none"
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? 'visibility' : 'visibility_off'}
                    </span>
                  </button>
                </div>
              </div>

              {!isRegistering && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      className="h-4 w-4 text-[#137fec] focus:ring-[#137fec] border-gray-300 rounded cursor-pointer"
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                    />
                    <label className="ml-2 block text-sm text-gray-600 dark:text-gray-400 cursor-pointer" htmlFor="remember-me">Lembrar-me</label>
                  </div>
                  <div className="text-sm">
                    <button
                      type="button"
                      onClick={onForgotPassword}
                      className="font-medium text-[#137fec] hover:text-[#0f66bd] focus:outline-none"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                </div>
              )}

              <button
                className="w-full bg-[#137fec] text-white font-bold py-3 px-4 rounded-lg hover:bg-[#0f66bd] transition-colors shadow-lg shadow-blue-500/30 disabled:opacity-50"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Carregando...' : (isRegistering ? 'Cadastrar' : 'Entrar')}
              </button>
            </form>

            <div className="my-6 flex items-center">
              <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
              <span className="mx-4 text-sm text-gray-500">Ou</span>
              <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
            </div>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  setLoading(true);
                  try {
                    const response = await api.post('/auth/google', { token: credentialResponse.credential });
                    if (response.auth) {
                      localStorage.setItem('token', response.token);
                      localStorage.setItem('user', JSON.stringify(response.user));
                      onLogin(response.user);
                    }
                  } catch (err: any) {
                    onNotify({ type: 'error', message: err.message || 'Erro ao autenticar com Google.' });
                  } finally {
                    setLoading(false);
                  }
                }}
                onError={() => {
                  onNotify({ type: 'error', message: 'Falha ao conectar com Google.' });
                }}
                useOneTap
                theme="outline"
                shape="pill"
                text="continue_with"
                width="320"
              />
            </div>

            {allowRegister && (
              <p className="mt-6 text-center text-sm text-gray-500">
                {isRegistering ? 'Já tem uma conta?' : 'Não tem uma conta?'}
                <button
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="font-bold text-[#137fec] hover:underline ml-1"
                >
                  {isRegistering ? 'Faça login' : 'Cadastre-se'}
                </button>
              </p>
            )}
          </main>
        </div>
      </div>

      {/* Right Side - Hero */}
      <div className="hidden lg:flex w-1/2 bg-[#137fec] items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative Background Patterns */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 opacity-10">
          <svg fill="none" height="404" viewBox="0 0 404 404" width="404">
            <defs>
              <pattern height="20" id="pattern-squares" patternUnits="userSpaceOnUse" width="20" x="0" y="0">
                <rect className="text-white" fill="currentColor" height="4" width="4" x="0" y="0"></rect>
              </pattern>
            </defs>
            <rect fill="url(#pattern-squares)" height="404" width="404"></rect>
          </svg>
        </div>

        <div className="absolute bottom-0 left-0 -ml-10 -mb-10 opacity-10">
          <svg fill="none" height="280" viewBox="0 0 280 280" width="280">
            <defs>
              <pattern height="20" id="pattern-squares-2" patternUnits="userSpaceOnUse" width="20" x="0" y="0">
                <rect className="text-white" fill="currentColor" height="4" width="4" x="0" y="0"></rect>
              </pattern>
            </defs>
            <rect fill="url(#pattern-squares-2)" height="280" width="280"></rect>
          </svg>
        </div>

        <div className="z-10 text-white max-w-lg text-center">
          {/* Analytics Visualization Card */}
          <div className="relative mb-12 transform hover:scale-105 transition-transform duration-500">
            <div className="bg-white/95 backdrop-blur-md p-6 rounded-2xl shadow-2xl text-left">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800">Analíticos</h3>
                <div className="text-[10px] text-gray-500 bg-gray-100 rounded-full p-1 flex space-x-1">
                  <span className="px-2 py-1 rounded-full bg-white text-[#137fec] shadow-sm font-bold">Semanal</span>
                  <span className="px-2 py-1 rounded-full">Mensal</span>
                </div>
              </div>

              <div className="relative h-32">
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                  <path d="M0 60 Q 30 50, 60 70 T 120 40 T 180 60 T 240 30 T 300 50" fill="none" stroke="#e5e7eb" strokeWidth="2" strokeDasharray="4 4"></path>
                  <path d="M0 80 Q 30 70, 60 90 T 120 60 T 180 80 T 240 50 T 300 70" fill="none" stroke="#137fec" strokeWidth="3"></path>
                </svg>
              </div>

              <div className="flex justify-between text-[10px] text-gray-400 mt-2 font-medium">
                <span>SEG</span><span>TER</span><span>QUA</span><span>QUI</span><span>SEX</span>
              </div>
            </div>

            {/* Floating Stat Card */}
            <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-xl shadow-xl flex items-center gap-3 animate-bounce-slow">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="24" cy="24" r="20" fill="none" stroke="#f3f4f6" strokeWidth="4"></circle>
                  <circle cx="24" cy="24" r="20" fill="none" stroke="#137fec" strokeWidth="4" strokeDasharray="125" strokeDashoffset="30"></circle>
                </svg>
                <span className="absolute text-[10px] font-bold text-gray-800">75%</span>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 font-semibold">Crescimento</p>
                <p className="text-sm font-bold text-gray-800">+24.5%</p>
              </div>
            </div>
          </div>

          <h2 className="text-4xl font-black mb-4 leading-tight">StockFlowAI: Gestão inteligente de estoque</h2>
          <p className="text-blue-100 text-lg leading-relaxed">
            Rastreie produtos, gerencie fornecedores e otimize seus níveis de estoque com nosso sistema intuitivo e eficiente.
          </p>
        </div>
      </div>
    </div>
  );
};