// client/src/pages/TimeSlotSelection.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
// import './TImeSlotSelection.css'
const TimeSlotSelection = () => {
  const [timeSlots, setTimeSlots] = useState([]);
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [doctorResponse, timeSlotsResponse] = await Promise.all([
          api.get(`/doctors/${id}`),
          api.get(`/doctors/${id}/availability`)
        ]);
        
        setDoctor(doctorResponse.data.doctor);
        setTimeSlots(timeSlotsResponse.data.timeSlots);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch time slots');
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleSelectTimeSlot = (timeSlotId) => {
    navigate(`/book/${id}/${timeSlotId}`);
  };

  if (loading) return <div className="text-center">Loading available times...</div>;
  if (error) return <div className="alert alert-danger">{error}</div>;

  // Group time slots by date
  const groupedTimeSlots = timeSlots.reduce((groups, slot) => {
    const date = new Date(slot.start_time).toLocaleDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(slot);
    return groups;
  }, {});

  return (
    <div>
      <h2>Available Time Slots</h2>
      {doctor && (
        <h4 className="mb-4">Dr. {doctor.name} - {doctor.specialty}</h4>
      )}
      
      {Object.keys(groupedTimeSlots).length === 0 ? (
        <div className="alert alert-info">No available time slots for this doctor.</div>
      ) : (
        Object.entries(groupedTimeSlots).map(([date, slots]) => (
          <div key={date} className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">{date}</h5>
            </div>
            <div className="card-body">
              <div className="row">
                {slots.map(slot => (
                  <div key={slot.id} className="col-md-3 mb-3">
                    <button 
                      className="btn btn-outline-primary w-100"
                      onClick={() => handleSelectTimeSlot(slot.id)}
                    >
                      {new Date(slot.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))
      )}
      
      <button 
        className="btn btn-secondary mt-3"
        onClick={() => navigate('/')}
      >
        Back to Doctor List
      </button>
    </div>
  );
};

export default TimeSlotSelection;