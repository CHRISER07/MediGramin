import React, { useState } from 'react';

const ClusterAccordion = ({ clusters, viewOnMap }) => {
  const [openCluster, setOpenCluster] = useState(null);

  const toggleCluster = (clusterId) => {
    setOpenCluster(openCluster === clusterId ? null : clusterId);
  };

  const getUrgencyColor = (score) => {
    if (score > 12) return 'red';
    if (score > 8) return 'orange';
    if (score > 5) return 'yellow';
    return 'green';
  };

  // Helper to convert priority string to numeric score for calculations
  const getPriorityScore = (priority) => {
    if (!priority) return 0;
    switch(priority.toLowerCase()) {
      case 'high': return 15;
      case 'medium': return 8;
      case 'low': return 3;
      default: 
        // Try to parse numeric value if it's a number
        const num = parseFloat(priority);
        return isNaN(num) ? 0 : num;
    }
  };

  // Function to ensure we're handling both data formats (patients array or patients property)
  const getClusterPatients = (cluster) => {
    if (!cluster) return [];
    
    // Handle case where cluster is the patients array directly
    if (Array.isArray(cluster)) return cluster;
    
    // Handle case where cluster has a patients property
    if (cluster.patients && Array.isArray(cluster.patients)) return cluster.patients;
    
    return [];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {Object.keys(clusters).map((clusterId) => {
        const clusterData = clusters[clusterId];
        const patients = getClusterPatients(clusterData);
        
        if (!patients.length) return null;

        // Calculate average urgency/priority using a safe method
        const totalPatients = patients.length;
        const avgUrgency = (
          patients.reduce((sum, p) => {
            // Handle both urgency_score and priority fields
            const score = p.urgency_score !== undefined 
              ? p.urgency_score 
              : getPriorityScore(p.priority);
            return sum + score;
          }, 0) / totalPatients
        ).toFixed(1);

        // Sort by urgency/priority
        const sortedPatients = [...patients].sort((a, b) => {
          const scoreA = a.urgency_score !== undefined 
            ? a.urgency_score 
            : getPriorityScore(a.priority);
          const scoreB = b.urgency_score !== undefined 
            ? b.urgency_score 
            : getPriorityScore(b.priority);
          return scoreB - scoreA;
        });

        const highestPriority = sortedPatients[0];

        return (
          <div key={clusterId} style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', boxShadow: '0px 2px 4px rgba(0,0,0,0.1)' }}>
            <button
              style={{
                width: '100%',
                padding: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: openCluster === clusterId ? '#e0e7ff' : '#fff',
                borderBottom: openCluster === clusterId ? '1px solid #ddd' : 'none',
                cursor: 'pointer',
                border: 'none',
                textAlign: 'left'
              }}
              onClick={() => toggleCluster(clusterId)}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: getUrgencyColor(avgUrgency),
                    color: 'white',
                    fontWeight: 'bold',
                    marginRight: '12px',
                  }}
                >
                  {clusterId}
                </div>
                <div>
                  <span style={{ fontWeight: 'bold' }}>Cluster {clusterId}</span>
                  <div style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>
                    {totalPatients} patients | Avg. Urgency: {avgUrgency}
                  </div>
                </div>
              </div>
              <span style={{ transform: openCluster === clusterId ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▼</span>
            </button>
            {openCluster === clusterId && (
              <div style={{ backgroundColor: 'white', padding: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '8px' }}>
                  <thead>
                    <tr>
                      <th style={{ borderBottom: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Patient ID</th>
                      <th style={{ borderBottom: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Name</th>
                      <th style={{ borderBottom: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Village</th>
                      <th style={{ borderBottom: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Location</th>
                      <th style={{ borderBottom: '1px solid #ddd', padding: '8px', textAlign: 'left' }}>Urgency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patients.map((patient, index) => {
                      // Handle different property naming across components
                      const patientId = patient.patient_id || patient.pid || `Patient-${index}`;
                      const name = patient.name || 'Unknown';
                      const village = patient.village || 'Unknown';
                      
                      // Handle latitude/longitude properties with different naming
                      const latitude = patient.latitude !== undefined ? patient.latitude : (patient.lat !== undefined ? patient.lat : 0);
                      const longitude = patient.longitude !== undefined ? patient.longitude : (patient.lon !== undefined ? patient.lon : 0);
                      
                      // Handle urgency/priority with different naming
                      const urgencyScore = patient.urgency_score !== undefined ? patient.urgency_score : getPriorityScore(patient.priority);
                      
                      return (
                        <tr key={patientId} style={{ borderBottom: '1px solid #ddd' }}>
                          <td style={{ padding: '8px' }}>{patientId}</td>
                          <td style={{ padding: '8px' }}>{name}</td>
                          <td style={{ padding: '8px' }}>{village}</td>
                          <td style={{ padding: '8px', fontSize: '12px', color: '#666' }}>
                            {latitude.toFixed(4)}, {longitude.toFixed(4)}
                          </td>
                          <td style={{ padding: '8px' }}>
                            <span
                              style={{
                                padding: '4px 8px',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                borderRadius: '12px',
                                backgroundColor: `${getUrgencyColor(urgencyScore)}30`,
                                color: getUrgencyColor(urgencyScore),
                              }}
                            >
                              {urgencyScore}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div style={{ marginTop: '16px', textAlign: 'right' }}>
                  <button
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#4f46e5',
                      color: 'white',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      border: 'none'
                    }}
                    onClick={() => viewOnMap(clusterId)}
                  >
                    View Route Map
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ClusterAccordion;