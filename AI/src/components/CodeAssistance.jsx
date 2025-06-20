// src/components/CodeAssistance.jsx

import React, { useState } from 'react';

const CodeAssistance = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Function to handle the request (mockup)
  const handleAskQuestion = async () => {
    if (!query) return;
    setIsLoading(true);
    
    // Simulate an API call for code assistance (replace with actual API logic)
    setTimeout(() => {
      setResponse(`This is the AI's response to: ${query}`);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div>
      <h3>Code Assistance</h3>
      <p>Ask your coding questions and get instant help from AI.</p>

      <div>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a question about code..."
          rows="4"
          cols="50"
        />
      </div>

      <button onClick={handleAskQuestion} disabled={isLoading}>
        {isLoading ? 'Processing...' : 'Ask AI'}
      </button>

      {response && (
        <div className="response">
          <h4>AI Response:</h4>
          <p>{response}</p>
        </div>
      )}
    </div>
  );
};

export default CodeAssistance;
