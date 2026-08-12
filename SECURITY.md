# 🔐 Security Configuration & Checklist

## Environment Variables Location & Security

### Frontend (.env - **NEVER COMMIT TO GIT**)

```bash
# File: .env (Root directory)
# Contains: Public Supabase keys only (safe to expose)

VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI...
VITE_LIVEKIT_URL=wss://livekit.example.com
VITE_API_URL=http://localhost:4000  # Backend URL
VITE_DEBUG=false
```

**✅ Safe to expose in frontend**:

- `VITE_SUPABASE_URL` - Public URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase "anon" key (read-only, scoped by RLS)
- `VITE_LIVEKIT_URL` - Public WebSocket URL
- `VITE_API_URL` - Backend API URL

**❌ NEVER in frontend**:

- Supabase Service Role Key
- LiveKit API Secret
- Any database credentials
- Webhook secrets

### Backend (server/.env - **KEEP PRIVATE**)

```bash
# File: server/.env (Server directory)
# Contains: Sensitive secrets (NEVER expose)

PORT=4000
NODE_ENV=production
FRONTEND_URL=https://your-domain.com

# Supabase - Use SERVICE ROLE KEY (has full access)
# ⚠️ CRITICAL: This key has unrestricted database access
# Only use on secure backend server, NEVER in frontend
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI...

# LiveKit - API credentials (server-only)
# ⚠️ CRITICAL: Never expose these
LIVEKIT_URL=wss://livekit.example.com
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret

LOG_LEVEL=info
```

**✅ Keep in backend .env**:

- `SUPABASE_SERVICE_KEY` - Unrestricted Supabase access
- `LIVEKIT_API_KEY` & `LIVEKIT_API_SECRET` - Token generation
- Database credentials
- Webhook secrets

**❌ NEVER commit to git**:

- `server/.env`
- `.env` (if using in production)
- Any `.env.local`, `.env.*.local`

---

## Security Layers Implemented

### 1. **Authentication Layer**

- ✅ Supabase Auth handles user authentication
- ✅ JWT tokens issued by Supabase Auth
- ✅ Tokens automatically stored in browser session storage
- ✅ Backend verifies tokens before issuing LiveKit tokens

### 2. **Authorization Layer**

- ✅ **Row Level Security (RLS)**: Database enforces access control
- ✅ Users can only access their own data
- ✅ Users can only access rooms they're members of
- ✅ Teachers get admin rights in their rooms
- ✅ Attendance logs scoped by room membership

### 3. **API Security**

