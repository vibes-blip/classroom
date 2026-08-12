# Setup Guide - LearnHome Classroom

This guide walks you through setting up the LearnHome Classroom platform with Supabase and LiveKit.

## Prerequisites

- Node.js 18+ and npm
- A Supabase account (free tier works)
- A LiveKit server (cloud or self-hosted)
- Git

## Step 1: Clone & Install

```bash
# Clone the repository
git clone <your-repo-url>
cd Classroom

# Install dependencies
npm install
```

## Step 2: Setup Supabase

### 2.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign in or create account
3. Click "New Project"
4. Fill in project details
5. Create project (takes ~2 minutes)

### 2.2 Deploy Database Schema

1. Go to SQL Editor in Supabase dashboard
2. Click "New query"
3. Copy entire contents of `src/db/schema.sql`
4. Paste into SQL editor
5. Click "Run"

**Expected output**: Tables created successfully

### 2.3 Get Your Credentials

1. Go to Settings → API
2. Copy your **Project URL** → `SUPABASE_URL`
3. Copy **anon** key → `VITE_SUPABASE_PUBLISHABLE_KEY` (frontend)
4. Copy **Service Role** key → `SUPABASE_SERVICE_KEY` (backend only!)

⚠️ **Important**:

- Never use Service Role key in frontend
- Never commit `.env` files to git

## Step 3: Setup LiveKit

### Option A: Use LiveKit Cloud (Recommended)

1. Go to [livekit.io](https://livekit.io)
2. Sign up for free
3. Create a project
4. Get API Key and Secret from settings
5. Note the WebSocket URL

### Option B: Self-Host LiveKit

```bash
# Using Docker (must have Docker installed)
docker run --rm -p 7880:7880 -p 7881:7881 -p 7882:7882/udp \
  -e LIVEKIT_API_KEY=devkey \
  -e LIVEKIT_API_SECRET=secret \
  -e LIVEKIT_ROOM_ENCRYPTION=false \
  livekit/livekit-server --dev
```

Then use:

- URL: `ws://localhost:7880`
- API Key: `devkey`
- API Secret: `secret`

## Step 4: Configure Environment

### Frontend Configuration

Create `.env` file in root:

```bash
cp .env.example .env
```

Edit `.env`:

```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_LIVEKIT_URL=wss://your-livekit-url.com
VITE_API_URL=http://localhost:4000
```

### Backend Configuration

Create `server/.env` file:

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:

```
PORT=4000
FRONTEND_URL=http://localhost:5173

SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

LIVEKIT_URL=wss://your-livekit-url.com
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
```

## Step 5: Run Development Server

```bash
# Starts both frontend (Vite) and backend (Express) concurrently
npm run dev
```

Expected output:

```
VITE v5.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Press h to show help

🚀 LearnHome LiveKit server running on port 4000
🌐 Frontend: http://localhost:5173
🎥 LiveKit: wss://your-livekit-url.com
```

## Step 6: Test the Setup

### 6.1 Test Frontend

1. Open http://localhost:5173
2. Should see your app loading

### 6.2 Test Backend

1. Open http://localhost:4000
2. Should see: `{"success":true,"service":"LearnHome LiveKit Server","status":"online"}`

### 6.3 Test Authentication

1. Sign up a new account in app
2. Check Supabase dashboard → Authentication
3. Should see new user in Auth Users table

### 6.4 Test LiveKit Token Request

1. Authenticated user tries to join room
2. Check backend logs for:
   - ✅ Auth verification successful
   - ✅ LiveKit token issued

## Deployment

### Frontend Deployment (Vercel)

```bash
# 1. Build production bundle
npm run build

# 2. Deploy to Vercel
npm install -g vercel
vercel
```

Update `.env.production`:

```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-key
VITE_LIVEKIT_URL=wss://your-livekit-url.com
VITE_API_URL=https://your-backend-api.com
```

### Backend Deployment (Railway/Render)

#### Railway.app

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
railway init
railway up
```

#### Render.com

1. Push code to GitHub
2. Create new Web Service on Render
3. Set environment variables
4. Deploy

### Database Backup

```bash
# Supabase handles backups automatically
# But you can manually backup:

# 1. Go to Supabase Dashboard
# 2. Settings → Backups
# 3. Create manual backup
```

## Troubleshooting

### "VITE_SUPABASE_URL is not configured"

- Make sure `.env` file exists in root directory
- Check spelling of environment variable names
- Restart dev server after changing `.env`

### "User is not authenticated"

- User hasn't signed in yet
- Supabase session expired (user needs to re-login)
- Check browser's Application → Cookies for `sb-*` tokens

### "User is not a member of this room"

- User hasn't joined room yet
- Call `createOrJoinRoom()` before requesting LiveKit token
- Check `room_participants` table in Supabase

### "LiveKit token request failed"

- Check backend logs for error details
- Ensure backend has all required environment variables
- Verify LiveKit URL is correct and accessible

### "Cannot connect to LiveKit server"

- Check if LiveKit server is running
- Verify WebSocket URL is correct
- Check firewall/network settings

### "cors error"

- Update `FRONTEND_URL` in `server/.env`
- Restart backend server

## Development Tips

### Hot Reload

- Frontend: Hot reload on `.jsx` changes ✅ (Vite)
- Backend: Restart required on `.js` changes (use nodemon if desired)

### Debug Logs

- Frontend: Open browser DevTools (F12)
- Backend: Check terminal output

### Database Queries

- Use Supabase dashboard SQL editor
- Test queries before implementing

### LiveKit Monitoring

- LiveKit provides built-in dashboard
- Monitor participants, bandwidth, quality

## Next Steps

1. **Customize UI**: Modify components in `src/`
2. **Add Features**: Implement whiteboard, screen sharing
3. **Setup CI/CD**: GitHub Actions for auto-deploy
4. **Setup Monitoring**: Sentry for error tracking
5. **Add Testing**: Unit and integration tests

## Support

- Supabase Docs: https://supabase.com/docs
- LiveKit Docs: https://docs.livekit.io
- React Docs: https://react.dev
- Express Docs: https://expressjs.com

## Security Checklist

Before going to production:

- [ ] Change all default API keys and secrets
- [ ] Enable 2FA on Supabase account
- [ ] Enable 2FA on LiveKit account
- [ ] Review and update CORS origins
- [ ] Enable HTTPS/WSS only
- [ ] Setup database backups
- [ ] Enable audit logging
- [ ] Setup rate limiting on API
- [ ] Enable DDoS protection
- [ ] Setup monitoring and alerting

## Architecture Diagram

For detailed architecture information, see [ARCHITECTURE.md](./ARCHITECTURE.md)

---

Congratulations! Your LearnHome Classroom is now ready. Start building awesome virtual classrooms! 🚀
