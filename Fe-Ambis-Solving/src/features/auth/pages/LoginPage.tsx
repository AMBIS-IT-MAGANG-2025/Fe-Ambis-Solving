import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod'; // <-- Tambahkan impor Zod
import { useNavigate } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query'; // <-- Tambahkan impor useMutation
import { loginUser } from '../../services/api';

// Definisikan skema validasi
const loginSchema = z.object({
  email: z.string().email({ message: 'Format email tidak valid' }),
  password: z.string().min(1, { message: 'Password tidak boleh kosong' }),
});
type LoginFormInputs = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      localStorage.setItem('authToken', data.token);
      navigate({ to: '/board' });
    },
    onError: (error) => {
      alert(error.message);
    }
  });

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  // Hanya ada satu fungsi onSubmit
  const onSubmit = (data: LoginFormInputs) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Selamat Datang!</h1>
          <p className="mt-2 text-gray-600">Masuk untuk melanjutkan</p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email / Username</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register('email')}
              className={`w-full px-3 py-2 mt-1 border rounded-md shadow-sm ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="pegawai@ambis.com"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register('password')}
              className={`w-full px-3 py-2 mt-1 border rounded-md shadow-sm ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="••••••••"
            />
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
          </div>
          <div>
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
            >
              {loginMutation.isPending ? 'Loading...' : 'Masuk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}