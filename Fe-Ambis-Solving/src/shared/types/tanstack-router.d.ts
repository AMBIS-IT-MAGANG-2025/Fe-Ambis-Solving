// memastikan TanStack Router tahu semua rute kita
import type { router } from '../shared/routing/router';

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof import('../shared/routing/router').router;
  }
}

export {}; // jaga agar file ini dianggap modul
