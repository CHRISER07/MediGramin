import React, { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const ClusterMap = ({ clusterId, clusterData }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mapData, setMapData] = useState(null);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!clusterId || !clusterData) {
      setLoading(false);
      return;
    }

    const fetchMapData = async () => {
      try {
        setLoading(true);
        // Check if patients array exists and is valid
        if (clusterData.patients && Array.isArray(clusterData.patients) && clusterData.patients.length > 0) {
          setMapData(clusterData.patients);
        } else {
          setError('No patient data available for this cluster.');
          setMapData(null);
        }
      } catch (err) {
        setError('Error loading map data. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchMapData();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [clusterId, clusterData]);

  useEffect(() => {
    if (!mapData || !Array.isArray(mapData) || mapData.length === 0 || loading) return;

    const initializeMap = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }

      // Make sure we have valid data with lat/lon
      const validPatients = mapData.filter(patient => 
        patient && typeof patient.lat === 'number' && typeof patient.lon === 'number'
      );
      
      if (validPatients.length === 0) {
        setError('No valid geographic data available for patients in this cluster.');
        return;
      }

      const sortedPatients = [...validPatients].sort((a, b) => {
        const priorityA = a.priority === 'high' ? 2 : (a.priority === 'medium' ? 1 : 0);
        const priorityB = b.priority === 'high' ? 2 : (b.priority === 'medium' ? 1 : 0);
        return priorityB - priorityA;
      });

      const map = L.map(mapRef.current).setView([sortedPatients[0].lat, sortedPatients[0].lon], 10);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors, Tiles by HOT'
      }).addTo(map);

      const routeCoords = [];

      sortedPatients.forEach((patient, index) => {
        let icon;
        if (index === 0) {
          icon = L.divIcon({ html: '<div style="width: 32px; height: 32px; background: green; color: white; text-align: center; line-height: 32px; border-radius: 50%;">S</div>', className: '' });
        } else if (index === sortedPatients.length - 1) {
          icon = L.divIcon({ html: '<div style="width: 32px; height: 32px; background: red; color: white; text-align: center; line-height: 32px; border-radius: 50%;">E</div>', className: '' });
        } else {
          icon = L.divIcon({ html: `<div style="width: 32px; height: 32px; background: blue; color: white; text-align: center; line-height: 32px; border-radius: 50%;">${index + 1}</div>`, className: '' });
        }

        const tooltipContent = `<div><strong>${patient.pid || 'Unknown'}</strong><br>Priority: ${patient.priority || 'unknown'}</div>`;

        L.marker([patient.lat, patient.lon], { icon })
          .addTo(map)
          .bindTooltip(tooltipContent, { direction: 'top', offset: [10, -5] });

        routeCoords.push([patient.lat, patient.lon]);
      });

      if (routeCoords.length > 1) {
        const routeLine = L.polyline(routeCoords, {
          color: '#4F46E5',
          weight: 4,
          opacity: 0.7,
          lineJoin: 'round',
          dashArray: '5, 10',
        }).addTo(map);

        map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });
      } else if (routeCoords.length === 1) {
        map.setView(routeCoords[0], 12);
      }
    };

    initializeMap();
  }, [mapData, loading]);

  if (loading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px' }}>Loading map data...</div>;
  }

  if (error) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: 'red' }}>{error}</div>;
  }

  return (
    <div ref={mapRef} style={{ height: '400px', width: '100%', borderRadius: '8px' }}>
      {(!mapData || !Array.isArray(mapData) || mapData.length === 0) && !loading && !error && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'gray' }}>Select a cluster to view the map</div>
      )}
    </div>
  );
};

export default ClusterMap;                    