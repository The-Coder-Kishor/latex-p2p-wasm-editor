# TeXLive.js - Manuels Implementation

## Overview

This implementation uses manuels/texlive.js, an Emscripten-compiled version of pdftex (TeX Live 2016) that runs entirely in the browser. It provides full LaTeX compilation capabilities without requiring a server.

**Project**: https://github.com/manuels/texlive.js

## Architecture

### Files Structure
```
public/
  texlive.js          # SwiftLaTeX wrapper with Web Worker
src/
  components/
    LatexPreview.jsx  # React component using TeXLiveEngine
```

### How It Works

1. **Initialization**: 
   - `LatexPreview` component loads `texlive.js`
   - Creates a `TeXLiveEngine` instance
   - Engine loads promise.js and pdftex.js from GitHub Pages CDN

2. **Setup**:
   - Loads pdftex binary compiled via Emscripten
   - Creates PDFTeX instance
   - Allocates 80MB memory for compilation

3. **Compilation Flow**:
   - User types LaTeX code in the editor
   - After 1 second debounce, compilation is triggered
   - LaTeX content is stored and passed to `compileRaw`
   - pdftex compiles the LaTeX to PDF
   - PDF is returned as binary string, converted to Uint8Array
   - PDF is converted to blob URL and displayed in iframe

## API Reference

### TeXLiveEngine Class

```javascript
const engine = new TeXLiveEngine();
await engine.loadEngine();

// Write LaTeX file
await engine.writeMemFSFile('main.tex', latexCode);

// Set main file to compile
await engine.setEngineMainFile('main.tex');

// Compile LaTeX
const result = await engine.compileLaTeX();
// result: { status: number, log: string, pdf: Uint8Array }

// Compile BibTeX (for bibliographies)
await engine.compileBibtex();

// Cleanup
engine.terminate();
```

### Configuration

```javascript
class TeXLiveEngine {
  compileTimeout = 30000;  // 30 seconds for compilation
  initTimeout = 60000;     // 60 seconds for initialization
}
```

## Features

✅ **TeX Live 2016** - Complete pdftex LaTeX distribution
✅ **CDN-Based** - No large local files, loads from GitHub Pages
✅ **Emscripten** - pdftex compiled to JavaScript
✅ **No Web Worker** - Direct compilation in main thread
✅ **Package Support** - Loads packages from texlive tree on demand
✅ **TikZ Graphics** - Full graphics package support
✅ **Real-time Preview** - Automatic recompilation with debouncing
✅ **Error Handling** - Detailed compilation logs via stdout/stderr

## Supported Packages

manuels/texlive.js includes TeX Live 2016 with packages loaded on-demand:

### Mathematics
- `amsmath`, `amssymb`, `amsthm`
- `mathtools`, `mathrsfs`

### Graphics
- `tikz`, `pgfplots`
- `graphicx`, `subfig`

### Tables
- `booktabs`, `multirow`
- `longtable`, `tabularx`

### Bibliography
- `biblatex`, `natbib`

### And many more...

## Advantages over BusyTeX

1. **CDN Loading**: No need to store large WASM/data files locally
2. **Simpler Setup**: Single file implementation  
3. **Proven Stability**: Used for many years, stable implementation
4. **Smaller Bundle**: No local files means smaller repository size
5. **Standard TeX Live**: Based on official TeX Live 2016 distribution

## Usage in Component

```jsx
import LatexPreview from './components/LatexPreview';

function App() {
  const [latexCode, setLatexCode] = useState('\\documentclass{article}...');
  
  return (
    <LatexPreview 
      content={latexCode}
      onCompileError={(error) => console.error(error)}
    />
  );
}
```

## Performance

- **First Load**: 10-30 seconds (downloads pdftex.js and dependencies from CDN)
- **Subsequent Compiles**: 2-5 seconds depending on document complexity
- **Network**: ~5-10 MB download from CDN (cached by browser, includes TeX Live tree)

## Troubleshooting

### Engine Not Loading
- Check browser console for errors
- Verify CDN is accessible: https://cdn.jsdelivr.net/npm/swiftlatex@latest/
- Check network tab for failed requests

### Compilation Errors
- Check the logs panel in the preview
- Common issues:
  - Missing packages (most standard packages are included)
  - Syntax errors in LaTeX code
  - Infinite loops in TikZ drawings

### Slow Compilation
- Increase `compileTimeout` if needed
- Simplify complex TikZ graphics
- Split large documents into smaller sections

## CDN Source

manuels/texlive.js is loaded from GitHub Pages:
```
https://manuels.github.io/texlive.js/promisejs/promise.js
https://manuels.github.io/texlive.js/pdftex.js
https://manuels.github.io/texlive.js/pdftex-worker.js
https://manuels.github.io/texlive.js/texlive/ (tree loaded on-demand)
```

## License

- TeXLive.js wrapper: MIT
- SwiftLaTeX: Apache 2.0
- TeX Live: Various open-source licenses

## References

- manuels/texlive.js: https://github.com/manuels/texlive.js
- Demo: https://manuels.github.io/texlive.js/
- TeX Live: https://www.tug.org/texlive/
- Emscripten: https://emscripten.org/
