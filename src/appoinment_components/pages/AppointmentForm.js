import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './AppointmentForm.css';

const AppointmentForm = () => {
  const [formData, setFormData] = useState({
    patient_name: '',
    patient_email: ''
  });
  const [doctor, setDoctor] = useState(null);
  const [timeSlot, setTimeSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const { doctorId, timeSlotId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (!doctorId || !timeSlotId) {
      setError('Invalid doctor or time slot selection.');
      setLoading(false);
      return;
    }

    const fetchDoctorAndTimeSlot = async () => {
      try {
        const doctorResponse = await api.get(`/doctors/${doctorId}`);
        const timeSlotResponse = await api.get(`/time_slots/${timeSlotId}`);
        
        setDoctor(doctorResponse.data);
        setTimeSlot(timeSlotResponse.data);
      } catch (err) {
        setError('Failed to load doctor or time slot details.');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctorAndTimeSlot();
  }, [doctorId, timeSlotId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    
    try {
      const response = await api.post('/appointments', {
        doctor_id: doctorId,
        start_time: timeSlot?.start_time,
        end_time: timeSlot?.end_time,
        ...formData
      });

      console.log("API Response:", response.data); // Debugging
      setConfirmation(response.data);
      setSubmitting(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to book appointment');
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading-container">Loading appointment details...</div>;
  if (error) return <div className="error-message">{error}</div>;

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  // Ensure correct extraction of Zoom link
  const zoomLink = confirmation?.zoom_link;
  let joinUrl = '';

  if (zoomLink) {
    if (typeof zoomLink === 'string') {
      joinUrl = zoomLink; // Direct string link
    } else if (typeof zoomLink === 'object' && zoomLink.join_url) {
      joinUrl = zoomLink.join_url; // Extract join_url from object
    }
  }

  return (
    <div className="appointment-container">
      {confirmation ? (
        <>
          <div className="appointment-header appointment-confirmation">
            <h4>Appointment Confirmed!</h4>
          </div>
          <div className="appointment-body">
            <div className="confirmation-message">
              {confirmation.confirmation_message}
            </div>
            <div className="appointment-details">
              <h5>Appointment Details:</h5>
              <div className="detail-item">
                <span className="detail-label">Doctor:</span>
                <span>{doctor?.name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Specialty:</span>
                <span>{doctor?.specialty}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Date & Time:</span>
                <span>{timeSlot && formatTime(timeSlot.start_time)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Patient:</span>
                <span>{formData.patient_name}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Email:</span>
                <span>{formData.patient_email}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Zoom Link:</span>
                <span>
                  {joinUrl ? (
                    <a href={joinUrl} target="_blank" rel="noopener noreferrer" className="zoom-link">
                      Join Meeting
                    </a>
                  ) : (
                    "Zoom link not available"
                  )}
                </span>
              </div>
            </div>
            
            <div className="button-container">
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/appointments')}
              >
                View All Appointments
              </button>
              <button 
                className="btn btn-outline btn-outline-primary"
                onClick={() => navigate('/')}
              >
                Book Another Appointment
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="appointment-header">
            <h4>Book Appointment</h4>
          </div>
          <div className="appointment-body">
            <div className="appointment-details">
              <h5>Appointment Details:</h5>
              <div className="detail-item">
                <span className="detail-label">Doctor:</span>
                <span>{doctor ? doctor.name : 'Loading...'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Specialty:</span>
                <span>{doctor ? doctor.specialty : 'Loading...'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Date & Time:</span>
                <span>{timeSlot ? formatTime(timeSlot.start_time) : 'Loading...'}</span>
              </div>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="patient_name" className="form-label">Your Name</label>
                <input
                  type="text"
                  className="form-control"
                  id="patient_name"
                  name="patient_name"
                  value={formData.patient_name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="patient_email" className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  id="patient_email"
                  name="patient_email"
                  value={formData.patient_email}
                  onChange={handleChange}
                  required
                />
                <span className="form-text">We'll send your appointment confirmation to this email.</span>
              </div>
              
              <div className="button-container">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => navigate(`/doctor/${doctorId}/timeslots`)}
                >
                  Back
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Booking...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
};

export default AppointmentForm;