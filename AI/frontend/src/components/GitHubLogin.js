import React from 'react';

const GitHubLogin = () => {
  const handleLogin = () => {
    // Redirect user to GitHub OAuth login flow
    window.location.href = '/github/login';
  };

  return (
    <button onClick={handleLogin}>
      Log in with GitHub
    </button>
  );
};

export default GitHubLogin;
