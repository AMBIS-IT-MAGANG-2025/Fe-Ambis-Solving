import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LoginPage } from "./features/auth/pages/LoginPage"; // atau default
import BoardsPage from "./features/auth/pages/BoardPage";
import BoardPage from "./features/auth/pages/BoardPage";     // detail board

const qc = new QueryClient();

function Protected({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("token");
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/boards" element={<Protected><BoardsPage /></Protected>} />
          <Route path="/board/:id" element={<Protected><BoardPage /></Protected>} />
          <Route path="/" element={<Navigate to="/boards" replace />} />
          <Route path="*" element={<div className="p-6">404</div>} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
