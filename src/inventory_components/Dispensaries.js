import React from 'react';
import './Dispensaries.css';

const Dispensaries = () => {
  const dispensaries = [
    { 
      name: 'Central Ayurveda Pharmacy', 
      location: 'Connaught Place, Delhi', 
      status: 'Active', 
      type: 'Main Center',
      inventory: 'High',
      contactPerson: 'Dr. Aditya Sharma',
      phone: '011-2345-6789'
    },
    { 
      name: 'Mobile Medical Unit', 
      location: 'Chandni Chowk', 
      status: 'Active', 
      type: 'Mobile',
      inventory: 'Medium',
      contactPerson: 'Vikram Singh',
      phone: '011-3456-7890'
    },
    { 
      name: 'Rural Health Clinic', 
      location: 'Gurgaon Outskirts', 
      status: 'Inactive', 
      type: 'Satellite',
      inventory: 'Low',
      contactPerson: 'Dr. Priya Patel',
      phone: '0124-456-7890'
    },
    { 
      name: 'Delhi University Health Center', 
      location: 'North Campus', 
      status: 'Active', 
      type: 'Educational',
      inventory: 'High',
      contactPerson: 'Dr. Rahul Gupta',
      phone: '011-2745-6789'
    },
    { 
      name: 'Community Health Outreach', 
      location: 'Lajpat Nagar', 
      status: 'Active', 
      type: 'Satellite',
      inventory: 'Medium',
      contactPerson: 'Ananya Reddy',
      phone: '011-4587-9012'
    },
    { 
      name: 'Yamuna Medical Center', 
      location: 'East Delhi', 
      status: 'Maintenance', 
      type: 'Main Center',
      inventory: 'Medium',
      contactPerson: 'Dr. Vivek Kumar',
      phone: '011-6789-0123'
    },
    { 
      name: 'Northern District Unit', 
      location: 'Model Town', 
      status: 'Active', 
      type: 'Satellite',
      inventory: 'High',
      contactPerson: 'Neha Malhotra',
      phone: '011-7890-1234'
    },
    { 
      name: 'Ayurvedic Research Center', 
      location: 'Hauz Khas', 
      status: 'Active', 
      type: 'Research',
      inventory: 'High',
      contactPerson: 'Dr. Arjun Nair',
      phone: '011-5678-3456'
    },
    { 
      name: 'South Delhi Dispensary', 
      location: 'Greater Kailash', 
      status: 'Active', 
      type: 'Main Center',
      inventory: 'Medium',
      contactPerson: 'Dr. Meera Iyer',
      phone: '011-8765-4321'
    },
    { 
      name: 'Elderly Care Unit', 
      location: 'Rohini', 
      status: 'Active', 
      type: 'Specialized',
      inventory: 'Medium',
      contactPerson: 'Dr. Sanjay Deshmukh',
      phone: '011-2456-7834'
    },
    { 
      name: 'Women\'s Health Center', 
      location: 'Saket', 
      status: 'Active', 
      type: 'Specialized',
      inventory: 'High',
      contactPerson: 'Dr. Kavita Krishnan',
      phone: '011-6543-2109'
    },
    { 
      name: 'Pediatric Care Unit', 
      location: 'Rajouri Garden', 
      status: 'Maintenance', 
      type: 'Specialized',
      inventory: 'Medium',
      contactPerson: 'Dr. Deepak Verma',
      phone: '011-7689-4321'
    },
    { 
      name: 'Emergency Response Center', 
      location: 'Dwarka', 
      status: 'Active', 
      type: 'Emergency',
      inventory: 'High',
      contactPerson: 'Dr. Ravi Kapoor',
      phone: '011-8907-6543'
    },
    { 
      name: 'Rural Outpost', 
      location: 'Najafgarh', 
      status: 'Inactive', 
      type: 'Satellite',
      inventory: 'Low',
      contactPerson: 'Sunita Chaudhary',
      phone: '011-2345-8765'
    },
    { 
      name: 'Corporate Health Facility', 
      location: 'Cyber City, Gurgaon', 
      status: 'Active', 
      type: 'Corporate',
      inventory: 'Medium',
      contactPerson: 'Dr. Amit Khanna',
      phone: '0124-678-5432'
    },
  ];

  const getStatusClass = (status) => {
    switch(status) {
      case 'Active':
        return 'status-active';
      case 'Inactive':
        return 'status-inactive';
      case 'Maintenance':
        return 'status-maintenance';
      default:
        return 'status-inactive';
    }
  };

  const getInventoryClass = (inventory) => {
    switch(inventory) {
      case 'High':
        return 'inventory-high';
      case 'Medium':
        return 'inventory-medium';
      case 'Low':
        return 'inventory-low';
      default:
        return 'inventory-default';
    }
  };

  return (
    <div className="dispensaries-container">
      <h2 className="dispensaries-title">Dispensaries</h2>
      <p className="dispensaries-summary">
        Total: {dispensaries.length} facilities ({dispensaries.filter(d => d.status === 'Active').length} active)
      </p>
      <div className="table-container">
        <table className="dispensaries-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Location</th>
              <th>Type</th>
              <th>Inventory</th>
              <th>Contact</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {dispensaries.map((dispensary, index) => (
              <tr key={index} className="table-row">
                <td className="cell-name">{dispensary.name}</td>
                <td className="cell-location">{dispensary.location}</td>
                <td className="cell-type">{dispensary.type}</td>
                <td className="cell-inventory">
                  <span className={getInventoryClass(dispensary.inventory)}>
                    {dispensary.inventory}
                  </span>
                </td>
                <td className="cell-contact">
                  <div>{dispensary.contactPerson}</div>
                  <div className="contact-phone">{dispensary.phone}</div>
                </td>
                <td className="cell-status">
                  <span className={`status-badge ${getStatusClass(dispensary.status)}`}>
                    {dispensary.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dispensaries;