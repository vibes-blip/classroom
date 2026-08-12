# Classroom Architecture Documentation

## System Overview

This document describes the well-connected architecture of the LearnHome Classroom platform, integrating **Supabase** and **LiveKit** for a secure, scalable classroom experience.

```
                          ┌────────────────────────┐
                          │     React Frontend      │
                          │   (Vite + TypeScript)   │
                          └────────────┬────────────┘
                                       │
                    ┌──────────────────┴──────────────────┐
                    │                                     │
         ┌──────────▼────────────┐          ┌────────────▼─────────┐
         │  Supabase Client SDK  │          │   LiveKit Browser SDK │
         │  - Auth Management    │          │   - Room Connection   │
         │  - Real-time Updates  │          │   - Media Streams     │
         │  - Database Queries   │          │   - Participants      │
         └──────────────┬────────┘          └────────────┬──────────┘
                        │                                │
         ┌──────────────▼──────────────────────────────┬─┘
         │                                             │
┌────────▼────────────────────────────────────────────▼───────┐
│          Express.js Backend Server (Node.js)                │
│                     Port 4000                               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  🔐 Auth Middleware                                          │
│  ├─ Verifies Supabase Auth Token                            │
│  ├─ Validates User Identity                                 │
│  └─ Attaches User/Profile to Request                        │
│                                                              │
│  📍 Endpoints:                                               │
│  ├─ POST /api/livekit/token (REQUIRES AUTH)                │
│  │  ├─ Verifies user is authenticated                       │
│  │  ├─ Checks room access permissions                       │
│  │  └─ Issues LiveKit JWT token                             │
│  ├─ GET /health                                             │
│  └─ GET / (status)                                          │
│                                                              │
└──────────────┬─────────────────────────────────┬────────────┘
               │                                 │
      ┌────────▼───────────┐          ┌─────────▼──────────┐
      │  Supabase Backend   │          │   LiveKit Server   │
      │  (PostgreSQL)       │          │   Media Server     │
      ├────────────────────┤          ├────────────────────┤
      │ Tables:            │          │ Manages:           │
      │ - profiles         │          │ - Rooms            │
      │ - rooms            │          │ - Participants     │
      │ - room_participants│          │ - Media Streams    │
      │ - presence         │          │ - Recording        │
      │ - chat_messages    │          │ - Transcoding      │
      │ - whiteboard_states│          │                    │
      │                    │          │                    │
      │ Features:          │          │ Features:          │
      │ - Auth (JWT)       │          │ - Real-time Media  │
      │ - RLS (Security)   │          │ - Low-latency      │
      │ - Realtime         │          │ - Scalable         │
      │ - Triggers         │          │ - WebRTC           │
      │                    │          │                    │
      └────────────────────┘          └────────────────────┘
```

---

## Architecture Layers

### 1. **Frontend (React + Vite)**

#### Authentication Context (`src/context/AuthContext.jsx`)

- Manages Supabase Auth state
- Provides `useAuth()` hook for components
- Handles sign up, sign in, sign out
- Syncs user profile on auth changes

#### Classroom Context (`src/context/ClassroomContext.jsx`)

- Manages room state and participants
- Provides `useClassroom()` hook
- Handles room creation/joining
- Manages participant tracking
- Stores presence information

#### Services

- **`src/services/authService.js`**: Auth operations (profile updates, role changes)
- **`src/services/classroomService.js`**: Room operations (create, join, chat, whiteboard)
- **`src/livekitClient.js`**: LiveKit token management with **Supabase Auth verification**

### 2. **Backend (Express.js)**

#### Authentication Middleware (`verifyAuth`)

- Extracts Bearer token from Authorization header
- Verifies token with Supabase Auth
- Fetches user profile from database
- Attaches user/profile to request
- Returns 401 if authentication fails

#### Protected Endpoints

- **`POST /api/livekit/token`**: Issues LiveKit tokens only to authenticated users
  - Verifies user identity matches request
  - Checks room access permissions
  - Returns LiveKit JWT with proper permissions

### 3. **Database (Supabase PostgreSQL)**

#### Core Tables

**`profiles`** (User profiles)

- `id` (UUID, FK to auth.users)
- `display_name`, `email`, `avatar_url`
- `role` ('student', 'teacher', 'admin')
- `created_at`, `updated_at`

**`rooms`** (Classroom sessions)

