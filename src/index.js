import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// CRA overlay does `new Error(reason)` for non-Error rejections → "[object Object]".
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  if (reason instanceof Error) {
    if (reason.message === '[object Object]') {
      event.preventDefault();
      console.error('[OOMS] Unhandled rejection (opaque Error):', reason.cause || reason);
    }
    return;
  }

  event.preventDefault();

  let message = 'Unhandled promise rejection';
  if (typeof reason === 'string' && reason.trim()) {
    message = reason;
  } else if (reason && typeof reason === 'object') {
    const raw = reason.message || reason.msg || reason.error || reason.description;
    if (typeof raw === 'string' && raw.trim()) {
      message = raw;
    } else {
      try {
        message = JSON.stringify(reason);
      } catch (_) {
        message = Object.prototype.toString.call(reason);
      }
    }
  }

  console.error('[OOMS] Unhandled rejection:', message, reason);
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

