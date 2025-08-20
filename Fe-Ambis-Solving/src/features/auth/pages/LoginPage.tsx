import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from '@tanstack/react-router';



export function LoginPage() {
  // 1. Definisikan skema validasi menggunakan Zod
  const loginSchema = z.object({
    email: z.string().email('Email tidak valid'),
    password: z.string().min(8, 'Password harus minimal 8 karakter'),
  });

  // 2. Buat tipe data untuk form inputs
  type LoginFormInputs = z.infer<typeof loginSchema>;

  // Gunakan useNavigate untuk navigasi setelah login
const navigate = useNavigate();

  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema), // Hubungkan Zod dengan react-hook-form
  });

  const onSubmit = (data: LoginFormInputs) => {
    console.log('Data yang akan dikirim ke API:', data);
  // --- SIMULASI LOGIN ---
    // Nantinya di sini kita akan memanggil API menggunakan TanStack Query
    // Jika sukses:
    alert('Login berhasil! (Simulasi)');
    // Simpan token (misal ke Zustand/localStorage)
    // Redirect ke halaman board
    navigate({ to: '/board' });
    // Jika gagal, tampilkan notifikasi error
  };



  
  return (
    <div className="bg-gray-50">
      <div className="bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-gray-900">Selamat Datang!</h1>
          <p className="text-gray-600">Masuk untuk melanjutkan ke Task Manager</p>
        </div>
                {/* 3. Gunakan handleSubmit untuk membungkus fungsi onSubmit kita */}
        <form className="bg-blue-300" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label 
              htmlFor="email" 
              className="text-gray-700"
            >
              Email / Username
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"

              {...register('email')} // Daftarkan input ini ke react-hook-form

              required
              className="placeholder-gray-400"
              placeholder="pegawai@ambis.com"
            />
          {/* Tampilkan pesan error jika ada */}
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>
          <div>
            <label 
              htmlFor="password" 
              className="text-gray-700"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              {...register('password')} // Daftarkan input ini ke react-hook-form
              className={`w-full px-3 py-2 mt-1 border rounded-md shadow-sm ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="••••••••"
            />
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
          </div>
          <div>
            <button
              type="submit"
              className="bg-blue-500"
            >
              Masuk
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};