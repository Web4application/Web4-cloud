import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';  // Global CSS file for any global styles
import App from './App';  // Import the main App component
import { BrowserRouter as Router } from 'react-router-dom';  // Import the Router for handling routes

// Render the app to the DOM
ReactDOM.render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>,
  document.getElementById('root')  // The app will be mounted in the element with id 'root'
);
