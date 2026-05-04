import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import '../shared/styles/global.css';
import '../shared/styles/login.css';
import '../shared/styles/dashboard.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