- `id` (UUID)
- `name` (unique, for LiveKit room name)
- `created_by` (FK to profiles)
- `is_active`, `max_participants`
- `settings` (JSONB)

**`room_participants`** (Room membership)

- `id` (UUID)
- `room_id`, `user_id` (FKs)
- `role` ('student', 'teacher')
- `joined_at`

**`presence`** (Real-time presence tracking)

- `room_id`, `user_id` (FKs)
- `camera_enabled`, `microphone_enabled`, `screen_shared`
- `last_update`

**`chat_messages`** (Message storage)

- `id` (UUID)
- `room_id`, `user_id` (FKs)
- `message`, `created_at`

**`whiteboard_states`** (Collaborative drawing)

- `room_id` (FK, unique)
- `data` (JSONB - drawing data)
- `updated_at`

#### Security (Row Level Security)

- Users can only read/write their own data
- Room access is verified before data access
- Teachers can manage their rooms
- Real-time updates only to authorized users

#### Triggers

- Auto-create profile on user signup
- Auto-update `updated_at` timestamps

### 4. **LiveKit Media Server**

Handles:

- Real-time video/audio/screen streaming
- WebRTC connections
- Room management
- Participant tracking
- Recording and transcoding

---

## Security Flow

### 1. **User Authentication**

```
User → Frontend (React)
  ↓
Frontend → Supabase Auth
  ↓
Supabase Auth → JWT Token (stored in browser)
```

### 2. **LiveKit Token Request** ⭐ **SECURED WITH SUPABASE AUTH**

```
Frontend Component
  ↓
getLiveKitToken() [livekitClient.js]
  ├─ Get Supabase session
  ├─ Extract access_token
  └─ Send to backend with Auth header
    ↓
Backend POST /api/livekit/token
  ├─ Receive Authorization: Bearer <token>
  ├─ verifyAuth middleware
  │  ├─ Extract token from header
  │  ├─ Verify with Supabase.auth.getUser(token)
  │  ├─ Fetch user profile from DB
  │  └─ Attach user/profile to request
  ├─ Validate room membership
  ├─ Create LiveKit JWT (server-side only!)
  └─ Return LiveKit token to frontend
    ↓
Frontend → LiveKit Server
  ├─ Connect to room
  ├─ Broadcast media streams
  └─ Receive media from participants
```

### 3. **Key Security Features**

- ✅ **Server-side Token Generation**: LiveKit secret never exposed to frontend
- ✅ **Supabase Auth Validation**: Every request verified
- ✅ **Identity Verification**: User can only request token for themselves
- ✅ **Room Access Control**: User must be room participant
- ✅ **Role-based Permissions**: Teachers get admin rights
- ✅ **Row Level Security**: Database level access control
- ✅ **Token Expiration**: LiveKit tokens expire after 2 hours

---

## Data Flow Examples

### Example 1: Join a Room

1. **Frontend** calls `createOrJoinRoom(roomName)`
2. **Database** checks if room exists
3. **Database** adds user to `room_participants`
4. **Frontend** calls `getLiveKitToken(roomName, userId)`
5. **Backend verifyAuth** validates Supabase token
6. **Backend** verifies room membership
7. **Backend** generates LiveKit JWT
8. **Frontend** uses token to connect to LiveKit room
9. **Realtime updates** notify room of new participant

### Example 2: Send Chat Message

1. **Frontend** calls `saveChatMessage(roomId, message)`
2. **Supabase RLS** verifies user is in room
3. **Database** inserts message into `chat_messages`
4. **Realtime subscription** triggers update
5. **All clients** in room receive message via Realtime

### Example 3: Update Presence

1. **Frontend** calls `updatePresence(roomId, {cameraEnabled: true})`
2. **Supabase** updates `presence` table
3. **Realtime** notifies all room participants
4. **All clients** update UI with new presence state

---

## Environment Variables

### Frontend (`.env`)

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIs...
VITE_LIVEKIT_URL=wss://livekit.example.com
VITE_API_URL=http://localhost:4000
```

### Backend (`.env`)

```
PORT=4000
FRONTEND_URL=http://localhost:5173

SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

LIVEKIT_URL=wss://livekit.example.com
LIVEKIT_API_KEY=YOUR_API_KEY
LIVEKIT_API_SECRET=YOUR_API_SECRET
```

---

## Getting Started

### 1. **Setup Supabase**

```bash
# Create tables using schema.sql
# Copy from: src/db/schema.sql
# Paste into Supabase SQL editor
# Click "Run"
```

### 2. **Setup Environment Variables**

```bash
# Frontend - create .env
cp .env.example .env
# Fill in your Supabase credentials and LiveKit URL

