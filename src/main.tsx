
// Redirect /blah to /#blah for local testing (only if not already using hash)
if (window.location.pathname !== '/' && !window.location.hash) {
  const newUrl = '/#' + window.location.pathname.slice(1) + window.location.search + window.location.hash;
  window.location.replace(newUrl);
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './store'; // Initialize YJS store

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
