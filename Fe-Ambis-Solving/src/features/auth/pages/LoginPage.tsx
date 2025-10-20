// src/features/auth/pages/LoginPage.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { loginUser, registerUser } from '../../../shared/services/api';

// ===== Validations =====
const loginSchema = z.object({
  email: z.string().email({ message: 'Format email tidak valid' }),
  password: z.string().min(1, { message: 'Password tidak boleh kosong' }),
});
type LoginFormInputs = z.infer<typeof loginSchema>;

const registerSchema = z.object({
  name: z.string().min(2, { message: 'Nama minimal 2 karakter' }),
  email: z.string().email({ message: 'Format email tidak valid' }),
  password: z.string().min(6, { message: 'Password minimal 6 karakter' }),
});
type RegisterFormInputs = z.infer<typeof registerSchema>;

type AuthResponse = { token: string; userId?: string };

export function LoginPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);

  const loginMutation = useMutation<AuthResponse, any, LoginFormInputs>({
    mutationFn: loginUser,
    onSuccess: (data) => {
      // Standarisasi: gunakan 'token'
      localStorage.setItem('token', data.token);
      if (data.userId) localStorage.setItem('userId', data.userId);
      setServerError(null);
      navigate({ to: '/boards' as any });
    },
    onError: (err: any) => {
      setServerError(err?.message || 'Login gagal. Periksa email/password.');
    }
  });

  const registerMutation = useMutation<unknown, any, RegisterFormInputs>({
    mutationFn: registerUser,
    onSuccess: () => {
      setServerError(null);
      alert('Registrasi berhasil! Silakan login.');
      setIsLogin(true);
    },
    onError: (err: any) => {
      setServerError(err?.message || 'Registrasi gagal. Mungkin pendaftaran dimatikan.');
    }
  });

  const loginForm = useForm<LoginFormInputs>({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterFormInputs>({ resolver: zodResolver(registerSchema) });

  const onLoginSubmit = (data: LoginFormInputs) => loginMutation.mutate(data);
  const onRegisterSubmit = (data: RegisterFormInputs) => registerMutation.mutate(data);

  return (
    <div className="flex min-h-screen items-center justify-center bg-white dark:bg-slate-950">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-slate-200 bg-white p-8 shadow-md
                      dark:border-slate-800 dark:bg-slate-900">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            {isLogin ? 'Selamat Datang!' : 'Daftar Akun Baru'}
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            {isLogin ? 'Masuk untuk melanjutkan' : 'Buat akun untuk mulai menggunakan'}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => { setIsLogin(true); setServerError(null); }}
            className={`flex-1 py-2 text-center ${
              isLogin
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Masuk
          </button>
          <button
            onClick={() => { setIsLogin(false); setServerError(null); }}
            className={`flex-1 py-2 text-center ${
              !isLogin
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            Daftar
          </button>
        </div>

        {serverError && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
            {serverError}
          </div>
        )}

        {isLogin ? (
          <form className="space-y-6" onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                {...loginForm.register('email')}
                className={`mt-1 w-full rounded-md border px-3 py-2 shadow-sm outline-none
                  ${loginForm.formState.errors.email ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'}
                  bg-white text-slate-900 placeholder:text-slate-400
                  dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500
                  focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-indigo-400/40`}
                placeholder="pegawai@ambis.com"
              />
              {loginForm.formState.errors.email && (
                <p className="mt-1 text-sm text-red-600">{loginForm.formState.errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                {...loginForm.register('password')}
                className={`mt-1 w-full rounded-md border px-3 py-2 shadow-sm outline-none
                  ${loginForm.formState.errors.password ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'}
                  bg-white text-slate-900 placeholder:text-slate-400
                  dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500
                  focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-indigo-400/40`}
                placeholder="••••••••"
              />
              {loginForm.formState.errors.password && (
                <p className="mt-1 text-sm text-red-600">{loginForm.formState.errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-blue-400"
            >
              {loginMutation.isPending ? 'Memproses...' : 'Masuk'}
            </button>
          </form>
        ) : (
          <form className="space-y-6" onSubmit={registerForm.handleSubmit(onRegisterSubmit)}>
            <div>
              <label htmlFor="register-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Nama Lengkap
              </label>
              <input
                id="register-name"
                type="text"
                autoComplete="name"
                {...registerForm.register('name')}
                className={`mt-1 w-full rounded-md border px-3 py-2 shadow-sm outline-none
                  ${registerForm.formState.errors.name ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'}
                  bg-white text-slate-900 placeholder:text-slate-400
                  dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500
                  focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-indigo-400/40`}
                placeholder="John Doe"
              />
              {registerForm.formState.errors.name && (
                <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="register-email" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Email
              </label>
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                {...registerForm.register('email')}
                className={`mt-1 w-full rounded-md border px-3 py-2 shadow-sm outline-none
                  ${registerForm.formState.errors.email ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'}
                  bg-white text-slate-900 placeholder:text-slate-400
                  dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500
                  focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-indigo-400/40`}
                placeholder="john@example.com"
              />
              {registerForm.formState.errors.email && (
                <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="register-password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Password
              </label>
              <input
                id="register-password"
                type="password"
                autoComplete="new-password"
                {...registerForm.register('password')}
                className={`mt-1 w-full rounded-md border px-3 py-2 shadow-sm outline-none
                  ${registerForm.formState.errors.password ? 'border-red-500' : 'border-slate-300 dark:border-slate-700'}
                  bg-white text-slate-900 placeholder:text-slate-400
                  dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500
                  focus:ring-2 focus:ring-indigo-500/50 dark:focus:ring-indigo-400/40`}
                placeholder="••••••••"
              />
              {registerForm.formState.errors.password && (
                <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-blue-400"
            >
              {registerMutation.isPending ? 'Memproses...' : 'Daftar'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default LoginPage;