- ✅ LiveKit token endpoint protected with Supabase auth verification
- ✅ Backend validates user identity (can't get token for other users)
- ✅ Backend checks room membership before issuing tokens
- ✅ CORS restricted to frontend domain only
- ✅ Authorization header required (`Bearer <token>`)

### 4. **Media Server Security**

- ✅ LiveKit tokens generated server-side (secret never exposed)
- ✅ Tokens have 2-hour expiration
- ✅ Tokens include user metadata (role, email)
- ✅ Role-based permissions enforced (teachers are room admins)

### 5. **Real-time Communication Security**

- ✅ Supabase Realtime channels require authentication
- ✅ Presence tracking uses Supabase native channels
- ✅ Chat messages saved to database (audit trail)
- ✅ Whiteboard state persisted and versioned
- ✅ Attendance events logged with timestamps

### 6. **Data Protection**

- ✅ Database encrypted at rest (Supabase default)
- ✅ All connections use HTTPS/WSS (encrypted in transit)
- ✅ Sensitive data fields protected by RLS policies
- ✅ No PII stored in browser local storage

---

## File Structure Security

```
Classroom/
├── .gitignore (CRITICAL!)
│   ├── .env                 ← IGNORE FRONTEND ENV
│   ├── server/.env          ← IGNORE BACKEND ENV
│   ├── node_modules/
│   └── dist/
│
├── .env.example             ← Safe to commit (template only)
├── server/.env.example      ← Safe to commit (template only)
│
├── src/
│   ├── lib/supabase.js      ← Uses VITE_SUPABASE_*
│   ├── livekitClient.js     ← Sends auth token to backend
│   └── services/
│       ├── authService.js
│       ├── classroomService.js
│       └── realtimeService.js
│
└── server/
    └── server.js            ← Verifies auth, generates tokens
```

**✅ Safe to commit**:

- `.env.example` - Template without real values
- `server/.env.example` - Template without real values
- Source code files
- Configuration files (tsconfig, vite.config.js)

**❌ NEVER commit**:

- `.env` - Frontend environment (contains public keys)
- `server/.env` - Backend environment (CRITICAL!)
- `.env.local`, `.env.*.local`
- `node_modules/`
- `dist/`
- `.DS_Store`, `*.log`

---

## .gitignore Setup

Ensure your `.gitignore` has:

```bash
# Environment
.env
.env.local
.env.*.local
server/.env
server/.env.local

# Dependencies
node_modules/
npm-debug.log

# Build
dist/
build/
.vite/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db
```

---

## Pre-Deployment Security Checklist

### Environment Setup

- [ ] `.env` file created with VITE\_\* variables only
- [ ] `server/.env` created with SUPABASE*SERVICE_KEY and LIVEKIT*\* secrets
- [ ] `.gitignore` includes `.env` and `server/.env`
- [ ] No `.env` files committed to git history
- [ ] Run `git rm --cached .env` if accidentally committed

### Supabase Security

- [ ] Row Level Security (RLS) enabled on all tables
- [ ] All database policies are defined correctly
- [ ] Service Role Key kept private (backend-only)
- [ ] Anon Key used in frontend (safe)
- [ ] Database backups configured
- [ ] Audit logging enabled
- [ ] 2FA enabled on Supabase account

### LiveKit Security

- [ ] API Key and Secret stored only in backend
- [ ] Token generation endpoint protected with auth
- [ ] CORS properly configured
- [ ] Access tokens have 2-hour expiration
- [ ] Room admin role restricted to teachers
- [ ] Tokens include user metadata (role, email)

### Backend Security

- [ ] `verifyAuth` middleware validates all tokens
- [ ] Identity verification prevents impersonation
- [ ] Room membership verified before token issuance
- [ ] Error messages don't leak sensitive info
- [ ] Logging doesn't include secrets
- [ ] HTTPS/WSS enforced in production

### Frontend Security

- [ ] No secrets stored in localStorage
- [ ] Session tokens auto-cleanup on logout
- [ ] Auth token only sent in Authorization header
- [ ] No API secrets in frontend code
- [ ] Content Security Policy (CSP) headers configured
- [ ] Cross-site scripting (XSS) protections active

### Production Deployment

- [ ] Use environment variables, not hardcoded values
- [ ] Enable HTTPS on all endpoints
- [ ] CORS origins restricted to production domain
- [ ] Rate limiting enabled on token endpoint
- [ ] DDoS protection enabled
- [ ] Monitoring and alerting configured
- [ ] Error tracking (Sentry) configured
- [ ] Database backups automated

---

## Common Security Mistakes to Avoid

### ❌ DON'T

```javascript
// ❌ Bad: Secret in frontend code
const LIVEKIT_SECRET = "your-secret-key";

// ❌ Bad: Hardcoded API URL
fetch("https://api.example.com/livekit/token");

// ❌ Bad: Storing secrets in localStorage
localStorage.setItem('api_secret', secret);

// ❌ Bad: No auth verification
app.post('/api/livekit/token', (req, res) => {
  // ❌ Missing authentication check!
});

// ❌ Bad: Committing .env files
git add .env
git commit -m "Add config"
```

### ✅ DO

```javascript
// ✅ Good: Use environment variables
const API_URL = import.meta.env.VITE_API_URL;

// ✅ Good: Send auth token to backend
const token = await supabase.auth.getSession();
fetch(`${API_URL}/api/livekit/token`, {
  headers: {
    Authorization: `Bearer ${token.access_token}`
  }
});

// ✅ Good: Backend verifies token
async function verifyAuth(req, res, next) {
  const token = req.headers.authorization?.substring(7);
  const { user } = await supabase.auth.getUser(token);
  // Verify user before proceeding
}

// ✅ Good: .gitignore prevents commits
# .gitignore
.env
server/.env
```

---

## Monitoring & Logging

### What to Log (Production Safe)

- ✅ User authentication events (without passwords)
- ✅ Token issuance success/failure
- ✅ Room access attempts
- ✅ API endpoint latency
- ✅ Error messages (generic)

### What NOT to Log

- ❌ API keys or secrets
- ❌ User passwords
- ❌ LiveKit tokens
- ❌ Supabase service keys
- ❌ Personal user data (without consent)

### Recommended Monitoring Tools

- **Error Tracking**: Sentry
- **Performance**: Vercel Analytics, DataDog
- **Logs**: LogRocket, Papertrail
- **Uptime**: Uptime Robot, Monitly

---

## Access Control Summary

| Component          | User Type   | Access Level           | Verified By             |
| ------------------ | ----------- | ---------------------- | ----------------------- |
| **Database**       | Student     | Own data + room-scoped | RLS Policies            |
| **Database**       | Teacher     | Room data + students   | RLS Policies            |
| **LiveKit Token**  | Any         | After auth             | Backend Auth Middleware |
| **Real-time Chat** | Participant | Room chat only         | RLS + Realtime Auth     |
| **Whiteboard**     | Participant | Room whiteboard only   | RLS + Realtime Auth     |
| **Attendance**     | Any         | Room attendance only   | RLS Policies            |
| **Admin Panel**    | Admin       | All data               | Custom policies         |

---

## Incident Response

If you suspect a security breach:

1. **Rotate Keys Immediately**
   - Change Supabase Service Role Key
   - Regenerate LiveKit API Key/Secret
   - Request new Supabase Auth keys

2. **Audit Access**
   - Check Supabase audit logs
   - Review LiveKit room history
   - Check git history for committed secrets

3. **Force Re-authentication**
   - Invalidate all user sessions
   - Require password reset
   - Review user role assignments

4. **Update Documentation**
   - Document what was compromised
   - Update security procedures
   - Notify users if needed

---

## References

- [Supabase Security Best Practices](https://supabase.com/docs/guides/auth/social-auth#best-practices)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [OWASP Security Checklist](https://owasp.org/www-project-application-security-verification-standard/)
- [LiveKit Security Guide](https://docs.livekit.io/guides/securing-your-app/)

---

**Last Updated**: 2026-08-12
**Status**: ✅ All security layers implemented and verified
