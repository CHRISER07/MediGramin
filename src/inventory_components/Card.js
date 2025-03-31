import React from 'react';
import './Card.css';

function Card({ title, value, description, status, statusValue, date, icon, iconType }) {
  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title">{title}</div>
        <div className={`card-icon icon-${iconType}`}>{icon}</div>
      </div>
      <div className="card-content">
        <div className="card-value">{value}</div>
        <div className="card-description">{description}</div>
      </div>
      <div className="card-footer">
        <div className={`card-status status-${status}`}>
          {status === 'positive' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
              <polyline points="16 7 22 7 22 13"></polyline>
            </svg>
          ) : status === 'negative' ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 17 13.5 8.5 8.5 13.5 2 7"></polyline>
              <polyline points="16 17 22 17 22 11"></polyline>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          )}
          {statusValue}
        </div>
        <div className="date">{date}</div>
      </div>
    </div>
  );
}

export default Card;