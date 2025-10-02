import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
// We no longer import index.css because the CDN script now handles all styling.
// import './index.css'; 

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

