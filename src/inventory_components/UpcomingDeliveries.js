import React, { useState } from 'react';
import './UpcomingDeliveries.css';

function UpcomingDeliveries({ openModal }) {
  const deliveryData = [
    {
      id: "#ORD-001",
      medicine: "Amoxicillin",
      dispensary: "Mobile Unit 1",
      quantity: 50,
      date: "2025-03-10",
      priority: "normal",
      status: "scheduled"
    },
    {
      id: "#ORD-002",
      medicine: "Ibuprofen",
      dispensary: "Central Pharmacy",
      quantity: 100,
      date: "2025-03-11",
      priority: "normal",
      status: "scheduled"
    },
    {
      id: "#ORD-003",
      medicine: "Insulin",
      dispensary: "Rural Clinic",
      quantity: 25,
      date: "2025-03-09",
      priority: "high",
      status: "scheduled"
    },
    {
      id: "#ORD-004",
      medicine: "Paracetamol",
      dispensary: "Urban Hospital",
      quantity: 200,
      date: "2025-03-12",
      priority: "low",
      status: "in-transit"
    },
    {
      id: "#ORD-005",
      medicine: "Metformin",
      dispensary: "Community Clinic",
      quantity: 75,
      date: "2025-03-15",
      priority: "high",
      status: "scheduled"
    },
    {
      id: "#ORD-006",
      medicine: "Omeprazole",
      dispensary: "Rural Hospital",
      quantity: 40,
      date: "2025-03-14",
      priority: "normal",
      status: "scheduled"
    }
  ];

  const [search, setSearch] = useState('');
  const [visibleRows, setVisibleRows] = useState(3);
  const [activeTab, setActiveTab] = useState('all');

  // Filter deliveries based on search input and tab
  const filteredDeliveries = deliveryData.filter(delivery => {
    const matchesSearch = delivery.medicine.toLowerCase().includes(search.toLowerCase());
    const matchesTab = activeTab === 'all' || 
                        (activeTab === 'high' && delivery.priority === 'high') || 
                        (activeTab === 'normal' && delivery.priority === 'normal') ||
                        (activeTab === 'in-transit' && delivery.status === 'in-transit');
    return matchesSearch && matchesTab;
  });

  const displayedDeliveries = filteredDeliveries.slice(0, visibleRows);
  const hasMoreToShow = filteredDeliveries.length > visibleRows;

  const handleViewMore = () => {
    if (hasMoreToShow) {
      setVisibleRows(prevRows => prevRows + 3);
    } else {
      setVisibleRows(3);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Priority Badge Component (inline)
  const PriorityBadge = ({ priority }) => (
    <span className={`status-badge priority-${priority}`}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );

  // Status Badge Component (inline)
  const StatusBadge = ({ status }) => (
    <span className={`status-badge status-${status}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );

  return (
    <div className="demand-predictions upcoming-deliveries">
      <div className="header">
        <h2 className="title">
          <svg className="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
            <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
          </svg>
          Upcoming Deliveries
        </h2>
      </div>

      <div className="toolbar">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 'all' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All
          </button>
          <button 
            className={`tab ${activeTab === 'high' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('high')}
          >
            High Priority
          </button>
          <button 
            className={`tab ${activeTab === 'normal' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('normal')}
          >
            Normal
          </button>
          <button 
            className={`tab ${activeTab === 'in-transit' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('in-transit')}
          >
            In Transit
          </button>
        </div>
        
        <div className="actions-container">
          <div className="search-container">
            <span className="search-icon">
              <svg className="icon-search" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </span>
            <input
              type="text"
              className="search-input"
              placeholder="Search medicines..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="order-button button-potential" onClick={openModal}>
            + Add Delivery
          </button>
        </div>
      </div>

      {filteredDeliveries.length > 0 ? (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Medicine</th>
                <th>Dispensary</th>
                <th>Quantity</th>
                <th>Date</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedDeliveries.map((delivery) => (
                <tr 
                  key={delivery.id} 
                  className={delivery.priority === 'high' ? 'critical-row' : ''}
                >
                  <td>{delivery.id}</td>
                  <td className="medicine-cell">{delivery.medicine}</td>
                  <td className="dispensary-cell">{delivery.dispensary}</td>
                  <td className="stock-cell">{delivery.quantity}</td>
                  <td>{formatDate(delivery.date)}</td>
                  <td>
                    <PriorityBadge priority={delivery.priority} />
                  </td>
                  <td>
                    <StatusBadge status={delivery.status} />
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className={`order-button ${delivery.priority === 'high' ? 'button-critical' : 'button-sufficient'}`}
                        title="View Details"
                      >
                        View
                      </button>
                      <button 
                        className="order-button button-sufficient" 
                        title="Edit"
                      >
                        Edit
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="no-results">
          No deliveries found.
        </div>
      )}

      {filteredDeliveries.length > 0 && (
        <div className="view-more-container">
          <button className="view-more-button" onClick={handleViewMore}>
            {hasMoreToShow ? 'View More' : 'View Less'}
            <svg 
              className="view-icon" 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20" 
              fill="currentColor"
              style={{ transform: hasMoreToShow ? 'none' : 'rotate(180deg)' }}
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

export default UpcomingDeliveries;