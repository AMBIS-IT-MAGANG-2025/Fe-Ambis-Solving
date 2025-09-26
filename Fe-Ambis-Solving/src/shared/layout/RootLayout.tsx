
import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from '@tanstack/react-query';
import { NavLink } from './NavLink';
import { KanbanSquare, Clock, LogOut, Menu, X } from 'lucide-react';
import { socket } from '../services/socket';


export function RootLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate({ to: '/login' as any });
  };
  
  // 5. Tambahkan useEffect untuk mengelola koneksi socket
  // DISABLED: WebSocket connections commented out
  /*
  useEffect(() => {
    // Ambil token dari localStorage
    const token = localStorage.getItem('authToken');

    // Hanya jalankan koneksi jika token ada
    if (token) {
      socket.connect();

      (socket as any).on('board_updated', () => {
        console.log('Event "board_updated" diterima! Memuat ulang data board...');
        queryClient.invalidateQueries({ queryKey: ['boards'] });
      });

      return () => {
        (socket as any).off('board_updated');
        socket.disconnect();
      };
    }
  }, [queryClient]);
  */



  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        flex flex-col w-64 bg-white border-r border-gray-200
        transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 transition-transform duration-300 ease-in-out
      `}>
        <div className="flex items-center justify-between p-4 mb-4 border-b">
          <div className="text-2xl font-bold text-indigo-600">
            Ambis<span className="text-gray-800">.TM</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-col gap-2 px-4 flex-1">
          <NavLink
            to={"/boards" as any}
            icon={<KanbanSquare size={20} />}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Boards
          </NavLink>
          <NavLink
            to={"/timeline" as any}
            icon={<Clock size={20} />}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Timeline
          </NavLink>
        </nav>

        <div className="px-4 mb-4">
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
      <div className="flex flex-col flex-1 min-w-0">
        <header className="flex items-center justify-between h-16 px-4 lg:px-8 bg-white border-b border-gray-200">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100"
          >
            <Menu size={20} />
          </button>
          <div className="lg:ml-auto font-medium">User Pegawai</div>
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}