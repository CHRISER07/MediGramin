import React, { useState, useEffect } from 'react';
import FileUpload from './FileUpload';
import ClusterAccordion from './ClusterAccordion';
import ClusterMap from './ClusterMap';
import './Priority.css';

function Priority() {
  const [uploaded, setUploaded] = useState(false);
  const [clusters, setClusters] = useState({}); // Initialize as empty object
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [viewMode, setViewMode] = useState('clusters');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Function to normalize data structure
  const normalizeClusterData = (data) => {
    if (!data || !data.clusters || typeof data.clusters !== 'object') {
      return {};
    }

    const normalizedClusters = {};
    
    Object.keys(data.clusters).forEach(clusterId => {
      const cluster = data.clusters[clusterId];
      
      // If cluster is already an object with patients array
      if (cluster && typeof cluster === 'object' && cluster.patients && Array.isArray(cluster.patients)) {
        normalizedClusters[clusterId] = {
          ...cluster,
          patients: cluster.patients.map(normalizePatientData)
        };
      } 
      // If cluster is directly the array of patients
      else if (Array.isArray(cluster)) {
        normalizedClusters[clusterId] = {
          patients: cluster.map(normalizePatientData),
          avg_distance: cluster.avgDistance || cluster.avg_distance || 0
        };
      }
      // Empty or invalid cluster
      else {
        normalizedClusters[clusterId] = { patients: [], avg_distance: 0 };
      }
    });
    
    return normalizedClusters;
  };
  
  // Function to normalize patient data
  const normalizePatientData = (patient) => {
    if (!patient || typeof patient !== 'object') return {};
    
    return {
      // Use consistent field names with fallbacks
      pid: patient.patient_id || patient.pid || 'unknown',
      patient_id: patient.patient_id || patient.pid || 'unknown',
      name: patient.name || 'Unknown',
      village: patient.village || 'Unknown',
      // Use consistent latitude/longitude
      lat: patient.latitude !== undefined ? patient.latitude : (patient.lat || 0),
      latitude: patient.latitude !== undefined ? patient.latitude : (patient.lat || 0),
      lon: patient.longitude !== undefined ? patient.longitude : (patient.lon || 0),
      longitude: patient.longitude !== undefined ? patient.longitude : (patient.lon || 0),
      // Handle priority/urgency consistently
      priority: patient.priority || (patient.urgency_score > 10 ? 'high' : patient.urgency_score > 5 ? 'medium' : 'low'),
      urgency_score: patient.urgency_score !== undefined ? patient.urgency_score : 
                    (patient.priority === 'high' ? 15 : patient.priority === 'medium' ? 8 : 3)
    };
  };

  const handleUploadSuccess = (data) => {
    if (data && data.clusters) {
      const normalizedData = normalizeClusterData(data);
      setClusters(normalizedData);
      setUploaded(true);
      setError(null);
      setNotification({
        message: "Data successfully uploaded and processed",
        type: "success"
      });
    } else {
      setError("Invalid data format received from server");
    }
  };

  const handleUploadError = (errorMessage) => {
    setError(errorMessage || "An error occurred during upload");
    setLoading(false);
  };

  const viewOnMap = (clusterId) => {
    setSelectedCluster(clusterId);
    setViewMode('map');
  };

  const backToList = () => {
    setViewMode('clusters');
    setSelectedCluster(null);
  };

  const updatePriority = async (userInput) => {
    if (!userInput.trim()) {
      setError("Please enter a valid instruction");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/update_priority', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_input: userInput }),
      });

      const data = await response.json();
      if (data.success) {
        const normalizedData = normalizeClusterData(data);
        setClusters(normalizedData);
        setLoading(false);
        setInputValue('');
        setNotification({
          message: "Priority successfully updated",
          type: "success"
        });
      } else {
        setError(data.message || "Failed to update priority");
        setLoading(false);
      }
    } catch (err) {
      setError("Error connecting to server: " + err.message);
      setLoading(false);
    }
  };

  // Helper function to safely count total patients
  const getTotalPatients = () => {
    return Object.values(clusters).reduce((acc, cluster) => {
      if (cluster && cluster.patients && Array.isArray(cluster.patients)) {
        return acc + cluster.patients.length;
      }
      return acc;
    }, 0);
  };

  // Helper function to safely count high priority patients
  const getHighPriorityPatients = () => {
    return Object.values(clusters).reduce((acc, cluster) => {
      if (cluster && cluster.patients && Array.isArray(cluster.patients)) {
        const highPriority = cluster.patients.filter(p => 
          p && (p.priority === 'high' || p.urgency_score > 10)
        ).length;
        return acc + highPriority;
      }
      return acc;
    }, 0);
  };

  return (
    <div className="priority-container">
      <div className="content-wrapper">
        <header className="header">
          <h1 className="header-title">Patient Priority System</h1>
          <p className="header-subtitle">
            Optimize healthcare delivery with geographic clustering and priority scoring
          </p>
        </header>

        {notification && (
          <div className={`notification ${notification.type}`}>
            <p>{notification.message}</p>
          </div>
        )}

        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button className="dismiss-button" onClick={() => setError(null)}>
              ✕
            </button>
          </div>
        )}

        {viewMode === 'clusters' ? (
          <div className="cluster-view">
            <h2 className="section-title">
              {uploaded ? 'Patient Data Analysis' : 'Upload Patient Data'}
            </h2>

            {!uploaded && (
              <div className="upload-section">
                <p className="upload-hint">
                  Upload your patient data file to generate geographic clusters and priority scores
                </p>
                <FileUpload
                  onUploadSuccess={handleUploadSuccess}
                  onUploadError={handleUploadError}
                  loading={loading}
                  setLoading={setLoading}
                />
              </div>
            )}

            {uploaded && clusters && (
              <div className="cluster-details">
                <div className="actions-bar">
                  <h3 className="cluster-title">Patient Clusters</h3>
                  <button className="refresh-button" onClick={() => window.location.reload()}>
                    Upload New Data
                  </button>
                </div>

                <div className="priority-update">
                  <h4 className="update-title">Update Patient Priority</h4>
                  <div className="input-group">
                    <input
                      type="text"
                      placeholder="e.g., Set priority high for patient PID-01"
                      id="priorityInput"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          updatePriority(inputValue);
                        }
                      }}
                    />
                    <button
                      onClick={() => updatePriority(inputValue)}
                      disabled={loading}
                      className="update-button"
                    >
                      {loading ? (
                        <span className="loading-spinner"></span>
                      ) : (
                        'Update'
                      )}
                    </button>
                  </div>
                  <div className="instruction-examples">
                    <p>Example commands:</p>
                    <ul>
                      <li>Set priority high for patient PID-01</li>
                      <li>Mark all elderly patients as high priority</li>
                      <li>Prioritize patients with chronic conditions</li>
                    </ul>
                  </div>
                </div>

                <div className="cluster-accordion">
                  <div className="cluster-stats">
                    <div className="stat-item">
                      <span className="stat-value">{Object.keys(clusters).length}</span>
                      <span className="stat-label">Clusters</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">{getTotalPatients()}</span>
                      <span className="stat-label">Patients</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">{getHighPriorityPatients()}</span>
                      <span className="stat-label">High Priority</span>
                    </div>
                  </div>

                  {Object.keys(clusters).length > 0 ? (
                    <ClusterAccordion clusters={clusters} viewOnMap={viewOnMap} />
                  ) : (
                    <p className="no-data-message">
                      No cluster data available. Please upload a valid dataset.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="map-view">
            <div className="map-header">
              <h2 className="map-title">Cluster {selectedCluster} Route Map</h2>
              <button onClick={backToList} className="back-button">
                <span className="back-icon">←</span> Back to Clusters
              </button>
            </div>
            <div className="map-container">
              {selectedCluster && clusters && clusters[selectedCluster] && (
                <div className="map-info">
                  <div className="map-stats">
                    <div className="map-stat-item">
                      <span className="stat-label">Patients:</span>
                      <span className="stat-value">
                        {clusters[selectedCluster].patients && Array.isArray(clusters[selectedCluster].patients) 
                          ? clusters[selectedCluster].patients.length 
                          : 0}
                      </span>
                    </div>
                    <div className="map-stat-item">
                      <span className="stat-label">Avg. Distance:</span>
                      <span className="stat-value">
                        {((clusters[selectedCluster].avg_distance) || 0).toFixed(1)} km
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <ClusterMap clusterId={selectedCluster} clusterData={clusters && clusters[selectedCluster] ? clusters[selectedCluster] : null} />
            </div>
          </div>
        )}

        <footer className="footer">
          <p>Patient Priority System &copy; {new Date().getFullYear()} | Optimizing healthcare delivery with AI</p>
        </footer>
      </div>
    </div>
  );
}

export default Priority;