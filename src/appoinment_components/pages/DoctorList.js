// client/src/pages/DoctorList.js
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
// import './DoctorList.css'; // Import the CSS file

const DoctorList = () => {
  const [doctors, setDoctors] = useState([]); // ✅ Ensure it's always an array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await api.get('/doctors');
        console.log("API Response:", response.data); // ✅ Debugging log
        setDoctors(Array.isArray(response.data) ? response.data : []); // ✅ Ensure array
      } catch (err) {
        console.error("Error fetching doctors:", err); // ✅ Log actual error
        setError('Failed to fetch doctors');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  // Enhanced loading state with spinner
  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner">Loading...</div>
      <p>Loading doctors...</p>
    </div>
  );
  
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (doctors.length === 0) return <div className="alert alert-info">No doctors are currently available.</div>;

  return (
    <div className="container">
      <div className="row">
        <div className="col-12 mb-4">
          <h2>Available Doctors</h2>
          <p className="page-description">Select a doctor to view their available time slots.</p>
        </div>

        {doctors.map((doctor) => (
          <div key={doctor.id} className="col-md-4 mb-4">
            <div className="card h-100">
              {/* Uncomment if you have doctor images */}
              {/* {doctor.image && <img src={doctor.image} alt={doctor.name} className="doctor-img" />} */}
              <div className="card-body">
                <h5 className="card-title">{doctor.name}</h5>
                <span className="specialty-badge">{doctor.specialty}</span>
                
                {/* Additional doctor info - add this if you have these fields */}
                <div className="doctor-info">
                  {doctor.experience && (
                    <span className="info-item">
                      <i className="far fa-clock"></i> {doctor.experience} years
                    </span>
                  )}
                  {doctor.rating && (
                    <span className="info-item">
                      <i className="far fa-star"></i> {doctor.rating}/5
                    </span>
                  )}
                </div>
                
                <Link to={`/doctor/${doctor.id}/timeslots`} className="btn btn-primary mt-3">
                  View Available Times
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DoctorList;