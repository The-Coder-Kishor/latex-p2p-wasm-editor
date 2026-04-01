import React, { useEffect, useRef, useState } from 'react';
import MonacoEditor from '@monaco-editor/react';
import { MonacoBinding } from 'y-monaco';
import { useP2P } from '../hooks/useP2P';
import { useGithub } from '../hooks/useGithub';
import { generateRoomName } from '../utils/crypto';
import LatexPreview from './LatexPreview';
import './Editor.css';

/**
 * P2P collaborative editor component
 * Binds Monaco Editor to Yjs for real-time collaboration
 * Handles synchronization with GitHub
 */
function Editor({ token, repo, file }) {
  const [roomName, setRoomName] = useState(null);
  const [isSyncing, setIsSyncing] = useState(true);
  const [lastSha, setLastSha] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const editorRef = useRef(null);
  const monacoBindingRef = useRef(null);

  const { ydoc, ytext, status, peers } = useP2P(roomName);
  const { getFileContent, updateFileContent } = useGithub(token);

  // Generate deterministic room name from repo and file path
  useEffect(() => {
    const setupRoom = async () => {
      const room = await generateRoomName(repo.fullName, file.path);
      setRoomName(room);
    };
    setupRoom();
  }, [repo, file]);

  // Auto-show preview for LaTeX files
  useEffect(() => {
    if (file && isLatexFile(file.path)) {
      setShowPreview(true);
    } else {
      setShowPreview(false);
    }
  }, [file]);

  // Initialize editor content and sync with GitHub
  useEffect(() => {
    if (!ytext || !roomName) return;

    const syncWithGithub = async () => {
      setIsSyncing(true);
      try {
        // Fetch latest content from GitHub
        const { content, sha } = await getFileContent(
          repo.owner,
          repo.name,
          file.path,
          repo.defaultBranch
        );
        
        setLastSha(sha);

        // Check if local IndexedDB has content
        const localContent = ytext.toString();
        
        if (localContent.length === 0) {
          // No local content - initialize from GitHub
          ytext.insert(0, content);
          console.log('Initialized from GitHub');
        } else {
          // Local content exists - smart merge strategy
          // For now, we'll use GitHub as source of truth on first load
          // In production, you'd want more sophisticated conflict resolution
          if (localContent !== content) {
            console.log('Local and GitHub differ - using GitHub version');
            ytext.delete(0, localContent.length);
            ytext.insert(0, content);
          }
        }
      } catch (error) {
        console.error('Failed to sync with GitHub:', error);
      } finally {
        setIsSyncing(false);
      }
    };

    syncWithGithub();
  }, [ytext, roomName, repo, file, getFileContent]);

  // Handle Monaco editor mount and binding
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;

    if (!ytext) {
      console.warn('ytext not ready yet');
      return;
    }

    // Create Monaco-Yjs binding for collaborative editing
    try {
      const binding = new MonacoBinding(
        ytext,
        editor.getModel(),
        new Set([editor]),
        // Awareness for cursor positions (optional)
        null
      );

      monacoBindingRef.current = binding;
      console.log('Monaco editor bound to Yjs');
    } catch (error) {
      console.error('Failed to create Monaco binding:', error);
    }
  };

  // Save current content to GitHub
  const handleSave = async () => {
    if (!ytext || !lastSha) return;

    setSaving(true);
    try {
      const content = ytext.toString();
      
      // Get current SHA to prevent conflicts
      const { sha: currentSha } = await getFileContent(
        repo.owner,
        repo.name,
        file.path,
        repo.defaultBranch
      );

      // Update file on GitHub
      const result = await updateFileContent(
        repo.owner,
        repo.name,
        file.path,
        content,
        currentSha,
        `Update ${file.path} via P2P Editor`
      );

      setLastSha(result.content.sha);
      alert('Successfully pushed to GitHub! ✅');
    } catch (error) {
      console.error('Failed to save to GitHub:', error);
      alert('Failed to save to GitHub: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Get file language for syntax highlighting
  const getLanguage = (path) => {
    const ext = path.split('.').pop().toLowerCase();
    const languageMap = {
      js: 'javascript',
      jsx: 'javascript',
      ts: 'typescript',
      tsx: 'typescript',
      py: 'python',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
      cs: 'csharp',
      go: 'go',
      rs: 'rust',
      rb: 'ruby',
      php: 'php',
      html: 'html',
      css: 'css',
      json: 'json',
      xml: 'xml',
      yaml: 'yaml',
      yml: 'yaml',
      md: 'markdown',
      sql: 'sql',
      sh: 'shell',
      bash: 'shell',
      tex: 'latex',
      latex: 'latex'
    };
    return languageMap[ext] || 'plaintext';
  };

  // Check if file is LaTeX
  const isLatexFile = (path) => {
    const ext = path.split('.').pop().toLowerCase();
    return ext === 'tex' || ext === 'latex';
  };

  if (!roomName) {
    return <div className="editor-loading">Initializing room...</div>;
  }

  return (
    <div className="editor-wrapper">
      <div className="editor-toolbar">
        <div className="toolbar-left">
          <span className="file-name">{file.path}</span>
          <span className={`status-badge ${status}`}>
            {status === 'connected' ? '🟢' : '🟡'} {status}
          </span>
          {peers.length > 0 && (
            <span className="peers-badge">
              👥 {peers.length} peer{peers.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div className="toolbar-right">
          {isSyncing && <span className="syncing">Syncing...</span>}
          {isLatexFile(file.path) && (
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="preview-toggle-btn"
            >
              {showPreview ? '📝 Code Only' : '👁️ Show Preview'}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving || isSyncing}
            className="save-btn"
          >
            {saving ? 'Saving...' : '💾 Push to GitHub'}
          </button>
        </div>
      </div>

      <div className={`editor-main ${showPreview ? 'split-view' : ''}`}>
        <div className="editor-content">
          {ytext ? (
            <MonacoEditor
              height="100%"
              language={getLanguage(file.path)}
              theme="vs-dark"
              onMount={handleEditorDidMount}
              options={{
                minimap: { enabled: true },
                fontSize: 14,
                lineNumbers: 'on',
                roundedSelection: false,
                scrollBeyondLastLine: false,
                automaticLayout: true,
                readOnly: isSyncing
              }}
            />
          ) : (
            <div className="editor-loading">Initializing editor...</div>
          )}
        </div>

        {showPreview && isLatexFile(file.path) && (
          <div className="preview-pane">
            <LatexPreview 
              content={ytext?.toString() || ''} 
              onCompileError={(error) => console.error('LaTeX error:', error)}
            />
          </div>
        )}
      </div>

      {peers.length > 0 && (
        <div className="peers-list">
          <h4>Active Collaborators:</h4>
          {peers.map(peer => (
            <div key={peer.id} className="peer-item">
              <span 
                className="peer-color" 
                style={{ backgroundColor: peer.color }}
              />
              <span className="peer-name">{peer.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Editor;
