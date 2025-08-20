import { Outlet, useNavigate } from "@tanstack/react-router";
import { NavLink } from './NavLink'; // Impor komponen NavLink
import { KanbanSquare, Clock, LogOut } from 'lucide-react'; // Impor ikon

export function RootLayout() {
      const navigate = useNavigate();

  const handleLogout = () => {
    // Di sini nanti kita akan hapus token/state autentikasi
    alert('Logout berhasil! (Simulasi)');
    navigate({ to: '/login' });
  };
  
    return (
     <div className="bg-gray-100">
             {/* Sidebar Navigation */}
        <div className="flex flex-col flex-1"></div>
        <header className="flex items-center justify-end h-16 px-8 bg-white border-b border-gray-200">
          {/* Nanti di sini bisa ada user profile, notifikasi, dll. */}
          <div className="font-medium">User Pegawai</div>
        </header>
         <aside className="flex flex-col w-64 p-4 bg-white border-r border-gray-200">
        <div className="mb-8 text-2xl font-bold text-center text-indigo-600">
          Ambis<span className="text-gray-800">.TM</span>
        </div>
        <nav className="flex flex-col gap-2">
          <NavLink to="/board" icon={<KanbanSquare size={20} />}>
            Board
          </NavLink>
          <NavLink to="/timeline" icon={<Clock size={20} />}>
            Timeline
          </NavLink>
        </nav>
        <div className="mt-auto">
          <button
            onClick={handleLogout}
            className="flex items-center w-full gap-3 px-3 py-2 text-gray-700 transition-colors rounded-md hover:bg-gray-200"
          >
            <LogOut size={20} />
            <span className="font-medium">Keluar</span>
          </button>
        </div>
      </aside>
         <main className="flex-1 p-8 overflow-y-auto">
          {/* Outlet adalah tempat komponen halaman (Board/Timeline) akan dirender */}
          <Outlet />
        </main>
     </div>
    );
}