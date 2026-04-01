# Signaling Server Setup

## Current Status

The app is currently configured to work **without external signaling servers**. This means:

✅ **Works**: Multiple tabs/windows in the **same browser** can collaborate via BroadcastChannel  
❌ **Doesn't work**: Cross-browser or cross-device collaboration

## Why Signaling Servers Are Needed

WebRTC needs signaling servers to help peers discover each other across different browsers/devices. Without them, peers can only connect via:
- **BroadcastChannel** (same browser, different tabs)
- **Local network discovery** (limited)

## Options to Enable Full P2P

### Option 1: Use Your Own Signaling Server (Recommended for Production)

Install and run `y-webrtc-signaling`:

```bash
# In a separate directory
npm install -g y-webrtc-signaling-server
y-webrtc-signaling-server --port 4444
```

Then update [src/hooks/useP2P.js](src/hooks/useP2P.js):

```javascript
signaling: ['ws://localhost:4444'],
```

### Option 2: Deploy a Signaling Server

Deploy your own signaling server to a cloud provider:

**Using Railway/Render/Heroku:**

1. Create a new project
2. Deploy `y-webrtc-signaling-server`
3. Use the deployment URL in your config:

```javascript
signaling: ['wss://your-app.railway.app'],
```

**Using Deno Deploy (Free):**

Create `signaling-server.ts`:

```typescript
import { serve } from "https://deno.land/std/http/server.ts";
// Simple WebSocket signaling relay
// Implementation available in y-webrtc-signaling repo
```

### Option 3: Public Signaling Servers (Unreliable)

Public servers are often down or rate-limited. Use only for testing:

```javascript
signaling: [
  'wss://signaling.yjs.dev',
  'wss://y-webrtc-signaling-us.herokuapp.com'
],
```

### Option 4: Local Network Only

Keep current config (empty signaling array) for:
- Single-user editing with GitHub sync
- Same-browser collaboration (different tabs)
- Demo purposes

## Testing Collaboration

With current setup:
1. Open the app in multiple tabs in the **same browser**
2. Select the same repo and file in both tabs
3. Edit in one tab - changes should appear in the other tab

To test cross-browser:
1. Set up a local signaling server (Option 1)
2. Open the app in different browsers (Chrome + Firefox)
3. Select the same repo and file
4. Edit - changes should sync across browsers

## For Your B.Tech Project

### Demo Scenario

**Without signaling server:**
- ✅ Show local persistence (IndexedDB)
- ✅ Show GitHub integration (fetch/push)
- ✅ Show same-browser collaboration (multiple tabs)

**With signaling server:**
- ✅ Full P2P collaboration across devices
- ✅ Real-world deployment scenario

### Evaluation Points

1. **Architecture**: Explain the need for signaling servers
2. **Trade-offs**: Centralized signaling vs fully decentralized
3. **Fallback**: System works even without signaling
4. **Production**: Demonstrate how to deploy for real use

## Quick Start for Full P2P

```bash
# Terminal 1: Run signaling server
npx y-webrtc-signaling-server --port 4444

# Terminal 2: Run your app
npm run dev
```

Then update the signaling config in `useP2P.js` to `['ws://localhost:4444']`.
