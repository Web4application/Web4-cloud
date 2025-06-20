// App.js - Web4AI Project Assistant

import React, { useState } from 'react';
import './App.css';
import CodeAssistance from './components/CodeAssistance';
import FileManager from './components/FileManager';
import Footer from './components/Footer';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';

function App() {
  const [isLoading, setIsLoading] = useState(false);

  const handleFileUpload = (event) => {
    setIsLoading(true);
    // Handle file upload logic here
    // You could use FileReader API or upload via a backend API
  };

  const handleCodeRefactor = async (codeSnippet) => {
    setIsLoading(true);
    // Here, call the backend API or use GPT-4 integration to refactor code
    // Example: const refactoredCode = await refactorCode(codeSnippet);
    setIsLoading(false);
  };

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <h1>Web4AI Project Assistant</h1>
          <p>AI-powered tools to assist with your software development workflow.</p>
        </header>

        <main>
          <Switch>
            <Route exact path="/">
              <section>
                <h2>Code Assistance</h2>
                <CodeAssistance onRefactor={handleCodeRefactor} />
              </section>

              <section>
                <h2>File Management</h2>
                <FileManager onFileUpload={handleFileUpload} />
              </section>
            </Route>
            {/* Add more routes here as needed */}
          </Switch>
        </main>

        {isLoading && <div className="loading-spinner">Processing...</div>}

        <Footer />
      </div>
    </Router>
  );
}

export default App;
