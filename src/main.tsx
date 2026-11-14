import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './app';
createRoot(document.getElementById('root') as HTMLElement).render(<App />);
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  const tinha = !!navigator.serviceWorker.controller; let recarregou = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (tinha && !recarregou) { recarregou = true; location.reload(); } });
  navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(r => r.update().catch(() => {})).catch(() => {});
}
