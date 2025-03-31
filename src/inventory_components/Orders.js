import React, { useState } from 'react';
import './Orders.css';
import { ordersData } from './ordersData';

const Orders = () => {
  const [orders, setOrders] = useState(ordersData);
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');

  const getStatusColor = (status) => {
    switch (status) {
      case 'Delivered': return 'status-delivered';
      case 'Scheduled': return 'status-scheduled';
      case 'Pending': return 'status-pending';
      case 'Cancelled': return 'status-cancelled';
      case 'Processing': return 'status-processing';
      default: return 'status-default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Urgent': return 'priority-urgent';
      case 'High': return 'priority-high';
      case 'Normal': return 'priority-normal';
      case 'Low': return 'priority-low';
      default: return 'priority-default';
    }
  };

  const handleSort = (field) => {
    const direction = field === sortField && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(direction);
    
    const sortedOrders = [...orders].sort((a, b) => {
      if (a[field] < b[field]) return direction === 'asc' ? -1 : 1;
      if (a[field] > b[field]) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    
    setOrders(sortedOrders);
  };

  return (
    <div className="orders-container">
      <h1 className="orders-title">Medicine Orders</h1>
      
      <div className="orders-card">
        <div className="orders-header">
          <h2>Recent Orders</h2>
          <span className="orders-count">{orders.length} orders</span>
        </div>
        
        <div className="table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('id')} className="sortable">
                  Order ID {sortField === 'id' && <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                </th>
                <th onClick={() => handleSort('medicine')} className="sortable">
                  Medicine {sortField === 'medicine' && <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                </th>
                <th onClick={() => handleSort('quantity')} className="sortable">
                  Quantity {sortField === 'quantity' && <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                </th>
                <th onClick={() => handleSort('status')} className="sortable">
                  Status {sortField === 'status' && <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                </th>
                <th onClick={() => handleSort('priority')} className="sortable">
                  Priority {sortField === 'priority' && <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => (
                <tr key={order.id}>
                  <td className="order-id">{order.id}</td>
                  <td>{order.medicine}</td>
                  <td>{order.quantity}</td>
                  <td>
                    <span className={`status-badge ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>
                    <span className={`priority-badge ${getPriorityColor(order.priority)}`}>
                      {order.priority}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-view">View</button>
                      <button className="btn-edit">Edit</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Orders;