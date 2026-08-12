# LearnHome Classroom Platform

A secure, real-time virtual classroom platform with live video, interactive whiteboard, instant chat, and attendance tracking.

## Architecture Overview

### 🎥 Media Layer (LiveKit)

- **LiveKit** handles video/audio/screen sharing
- Low-latency WebRTC Selective Forwarding Unit (SFU)
- Automatic bandwidth adaptation and quality selection
- Built-in recording and transcoding

### 🔐 Authentication & Authorization (Supabase Auth)

- Supabase Auth with JWT tokens
- Secure password management
- Session persistence
- Multi-factor authentication ready

### 💾 Database & Real-time (Supabase PostgreSQL)

- User profiles and classroom data
- Permanent message history (chat)
- Collaborative whiteboard state
- Attendance logs with timestamps
- Row Level Security (RLS) for data isolation
- Realtime subscriptions for live updates

### 🔄 Real-time Communication (Supabase Realtime)

- Live chat messaging (broadcast + persistent)
- Collaborative whiteboard syncing
- Participant presence tracking (camera/mic/screen)
- Attendance event logging
- No separate Socket.IO needed

### ⚙️ Backend API (Express.js)

- Secure LiveKit token generation
- Supabase Auth verification
- Room membership validation
- Identity verification
- CORS and security headers

## Key Files

| File                               | Purpose                                                                             |
| ---------------------------------- | ----------------------------------------------------------------------------------- |
| `src/App.tsx`                      | Main React application, classroom UI logic                                          |
| `src/livekitClient.js`             | LiveKit connection with Supabase auth                                               |
| `src/services/realtimeService.js`  | **NEW**: Unified Supabase Realtime service (chat, whiteboard, presence, attendance) |
| `src/services/classroomService.js` | Classroom operations (create, join, leave)                                          |
| `src/services/authService.js`      | Authentication operations                                                           |
| `src/context/AuthContext.jsx`      | React context for auth state                                                        |
| `src/context/ClassroomContext.jsx` | React context for classroom state                                                   |
| `src/db/schema.sql`                | PostgreSQL schema with RLS policies                                                 |
| `server/server.js`                 | Express backend with auth middleware                                                |
| `src/lib/supabase.js`              | Supabase client initialization                                                      |

## Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Complete system design and data flow
- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Step-by-step setup instructions
- **[SECURITY.md](./SECURITY.md)** - Security configuration and best practices
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Socket.IO to Supabase Realtime migration
- **[INTEGRATION_COMPLETE.md](./INTEGRATION_COMPLETE.md)** - Integration status and next steps

## Features

✅ **Live Video & Audio** - Multi-party video conferencing with LiveKit
✅ **Screen Sharing** - Teacher-controlled screen sharing
✅ **Real-time Chat** - Persistent message history with Supabase
✅ **Collaborative Whiteboard** - Synchronized drawing canvas
✅ **Attendance Tracking** - Automatic attendance logging
✅ **Presence Awareness** - See who has camera/mic/screen enabled
✅ **Secure Authentication** - Supabase Auth with JWT tokens
✅ **Role-Based Access** - Teachers vs Students with different permissions
✅ **Data Privacy** - Row Level Security ensures data isolation
✅ **Offline Support** - Chat history loads from persistent storage

## Security Features

🔒 **Supabase Auth** - Industry-standard JWT authentication
🔒 **Row Level Security** - Database enforces access control
🔒 **Server-side Token Generation** - LiveKit secrets never exposed
🔒 **Identity Verification** - Users can only join as themselves
🔒 **Membership Validation** - Only room members can access data
🔒 **Environment Isolation** - Secrets kept in secure backend .env
🔒 **HTTPS/WSS** - All connections encrypted in transit
🔒 **Token Expiration** - 2-hour token lifetime with refresh

## Getting Started

### Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
cp server/.env.example server/.env
# Fill in your Supabase and LiveKit credentials

# 3. Deploy database schema
# Copy src/db/schema.sql and run in Supabase SQL Editor

# 4. Start development
npm run dev
```

### Full Setup Instructions

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed instructions.

## Deployment

- **Frontend**: Vercel, Netlify, or any static host
- **Backend**: Railway, Render, Heroku, or any Node.js host
- **Database**: Supabase (PostgreSQL with built-in security)
- **Media**: LiveKit Cloud or self-hosted

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) deployment section for details.

## Removed Components

The following have been consolidated to reduce complexity:

- ❌ Socket.IO → ✅ Supabase Realtime (more reliable, integrated auth)
- ❌ Mock data helpers → ✅ Supabase database (persistent)
- ❌ Custom auth → ✅ Supabase Auth (enterprise-grade)

## Project Status

**✅ Integration Complete** (2026-08-12)

- Supabase Auth fully integrated
- LiveKit secured with Supabase tokens
- Real-time communication via Supabase Realtime
- Database schema with RLS policies
- Backend API with auth middleware
- Comprehensive security documentation

**🔄 Next Steps**: Component refactoring to use realtimeService

See [INTEGRATION_COMPLETE.md](./INTEGRATION_COMPLETE.md) for detailed status.

## Technology Stack

| Layer              | Technology                               |
| ------------------ | ---------------------------------------- |
| **Frontend**       | React 18, TypeScript, Vite, Tailwind CSS |
| **Authentication** | Supabase Auth (JWT)                      |
| **Database**       | PostgreSQL (Supabase)                    |
| **Real-time**      | Supabase Realtime (broadcast + presence) |
| **Media**          | LiveKit (WebRTC SFU)                     |
| **Backend**        | Express.js (Node.js)                     |
| **Deployment**     | Vercel (frontend), Railway (backend)     |

## Support

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Installation guide
- [SECURITY.md](./SECURITY.md) - Security checklist
- [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) - Component migration
- [Supabase Docs](https://supabase.com/docs)
- [LiveKit Docs](https://docs.livekit.io)
