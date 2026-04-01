import React, { useState, useEffect, useRef } from 'react';
import { useGithub } from '../hooks/useGithub';
import './FileExplorer.css';

// Repository format configuration
const REPO_PREFIX = 'p2p-editor-'; // Repositories must start with this prefix
const REPO_DESCRIPTION = 'P2P Editor Project'; // Default description for new repos

/**
 * File Explorer component for navigating GitHub repositories
 * Uses GitHub API to fetch and display repository tree structure
 */
function FileExplorer({ token, onFileSelect, onLogout }) {
  const { listRepos, getRepoTree, createRepo, createFile, loading } = useGithub(token);
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [files, setFiles] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [allRepos, setAllRepos] = useState([]);
  const [showAllRepos, setShowAllRepos] = useState(false);
  const [showCreateRepo, setShowCreateRepo] = useState(false);
  const [newRepoName, setNewRepoName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState('file'); // 'file' or 'folder'
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch user's repositories on mount
  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const repoList = await listRepos();
        setAllRepos(repoList);
        // Filter repos by format unless user wants to see all
        const filtered = showAllRepos 
          ? repoList 
          : repoList.filter(repo => repo.name.startsWith(REPO_PREFIX));
        setRepos(filtered);
      } catch (error) {
        console.error('Failed to fetch repositories:', error);
      }
    };
    fetchRepos();
  }, [listRepos, showAllRepos]);

  // Filter repos based on search query and format
  useEffect(() => {
    let filteredRepos = showAllRepos 
      ? allRepos 
      : allRepos.filter(repo => repo.name.startsWith(REPO_PREFIX));

    if (searchQuery.trim() !== '') {
      filteredRepos = filteredRepos.filter(repo =>
        repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.fullName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setRepos(filteredRepos);
  }, [searchQuery, allRepos, showAllRepos]);

  // Create new repository
  const handleCreateRepo = async () => {
    if (!newRepoName.trim()) return;
    
    setCreating(true);
    try {
      const fullName = REPO_PREFIX + newRepoName;
      const newRepo = await createRepo(fullName, REPO_DESCRIPTION, isPrivate);
      
      // Refresh repo list
      const repoList = await listRepos();
      setAllRepos(repoList);
      
      // Reset form
      setShowCreateRepo(false);
      setNewRepoName('');
      setIsPrivate(false);
      
      alert(`Repository "${fullName}" created with sample LaTeX file! ✅`);
    } catch (error) {
      alert('Failed to create repository: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  // Create new file or folder
  const handleCreateFile = async () => {
    if (!newFileName.trim() || !selectedRepo) return;
    
    setCreating(true);
    try {
      const path = newFileName.startsWith('/') ? newFileName.slice(1) : newFileName;
      
      if (newFileType === 'folder') {
        // Create a .gitkeep file to create the folder
        await createFile(
          selectedRepo.owner,
          selectedRepo.name,
          `${path}/.gitkeep`,
          '',
          `Create folder ${path}`
        );
      } else {
        // Determine default content based on file extension
        let defaultContent = '';
        if (path.endsWith('.tex') || path.endsWith('.latex')) {
          defaultContent = '\\documentclass{article}\n\\begin{document}\n\n% Your content here\n\n\\end{document}';
        } else if (path.endsWith('.md')) {
          defaultContent = '# ' + path.split('/').pop().replace('.md', '') + '\n\n';
        }
        
        await createFile(
          selectedRepo.owner,
          selectedRepo.name,
          path,
          defaultContent,
          `Create ${path}`
        );
      }
      
      // Refresh file tree
      const tree = await getRepoTree(selectedRepo.owner, selectedRepo.name, selectedRepo.defaultBranch);
      setFiles(tree);
      
      // Reset form
      setShowNewFileDialog(false);
      setNewFileName('');
      
      alert(`${newFileType === 'folder' ? 'Folder' : 'File'} created successfully! ✅`);
    } catch (error) {
      alert(`Failed to create ${newFileType}: ` + error.message);
    } finally {
      setCreating(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (event) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0 || !selectedRepo) return;
    
    setUploading(true);
    try {
      const uploadPromises = Array.from(uploadedFiles).map(async (file) => {
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
          reader.onload = async (e) => {
            try {
              const content = e.target.result;
              await createFile(
                selectedRepo.owner,
                selectedRepo.name,
                file.name,
                content,
                `Upload ${file.name}`
              );
              resolve();
            } catch (err) {
              reject(err);
            }
          };
          reader.onerror = reject;
          reader.readAsText(file);
        });
      });
      
      await Promise.all(uploadPromises);
      
      // Refresh file tree
      const tree = await getRepoTree(selectedRepo.owner, selectedRepo.name, selectedRepo.defaultBranch);
      setFiles(tree);
      
      alert(`${uploadedFiles.length} file(s) uploaded successfully! ✅`);
    } catch (error) {
      alert('Failed to upload files: ' + error.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Fetch repository tree when a repo is selected
  const handleRepoSelect = async (repo) => {
    setSelectedRepo(repo);
    try {
      const tree = await getRepoTree(repo.owner, repo.name, repo.defaultBranch);
      setFiles(tree);
      setExpandedFolders(new Set());
    } catch (error) {
      console.error('Failed to fetch repository tree:', error);
    }
  };

  // Build hierarchical file structure
  const buildFileTree = (files) => {
    const tree = {};
    
    files.forEach(file => {
      const parts = file.path.split('/');
      let current = tree;
      
      parts.forEach((part, index) => {
        if (!current[part]) {
          current[part] = {
            name: part,
            path: file.path,
            type: index === parts.length - 1 ? file.type : 'tree',
            children: {}
          };
        }
        current = current[part].children;
      });
    });
    
    return tree;
  };

  // Render file tree recursively
  const renderFileTree = (node, level = 0) => {
    const entries = Object.entries(node);
    
    return entries.map(([name, item]) => {
      const isFolder = item.type === 'tree';
      const isExpanded = expandedFolders.has(item.path);
      const hasChildren = Object.keys(item.children).length > 0;

      return (
        <div key={item.path} className="tree-item">
          <div
            className={`tree-node ${!isFolder ? 'file' : ''}`}
            style={{ paddingLeft: `${level * 16}px` }}
            onClick={() => {
              if (isFolder) {
                const newExpanded = new Set(expandedFolders);
                if (isExpanded) {
                  newExpanded.delete(item.path);
                } else {
                  newExpanded.add(item.path);
                }
                setExpandedFolders(newExpanded);
              } else {
                onFileSelect(item, selectedRepo);
              }
            }}
          >
            <span className="tree-icon">
              {isFolder ? (isExpanded ? '📂' : '📁') : '📄'}
            </span>
            <span className="tree-label">{name}</span>
          </div>
          {isFolder && isExpanded && hasChildren && (
            <div className="tree-children">
              {renderFileTree(item.children, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const fileTree = files.length > 0 ? buildFileTree(files) : {};

  return (
    <div className="file-explorer">
      <div className="explorer-header">
        <h2>GitHub Explorer</h2>
        <button onClick={onLogout} className="logout-btn" title="Logout">
          🚪
        </button>
      </div>

      {!selectedRepo ? (
        <div className="repo-list">
          <div className="repo-list-header">
            <h3>Your Repositories</h3>
            <button 
              onClick={() => setShowCreateRepo(!showCreateRepo)}
              className="create-repo-btn"
              title="Create new repository"
            >
              ➕
            </button>
          </div>

          {showCreateRepo && (
            <div className="create-repo-form">
              <h4>Create New Repository</h4>
              <div className="form-field">
                <label>Repository Name</label>
                <div className="name-input-wrapper">
                  <span className="name-prefix">{REPO_PREFIX}</span>
                  <input
                    type="text"
                    placeholder="project-name"
                    value={newRepoName}
                    onChange={(e) => setNewRepoName(e.target.value)}
                    className="repo-name-input"
                  />
                </div>
              </div>
              <div className="form-field">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                  />
                  <span>Private repository</span>
                </label>
              </div>
              <div className="form-actions">
                <button
                  onClick={handleCreateRepo}
                  disabled={!newRepoName.trim() || creating}
                  className="btn-primary"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateRepo(false);
                    setNewRepoName('');
                    setIsPrivate(false);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="filter-controls">
            <label className="checkbox-label small">
              <input
                type="checkbox"
                checked={showAllRepos}
                onChange={(e) => setShowAllRepos(e.target.checked)}
              />
              <span>Show all repositories</span>
            </label>
          </div>

          <div className="search-box">
            <input
              type="text"
              placeholder="Search repositories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
          {loading ? (
            <div className="loading">Loading repositories...</div>
          ) : repos.length === 0 ? (
            <div className="no-results">No repositories found</div>
          ) : (
            repos.map(repo => (
              <div
                key={repo.id}
                className="repo-item"
                onClick={() => handleRepoSelect(repo)}
              >
                <div className="repo-name">{repo.name}</div>
                <div className="repo-info">
                  {repo.private && <span className="badge">Private</span>}
                  <span className="repo-branch">{repo.defaultBranch}</span>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="file-tree">
          <div className="repo-header">
            <button
              onClick={() => setSelectedRepo(null)}
              className="back-btn"
            >
              ← Back
            </button>
            <div className="repo-name-header">{selectedRepo.name}</div>
            <div className="file-actions">
              <button
                onClick={() => setShowNewFileDialog(true)}
                className="action-btn"
                title="New file or folder"
              >
                📄+
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="action-btn"
                title="Upload files"
                disabled={uploading}
              >
                {uploading ? '⏳' : '📤'}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {showNewFileDialog && (
            <div className="new-file-dialog">
              <h4>Create New {newFileType === 'folder' ? 'Folder' : 'File'}</h4>
              <div className="form-field">
                <div className="file-type-toggle">
                  <button
                    className={newFileType === 'file' ? 'active' : ''}
                    onClick={() => setNewFileType('file')}
                  >
                    📄 File
                  </button>
                  <button
                    className={newFileType === 'folder' ? 'active' : ''}
                    onClick={() => setNewFileType('folder')}
                  >
                    📁 Folder
                  </button>
                </div>
              </div>
              <div className="form-field">
                <input
                  type="text"
                  placeholder={newFileType === 'folder' ? 'folder/path' : 'filename.tex'}
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="file-name-input"
                  autoFocus
                />
              </div>
              <div className="form-actions">
                <button
                  onClick={handleCreateFile}
                  disabled={!newFileName.trim() || creating}
                  className="btn-primary"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
                <button
                  onClick={() => {
                    setShowNewFileDialog(false);
                    setNewFileName('');
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          {loading ? (
            <div className="loading">Loading files...</div>
          ) : (
            <div className="tree-container">
              {renderFileTree(fileTree)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FileExplorer;
