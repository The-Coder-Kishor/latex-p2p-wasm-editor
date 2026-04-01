# P2P Git Editor - IIIT B.Tech Project

A peer-to-peer collaborative code editor with GitHub integration, built using React, Yjs, WebRTC, and Monaco Editor.

## 🎯 Project Overview

This project enables real-time collaborative editing of GitHub repository files using peer-to-peer technology. Changes are synchronized across all collaborators instantly via WebRTC, with local persistence through IndexedDB, and can be pushed back to GitHub when ready.

## 🏗️ Architecture

### Core Technologies

- **React** - UI framework
- **Yjs** - CRDT for conflict-free collaborative editing
- **WebRTC (y-webrtc)** - P2P synchronization between peers
- **IndexedDB (y-indexeddb)** - Local browser persistence
- **Monaco Editor** - Code editor with syntax highlighting
- **Octokit** - GitHub API client
- **Vite** - Build tool and dev server

### Key Features

1. **Asynchronous Collaboration**: Work offline with local persistence, sync when peers connect
2. **GitHub Integration**: Fetch files from GitHub, edit collaboratively, push changes back
3. **Real-time Sync**: Changes propagate instantly via WebRTC
4. **Conflict Resolution**: Yjs CRDT handles concurrent edits automatically
5. **Room-based Sessions**: Deterministic room names from repo ID + file path

## 📁 Project Structure

\`\`\`
p2p-git-editor/
├── src/
│   ├── components/
│   │   ├── Editor.jsx       # Monaco editor with Yjs binding
│   │   ├── FileExplorer.jsx # GitHub repository browser
│   │   └── Auth.jsx         # GitHub PAT authentication
│   ├── hooks/
│   │   ├── useP2P.js        # Yjs + WebRTC + IndexedDB logic
│   │   └── useGithub.js     # Octokit REST API wrapper
│   ├── utils/
│   │   └── crypto.js        # Room name hashing utilities
│   ├── App.jsx              # Main application component
│   └── main.jsx             # Entry point
├── index.html
├── package.json
└── vite.config.js
\`\`\`

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm/pnpm
- GitHub Personal Access Token with \`repo\` scope

### Installation

1. **Install dependencies**:
   \`\`\`bash
   npm install
   \`\`\`

2. **Start development server**:
   \`\`\`bash
   npm run dev
   \`\`\`

3. **Open browser** and navigate to \`http://localhost:5173\`

### Usage

1. **Authenticate**: Enter your GitHub Personal Access Token
   - Go to GitHub → Settings → Developer Settings → Personal Access Tokens
   - Create token with \`repo\` scope
   - Paste token in the app

2. **Select Repository**: Choose from your repositories

3. **Select File**: Navigate the file tree and select a file to edit

4. **Collaborate**: Share the repo + file with peers - they'll automatically join the same room

5. **Save**: Click "Push to GitHub" to commit changes back to the repository

## 🔧 Implementation Details

### P2P Hook (\`useP2P.js\`)

- Initializes Yjs document with shared text type
- Sets up IndexedDB persistence for offline capability
- Configures WebRTC provider for P2P syncing
- Tracks connection status and active peers

### GitHub Hook (\`useGithub.js\`)

- Wraps Octokit API calls
- Handles Base64 encoding/decoding for GitHub API
- Fetches file content with SHA for conflict detection
- Updates files with commit messages

### Editor Component (\`Editor.jsx\`)

- Binds Monaco Editor to Yjs text type via \`y-monaco\`
- Generates deterministic room names from repo + file path
- Implements merge strategy: GitHub content initializes local doc
- Handles save operation: fetch latest SHA, then update GitHub

### Crypto Utilities (\`crypto.js\`)

- Generates deterministic room names using SHA-256
- Ensures all collaborators join the same WebRTC room
- Format: \`p2p-editor-{hash}\`

## 🧠 Merge Strategy

The "glue logic" between GitHub and P2P:

1. **Check Local**: Query IndexedDB for existing content
2. **Check Remote**: Fetch latest from GitHub API
3. **Initialize**: If local is empty, insert GitHub content
4. **Merge**: If both exist, Yjs CRDT handles conflict resolution
5. **Broadcast**: Enable WebRTC provider to sync with peers

## 📝 Future Enhancements

- [ ] Cursor awareness (show collaborator cursors)
- [ ] User authentication and profiles
- [ ] Private rooms with passwords
- [ ] Commit history and branch switching
- [ ] Pull request creation from editor
- [ ] Syntax validation and linting
- [ ] Chat functionality
- [ ] Video/voice communication

## 🤝 Contributing

This is an IIIT B.Tech academic project. Contributions, suggestions, and feedback are welcome!

## 📄 License

MIT License - Feel free to use this project for learning and development.

## 👥 Authors

IIIT B.Tech Students

---

**Note**: This project uses public signaling servers for WebRTC. For production use, consider deploying your own signaling server for better reliability and privacy.
