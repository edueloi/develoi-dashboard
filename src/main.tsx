import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import './index.css';

console.log("App starting...");

// Benign errors to ignore
const IGNORED_ERRORS = ["WebSocket", "vite"];

window.onerror = (message, source, lineno, colno, error) => {
  const msg = String(message);
  if (IGNORED_ERRORS.some(err => msg.includes(err))) return;
  
  console.error("Global error:", { message, source, lineno, colno, error });
};

window.onunhandledrejection = (event) => {
  const msg = String(event.reason);
  if (IGNORED_ERRORS.some(err => msg.includes(err))) return;

  console.error("Unhandled rejection:", event.reason);
};

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error("Root element not found");
  
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
  console.log("App rendered");
} catch (error) {
  console.error("App render error:", error);
  document.body.innerHTML = `<div style="padding: 20px; color: red;"><h1>Render Error</h1><pre>${error}</pre></div>`;
}
