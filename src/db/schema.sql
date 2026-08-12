-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- =====================================================
-- PROFILES TABLE
-- =====================================================
-- Stores user profile data connected to Supabase Auth
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  avatar_url TEXT,
  role VARCHAR(50) DEFAULT 'student', -- 'student', 'teacher', 'admin'
  bio TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- ROOMS TABLE
-- =====================================================
-- Represents classroom sessions/rooms
CREATE TABLE IF NOT EXISTS rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  max_participants INT DEFAULT NULL,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- ROOM_PARTICIPANTS TABLE
-- =====================================================
-- Tracks who is/was in each room
CREATE TABLE IF NOT EXISTS room_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'student', -- 'student', 'teacher', 'observer'
  joined_at TIMESTAMP DEFAULT NOW(),
  left_at TIMESTAMP DEFAULT NULL,
  UNIQUE(room_id, user_id)
);

-- =====================================================
-- PRESENCE TABLE
-- =====================================================
-- Real-time presence tracking (camera/mic/screen status)
CREATE TABLE IF NOT EXISTS presence (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  camera_enabled BOOLEAN DEFAULT false,
  microphone_enabled BOOLEAN DEFAULT false,
  screen_shared BOOLEAN DEFAULT false,
  last_update TIMESTAMP DEFAULT NOW(),
  UNIQUE(room_id, user_id)
);

-- =====================================================
-- CHAT_MESSAGES TABLE
-- =====================================================
-- Stores chat messages within rooms
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- WHITEBOARD_STATES TABLE
-- =====================================================
-- Stores collaborative whiteboard state
CREATE TABLE IF NOT EXISTS whiteboard_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID UNIQUE NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}',
  updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- ATTENDANCE_LOGS TABLE
-- =====================================================
-- Tracks attendance events (participant joined/left)
CREATE TABLE IF NOT EXISTS attendance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type VARCHAR(50) DEFAULT 'joined', -- 'joined' or 'left'
  timestamp TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_rooms_created_by ON rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_rooms_is_active ON rooms(is_active);
CREATE INDEX IF NOT EXISTS idx_room_participants_room_id ON room_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_room_participants_user_id ON room_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_presence_room_id ON presence(room_id);
CREATE INDEX IF NOT EXISTS idx_presence_user_id ON presence(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_room_id ON attendance_logs(room_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_user_id ON attendance_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_timestamp ON attendance_logs(timestamp);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE whiteboard_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES POLICIES
-- =====================================================
-- Users can read their own profile and all teacher profiles
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can read teacher profiles" ON profiles
  FOR SELECT
  USING (role = 'teacher');

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- =====================================================
-- ROOMS POLICIES
-- =====================================================
-- Users in a room can read the room
CREATE POLICY "Users can read rooms they're in" ON rooms
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_participants
      WHERE room_participants.room_id = id
      AND room_participants.user_id = auth.uid()
    )
  );

-- Teachers and admins can create rooms
CREATE POLICY "Teachers and admins can create rooms" ON rooms
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('teacher', 'admin')
    )
  );

-- =====================================================
-- ROOM_PARTICIPANTS POLICIES
-- =====================================================
-- Users can read participants of rooms they're in
CREATE POLICY "Users can read room participants" ON room_participants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_participants AS rp
      WHERE rp.room_id = room_id
      AND rp.user_id = auth.uid()
    )
  );

-- Users can join rooms (insert themselves)
CREATE POLICY "Users can join rooms" ON room_participants
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- PRESENCE POLICIES
-- =====================================================
-- Users can read presence in rooms they're in
CREATE POLICY "Users can read presence" ON presence
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_participants
      WHERE room_participants.room_id = room_id
      AND room_participants.user_id = auth.uid()
    )
  );

-- Users can update their own presence
CREATE POLICY "Users can update own presence" ON presence
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their presence" ON presence
  FOR UPDATE
  USING (user_id = auth.uid());

-- =====================================================
-- CHAT_MESSAGES POLICIES
-- =====================================================
-- Users can read messages from rooms they're in
CREATE POLICY "Users can read room messages" ON chat_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_participants
      WHERE room_participants.room_id = room_id
      AND room_participants.user_id = auth.uid()
    )
  );

-- Users can insert messages
CREATE POLICY "Users can insert messages" ON chat_messages
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- =====================================================
-- WHITEBOARD_STATES POLICIES
-- =====================================================
-- Users can read whiteboard from rooms they're in
CREATE POLICY "Users can read whiteboard" ON whiteboard_states
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_participants
      WHERE room_participants.room_id = room_id
      AND room_participants.user_id = auth.uid()
    )
  );

-- Users can update whiteboard
CREATE POLICY "Users can update whiteboard" ON whiteboard_states
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM room_participants
      WHERE room_participants.room_id = room_id
      AND room_participants.user_id = auth.uid()
    )
  );

-- =====================================================
-- ATTENDANCE_LOGS POLICIES
-- =====================================================
-- Users can read attendance logs from rooms they're in
CREATE POLICY "Users can read attendance logs" ON attendance_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM room_participants
      WHERE room_participants.room_id = room_id
      AND room_participants.user_id = auth.uid()
    )
  );

-- Users can insert attendance logs (their own)
CREATE POLICY "Users can insert attendance logs" ON attendance_logs
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM room_participants
      WHERE room_participants.room_id = room_id
      AND room_participants.user_id = auth.uid()
    )
  );

-- =====================================================
-- TRIGGERS
-- =====================================================
-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'display_name', new.email),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'student')
  );
  RETURN new;
END;
$$;

-- Trigger for new user
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update updated_at on profile change
CREATE OR REPLACE FUNCTION public.update_profiles_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_profiles_updated_at();
