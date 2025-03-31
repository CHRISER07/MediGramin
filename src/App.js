import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Inventory Management Components
import Inventory from './inventory_components/Inventory';
import Header from './inventory_components/Header';
import Dashboard from './inventory_components/Dashboard';
import Dispensaries from './inventory_components/Dispensaries';
import Orders from './inventory_components/Orders';
import Analytics from './inventory_components/Analytics';


// Appointment-related Components
import DoctorList from './appoinment_components/pages/DoctorList';
import TimeSlotSelection from './appoinment_components/pages/TimeSlotSelection';
import AppointmentForm from './appoinment_components/pages/AppointmentForm.js';
import AppointmentList from './appoinment_components/pages/AppointmentList.js';

// Pages
import Chatbot from './chatbot_components/Chatbot.js';
import Home from './home_components/Home.js';
import Priority from './router_components/Priority.js';

import './App.css';

function App() {
  return (
    <div className="App">
      <Header />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/dispensaries" element={<Dispensaries />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/home" element={<Home />} />
        <Route path="/router" element={<Priority />} />

        {/* Appointment Routes */}
        <Route path="/doctors" element={<DoctorList />} />
        <Route path="/doctor/:id/timeslots" element={<TimeSlotSelection />} />
        <Route path="/book/:doctorId/:timeSlotId" element={<AppointmentForm />} />
        <Route path="/appointments" element={<AppointmentList />} />
      </Routes>
    </div>
  );
}

export default App;
