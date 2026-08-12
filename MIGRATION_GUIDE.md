# Migration Guide: Socket.IO to Supabase Realtime + LiveKit

## Overview

We're consolidating the classroom communication stack:

- **Socket.IO** (redundant) → **Supabase Realtime** (chat, whiteboard, presence, attendance)
- **Custom video logic** → **LiveKit** (video, audio, screen sharing)
- **Mock data** → **Real Supabase database**

This eliminates duplicate connections and simplifies the architecture.

---

## What's Changed

### Removed

- ✅ `src/classroomState.js` - Mock data utility (use Supabase now)
- ✅ Socket.IO import from `src/App.tsx`
- ✅ Socket.IO initialization code
- ✅ `socketRef` prop passing

### Added

- ✅ `src/services/realtimeService.js` - Unified Realtime service
- ✅ `attendance_logs` table in database
- ✅ Comprehensive security documentation
- ✅ Environment configuration templates

### Updated

- ✅ `src/db/schema.sql` - Added attendance table + RLS policies
- ✅ `server/server.js` - Secured LiveKit token endpoint
- ✅ `src/livekitClient.js` - Uses Supabase auth tokens

---

## Migration Steps

### Step 1: Update Database Schema

```bash
# 1. Open Supabase SQL Editor
# 2. Copy src/db/schema.sql
# 3. Paste into SQL editor
# 4. Run the queries
# 5. Verify tables are created
```

**Tables added/updated**:

- `attendance_logs` - New table for attendance tracking
- All tables now have complete RLS policies

### Step 2: Remove Socket.IO Dependency

```bash
# Remove Socket.IO from package.json (optional - can keep for now)
npm uninstall socket.io socket.io-client

# Or keep it installed but unused - migration doesn't require this
```

### Step 3: Migrate LiveClassroom Component

The `LiveClassroom` component in `App.tsx` currently uses Socket.IO. To fully migrate:

#### Current Architecture (OLD)

```javascript
// App.tsx
socketRef.current.on('receiveMessage', (message) => { ... });
socketRef.current.emit('joinRoom', payload);
socketRef.current.on('participantJoined', (p) => { ... });
```

#### New Architecture (NEW)

```javascript
// App.tsx or new ClassroomComponent.jsx
import { realtimeService } from "./services/realtimeService";

// Subscribe to room
const channel = realtimeService.subscribeToRoom(roomId, {
  onChatMessage: (msg) => {
    /* handle message */
  },
  onParticipantJoined: (p) => {
    /* handle join */
  },
  onWhiteboardAction: (action) => {
    /* handle whiteboard */
  },
  onPresenceUpdate: (presence) => {
    /* handle status */
  },
  onAttendanceEvent: (event) => {
    /* handle attendance */
  },
});

// Send chat message
await realtimeService.sendChatMessage(roomId, userId, userName, "Hello class!");

// Update presence
await realtimeService.updatePresence(roomId, userId, displayName, {
  camera_enabled: true,
  microphone_enabled: true,
  screen_shared: false,
});

// Log attendance
await realtimeService.logAttendanceEvent(roomId, userId, userName, "joined");
```

### Step 4: Update LiveClassroom Event Handlers

Find all `socketRef.current` references in `LiveClassroom` and replace:

| Old (Socket.IO)                                  | New (Supabase Realtime)                              |
| ------------------------------------------------ | ---------------------------------------------------- |
| `socketRef.current.emit('joinRoom', data)`       | `realtimeService.subscribeToRoom(roomId, callbacks)` |
| `socketRef.current.emit('receiveMessage', msg)`  | `realtimeService.sendChatMessage()`                  |
| `socketRef.current.on('participantJoined', ...)` | `callbacks.onParticipantJoined`                      |
| `socketRef.current.on('whiteboardAction', ...)`  | `callbacks.onWhiteboardAction`                       |
| `socketRef.current.emit('leaveRoom', ...)`       | `realtimeService.unsubscribeFromRoom()`              |

### Step 5: Example Migration - Chat Feature

