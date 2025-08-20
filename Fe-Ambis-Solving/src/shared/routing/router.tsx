import {createRouter, createRootRoute, createRoute} from '@tanstack/react-router';
import {RootLayout} from '../layout/RootLayout';
import {LoginPage} from '../../features/auth/pages/LoginPage';
import { BoardPage } from '../../features/auth/pages/BoardPage';
import { TimeLinePage } from '../../features/auth/pages/TimeLinePage';

//Buat Root Route
const rootRoute = createRootRoute({
    component: RootLayout,
})

// 2. Buat Rute untuk setiap halaman
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: BoardPage, // Halaman default setelah login adalah Board
});

const boardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/board',
  component: BoardPage,
});

const timelineRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/timeline',
  component: TimeLinePage,
});

// 3. Buat rute login yang tidak menggunakan layout utama
const loginRoute = createRoute({
  getParentRoute: () => rootRoute, // Kita bisa buat root lain jika login punya layout berbeda
  path: '/login',
  component: LoginPage,
});

// 4. Gabungkan semua rute menjadi satu pohon rute
const routeTree = rootRoute.addChildren([
  indexRoute,
  boardRoute,
  timelineRoute,
  loginRoute,
]);

// 5. Buat dan ekspor instance router
export const router = createRouter({ routeTree });

// Deklarasikan modul untuk type-safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}