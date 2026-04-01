import React, { useEffect, useRef, useState } from 'react';
import './LatexPreview.css';

/**
 * LaTeX Preview Component using TeXLive (SwiftLaTeX)
 * Compiles LaTeX documents client-side with full TeX Live support
 */
function LatexPreview({ content, onCompileError }) {
  const [isCompiling, setIsCompiling] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState('');
  const engineRef = useRef(null);
  const compileTimeoutRef = useRef(null);

  useEffect(() => {
    // Load TeXLive engine
    const initTeXLive = async () => {
      try {
        console.log('Starting TeXLive initialization...');
        
        // Check if already loaded
        if (window.TeXLiveEngine) {
          console.log('TeXLiveEngine already loaded, initializing...');
          try {
            const engine = new window.TeXLiveEngine();
            console.log('Loading engine...');
            await engine.loadEngine();
            engineRef.current = engine;
            console.log('TeXLive engine loaded successfully');
          } catch (err) {
            console.error('Failed to initialize engine:', err);
            setError('Failed to initialize LaTeX engine: ' + err.message);
          }
          return;
        }
        
        // Check if script is already loading
        const existingScript = document.querySelector('script[src="/texlive.js"]');
        if (existingScript) {
          console.log('texlive.js is already loading...');
          // Wait for it to load
          existingScript.addEventListener('load', async () => {
            if (window.TeXLiveEngine) {
              try {
                const engine = new window.TeXLiveEngine();
                await engine.loadEngine();
                engineRef.current = engine;
                console.log('TeXLive engine loaded successfully');
              } catch (err) {
                console.error('Failed to initialize engine:', err);
                setError('Failed to initialize LaTeX engine: ' + err.message);
              }
            }
          });
          return;
        }
        
        // Load TeXLiveEngine script
        const script = document.createElement('script');
        script.src = '/texlive.js';
        script.async = false;
        
        script.onload = async () => {
          console.log('texlive.js loaded');
          
          if (!window.TeXLiveEngine) {
            setError('TeXLiveEngine constructor not found');
            return;
          }
          
          try {
            console.log('Creating TeXLiveEngine instance...');
            const engine = new window.TeXLiveEngine();
            
            console.log('Loading engine...');
            await engine.loadEngine();
            
            engineRef.current = engine;
            console.log('TeXLive engine loaded successfully');
          } catch (err) {
            console.error('Failed to initialize engine:', err);
            setError('Failed to initialize LaTeX engine: ' + err.message);
          }
        };
        
        script.onerror = () => {
          setError('Failed to load texlive.js');
        };
        
        document.head.appendChild(script);
        
        return () => {
          // Don't remove the script on unmount, let it stay for reuse
        };
      } catch (err) {
        console.error('Failed to setup TeXLive:', err);
        setError('Failed to setup LaTeX engine: ' + err.message);
      }
    };

    initTeXLive();
  }, []);

  // Compile LaTeX when content changes (debounced)
  useEffect(() => {
    if (!content || !engineRef.current) return;

    if (compileTimeoutRef.current) {
      clearTimeout(compileTimeoutRef.current);
    }

    compileTimeoutRef.current = setTimeout(() => {
      compileLaTeX();
    }, 1000);

    return () => {
      if (compileTimeoutRef.current) {
        clearTimeout(compileTimeoutRef.current);
      }
    };
  }, [content]);

  const compileLaTeX = async () => {
    if (!engineRef.current) {
      setError('LaTeX engine not ready');
      return;
    }

    setIsCompiling(true);
    setError(null);
    setLogs('');

    try {
      const engine = engineRef.current;
      
      engine.writeMemFSFile('main.tex', content);
      engine.setEngineMainFile('main.tex');
      
      const result = await engine.compileLaTeX();
      
      setLogs(result.log || '');
      
      if (result.status === 0 && result.pdf) {
        const pdfBlob = new Blob([result.pdf], { type: 'application/pdf' });
        
        if (pdfUrl) {
          URL.revokeObjectURL(pdfUrl);
        }
        
        const url = URL.createObjectURL(pdfBlob);
        setPdfUrl(url);
        setError(null);
      } else {
        const errorMsg = result.log || 'Compilation failed';
        setError(errorMsg);
        onCompileError?.(errorMsg);
      }
    } catch (err) {
      console.error('LaTeX compilation error:', err);
      const errorMsg = err.message || 'Compilation failed';
      setError(errorMsg);
      onCompileError?.(errorMsg);
    } finally {
      setIsCompiling(false);
    }
  };

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  return (
    <div className="latex-preview">
      <div className="preview-header">
        <h3>LaTeX Preview</h3>
        <div className="preview-controls">
          {isCompiling && <span className="compiling">⚙️ Compiling...</span>}
          {error && <span className="error-badge">❌ Error</span>}
          {!engineRef.current && <span className="compiling">🔄 Loading...</span>}
          <button 
            onClick={compileLaTeX}
            disabled={isCompiling || !engineRef.current}
            className="compile-btn"
          >
            🔄 Recompile
          </button>
        </div>
      </div>

      <div className="preview-content">
        {pdfUrl ? (
          <iframe
            src={pdfUrl}
            className="pdf-viewer"
            title="LaTeX Preview"
          />
        ) : (
          <div className="preview-placeholder">
            <div className="placeholder-content">
              <h2>📄 LaTeX Preview</h2>
              <p>Write LaTeX code to see the preview</p>
              <div className="features">
                <div className="feature">✓ Full TeX Live</div>
                <div className="feature">✓ SwiftLaTeX engine</div>
                <div className="feature">✓ TikZ graphics</div>
                <div className="feature">✓ Real-time preview</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="error-panel">
          <h4>Compilation Error:</h4>
          <pre>{error}</pre>
        </div>
      )}

      {logs && (
        <details className="logs-panel">
          <summary>Compilation Logs</summary>
          <pre>{logs}</pre>
        </details>
      )}
    </div>
  );
}

export default LatexPreview;
