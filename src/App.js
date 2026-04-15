import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import Navbar from './components/Navbar';
import Loader from './components/Loader';

// Lazy-load all pages for performance (smaller initial bundle)
const Landing      = lazy(() => import('./pages/Landing'));
const Dashboard    = lazy(() => import('./pages/Dashboard'));
const Inventory    = lazy(() => import('./pages/Inventory'));
const PatientRouter= lazy(() => import('./pages/PatientRouter'));
const Analytics    = lazy(() => import('./pages/Analytics'));
const Orders       = lazy(() => import('./pages/Orders'));
const AshaPortal   = lazy(() => import('./pages/AshaPortal'));
const PatientEHR   = lazy(() => import('./pages/PatientEHR'));
const VisitLog     = lazy(() => import('./pages/VisitLog'));
const Triage       = lazy(() => import('./pages/Triage'));
const Prescriptions= lazy(() => import('./pages/Prescriptions'));
const Appointments = lazy(() => import('./pages/Appointments'));
const Chatbot      = lazy(() => import('./pages/Chatbot'));

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Suspense fallback={<Loader />}>
        <Routes>
          {/* Public */}
          <Route path="/"            element={<Landing />} />

          {/* PHC Admin */}
          <Route path="/dashboard"   element={<Dashboard />} />
          <Route path="/inventory"   element={<Inventory />} />
          <Route path="/router"      element={<PatientRouter />} />
          <Route path="/analytics"   element={<Analytics />} />
          <Route path="/orders"      element={<Orders />} />

          {/* ASHA Worker */}
          <Route path="/asha"              element={<AshaPortal />} />
          <Route path="/asha/patients"     element={<PatientEHR />} />
          <Route path="/asha/visit/:id"    element={<VisitLog />} />
          <Route path="/asha/triage"       element={<Triage />} />
          <Route path="/asha/prescriptions"element={<Prescriptions />} />

          {/* Shared */}
          <Route path="/chatbot"     element={<Chatbot />} />
          <Route path="/appointments"element={<Appointments />} />

          {/* Fallback */}
          <Route path="*"            element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <ToastContainer
        position="bottom-right"
        autoClose={3500}
        hideProgressBar={false}
        theme="dark"
        toastClassName="Toastify__toast"
      />
    </BrowserRouter>
  );
}

export default App;
