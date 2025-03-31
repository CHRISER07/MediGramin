// client/src/pages/AppointmentList.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
// import './Appointmentlist.css';

const AppointmentList = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await api.get('/appointments');
        setAppointments(response.data.appointments);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch appointments');
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);

  const handleStatusUpdate = async (id, status) => {
    try {
      await api.put(`/appointments/${id}`, { status });
      setAppointments(appointments.map(apt => 
        apt.id === id ? { ...apt, status } : apt
      ));
    } catch (err) {
      setError('Failed to update appointment status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }
    
    try {
      await api.delete(`/appointments/${id}`);
      setAppointments(appointments.filter(apt => apt.id !== id));
    } catch (err) {
      setError('Failed to cancel appointment');
    }
  };

  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Scheduled':
        return <span className="badge bg-primary">Scheduled</span>;
      case 'Completed':
        return <span className="badge bg-success">Completed</span>;
      case 'Canceled':
        return <span className="badge bg-danger">Canceled</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  if (loading) return <div className="text-center">Loading appointments...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>My Appointments</h2>
        <Link to="/" className="btn btn-primary">Book New Appointment</Link>
      </div>
      
      {appointments.length === 0 ? (
        <div className="alert alert-info">
          You don't have any appointments scheduled. <Link to="/">Book an appointment</Link> to get started.
        </div>
      ) : (
        <div className="row">
          {appointments.map(appointment => (
            <div key={appointment.id} className="col-md-6 mb-4">
              <div className="card h-100">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">{appointment.doctor_name}</h5>
                  {getStatusBadge(appointment.status)}
                </div>
                <div className="card-body">
                  <p><strong>Patient:</strong> {appointment.patient_name}</p>
                  <p><strong>Date & Time:</strong> {formatDateTime(appointment.start_time)}</p>
                  <p><strong>Email:</strong> {appointment.patient_email}</p>
                  
                  {appointment.zoom_link && (
                    <p>
                      <strong>Zoom Link:</strong>{' '}
                      <a href={appointment.zoom_link} target="_blank" rel="noopener noreferrer">
                        Join Meeting
                      </a>
                    </p>
                  )}
                  
                  {appointment.status === 'Scheduled' && (
                    <div className="d-flex justify-content-between mt-3">
                      <button 
                        className="btn btn-success btn-sm"
                        onClick={() => handleStatusUpdate(appointment.id, 'Completed')}
                      >
                        Mark as Completed
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(appointment.id)}
                      >
                        Cancel Appointment
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppointmentList;