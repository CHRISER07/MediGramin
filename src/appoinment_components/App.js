import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import DoctorList from './pages/DoctorList';
import TimeSlotSelection from './pages/TimeSlotSelection';
import AppointmentForm from './pages/AppointmentForm';
import AppointmentList from './pages/AppointmentList';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <div className="container mt-4">
          <Routes>
            <Route path="/" element={<DoctorList />} />
            <Route path="/doctor/:id/timeslots" element={<TimeSlotSelection />} />
            <Route path="/book/:doctorId/:timeSlotId" element={<AppointmentForm />} />
            <Route path="/appointments" element={<AppointmentList />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;