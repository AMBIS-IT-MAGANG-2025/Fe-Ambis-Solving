import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './shared/routing/router'; 
import './index.css';

const rootElement = document.getElementById('root')!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      {/* Ganti <App /> dengan <RouterProvider /> */}
      <RouterProvider router={router} />
    </React.StrictMode>
  );
}