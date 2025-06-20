// src/pages/HomePage.jsx

import React from 'react';
import CodeAssistance from '../components/CodeAssistance';
import FileManager from '../components/FileManager';

const HomePage = () => {
  return (
    <div>
      <h2>Welcome to Web4AI Project Assistant</h2>
      <p>Your AI-powered assistant for software development tasks.</p>

      <section>
        <h3>Code Assistance</h3>
        <CodeAssistance />
      </section>

      <section>
        <h3>File Management</h3>
        <FileManager />
      </section>
    </div>
  );
};

export default HomePage;
