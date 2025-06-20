// frontend/src/components/Web4ButtonComponent.jsx
import React, { useEffect } from 'react';

const Web4ButtonComponent = () => {
  useEffect(() => {
    // Optionally, initialize any Web4-specific JavaScript here if needed
  }, []);

  return (
    <div>
      {/* Web4 Button component integration */}
      <web4-button 
        label="Click Me" 
        onClick={() => alert('Web4 Button Clicked!')}
      ></web4-button>
    </div>
  );
};

export default Web4ButtonComponent;
