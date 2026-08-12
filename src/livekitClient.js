import { supabase } from './lib/supabase';

const API_BASE =
  import.meta.env.VITE_API_URL || 'http://localhost:4000';

const LIVEKIT_URL =
  import.meta.env.VITE_LIVEKIT_URL;

/**
 * Get a LiveKit access token from the secure backend.
 *
 * IMPORTANT:
 * 1. The LiveKit API secret is NEVER placed in the React app.
 * 2. The backend verifies the Supabase Auth token before issuing a LiveKit token.
 * 3. Only authenticated users can request tokens.
 */
export async function getLiveKitToken({
  roomName,
  identity,
  name,
  role = 'student'
}) {
  if (!roomName) {
    throw new Error('LiveKit room name is required');
  }

  if (!identity) {
    throw new Error('LiveKit identity is required');
  }

  if (!API_BASE) {
    throw new Error('VITE_API_URL is not configured');
  }

  // Get the current user's session
  const {
    data: { session },
    error: sessionError
  } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error('User is not authenticated');
  }

  // Use the auth token to request LiveKit token
  const response = await fetch(
    `${API_BASE}/api/livekit/token`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        roomName,
        identity,
        name,
        role
      })
    }
  );

  let data = {};

  try {
    data = await response.json();
  } catch {
    throw new Error(
      `LiveKit server returned invalid JSON (${response.status})`
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
      `LiveKit token request failed (${response.status})`
    );
  }

  if (!data.token) {
    throw new Error(
      'LiveKit server did not return a token'
    );
  }

  return {
    token: data.token,
    url: data.url || LIVEKIT_URL,
    roomName: data.roomName || roomName,
    identity: data.identity || identity,
    role: data.role || role
  };
}