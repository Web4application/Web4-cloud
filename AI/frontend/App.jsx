// frontend/src/App.jsx
import React from 'react';
import Web4ButtonComponent from './components/Web4ButtonComponent';
import Web4FormComponent from './components/Web4FormComponent';

const App = () => {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to the Web4 AI Project Assistant</h1>
      </header>

      <main>
        <section>
          <h2>Web4 Button Component</h2>
          <Web4ButtonComponent />
        </section>

        <section>
          <h2>Web4 Form Component</h2>
          <Web4FormComponent />
        </section>
      </main>
      
      <footer>
        <p>&copy; 2025 Web4 AI Project Assistant</p>
      </footer>
    </div>
  );
};

export default App;
