// src/components/FileManager.jsx

import React, { useState } from 'react';

const FileManager = () => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Handle file selection
  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFileName(selectedFile.name);
      const reader = new FileReader();
      reader.onload = () => {
        setFileContent(reader.result);
      };
      reader.readAsText(selectedFile);
    }
  };

  // Handle file upload (mockup)
  const handleFileUpload = () => {
    if (!fileContent) return;
    setIsUploading(true);

    // Simulate file upload (replace with actual file upload logic)
    setTimeout(() => {
      alert(`File "${fileName}" uploaded successfully!`);
      setIsUploading(false);
    }, 1500);
  };

  return (
    <div>
      <h3>File Manager</h3>
      <p>Upload, view, and manage your project files.</p>

      <div>
        <input type="file" onChange={handleFileSelect} />
      </div>

      {fileName && (
        <div>
          <h4>Selected File: {fileName}</h4>
          <textarea
            value={fileContent}
            readOnly
            rows="10"
            cols="50"
          />
        </div>
      )}

      <button onClick={handleFileUpload} disabled={isUploading}>
        {isUploading ? 'Uploading...' : 'Upload File'}
      </button>
    </div>
  );
};

export default FileManager;
