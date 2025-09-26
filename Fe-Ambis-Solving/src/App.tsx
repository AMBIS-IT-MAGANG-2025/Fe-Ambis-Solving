// This file is not used. The app uses TanStack Router via RouterProvider in main.tsx
// The routing is handled in src/shared/routing/router.tsx
// This file contains duplicate routing code that has been disabled to avoid conflicts.

// import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { LoginPage } from "./features/auth/pages/LoginPage";
// import BoardsPage from "./features/board/pages/BoardPage";
// import BoardPage from "./features/board/pages/BoardPage";
// import { useEffect } from "react";
// import { socket } from "./shared/services/socket";

// const qc = new QueryClient();

// function Protected({ children }: { children: React.ReactNode }) {
//   const token = localStorage.getItem("token");
//   return token ? <>{children}</> : <Navigate to="/login" replace />;
// }

// export default function App() {
//   return (
//     <QueryClientProvider client={qc}>
//       <BrowserRouter>
//         <Routes>
//           <Route path="/login" element={<LoginPage />} />
//           <Route path="/boards" element={<Protected><BoardsPage /></Protected>} />
//           <Route path="/board/:id" element={<Protected><BoardPage /></Protected>} />
//           <Route path="/" element={<Navigate to="/boards" replace />} />
//           <Route path="*" element={<div className="p-6">404</div>} />
//         </Routes>
//       </BrowserRouter>
//     </QueryClientProvider>
//   );
// }
