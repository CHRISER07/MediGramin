import React from 'react';
import './Dashboard.css';
import './Card.js';
import DemandPredictions from './DemandPredictions.js';
// import LowStockAlerts from './LowStockAlerts.js';
import UpcomingDeliveries from './UpcomingDeliveries.js';
// Card component defined inline since it's imported in the original code
const Card = ({ title, value, description, status, statusValue, date, icon }) => {
  return (
    <div className="card">
      <div className="card-content">
        <div className="card-header">
          <div className="icon-container">{icon}</div>
        </div>
        <div className="card-body">
          <h3 className="card-title">{title}</h3>
          <p className="card-value">{value}</p>
          <p className="card-description">{description}</p>
        </div>
        <div className="card-footer">
          <span className={`status ${status}`}>{statusValue}</span>
          <span className="date">{date}</span>
        </div>
      </div>
    </div>
  );
};

function Dashboard() {
  const dashboardData = [
    {
      title: "Total Medicines",
      value: "1,700",
      description: "Units in stock",
      status: "positive",
      statusValue: "+12.5%",
      date: "Since last month",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
        </svg>
      )
    },
    {
      title: "Pending Orders",
      value: "24",
      description: "Orders awaiting delivery",
      status: "negative",
      statusValue: "+5.8%",
      date: "Since last week",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="14" x="2" y="3" rx="2"></rect>
          <line x1="8" x2="16" y1="21" y2="21"></line>
          <line x1="12" x2="12" y1="17" y2="21"></line>
        </svg>
      )
    },
    {
      title: "Expiring Soon",
      value: "12",
      description: "Medicines expiring in 30 days",
      status: "negative",
      statusValue: "-2.3%",
      date: "Since last month",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect>
          <line x1="16" x2="16" y1="2" y2="6"></line>
          <line x1="8" x2="8" y1="2" y2="6"></line>
          <line x1="3" x2="21" y1="10" y2="10"></line>
          <path d="M8 14h.01"></path>
          <path d="M12 14h.01"></path>
          <path d="M16 14h.01"></path>
          <path d="M8 18h.01"></path>
          <path d="M12 18h.01"></path>
          <path d="M16 18h.01"></path>
        </svg>
      )
    },
    {
      title: "Mobile Units",
      value: "8",
      description: "Active mobile units",
      status: "positive",
      statusValue: "+25%",
      date: "Since last month",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9h18v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9Z"></path>
          <path d="M3 9V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4"></path>
          <path d="M3 9h4.5a3.5 3.5 0 0 0 7 0H21"></path>
        </svg>
      )
    }
  ];

  return (<>
    <div className="dashboard">
      {dashboardData.map((card, index) => (
        <Card key={index} {...card} />
      ))}
    </div>

    <DemandPredictions/>
    <UpcomingDeliveries/>
    </>
  );
}

export default Dashboard;