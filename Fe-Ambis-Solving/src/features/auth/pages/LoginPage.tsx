import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { loginUser, registerUser } from '../../../shared/services/api';

// Definisikan skema validasi
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

export function LoginPage() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      localStorage.setItem('authToken', data.token);
      if (data.userId) localStorage.setItem('userId', data.userId);
      navigate({ to: '/boards' as any });
    },
    onError: (error: any) => {
      alert(error?.message || 'Login gagal');
    }
  });

  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: () => {
      alert('Registrasi berhasil! Silakan login.');
      setIsLogin(true);
    },
    onError: (error: any) => {
      alert(error?.message || 'Registrasi gagal');
    }
  });

  const loginForm = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const registerForm = useForm<RegisterFormInputs>({
    resolver: zodResolver(registerSchema),
  });

  const onLoginSubmit = (data: LoginFormInputs) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormInputs) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            {isLogin ? 'Selamat Datang!' : 'Daftar Akun Baru'}
          </h1>
          <p className="mt-2 text-gray-600">
            {isLogin ? 'Masuk untuk melanjutkan' : 'Buat akun untuk mulai menggunakan'}
          </p>
        </div>

        {/* Tab buttons */}
        <div className="flex border-b">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 text-center ${isLogin ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
          >
            Masuk
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 text-center ${!isLogin ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
          >
            Daftar
          </button>
        </div>

        {isLogin ? (
          <form className="space-y-6" onSubmit={loginForm.handleSubmit(onLoginSubmit)}>
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                {...loginForm.register('email')}
                className={`w-full px-3 py-2 mt-1 border rounded-md shadow-sm ${loginForm.formState.errors.email ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="pegawai@ambis.com"
              />
              {loginForm.formState.errors.email && <p className="mt-1 text-sm text-red-600">{loginForm.formState.errors.email.message}</p>}
            </div>
            <div>
              <label htmlFor="login-password" className="block text-sm font-medium text-gray-700">Password</label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                {...loginForm.register('password')}
                className={`w-full px-3 py-2 mt-1 border rounded-md shadow-sm ${loginForm.formState.errors.password ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="••••••••"
              />
              {loginForm.formState.errors.password && <p className="mt-1 text-sm text-red-600">{loginForm.formState.errors.password.message}</p>}
            </div>
            <div>
              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
              >
                {loginMutation.isPending ? 'Memproses...' : 'Masuk'}
              </button>
            </div>
          </form>
        ) : (
          <form className="space-y-6" onSubmit={registerForm.handleSubmit(onRegisterSubmit)}>
            <div>
              <label htmlFor="register-name" className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
              <input
                id="register-name"
                type="text"
                autoComplete="name"
                {...registerForm.register('name')}
                className={`w-full px-3 py-2 mt-1 border rounded-md shadow-sm ${registerForm.formState.errors.name ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="John Doe"
              />
              {registerForm.formState.errors.name && <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.name.message}</p>}
            </div>
            <div>
              <label htmlFor="register-email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                id="register-email"
                type="email"
                autoComplete="email"
                {...registerForm.register('email')}
                className={`w-full px-3 py-2 mt-1 border rounded-md shadow-sm ${registerForm.formState.errors.email ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="john@example.com"
              />
              {registerForm.formState.errors.email && <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.email.message}</p>}
            </div>
            <div>
              <label htmlFor="register-password" className="block text-sm font-medium text-gray-700">Password</label>
              <input
                id="register-password"
                type="password"
                autoComplete="new-password"
                {...registerForm.register('password')}
                className={`w-full px-3 py-2 mt-1 border rounded-md shadow-sm ${registerForm.formState.errors.password ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="••••••••"
              />
              {registerForm.formState.errors.password && <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.password.message}</p>}
            </div>
            <div>
              <button
                type="submit"
                disabled={registerMutation.isPending}
                className="w-full px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
              >
                {registerMutation.isPending ? 'Memproses...' : 'Daftar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}