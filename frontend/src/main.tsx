// src/main.tsx
// React application entry point

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found in index.html');

ReactDOM.createRoot(root).render(
  // StrictMode double-invokes effects in development to detect side-effects
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
