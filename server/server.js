import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AccessToken } from 'livekit-server-sdk';
import { createClient } from '@supabase/supabase-js';
dotenv.config();

const app = express();

const PORT = process.env.PORT || 4000;

const FRONTEND_URL =
  process.env.FRONTEND_URL || 'http://localhost:5173';

const LIVEKIT_URL = process.env.LIVEKIT_URL;
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;

// --------------------------------------------------
// Supabase setup
// --------------------------------------------------

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL) {
  console.error('❌ SUPABASE_URL is missing');
}

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_SERVICE_KEY is missing');
}

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// --------------------------------------------------
// Validate required environment variables
// --------------------------------------------------

if (!LIVEKIT_URL) {
  console.error('❌ LIVEKIT_URL is missing');
}

if (!LIVEKIT_API_KEY) {
  console.error('❌ LIVEKIT_API_KEY is missing');
}

if (!LIVEKIT_API_SECRET) {
  console.error('❌ LIVEKIT_API_SECRET is missing');
}

// --------------------------------------------------
// Middleware
// --------------------------------------------------

app.use(
  cors({
    origin: [
      FRONTEND_URL,
      'http://localhost:5173',
      'http://localhost:3000'
    ],
    credentials: true
  })
);

app.use(express.json());

// --------------------------------------------------
// Auth middleware - Verify Supabase token
// --------------------------------------------------

/**
 * Middleware to verify Supabase Auth token and attach user to request
 */
async function verifyAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Missing or invalid authorization header'
      });
    }

    const token = authHeader.substring(7);

    // Verify the token with Supabase
    const {
      data: { user },
      error
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error(
        '❌ Auth verification failed:',
        error?.message
      );

      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token'
      });
    }

    // Get user profile from database
    const { data: profile, error: profileError } =
      await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    if (profileError) {
      console.error(
        '❌ Profile fetch failed:',
        profileError.message
      );

      return res.status(401).json({
        success: false,
        error: 'User profile not found'
      });
    }

    // Attach user and profile to request
    req.user = user;
    req.profile = profile;

    next();
  } catch (err) {
    console.error('❌ Auth middleware error:', err);

    return res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
}

// --------------------------------------------------
// Health check
// --------------------------------------------------

app.get('/', (req, res) => {
  res.json({
    success: true,
    service: 'LearnHome LiveKit Server',
    status: 'online'
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok'
  });
});

// --------------------------------------------------
// LiveKit token endpoint (requires authentication)
// --------------------------------------------------

app.post('/api/livekit/token', verifyAuth, async (req, res) => {
  try {
    const {
      roomName,
      identity,
      name,
      role = 'student'
    } = req.body;

    // Get authenticated user from middleware
    const user = req.user;
    const profile = req.profile;

    // ----------------------------------------------
    // Validate request
    // ----------------------------------------------

    if (!roomName) {
      return res.status(400).json({
        success: false,
        error: 'roomName is required'
      });
    }

    if (!identity) {
      return res.status(400).json({
        success: false,
        error: 'identity is required'
      });
    }

    // Ensure the requested identity matches the authenticated user
    if (String(identity) !== String(user.id)) {
      console.warn(
        `⚠️ Identity mismatch: ${identity} vs ${user.id}`
      );

      return res.status(403).json({
        success: false,
        error: 'Cannot request token for another user'
      });
    }

    // Ensure the room exists and user has permission to join
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .select('*')
      .eq('name', roomName)
      .single();

    if (roomError && roomError.code !== 'PGRST116') {
      console.error('❌ Room lookup error:', roomError);

      return res.status(500).json({
        success: false,
        error: 'Failed to verify room access'
      });
    }

    // If room exists, verify user can access it
    if (room) {
      const { data: participant, error: participantError } =
        await supabase
          .from('room_participants')
          .select('*')
          .eq('room_id', room.id)
          .eq('user_id', user.id)
          .single();

      if (
        participantError &&
        participantError.code !== 'PGRST116'
      ) {
        console.error(
          '❌ Participant lookup error:',
          participantError
        );

        return res.status(500).json({
          success: false,
          error: 'Failed to verify room access'
        });
      }

      if (!participant) {
        return res.status(403).json({
          success: false,
          error: 'User is not a member of this room'
        });
      }
    }

    // Use profile role if not overridden
    const userRole = profile?.role || role;

    // ----------------------------------------------
    // Validate LiveKit configuration
    // ----------------------------------------------

    if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
      console.error(
        'LiveKit credentials are not configured'
      );

      return res.status(500).json({
        success: false,
        error: 'LiveKit server is not configured'
      });
    }

    // ----------------------------------------------
    // Determine permissions based on user role
    // ----------------------------------------------

    const isTeacher = userRole === 'teacher';

    const canPublish = true;
    const canSubscribe = true;

    // ----------------------------------------------
    // Create LiveKit access token
    // ----------------------------------------------

    const token = new AccessToken(
      LIVEKIT_API_KEY,
      LIVEKIT_API_SECRET,
      {
        identity: String(user.id),
        name: name ||
          profile?.display_name ||
          String(user.id),
        metadata: JSON.stringify({
          role: userRole,
          email: profile?.email || user.email
        }),
        ttl: '2h'
      }
    );

    // ----------------------------------------------
    // Room permissions
    // ----------------------------------------------

    token.addGrant({
      roomJoin: true,
      room: String(roomName),

      canPublish,
      canSubscribe,

      // Users can publish data (for chat, whiteboard)
      canPublishData: true,

      // Only teachers are room admins
      roomAdmin: isTeacher
    });

    // ----------------------------------------------
    // Generate JWT
    // ----------------------------------------------

    const jwt = await token.toJwt();

    console.log(
      `✅ LiveKit token issued for ${profile?.display_name || user.email} in room ${roomName}`
    );

    return res.json({
      success: true,
      token: jwt,
      url: LIVEKIT_URL,
      roomName,
      identity: user.id,
      role: userRole,
      userId: user.id,
      displayName: profile?.display_name || user.email
    });

  } catch (error) {
    console.error(
      '❌ LiveKit token error:',
      error
    );

    return res.status(500).json({
      success: false,
      error: 'Failed to create LiveKit token'
    });
  }
});

// --------------------------------------------------
// 404 handler
// --------------------------------------------------

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// --------------------------------------------------
// Error handler
// --------------------------------------------------

app.use((err, req, res, next) => {
  console.error(
    '❌ Server error:',
    err
  );

  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// --------------------------------------------------
// Start server
// --------------------------------------------------

app.listen(PORT, () => {
  console.log(
    `🚀 LearnHome LiveKit server running on port ${PORT}`
  );

  console.log(
    `🌐 Frontend: ${FRONTEND_URL}`
  );

  if (LIVEKIT_URL) {
    console.log(
      `🎥 LiveKit: ${LIVEKIT_URL}`
    );
  } else {
    console.log(
      '⚠️ LiveKit URL is not configured'
    );
  }
});