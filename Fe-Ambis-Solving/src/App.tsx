import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LoginPage } from "./features/auth/pages/LoginPage"; // atau default
import BoardsPage from "./features/auth/pages/BoardPage";
import BoardPage from "./features/auth/pages/BoardPage";     // detail board
import { useEffect } from "react";
import { socket } from "../src/features/auth/services/socket";



const qc = new QueryClient();

export function RootSockets() {
  useEffect(() => {
    if (!socket.connected) socket.connect();

    const onConnect = () => console.log("socket connected", socket.id);
    const onDisconnect = (r: string) => console.log("socket disconnected", r);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.disconnect();
    };
  }, []);

  return null;
}

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
