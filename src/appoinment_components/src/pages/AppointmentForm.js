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

  if (loading) return <div className="text-center">Loading appointment details...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  const formatTime = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString();
  };

  // ✅ Ensure correct extraction of Zoom link
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
    <div className="row justify-content-center">
      <div className="col-md-8">
        {confirmation ? (
          <div className="card">
            <div className="card-header bg-success text-white">
              <h4 className="mb-0">Appointment Confirmed!</h4>
            </div>
            <div className="card-body">
              <div className="alert alert-success">
                {confirmation.confirmation_message}
              </div>
              <h5>Appointment Details:</h5>
              <p><strong>Doctor:</strong> {doctor?.name}</p>
              <p><strong>Specialty:</strong> {doctor?.specialty}</p>
              <p><strong>Date & Time:</strong> {timeSlot && formatTime(timeSlot.start_time)}</p>
              <p><strong>Patient:</strong> {formData.patient_name}</p>
              <p><strong>Email:</strong> {formData.patient_email}</p>

              {/* ✅ Ensure Zoom link is correctly displayed */}
              <p>
                <strong>Zoom Link:</strong>{' '}
                {joinUrl ? (
                  <a href={joinUrl} target="_blank" rel="noopener noreferrer">
                    Join Meeting
                  </a>
                ) : (
                  "Zoom link not available"
                )}
              </p>
              
              <div className="d-flex justify-content-between mt-4">
                <button 
                  className="btn btn-primary"
                  onClick={() => navigate('/appointments')}
                >
                  View All Appointments
                </button>
                <button 
                  className="btn btn-outline-primary"
                  onClick={() => navigate('/')}
                >
                  Book Another Appointment
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="card-header">
              <h4 className="mb-0">Book Appointment</h4>
            </div>
            <div className="card-body">
              <div className="mb-4">
                <h5>Appointment Details:</h5>
                <p><strong>Doctor:</strong> {doctor ? doctor.name : 'Loading...'}</p>
                <p><strong>Specialty:</strong> {doctor ? doctor.specialty : 'Loading...'}</p>
                <p><strong>Date & Time:</strong> {timeSlot ? formatTime(timeSlot.start_time) : 'Loading...'}</p>
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
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
                <div className="mb-3">
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
                  <div className="form-text">We'll send your appointment confirmation to this email.</div>
                </div>
                
                <div className="d-flex justify-content-between">
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary"
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
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentForm;
