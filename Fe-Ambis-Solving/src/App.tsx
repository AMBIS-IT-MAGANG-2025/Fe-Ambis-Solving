// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// pastikan file ini ada & export default
import { LoginPage } from "./features/auth/pages/LoginPage";
import BoardPage from "./features/auth/pages/BoardPage";

// React Query client (satu per app)
const qc = new QueryClient();

// Guard sederhana: butuh token untuk akses halaman terlindungi
import type { ReactNode } from "react";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}


export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/board/:id"
            element={
              <ProtectedRoute>
                <BoardPage />
              </ProtectedRoute>
            }
          />
          {/* arahkan root ke login (atau ganti ke /boards kalau kamu punya halaman list boards) */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<div className="p-6">404 - Halaman tidak ditemukan</div>} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
