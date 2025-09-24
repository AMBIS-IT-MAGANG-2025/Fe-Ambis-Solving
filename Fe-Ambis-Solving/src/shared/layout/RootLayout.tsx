
import { useEffect } from 'react'; // <-- 1. Impor useEffect
import { Outlet, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from '@tanstack/react-query'; // <-- 2. Impor useQueryClient
import { NavLink } from './NavLink';
import { KanbanSquare, Clock, LogOut } from 'lucide-react';
import { socket } from '../../features/auth/services/socket'; // <-- 3. Impor socket


export function RootLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient(); // <-- 4. Dapatkan instance queryClient

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate({ to: '/login' });
  };
  
  // 5. Tambahkan useEffect untuk mengelola koneksi socket

useEffect(() => {
  // Ambil token dari localStorage
  const token = localStorage.getItem('authToken');

  // Hanya jalankan koneksi jika token ada
  if (token) {
    socket.connect();

    socket.on('board_updated', () => {
      console.log('Event "board_updated" diterima! Memuat ulang data board...');
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    });

    return () => {
      socket.off('board_updated');
      socket.disconnect();
    };
  }
}, [queryClient]);



   return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar Navigation */}
      <aside className="flex flex-col w-64 bg-white border-r border-gray-200">
        <div className="p-4 mb-4 text-2xl font-bold text-center text-indigo-600 border-b">
          Ambis<span className="text-gray-800">.TM</span>
        </div>
        <nav className="flex flex-col gap-2 px-4">
          <NavLink to="/board" icon={<KanbanSquare size={20} />}>
            Board
          </NavLink>
          <NavLink to="/timeline" icon={<Clock size={20} />}>
            Timeline
          </NavLink>
        </nav>
        <div className="px-4 mt-auto mb-4">
          <button
            onClick={handleLogout}
            className="flex items-center w-full gap-3 px-3 py-2 text-gray-700 transition-colors rounded-md hover:bg-gray-200"
          >
            <LogOut size={20} />
            <span className="font-medium">Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1">
        <header className="flex items-center justify-end h-16 px-8 bg-white border-b border-gray-200">
          <div className="font-medium">User Pegawai</div>
        </header>
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}