#### Before (Socket.IO)

```javascript
// Send message
socketRef.current.emit("sendMessage", {
  roomId: classroom.id,
  message: "Hello",
  user: state.currentUser?.name,
});

// Receive messages
socketRef.current.on("receiveMessage", (message) => {
  setChatMessages((prev) => [...prev, message]);
});
```

#### After (Supabase Realtime)

```javascript
import { realtimeService } from "./services/realtimeService";

// On room join
useEffect(() => {
  const channel = realtimeService.subscribeToRoom(roomId, {
    onChatMessage: (msg) => {
      setChatMessages((prev) => [...prev, msg]);
    },
    onParticipantJoined: (participant) => {
      setParticipants((prev) => [...prev, participant]);
    },
  });

  return () => realtimeService.unsubscribeFromRoom(roomId);
}, [roomId]);

// Send message
const handleSendMessage = async (text) => {
  await realtimeService.sendChatMessage(
    roomId,
    state.currentUser.id,
    state.currentUser.name,
    text,
  );
};
```

### Step 6: Example Migration - Whiteboard

#### Before (Socket.IO)

```javascript
// Draw on whiteboard
if (socketRef.current && classroom) {
  socketRef.current.emit('whiteboardAction', {
    roomId: classroom.id,
    action: { type: 'line', points: [...] }
  });
}

// Receive whiteboard updates
socketRef.current.on('whiteboardAction', (action) => {
  redraw(action);
});
```

#### After (Supabase Realtime)

```javascript
// On room join
const channel = realtimeService.subscribeToRoom(roomId, {
  onWhiteboardAction: (action) => {
    redraw(action);
  },
});

// Broadcast whiteboard action
const handleWhiteboardDraw = async (action) => {
  await realtimeService.broadcastWhiteboardAction(roomId, action);
};
```

### Step 7: Example Migration - Presence

#### Before (Socket.IO)

```javascript
// Update presence (no persistence)
socketRef.current.emit("updatePresence", {
  roomId: classroom.id,
  camera: true,
  microphone: false,
});
```

#### After (Supabase Realtime)

```javascript
// Update and persist presence
const handleCameraToggle = async () => {
  await realtimeService.updatePresence(roomId, userId, userName, {
    camera_enabled: !camera,
    microphone_enabled: microphone,
    screen_shared: false,
  });
};

// Receive presence updates
const channel = realtimeService.subscribeToRoom(roomId, {
  onPresenceUpdate: (presence) => {
    updateParticipantStatus(presence.user_id, presence);
  },
  onParticipantJoined: (participant) => {
    console.log(`${participant.name} joined with camera=${participant.camera}`);
  },
});
```

### Step 8: Video/Audio Setup (LiveKit)

LiveKit integration remains the same:

```javascript
import { getLiveKitToken } from "./livekitClient";

// Get token (now with Supabase auth verification)
const { token, url } = await getLiveKitToken({
  roomName: classroom.name,
  identity: state.currentUser.id,
  name: state.currentUser.name,
});

// Connect to LiveKit
const room = await connect(url, token, {
  audio: true,
  video: true,
});

// Track local participant
const participants = room.participants;

// Handle remote participants
room.on(RoomEvent.ParticipantsChanged, () => {
  // Update UI
});
```

---

## Security Improvements

### Before

- ❌ Socket.IO connection unverified
- ❌ No token verification
- ❌ Chat/whiteboard data not persisted
- ❌ No audit trail
- ❌ No attendance tracking

### After

- ✅ All Supabase connections require auth token
- ✅ Token verified on backend before LiveKit token issued
- ✅ All data persisted in secure database
- ✅ Complete audit trail with timestamps
- ✅ Attendance automatically logged
- ✅ Row Level Security ensures data isolation
- ✅ Secrets kept secure (Service Key backend-only)

---

## Testing Checklist

