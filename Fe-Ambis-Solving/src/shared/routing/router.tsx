import {createRouter, createRootRoute, createRoute, redirect} from '@tanstack/react-router';
import { lazy } from 'react';

// Lazy load components
const RootLayout = lazy(() => import('../layout/RootLayout').then(m => ({ default: m.RootLayout })));
const LoginPage = lazy(() => import('../../features/auth/pages/LoginPage').then(m => ({ default: m.LoginPage })));
const BoardPage = lazy(() => import('../../features/board/pages/BoardPage').then(m => ({ default: m.BoardPage })));
const TimeLinePage = lazy(() => import('../../features/timeline/pages/TimeLinePage').then(m => ({ default: m.TimeLinePage })));
const NotesPage = lazy(() => import('../../features/notes/pages/NotesPage').then(m => ({ default: m.NotesPage })));

// Route configurations
const publicRoutes = [
  { path: '/login', component: LoginPage }
];

// Lazy load additional components
const BoardsPage = lazy(() => import('../../features/board/pages/BoardsPage').then(m => ({ default: m.BoardsPage })));

// shared/routing/router.tsx (potongan penting)
const privateRoutes = [
  { path: '/boards', component: BoardsPage },
  { path: '/boards/$boardId', component: BoardPage }, // ✅ ganti ke plural
  { path: '/timeline', component: TimeLinePage },
  { path: '/notes', component: NotesPage }
];

// Create root route
const rootRoute = createRootRoute();

// Create public routes
const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: publicRoutes[0].path,
  component: publicRoutes[0].component,
});

// Create app layout route for private routes
const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: RootLayout,
  beforeLoad: ({ location }) => {
    if (!localStorage.getItem('authToken')) {
      throw redirect({ to: '/login' as any });
    }
    if (location.pathname === '/') {
      throw redirect({ to: '/boards' as any });
    }
  },
});

// Create private routes dynamically
const privateRouteInstances = privateRoutes.map(routeConfig =>
  createRoute({
    getParentRoute: () => appRoute,
    path: routeConfig.path,
    component: routeConfig.component,
    beforeLoad: () => {
      if (!localStorage.getItem('authToken')) {
        throw redirect({ to: '/login' as any });
      }
    },
  })
);

// Build route tree
const routeTree = rootRoute.addChildren([
  loginRoute,
  appRoute.addChildren(privateRouteInstances),
]);

// Create and export router
export const router = createRouter({ routeTree });

// Declare module for type-safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}