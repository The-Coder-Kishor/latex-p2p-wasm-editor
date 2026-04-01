import { useState, useEffect, useRef } from 'react';
import * as Y from 'yjs';
import Peer from 'peerjs';
import { IndexeddbPersistence } from 'y-indexeddb';

/**
 * Custom React hook for P2P collaboration with Yjs + PeerJS
 * Implements local persistence via IndexedDB and P2P syncing via PeerJS
 * Uses PeerJS's free cloud signaling server (no self-hosting required!)
 * 
 * @param {string} roomName - Unique room identifier (typically hash of repo ID + file path)
 * @returns {Object} { ydoc, provider, status, peers, ytext }
 */
export function useP2P(roomName) {
  const [status, setStatus] = useState('disconnected');
  const [peers, setPeers] = useState([]);
  const ydocRef = useRef(null);
  const peerRef = useRef(null);
  const connectionsRef = useRef(new Map());
  const persistenceRef = useRef(null);
  const ytextRef = useRef(null);

  useEffect(() => {
    if (!roomName) return;

    // Initialize Yjs document
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    // Create shared text type for the editor
    const ytext = ydoc.getText('monaco');
    ytextRef.current = ytext;

    // Set up IndexedDB persistence for local storage
    const persistence = new IndexeddbPersistence(roomName, ydoc);
    persistenceRef.current = persistence;

    persistence.on('synced', () => {
      console.log('Local content loaded from IndexedDB');
    });

    // Generate a unique peer ID for this session
    const peerId = `${roomName}-${Math.random().toString(36).substr(2, 9)}`;
    const userName = 'User-' + Math.random().toString(36).substr(2, 5);
    const userColor = '#' + Math.floor(Math.random() * 16777215).toString(16);

    // Initialize PeerJS with free cloud signaling server
    const peer = new Peer(peerId, {
      host: '0.peerjs.com',
      port: 443,
      path: '/',
      secure: true,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:global.stun.twilio.com:3478' }
        ]
      }
    });

    peerRef.current = peer;

    // Handle peer open event
    peer.on('open', (id) => {
      console.log('PeerJS connected with ID:', id);
      console.log('Room:', roomName);
      setStatus('connected');
      
      // Broadcast presence to room
      broadcastToRoom(roomName, peerId);
    });

    // Handle incoming connections
    peer.on('connection', (conn) => {
      console.log('Incoming connection from:', conn.peer);
      setupConnection(conn, ydoc, userName, userColor);
    });

    // Handle errors
    peer.on('error', (err) => {
      // Ignore common expected errors
      if (err.type === 'peer-unavailable') {
        // This is normal - trying to connect to an offline peer
        return;
      }
      if (err.type === 'network') {
        console.log('Network error (expected in some cases):', err.message);
        return;
      }
      console.error('PeerJS error:', err);
      setStatus('error');
    });

    // Set up Yjs update handler to broadcast changes
    const updateHandler = (update, origin) => {
      // Don't broadcast updates that came from other peers
      if (origin !== 'remote') {
        const connections = connectionsRef.current;
        connections.forEach((conn) => {
          if (conn.open) {
            conn.send({
              type: 'sync',
              update: Array.from(update),
              userName,
              userColor
            });
          }
        });
      }
    };

    ydoc.on('update', updateHandler);

    // Setup connection helper
    function setupConnection(conn, ydoc, userName, userColor) {
      connectionsRef.current.set(conn.peer, conn);
      
      conn.on('open', () => {
        console.log('Connection established with:', conn.peer);
        
        // Send full state to new peer
        const state = Y.encodeStateAsUpdate(ydoc);
        conn.send({
          type: 'sync',
          update: Array.from(state),
          userName,
          userColor
        });

        // Update peers list
        updatePeersList();
      });

      conn.on('data', (data) => {
        if (data.type === 'sync') {
          // Apply update from peer
          const update = new Uint8Array(data.update);
          Y.applyUpdate(ydoc, update, 'remote');
          
          // Update peer info
          updatePeersList();
        }
      });

      conn.on('close', () => {
        console.log('Connection closed with:', conn.peer);
        connectionsRef.current.delete(conn.peer);
        updatePeersList();
      });
    }

    // Update peers list
    function updatePeersList() {
      const connections = Array.from(connectionsRef.current.values());
      setPeers(connections.map((conn, idx) => ({
        id: conn.peer,
        name: `User-${idx + 1}`,
        color: '#' + Math.floor(Math.random() * 16777215).toString(16)
      })));
    }

    // Broadcast to room via PeerServer's room functionality
    // In a real implementation, you'd use a separate room discovery service
    // For now, peers need to know each other's IDs to connect
    function broadcastToRoom(roomName, peerId) {
      // Store peer ID in localStorage for same-browser discovery
      const roomPeers = JSON.parse(localStorage.getItem(`room-${roomName}`) || '[]');
      
      // Clean up old peer IDs (older than 5 minutes)
      const now = Date.now();
      const cleanedPeers = roomPeers.filter(entry => {
        if (typeof entry === 'string') return true; // Old format, keep for now
        return now - entry.timestamp < 5 * 60 * 1000; // 5 minutes
      });
      
      // Add current peer with timestamp
      if (!cleanedPeers.some(entry => entry.id === peerId)) {
        cleanedPeers.push({ id: peerId, timestamp: now });
      }
      
      localStorage.setItem(`room-${roomName}`, JSON.stringify(cleanedPeers));
      
      // Extract just the IDs for connection attempts
      const peerIds = cleanedPeers.map(entry => 
        typeof entry === 'string' ? entry : entry.id
      );

      // Try to connect to other peers in the room
      roomPeers.forEach((otherPeerId) => {
        if (otherPeerId !== peerId && !connectionsRef.current.has(otherPeerId)) {
          try {
            const conn = peer.connect(otherPeerId, { reliable: true });
            setupConnection(conn, ydoc, userName, userColor);
          } catch (err) {
            // Silently ignore connection errors (peer may be offline)
          }
        }
      });

      // Listen for new peers joining via localStorage changes
      const storageListener = (e) => {
        if (e.key === `room-${roomName}` && e.newValue) {
          try {
            const newPeers = JSON.parse(e.newValue);
            newPeers.forEach((entry) => {
              const otherId = typeof entry === 'string' ? entry : entry.id;
              if (otherId && otherId !== peerId && !connectionsRef.current.has(otherId)) {
                setTimeout(() => {
                  if (!connectionsRef.current.has(otherId)) {
                    try {
                      console.log('New peer detected, connecting:', otherId);
                      const conn = peer.connect(otherId, { reliable: true });
                      setupConnection(conn, ydoc, userName, userColor);
                    } catch (err) {
                      // Silent fail - peer might be offline
                    }
                  }
                }, Math.random() * 500);
              }
            });
          } catch (err) {
            console.error('Error parsing localStorage peer list:', err);
          }
        }
      };

      window.addEventListener('storage', storageListener);

      // Cleanup storage listener
      return () => window.removeEventListener('storage', storageListener);
    }

    // Cleanup on unmount
    return () => {
      // Close all connections
      connectionsRef.current.forEach((conn) => conn.close());
      connectionsRef.current.clear();

      // Destroy peer
      if (peer) {
        peer.destroy();
      }
entry => {
        const id = typeof entry === 'string' ? entry : entry.id;
        return id !== peerId;
      }
      // Remove from room
      const roomPeers = JSON.parse(localStorage.getItem(`room-${roomName}`) || '[]');
      const filtered = roomPeers.filter(id => id !== peerId);
      localStorage.setItem(`room-${roomName}`, JSON.stringify(filtered));

      // Cleanup Yjs
      ydoc.off('update', updateHandler);
      persistence.destroy();
      ydoc.destroy();
    };
  }, [roomName]);

  return {
    ydoc: ydocRef.current,
    peer: peerRef.current,
    persistence: persistenceRef.current,
    ytext: ytextRef.current,
    status,
    peers
  };
}