# Backend - create .env
cp server/.env.example server/.env
# Fill in your Supabase and LiveKit credentials
```

### 3. **Install Dependencies**

```bash
npm install
```

### 4. **Run Development**

```bash
# Starts frontend and backend concurrently
npm run dev
```

### 5. **Build for Production**

```bash
npm run build
```

---

## Component Examples

### Using Auth Context

```jsx
import { useAuth } from "./context/AuthContext";

function LoginComponent() {
  const { signIn, isAuthenticated, user } = useAuth();

  if (isAuthenticated) {
    return <p>Welcome, {user.email}!</p>;
  }

  return <button onClick={() => signIn(email, password)}>Login</button>;
}
```

### Using Classroom Context

```jsx
import { useClassroom } from "./context/ClassroomContext";

function JoinRoomComponent() {
  const { createOrJoinRoom } = useClassroom();

  const handleJoin = async () => {
    const room = await createOrJoinRoom("math-class-101");
    // Room created, now ready to get LiveKit token
  };

  return <button onClick={handleJoin}>Join Room</button>;
}
```

### Getting LiveKit Token

```jsx
import { getLiveKitToken } from "../livekitClient";
import { useAuth } from "../context/AuthContext";

function VideoComponent() {
  const { user } = useAuth();

  const connectToRoom = async (roomName) => {
    // ✅ Now includes Supabase Auth verification!
    const { token, url } = await getLiveKitToken({
      roomName,
      identity: user.id,
      name: user.email,
    });

    // Use token to connect
    const room = await connect(url, token, {
      audio: true,
      video: true,
    });
  };

  return <button onClick={() => connectToRoom("room-1")}>Connect</button>;
}
```

---

## Deployment Checklist

- [ ] Supabase project created and configured
- [ ] Database schema deployed (SQL in src/db/schema.sql)
- [ ] Row Level Security policies enabled
- [ ] LiveKit server deployed or SaaS account created
- [ ] Environment variables set in production
- [ ] CORS origins updated for production domain
- [ ] Frontend built (`npm run build`)
- [ ] Backend deployed to hosting (Vercel, Railway, Heroku, etc.)
- [ ] Database backups configured
- [ ] Monitoring and error tracking setup

---

## Key Improvements Made

1. ✅ **Supabase Auth Integration**: Secure authentication with JWT tokens
2. ✅ **LiveKit Token Endpoint Secured**: Requires Supabase Auth verification
3. ✅ **Database Schema**: Complete tables for users, rooms, participants, chat, whiteboard, presence
4. ✅ **Row Level Security**: Database-level access control
5. ✅ **Real-time Features**: Supabase Realtime for live updates
6. ✅ **Context API**: React contexts for auth and classroom management
7. ✅ **Service Layer**: Clean, reusable service functions
8. ✅ **Error Handling**: Comprehensive error checking throughout
9. ✅ **Type Safety**: JSDoc comments for better IDE support

---

## Next Steps

1. **Deploy Supabase**: Create production project
2. **Deploy LiveKit**: Use LiveKit Cloud or self-host
3. **Deploy Backend**: Deploy Express server
4. **Deploy Frontend**: Build and deploy React app
5. **Configure DNS**: Point domains to services
6. **Setup Monitoring**: Add error tracking (Sentry)
7. **Add Tests**: Write integration tests
8. **Documentation**: Add API documentation (Swagger)

---

## Support & Troubleshooting

### Common Issues

**Problem**: "Missing or invalid authorization header"

- **Solution**: Ensure client is sending Supabase token in Authorization header

**Problem**: "User profile not found"

- **Solution**: Ensure profile table has row Level Security policies disabled for admin or enable proper RLS

**Problem**: "User is not a member of this room"

- **Solution**: User must first join room via `createOrJoinRoom()` before requesting LiveKit token

**Problem**: "Invalid or expired token"

- **Solution**: Supabase token expired, user needs to re-authenticate

---

For more information, see:

- [Supabase Docs](https://supabase.com/docs)
- [LiveKit Docs](https://docs.livekit.io)
- [Express.js Docs](https://expressjs.com)
- [React Context API](https://react.dev/reference/react/useContext)
