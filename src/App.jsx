import React, { useState } from 'react';
import Auth from './components/Auth';
import FileExplorer from './components/FileExplorer';
import Editor from './components/Editor';
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('github_token') || '');
  const [selectedFile, setSelectedFile] = useState(null);
  const [repo, setRepo] = useState(null);

  const handleAuth = (newToken) => {
    localStorage.setItem('github_token', newToken);
    setToken(newToken);
  };

  const handleFileSelect = (file, repository) => {
    setSelectedFile(file);
    setRepo(repository);
  };

  if (!token) {
    return <Auth onAuth={handleAuth} />;
  }

  return (
    <div className="app-container">
      <div className="sidebar">
        <FileExplorer 
          token={token} 
          onFileSelect={handleFileSelect}
          onLogout={() => {
            localStorage.removeItem('github_token');
            setToken('');
          }}
        />
      </div>
      <div className="editor-container">
        {selectedFile && repo ? (
          <Editor 
            token={token}
            repo={repo}
            file={selectedFile}
          />
        ) : (
          <div className="placeholder">
            <h2>Select a file from the explorer to start editing</h2>
            <p>Changes will sync in real-time with other collaborators</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
