/**
 * TeXLive.js Engine Wrapper
 * Based on manuels/texlive.js - Emscripten-compiled pdftex (TeX Live 2016)
 * 
 * This wrapper provides a simplified interface for compiling LaTeX documents
 * using the pdftex binary compiled to JavaScript via Emscripten.
 * 
 * Original project: https://github.com/manuels/texlive.js
 * 
 * NOTE: This uses the CDN version hosted on GitHub Pages
 */

class TeXLiveEngine {
  constructor() {
    this.pdftex = null;
    this.ready = false;
    this.compiling = false;
    this.latexContent = '';
    this.logs = [];
  }

  /**
   * Load required scripts from CDN
   */
  async loadScript(url) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Failed to load ${url}`));
      document.head.appendChild(script);
    });
  }

  /**
   * Initialize the TeXLive engine
   * Loads pdftex.js from GitHub CDN
   */
  async loadEngine() {
    if (this.ready) {
      return;
    }

    console.log('Loading TeXLive.js from CDN...');

    try {
      // Check if PDFTeX is already loaded
      if (!window.PDFTeX) {
        // Load promise.js first (required by pdftex.js)
        if (!window.promise) {
          await this.loadScript('https://manuels.github.io/texlive.js/promisejs/promise.js');
        }

        // Load pdftex.js
        await this.loadScript('https://manuels.github.io/texlive.js/pdftex.js');
      }

      // Create PDFTeX instance
      console.log('Creating PDFTeX instance...');
      this.pdftex = new window.PDFTeX();

      // Set up log handlers
      this.pdftex.on_stdout = (msg) => {
        this.logs.push(msg);
        console.log('[pdftex]', msg);
      };

      this.pdftex.on_stderr = (msg) => {
        this.logs.push(msg);
        console.error('[pdftex]', msg);
      };

      // Set memory
      console.log('Setting memory...');
      await this.pdftex.set_TOTAL_MEMORY(80 * 1024 * 1024); // 80MB

      this.ready = true;
      console.log('TeXLive engine ready');

    } catch (err) {
      console.error('Failed to load TeXLive engine:', err);
      throw new Error('Failed to load LaTeX engine: ' + err.message);
    }
  }

  /**
   * Write a file to the virtual file system
   * Note: manuels/texlive.js writes files during compilation
   */
  async writeMemFSFile(filename, content) {
    this.latexContent = content;
  }

  /**
   * Set the main LaTeX file to compile
   * Note: manuels/texlive.js expects 'input.tex' by default
   */
  async setEngineMainFile(filename) {
    // The engine compiles input.tex by default, so we'll handle this in compileLaTeX
  }

  /**
   * Compile the LaTeX document
   * Returns: { status: number, log: string, pdf: Uint8Array }
   */
  async compileLaTeX() {
    if (!this.ready || !this.pdftex) {
      throw new Error('Engine not ready');
    }

    if (this.compiling) {
      throw new Error('Already compiling');
    }

    this.compiling = true;
    this.logs = [];

    console.log('Starting LaTeX compilation...');

    try {
      // Use compileRaw to get the PDF as binary data
      const pdfBinary = await this.pdftex.compileRaw(this.latexContent);

      if (pdfBinary === false || !pdfBinary) {
        // Compilation failed
        const logText = this.logs.join('\n');
        return {
          status: 1,
          log: logText || 'Compilation failed',
          pdf: null
        };
      }

      // Convert binary string to Uint8Array
      const pdfArray = new Uint8Array(pdfBinary.length);
      for (let i = 0; i < pdfBinary.length; i++) {
        pdfArray[i] = pdfBinary.charCodeAt(i);
      }

      console.log('Compilation successful, PDF size:', pdfArray.length);

      return {
        status: 0,
        log: this.logs.join('\n'),
        pdf: pdfArray
      };

    } catch (err) {
      console.error('Compilation error:', err);
      return {
        status: 1,
        log: err.message + '\n' + this.logs.join('\n'),
        pdf: null
      };
    } finally {
      this.compiling = false;
    }
  }

  /**
   * Cleanup resources
   */
  terminate() {
    this.pdftex = null;
    this.ready = false;
    this.logs = [];
  }
}

// Export for use in browser
if (typeof window !== 'undefined') {
  window.TeXLiveEngine = TeXLiveEngine;
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TeXLiveEngine;
}
