# LaTeX Support

## Features

This editor includes **full client-side LaTeX compilation** using manuels/texlive.js:

✅ **TeX Live 2016 Distribution** - pdftex compiled to JavaScript  
✅ **TikZ Graphics** - Full TikZ/PGF support for diagrams  
✅ **Real-time Preview** - Automatic PDF preview as you type  
✅ **Zero Server Dependency** - Everything runs in your browser  
✅ **CDN-Based** - Loads from GitHub Pages, no large local files  
✅ **Collaborative Editing** - Real-time LaTeX collaboration via P2P

## Usage

### Creating LaTeX Files

1. Create a repository with `p2p-editor-` prefix
2. Create a new file with `.tex` extension
3. The LaTeX preview pane opens automatically

### Example LaTeX Document

```latex
\documentclass{article}
\usepackage{amsmath}
\usepackage{tikz}
\usepackage{graphicx}

\title{My Document}
\author{Your Name}
\date{\today}

\begin{document}

\maketitle

\section{Introduction}

This is a collaborative LaTeX document with full package support.

\subsection{Math Example}

Einstein's famous equation:
\begin{equation}
    E = mc^2
\end{equation}

\subsection{TikZ Example}

\begin{tikzpicture}
    \draw[->] (0,0) -- (4,0) node[right] {$x$};
    \draw[->] (0,0) -- (0,3) node[above] {$y$};
    \draw[domain=0:3.5, smooth, variable=\x, blue, thick] 
        plot ({\x}, {\x*\x/4});
\end{tikzpicture}

\end{document}
```

## Supported Packages

SwiftLaTeX includes the full TeX Live distribution with all standard packages:

### Mathematics
- `amsmath`, `amssymb`, `amsthm`
- `mathtools`, `mathrsfs`
- `bm` (bold math)

### Graphics & Figures
- `tikz`, `pgfplots`
- `graphicx`, `subfig`
- `float`, `wrapfig`

### Tables
- `booktabs`, `multirow`
- `longtable`, `tabularx`

### Typography
- `fontenc`, `inputenc`
- `microtype`
- `hyperref`

### Bibliography
- `biblatex`, `natbib`
- `cite`

### Algorithms
- `algorithm`, `algorithmic`
- `listings`

### Chemistry
- `chemfig`, `mhchem`

### And many more...

## TikZ Examples

### Flowchart
```latex
\begin{tikzpicture}[node distance=2cm]
    \node (start) [rectangle, draw] {Start};
    \node (process) [rectangle, draw, below of=start] {Process};
    \node (end) [rectangle, draw, below of=process] {End};
    
    \draw[->] (start) -- (process);
    \draw[->] (process) -- (end);
\end{tikzpicture}
```

### Graph
```latex
\begin{tikzpicture}
    \begin{axis}[
        xlabel=$x$,
        ylabel=$y$,
        grid=major
    ]
    \addplot[blue, thick] {x^2};
    \addplot[red, thick] {2*x + 1};
    \end{axis}
\end{tikzpicture}
```

### Circuit Diagram
```latex
\usepackage{circuitikz}

\begin{circuitikz}
    \draw (0,0) to[battery] (0,2)
          to[R=$R_1$] (2,2)
          to[L=$L_1$] (2,0)
          to[short] (0,0);
\end{circuitikz}
```

## Compilation

### Automatic Compilation
- LaTeX documents auto-compile 1 second after you stop typing
- Preview updates in real-time

### Manual Compilation
- Click "🔄 Recompile" button to force recompilation
- Useful after adding new packages

### Compilation Logs
- Click "Compilation Logs" to see detailed output
- Helps debug compilation errors

## Performance

- **First compilation**: 3-5 seconds (loads WASM engine)
- **Subsequent compilations**: 1-2 seconds
- **Complex documents with TikZ**: 2-4 seconds

## Browser Requirements

- Modern browser with WASM support
- Chrome 57+, Firefox 52+, Safari 11+, Edge 16+
- Minimum 4GB RAM recommended for large documents

## Collaborative LaTeX Editing

1. Open the same `.tex` file in multiple browsers
2. All collaborators see changes in real-time
3. Each person can see the PDF preview
4. Changes sync via P2P (no server required)

## Troubleshooting

### Package Not Found
SwiftLaTeX includes most packages. If missing:
- Check package name spelling
- Use alternative package
- Report missing package as feature request

### Compilation Timeout
- Simplify complex TikZ diagrams
- Split large documents into sections
- Reduce image count/size

### Memory Issues
- Close other browser tabs
- Refresh the page
- Use simpler document structure

## Advanced Features

### Custom Commands
```latex
\newcommand{\highlight}[1]{\textcolor{red}{\textbf{#1}}}
```

### Beamer Presentations
```latex
\documentclass{beamer}
\usetheme{Madrid}

\begin{document}
\begin{frame}
    \frametitle{My Presentation}
    Content here
\end{frame}
\end{document}
```

### Bibliography
```latex
\usepackage{biblatex}
\addbibresource{references.bib}

\printbibliography
```

## Future Enhancements

- [ ] PDF download button
- [ ] LaTeX template library
- [ ] Spell checking
- [ ] Auto-completion for commands
- [ ] Package documentation lookup
- [ ] Export to different formats

---

**Note**: SwiftLaTeX runs entirely in your browser. No LaTeX source code is sent to any server, ensuring complete privacy for your documents.
