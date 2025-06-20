// frontend/src/components/Web4FormComponent.jsx
import React, { useState, useEffect } from 'react';

const Web4FormComponent = () => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    // Initialize Web4 HTML components if necessary
    window.initWeb4Form(); // If Web4 requires any JS initialization
  }, []);

  const handleFormSubmit = (event) => {
    event.preventDefault();
    alert('Form submitted with data: ' + JSON.stringify(formData));
  };

  return (
    <div>
      <h1>Web4 AI Integration</h1>
      <web4-form id="ai-form" onSubmit={handleFormSubmit}>
        <web4-input
          label="Enter Name"
          value={formData.name || ''}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
        <web4-input
          label="Enter Email"
          value={formData.email || ''}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        <web4-button label="Submit" onClick={handleFormSubmit}></web4-button>
      </web4-form>
    </div>
  );
};

export default Web4FormComponent;