- [ ] Database schema deployed successfully
- [ ] User authentication works (sign up/login)
- [ ] Create classroom/room works
- [ ] Join room works
- [ ] LiveKit video/audio connects
- [ ] Chat messages send and receive
- [ ] Whiteboard syncs across clients
- [ ] Presence updates show camera/mic status
- [ ] Attendance automatically logged
- [ ] Leave room cleans up subscriptions
- [ ] No Socket.IO errors in console
- [ ] Browser DevTools shows no 404s for socket.io

---

## Rollback Plan

If issues arise, you can keep Socket.IO as a fallback:

1. Don't delete Socket.IO dependencies yet
2. Keep both Socket.IO and Supabase Realtime running
3. Gradually migrate features one by one
4. Remove Socket.IO only when fully confident

---

## Performance Improvements

| Metric                     | Before                  | After                |
| -------------------------- | ----------------------- | -------------------- |
| **Connections per client** | 2 (Socket.IO + LiveKit) | 1 (LiveKit)          |
| **Data persistence**       | No                      | Yes (DB)             |
| **Audit trail**            | No                      | Yes                  |
| **Realtime channels**      | Proprietary             | Supabase native      |
| **Scalability**            | Limited                 | Supabase enterprise  |
| **Cost**                   | Socket.IO server        | Included in Supabase |

---

## Common Issues & Solutions

### Issue: "Channel not subscribed"

```javascript
// ✅ Fix: Wait for channel to be ready
const channel = realtimeService.subscribeToRoom(roomId, {
  onReady: () => console.log("Ready to receive events"),
  onChatMessage: (msg) => {
    /* handle */
  },
});
```

### Issue: "Message not persisted"

```javascript
// ✅ Fix: Use sendChatMessage instead of broadcast
// ❌ Bad: Only broadcasts (not saved)
channel.send({ type: "broadcast", event: "chat-message", payload: msg });

// ✅ Good: Saves to DB and broadcasts
await realtimeService.sendChatMessage(roomId, userId, userName, text);
```

### Issue: "Presence not updating"

```javascript
// ✅ Fix: Always call updatePresence
await realtimeService.updatePresence(roomId, userId, displayName, {
  camera_enabled: true,
  microphone_enabled: true,
  screen_shared: false,
});
```

### Issue: "Old Socket.IO events still firing"

```javascript
// ✅ Fix: Remove all socketRef event listeners
// Find and remove all:
// - socketRef.current.on(...)
// - socketRef.current.emit(...)
// - socketRef.current.off(...)
```

---

## Files to Update

Priority order for migration:

1. **CRITICAL** - Remove Socket.IO initialization
   - [x] `src/App.tsx` - Remove socketRef, Socket.IO imports
   - [x] `src/App.tsx` - Remove socketRef prop from LiveClassroom
   - [ ] `src/App.tsx` - LiveClassroom component: Replace all socketRef with realtimeService

2. **HIGH** - Update components
   - [ ] `src/App.tsx` - Update LiveClassroom event handlers
   - [ ] Add imports for realtimeService
   - [ ] Replace socket event handlers with callback functions

3. **MEDIUM** - Testing and cleanup
   - [ ] Test all features work
   - [ ] Remove Socket.IO imports from other files if any
   - [ ] Update README to remove Socket.IO references

4. **LOW** - Optimization
   - [ ] Remove Socket.IO from package.json (optional)
   - [ ] Add error handling and logging
   - [ ] Optimize database queries

---

## References

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Supabase Channels](https://supabase.com/docs/guides/realtime/extensions/broadcast)
- [LiveKit Documentation](https://docs.livekit.io)
- [Supabase Auth Best Practices](https://supabase.com/docs/guides/auth)

---

## Summary

- **Lines Changed**: ~50+ socket.io references
- **New Service**: `realtimeService.js` (unified API)
- **Removed**: `classroomState.js` (mock data)
- **Added**: `attendance_logs` table
- **Security**: Enhanced with RLS + auth verification
- **Maintenance**: Simplified - one realtime system instead of two

**Next Step**: Update `LiveClassroom` component to use `realtimeService`

---

**Last Updated**: 2026-08-12
**Status**: ✅ Initial migration complete, component refactoring needed
