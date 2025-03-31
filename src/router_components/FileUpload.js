import React, { useState } from 'react';

const FileUpload = ({ onUploadSuccess, onUploadError, loading, setLoading }) => {
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fileName) {
      setError('Please select a file');
      return;
    }

    const formData = new FormData(e.target);
    const file = formData.get('file');

    if (!file || file.name === '') {
      setError('Please select a file');
      return;
    }

    if (!file.name.endsWith('.csv')) {
      setError('Only CSV files are allowed');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://127.0.0.1:5000/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      
      // Ensure data has the expected structure
      if (!data || !data.clusters || typeof data.clusters !== 'object') {
        throw new Error('Invalid data format received from server');
      }
      
      onUploadSuccess(data);
    } catch (err) {
      const errorMessage = 'Failed to upload file: ' + (err.message || 'Please try again.');
      setError(errorMessage);
      onUploadError(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFileName(e.target.files[0].name);
      setError(''); // Clear any previous errors
    } else {
      setFileName('');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === 'dragenter' || e.type === 'dragover');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.csv')) {
        setFileName(file.name);
        setError(''); // Clear any previous errors
        
        // Create a new DataTransfer object
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        
        // Set the files property of the file input
        const fileInput = document.getElementById('file-upload');
        fileInput.files = dataTransfer.files;
      } else {
        setError('Only CSV files are allowed');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <form
        onSubmit={handleSubmit}
        style={{ width: '100%', maxWidth: '480px' }}
        onDragEnter={handleDrag}
      >
        <div
          style={{
            border: '2px dashed',
            borderRadius: '8px',
            padding: '32px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: '0.3s',
            backgroundColor: dragActive ? '#ebf4ff' : 'white',
            borderColor: dragActive ? '#4f46e5' : '#ccc',
          }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-upload').click()}
        >
          <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" stroke="#4f46e5" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p style={{ fontSize: '16px', color: '#374151', fontWeight: '500', marginBottom: '8px' }}>
            {fileName ? `Selected: ${fileName}` : 'Drag & drop your CSV file here'}
          </p>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>or</p>
          <input
            id="file-upload"
            type="file"
            name="file"
            style={{ display: 'none' }}
            accept=".csv"
            onChange={handleFileChange}
          />
          <button
            type="button"
            style={{
              backgroundColor: '#e0e7ff',
              color: '#4f46e5',
              padding: '8px 16px',
              borderRadius: '8px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: '0.2s',
              border: 'none',
            }}
            onMouseOver={(e) => (e.target.style.backgroundColor = '#c7d2fe')}
            onMouseOut={(e) => (e.target.style.backgroundColor = '#e0e7ff')}
            onClick={(e) => {
              e.stopPropagation();
              document.getElementById('file-upload').click();
            }}
          >
            Browse Files
          </button>
        </div>

        {error && (
          <div style={{ color: '#dc2626', marginTop: '8px', textAlign: 'center', padding: '8px', backgroundColor: '#fee2e2', borderRadius: '8px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#dc2626" viewBox="0 0 20 20" style={{ marginRight: '4px', display: 'inline-block' }}>
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button
            type="submit"
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              borderRadius: '8px',
              fontWeight: '600',
              transition: '0.2s',
              border: 'none',
              cursor: fileName ? 'pointer' : 'not-allowed',
              backgroundColor: fileName ? '#4f46e5' : '#d1d5db',
              color: fileName ? 'white' : '#6b7280',
            }}
            disabled={!fileName || loading}
          >
            {loading ? (
              <span className="loading-text">
                <span className="loading-spinner"></span> Processing...
              </span>
            ) : (
              'Process Patient Data'
            )}
          </button>
        </div>
      </form>

      <div style={{ width: '100%', maxWidth: '480px', marginTop: '16px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="#4f46e5" viewBox="0 0 20 20" style={{ marginRight: '4px', display: 'inline-block' }}>
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        Upload a CSV file with patient data to analyze priority and geographic clusters.
      </div>
    </div>
  );
};

export default FileUpload;