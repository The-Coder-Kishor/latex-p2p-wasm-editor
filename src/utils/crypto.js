/**
 * Utility functions for cryptographic operations
 * Used for generating deterministic room names from repo/file identifiers
 */

/**
 * Generate a deterministic room name from repository and file path
 * This ensures all collaborators join the same WebRTC room
 * 
 * @param {string} repoId - Repository identifier (owner/repo)
 * @param {string} filePath - Path to the file in the repository
 * @returns {string} Hashed room name
 */
export async function generateRoomName(repoId, filePath) {
  const input = `${repoId}:${filePath}`;
  
  // Use Web Crypto API for SHA-256 hashing
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  // Convert hash to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return `p2p-editor-${hashHex}`;
}

/**
 * Generate a short hash for display purposes
 * 
 * @param {string} input - Input string to hash
 * @returns {string} Short hash (first 8 characters)
 */
export async function generateShortHash(input) {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex.substring(0, 8);
}

/**
 * Simple hash function for non-critical use cases
 * (faster than crypto.subtle but less secure)
 */
export function simpleHash(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}
