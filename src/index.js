import React from 'react';
// import ReactDOM from 'react-dom/client';
import { createRoot } from "react-dom/client"; 
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import './index.css';
import App from './App';

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
