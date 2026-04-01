import React, { useState } from 'react';
import './Auth.css';

/**
 * Authentication component for GitHub Personal Access Token (PAT) management
 * Allows users to input and store their GitHub PAT for API access
 */
function Auth({ onAuth }) {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!token || token.trim().length === 0) {
      setError('Please enter a valid GitHub Personal Access Token');
      return;
    }

    // Basic validation - GitHub PATs start with 'ghp_' or 'github_pat_'
    if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
      setError('Invalid token format. GitHub tokens should start with "ghp_" or "github_pat_"');
      return;
    }

    setError('');
    onAuth(token);
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>P2P Git Editor</h1>
        <p className="subtitle">IIIT B.Tech Project - Collaborative Code Editor</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="token">GitHub Personal Access Token</label>
            <input
              id="token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="token-input"
            />
            {error && <div className="error-message">{error}</div>}
          </div>

          <button type="submit" className="auth-button">
            Connect to GitHub
          </button>
        </form>

        <div className="instructions">
          <h3>How to get a Personal Access Token:</h3>
          <ol>
            <li>Go to GitHub Settings → Developer Settings</li>
            <li>Click "Personal access tokens" → "Tokens (classic)"</li>
            <li>Generate new token with <code>repo</code> scope</li>
            <li>Copy the token and paste it above</li>
          </ol>
          <p className="note">
            <strong>Note:</strong> Your token is stored locally in your browser and never sent to our servers.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Auth;
