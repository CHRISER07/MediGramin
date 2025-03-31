import React from 'react';
import './Inventory.css';
const Inventory = () => {
  const medicines = [
    { name: 'Amoxicillin', category: 'Antibiotic', stock: 25, reorderLevel: 100, status: 'Critical' },
    { name: 'Insulin', category: 'Hormone', stock: 45, reorderLevel: 50, status: 'Low Stock' },
    { name: 'Paracetamol', category: 'Pain Relief', stock: 78, reorderLevel: 75, status: 'Adequate' },
    { name: 'Ibuprofen', category: 'Pain Relief', stock: 120, reorderLevel: 80, status: 'Adequate' },
    { name: 'Metformin', category: 'Diabetes', stock: 90, reorderLevel: 100, status: 'Low Stock' },
    { name: 'Ciprofloxacin', category: 'Antibiotic', stock: 30, reorderLevel: 60, status: 'Critical' },
    { name: 'Atorvastatin', category: 'Cholesterol', stock: 50, reorderLevel: 40, status: 'Adequate' },
    { name: 'Omeprazole', category: 'Acid Reducer', stock: 70, reorderLevel: 50, status: 'Adequate' },
    { name: 'Cetirizine', category: 'Antihistamine', stock: 85, reorderLevel: 70, status: 'Adequate' },
    { name: 'Losartan', category: 'Hypertension', stock: 40, reorderLevel: 50, status: 'Low Stock' },
    { name: 'Aspirin', category: 'Pain Relief', stock: 55, reorderLevel: 60, status: 'Low Stock' },
    { name: 'Levothyroxine', category: 'Hormone', stock: 100, reorderLevel: 90, status: 'Adequate' },
    { name: 'Prednisone', category: 'Corticosteroid', stock: 20, reorderLevel: 50, status: 'Critical' },
    { name: 'Warfarin', category: 'Anticoagulant', stock: 75, reorderLevel: 60, status: 'Adequate' },
    { name: 'Metoprolol', category: 'Hypertension', stock: 45, reorderLevel: 40, status: 'Adequate' },
    { name: 'Lisinopril', category: 'Hypertension', stock: 30, reorderLevel: 50, status: 'Critical' },
    { name: 'Glipizide', category: 'Diabetes', stock: 95, reorderLevel: 80, status: 'Adequate' },
    { name: 'Simvastatin', category: 'Cholesterol', stock: 40, reorderLevel: 70, status: 'Critical' },
    { name: 'Ranitidine', category: 'Acid Reducer', stock: 85, reorderLevel: 60, status: 'Adequate' },
    { name: 'Clopidogrel', category: 'Anticoagulant', stock: 60, reorderLevel: 50, status: 'Adequate' },
  ];

  const getStatusClass = (status) => {
    const statusClasses = {
      'Critical': 'status-badge status-critical',
      'Low Stock': 'status-badge status-low-stock',
      'Adequate': 'status-badge status-adequate',
    };
    return statusClasses[status] || 'status-badge';
  };

  return (
    <div className="inventory-container">
      <h2 className="inventory-title">Inventory</h2>
      <div className="inventory-table-wrapper">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Medicine</th>
              <th>Category</th>
              <th>Current Stock</th>
              <th>Reorder Level</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {medicines.map((medicine, index) => (
              <tr key={index}>
                <td>{medicine.name}</td>
                <td>{medicine.category}</td>
                <td>{medicine.stock}</td>
                <td>{medicine.reorderLevel}</td>
                <td>
                  <span className={getStatusClass(medicine.status)}>
                    {medicine.status}
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

export default Inventory;

