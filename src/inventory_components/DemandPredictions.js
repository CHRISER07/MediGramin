import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './DemandPredictions.css';

const DemandPredictions = () => {
  const [activeTab, setActiveTab] = useState('weekly');
  const [ordering, setOrdering] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllRows, setShowAllRows] = useState(false);
  const [filteredData, setFilteredData] = useState([]);
  
  const weeklyData = [
    { name: 'Mon', Amoxicillin: 15, Ibuprofen: 12, Insulin: 8 },
    { name: 'Tue', Amoxicillin: 18, Ibuprofen: 15, Insulin: 10 },
    { name: 'Wed', Amoxicillin: 14, Ibuprofen: 18, Insulin: 12 },
    { name: 'Thu', Amoxicillin: 16, Ibuprofen: 14, Insulin: 9 },
    { name: 'Fri', Amoxicillin: 20, Ibuprofen: 16, Insulin: 11 },
    { name: 'Sat', Amoxicillin: 10, Ibuprofen: 8, Insulin: 6 },
    { name: 'Sun', Amoxicillin: 8, Ibuprofen: 10, Insulin: 4 },
  ];

  const monthlyData = [
    { name: 'Week 1', Amoxicillin: 75, Ibuprofen: 65, Insulin: 45 },
    { name: 'Week 2', Amoxicillin: 80, Ibuprofen: 90, Insulin: 50 },
    { name: 'Week 3', Amoxicillin: 85, Ibuprofen: 95, Insulin: 55 },
    { name: 'Week 4', Amoxicillin: 80, Ibuprofen: 100, Insulin: 60 },
  ];

  const quarterlyData = [
    { name: 'Month 1', Amoxicillin: 300, Ibuprofen: 350, Insulin: 200 },
    { name: 'Month 2', Amoxicillin: 320, Ibuprofen: 340, Insulin: 210 },
    { name: 'Month 3', Amoxicillin: 330, Ibuprofen: 360, Insulin: 240 },
  ];

  // Extended data for "View More" functionality
  const extendedTableData = {
    weekly: [
      { medicine: 'Amoxicillin', dispensary: 'Deogiri', currentStock: 500, predictedDemand: 75, status: 'Sufficient' },
      { medicine: 'Ibuprofen', dispensary: 'Mobile Unit 1', currentStock: 200, predictedDemand: 80, status: 'Sufficient' },
      { medicine: 'Insulin', dispensary: 'Deogiri', currentStock: 45, predictedDemand: 50, status: 'Potential Shortage' },
      { medicine: 'Paracetamol', dispensary: 'Mobile Unit 2', currentStock: 350, predictedDemand: 120, status: 'Sufficient' },
      { medicine: 'Metformin', dispensary: 'Deogiri', currentStock: 80, predictedDemand: 95, status: 'Potential Shortage' },
      { medicine: 'Lisinopril', dispensary: 'Mobile Unit 3', currentStock: 120, predictedDemand: 60, status: 'Sufficient' },
      { medicine: 'Atorvastatin', dispensary: ' Deogiri', currentStock: 30, predictedDemand: 45, status: 'Critical Shortage' },
    ],
    monthly: [
      { medicine: 'Amoxicillin', dispensary: 'Deogiri', currentStock: 500, predictedDemand: 320, status: 'Sufficient' },
      { medicine: 'Ibuprofen', dispensary: 'Taranagar', currentStock: 200, predictedDemand: 350, status: 'Potential Shortage' },
      { medicine: 'Insulin', dispensary: 'Deogiri', currentStock: 45, predictedDemand: 210, status: 'Critical Shortage' },
      { medicine: 'Paracetamol', dispensary: 'Krishnagar', currentStock: 350, predictedDemand: 420, status: 'Potential Shortage' },
      { medicine: 'Metformin', dispensary: 'Deogiri', currentStock: 80, predictedDemand: 300, status: 'Critical Shortage' },
      { medicine: 'Lisinopril', dispensary: 'Sandur', currentStock: 120, predictedDemand: 180, status: 'Potential Shortage' },
      { medicine: 'Atorvastatin', dispensary: 'Deogiri', currentStock: 30, predictedDemand: 150, status: 'Critical Shortage' },
    ],
    quarterly: [
      { medicine: 'Amoxicillin', dispensary: 'Deogiri', currentStock: 500, predictedDemand: 950, status: 'Potential Shortage' },
      { medicine: 'Ibuprofen', dispensary: 'Bommagatta', currentStock: 200, predictedDemand: 1050, status: 'Critical Shortage' },
      { medicine: 'Insulin', dispensary: 'Deogiri', currentStock: 45, predictedDemand: 650, status: 'Critical Shortage' },
      { medicine: 'Paracetamol', dispensary: ' Bhujanganagar ', currentStock: 350, predictedDemand: 1200, status: 'Critical Shortage' },
      { medicine: 'Metformin', dispensary: 'Deogiri', currentStock: 80, predictedDemand: 900, status: 'Critical Shortage' },
      { medicine: 'Lisinopril', dispensary: 'Taranagar', currentStock: 120, predictedDemand: 540, status: 'Critical Shortage' },
      { medicine: 'Atorvastatin', dispensary: 'Deogiri', currentStock: 30, predictedDemand: 450, status: 'Critical Shortage' },
    ]
  };

  const switchTab = (tabName) => {
    setActiveTab(tabName);
    setShowAllRows(false);
    setSearchTerm('');
  };

  const initiateOrder = (medicine, dispensary) => {
    setOrdering({ medicine, dispensary });
    // In a real application, this could open a modal or redirect to an order form
    setTimeout(() => {
      setOrdering(null);
    }, 2000);
  };

  const getActiveData = () => {
    switch (activeTab) {
      case 'weekly':
        return {
          data: weeklyData,
          chartData: weeklyData
        };
      case 'monthly':
        return {
          data: monthlyData,
          chartData: monthlyData
        };
      case 'quarterly':
        return {
          data: quarterlyData,
          chartData: quarterlyData
        };
      default:
        return {
          data: weeklyData,
          chartData: weeklyData
        };
    }
  };

  useEffect(() => {
    const currentData = extendedTableData[activeTab];
    
    if (searchTerm.trim() === '') {
      setFilteredData(currentData);
    } else {
      const filtered = currentData.filter(row => 
        row.medicine.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.dispensary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        row.status.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredData(filtered);
    }
  }, [searchTerm, activeTab]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Sufficient':
        return <span className="status-badge status-sufficient">Sufficient</span>;
      case 'Potential Shortage':
        return <span className="status-badge status-potential">Potential Shortage</span>;
      case 'Critical Shortage':
        return <span className="status-badge status-critical">Critical Shortage</span>;
      default:
        return <span className="status-badge status-default">{status}</span>;
    }
  };

  const { chartData } = getActiveData();
  const displayData = showAllRows ? filteredData : filteredData.slice(0, 3);

  return (
    <div className="demand-predictions">
      <div className="header">
        <h2 className="title">
          <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
          </svg>
          AI Demand Predictions
        </h2>
      </div>

      <div className="toolbar">
        <div className="tabs">
          {['weekly', 'monthly', 'quarterly'].map((tab) => (
            <button
              key={tab}
              onClick={() => switchTab(tab)}
              className={`tab ${activeTab === tab ? 'tab-active' : ''}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
        
        <div className="search-container">
          <div className="search-icon">
            <svg className="icon-search" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search medicines, dispensaries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Medicine</th>
              <th>Dispensary</th>
              <th>Current Stock</th>
              <th>Predicted Demand</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {displayData.map((row, index) => (
              <tr key={index} className={row.status === 'Critical Shortage' ? 'critical-row' : ''}>
                <td className="medicine-cell">{row.medicine}</td>
                <td className="dispensary-cell">{row.dispensary}</td>
                <td className="stock-cell">{row.currentStock}</td>
                <td className="demand-cell">{row.predictedDemand}</td>
                <td className="status-cell">{getStatusBadge(row.status)}</td>
                <td className="action-cell">
                  <button
                    onClick={() => initiateOrder(row.medicine, row.dispensary)}
                    disabled={ordering !== null}
                    className={`order-button ${
                      row.status === 'Sufficient'
                        ? 'button-sufficient'
                        : row.status === 'Critical Shortage'
                        ? 'button-critical'
                        : 'button-potential'
                    } ${
                      ordering && ordering.medicine === row.medicine
                        ? 'button-processing'
                        : ''
                    }`}
                  >
                    {ordering && ordering.medicine === row.medicine ? (
                      <span className="loading-indicator">
                        <svg className="loading-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="loading-circle" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="loading-path" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      'Order'
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* View More / View Less button */}
        {filteredData.length > 3 && (
          <div className="view-more-container">
            <button
              onClick={() => setShowAllRows(!showAllRows)}
              className="view-more-button"
            >
              {showAllRows ? (
                <>
                  View Less
                  <svg className="view-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path>
                  </svg>
                </>
              ) : (
                <>
                  View More ({filteredData.length - 3} more items)
                  <svg className="view-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </>
              )}
            </button>
          </div>
        )}
        
        {/* No results message */}
        {filteredData.length === 0 && (
          <div className="no-results">
            No medicines found matching your search criteria.
          </div>
        )}
      </div>

      <div className="chart-container">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" stroke="#6b7280" />
            <YAxis stroke="#6b7280" />
            <Tooltip contentStyle={{ borderRadius: '8px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }} />
            <Legend verticalAlign="top" height={36} />
            <Line type="monotone" dataKey="Amoxicillin" stroke="#4f46e5" strokeWidth={2} activeDot={{ r: 8 }} />
            <Line type="monotone" dataKey="Ibuprofen" stroke="#10b981" strokeWidth={2} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="Insulin" stroke="#ef4444" strokeWidth={2} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DemandPredictions;