import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import './Analytics.css';

// Register the necessary components for Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('monthly'); // Default to monthly view

  // Generate mock data for different timeframes
  const generateMockData = (timeframe) => {
    let labels = [];
    let salesData = [];
    let inventoryData = [];

    switch (timeframe) {
      case 'weekly':
        labels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        salesData = [42, 38, 45, 50, 65, 75, 55];
        inventoryData = [120, 115, 105, 95, 85, 70, 90];
        break;
      case 'monthly':
        labels = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August'];
        salesData = [65, 59, 80, 81, 56, 55, 40, 70];
        inventoryData = [100, 95, 90, 85, 95, 100, 110, 105];
        break;
      case 'yearly':
        labels = ['2018', '2019', '2020', '2021', '2022', '2023', '2024'];
        salesData = [450, 520, 480, 380, 600, 750, 820];
        inventoryData = [600, 650, 620, 580, 700, 850, 900];
        break;
      default:
        labels = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August'];
        salesData = [65, 59, 80, 81, 56, 55, 40, 70];
        inventoryData = [100, 95, 90, 85, 95, 100, 110, 105];
    }

    // Add some random variance to the secondary data
    const expenditureData = salesData.map(value => Math.floor(value * 0.6 + Math.random() * 20));
    const stockoutsData = inventoryData.map(() => Math.floor(Math.random() * 5));

    return {
      labels,
      datasets: [
        {
          label: 'Sales',
          data: salesData,
          fill: false,
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgba(59, 130, 246, 0.8)',
          tension: 0.4,
        },
        {
          label: 'Inventory Levels',
          data: inventoryData,
          fill: false,
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: 'rgba(239, 68, 68, 0.8)',
          tension: 0.4,
        },
        {
          label: 'Expenditure',
          data: expenditureData,
          fill: false,
          backgroundColor: 'rgba(16, 185, 129, 0.8)',
          borderColor: 'rgba(16, 185, 129, 0.8)',
          tension: 0.4,
        },
        {
          label: 'Stockouts',
          data: stockoutsData,
          fill: false,
          backgroundColor: 'rgba(245, 158, 11, 0.8)',
          borderColor: 'rgba(245, 158, 11, 0.8)',
          tension: 0.4,
        }
      ],
    };
  };

  // Generate KPI summaries based on the timeframe
  const generateKPISummary = (timeframe) => {
    switch (timeframe) {
      case 'weekly':
        return {
          totalSales: '₹32,500',
          salesGrowth: '+5.2%',
          inventoryTurnover: '2.3x',
          avgOrderValue: '₹750',
          stockoutRate: '3.2%'
        };
      case 'monthly':
        return {
          totalSales: '₹145,000',
          salesGrowth: '+12.8%',
          inventoryTurnover: '3.1x',
          avgOrderValue: '₹820',
          stockoutRate: '2.5%'
        };
      case 'yearly':
        return {
          totalSales: '₹1,750,000',
          salesGrowth: '+15.4%',
          inventoryTurnover: '8.6x',
          avgOrderValue: '₹875',
          stockoutRate: '1.8%'
        };
      default:
        return {
          totalSales: '₹145,000',
          salesGrowth: '+12.8%',
          inventoryTurnover: '3.1x',
          avgOrderValue: '₹820',
          stockoutRate: '2.5%'
        };
    }
  };

  useEffect(() => {
    // Simulate data fetching
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Simulate API call with a small delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const fetchedData = generateMockData(timeframe);
        setData(fetchedData);
        setLoading(false);
      } catch (err) {
        setError(err);
        setLoading(false);
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, [timeframe]);

  const handleTimeframeChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-pulse">
          <div className="loading-avatar"></div>
          <div className="loading-content">
            <div className="loading-line-large"></div>
            <div className="loading-lines">
              <div className="loading-line-full"></div>
              <div className="loading-line-partial"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-alert" role="alert">
          <strong className="error-title">Error!</strong>
          <span className="error-message"> Failed to load analytics data. Please try again later.</span>
        </div>
      </div>
    );
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Medicine Sales and Inventory Trends (${timeframe.charAt(0).toUpperCase() + timeframe.slice(1)})`,
        font: {
          size: 16,
          weight: 'bold'
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  const kpiSummary = generateKPISummary(timeframe);

  return (
    <div className="analytics-container">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h2 className="dashboard-title">Pharmacy Analytics Dashboard</h2>
          
          <div className="timeframe-selector">
            <div className="button-group" role="group">
              <button
                type="button"
                onClick={() => handleTimeframeChange('weekly')}
                className={`timeframe-button timeframe-button-left ${timeframe === 'weekly' ? 'active' : ''}`}
              >
                Weekly
              </button>
              <button
                type="button"
                onClick={() => handleTimeframeChange('monthly')}
                className={`timeframe-button timeframe-button-middle ${timeframe === 'monthly' ? 'active' : ''}`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => handleTimeframeChange('yearly')}
                className={`timeframe-button timeframe-button-right ${timeframe === 'yearly' ? 'active' : ''}`}
              >
                Yearly
              </button>
            </div>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="kpi-grid">
          <div className="kpi-card">
            <h3 className="kpi-title">Total Sales</h3>
            <p className="kpi-value">{kpiSummary.totalSales}</p>
            <span className="kpi-subtext kpi-positive">{kpiSummary.salesGrowth}</span>
          </div>
          
          <div className="kpi-card">
            <h3 className="kpi-title">Inventory Turnover</h3>
            <p className="kpi-value">{kpiSummary.inventoryTurnover}</p>
            <span className="kpi-subtext">per period</span>
          </div>
          
          <div className="kpi-card">
            <h3 className="kpi-title">Avg Order Value</h3>
            <p className="kpi-value">{kpiSummary.avgOrderValue}</p>
            <span className="kpi-subtext">per order</span>
          </div>
          
          <div className="kpi-card">
            <h3 className="kpi-title">Stockout Rate</h3>
            <p className="kpi-value">{kpiSummary.stockoutRate}</p>
            <span className="kpi-subtext kpi-negative">products</span>
          </div>
          
          <div className="kpi-card">
            <h3 className="kpi-title">Customer Satisfaction</h3>
            <p className="kpi-value">4.8/5</p>
            <span className="kpi-subtext">from reviews</span>
          </div>
        </div>

        {/* Chart */}
        <div className="chart-container">
          <div className="chart-inner">
            <Line data={data} options={options} />
          </div>
        </div>

        {/* Additional Info Tables */}
        <div className="tables-grid">
          <div className="table-container">
            <h3 className="table-title">Top Selling Medicines</h3>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Medicine</th>
                    <th>Units Sold</th>
                    <th>Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="medicine-name">Dolo 650</td>
                    <td>1,245</td>
                    <td>₹18,675</td>
                  </tr>
                  <tr>
                    <td className="medicine-name">Crocin</td>
                    <td>980</td>
                    <td>₹13,720</td>
                  </tr>
                  <tr>
                    <td className="medicine-name">Azithromycin</td>
                    <td>765</td>
                    <td>₹24,480</td>
                  </tr>
                  <tr>
                    <td className="medicine-name">Allegra</td>
                    <td>650</td>
                    <td>₹19,500</td>
                  </tr>
                  <tr>
                    <td className="medicine-name">Revital H</td>
                    <td>520</td>
                    <td>₹16,640</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="table-container">
            <h3 className="table-title">Low Stock Alert</h3>
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Medicine</th>
                    <th>Current Stock</th>
                    <th>Reorder Level</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="medicine-name">Insulin</td>
                    <td>12</td>
                    <td>25</td>
                    <td>
                      <span className="status-tag status-critical">Critical</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="medicine-name">Thyronorm</td>
                    <td>18</td>
                    <td>30</td>
                    <td>
                      <span className="status-tag status-low">Low</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="medicine-name">Telmikind</td>
                    <td>15</td>
                    <td>25</td>
                    <td>
                      <span className="status-tag status-low">Low</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="medicine-name">Metformin</td>
                    <td>24</td>
                    <td>30</td>
                    <td>
                      <span className="status-tag status-ok">OK</span>
                    </td>
                  </tr>
                  <tr>
                    <td className="medicine-name">Ecosprin</td>
                    <td>28</td>
                    <td>30</td>
                    <td>
                      <span className="status-tag status-ok">OK</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;