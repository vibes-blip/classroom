import { supabase } from '../lib/supabase';

/**
 * Create a new classroom room
 */
export async function createRoom(roomData) {
  const { data, error } = await supabase
    .from('rooms')
    .insert([
      {
        name: roomData.name,
        description: roomData.description || '',
        created_by: roomData.createdBy,
        is_active: true,
        created_at: new Date(),
        max_participants: roomData.maxParticipants || null,
        settings: roomData.settings || {}
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get room details
 */
export async function getRoom(roomId) {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get all active rooms
 */
export async function getActiveRooms() {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Add participant to room
 */
export async function addRoomParticipant(
  roomId,
  userId,
  role = 'student'
) {
  const { data, error } = await supabase
    .from('room_participants')
    .insert([
      {
        room_id: roomId,
        user_id: userId,
        role,
        joined_at: new Date()
      }
    ])
    .select()
    .single();

  if (error && error.code !== '23505') {
    // Ignore duplicate key error
    throw error;
  }

  return data;
}

/**
 * Remove participant from room
 */
export async function removeRoomParticipant(
  roomId,
  userId
) {
  const { error } = await supabase
    .from('room_participants')
    .delete()
    .eq('room_id', roomId)
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * Get room participants with profile info
 */
export async function getRoomParticipants(roomId) {
  const { data, error } = await supabase
    .from('room_participants')
    .select(
      'id, user_id, role, joined_at, profiles(id, display_name, email)'
    )
    .eq('room_id', roomId)
    .order('joined_at', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Get room participant count
 */
export async function getRoomParticipantCount(roomId) {
  const { count, error } = await supabase
    .from('room_participants')
    .select('*', { count: 'exact', head: true })
    .eq('room_id', roomId);

  if (error) throw error;
  return count || 0;
}

/**
 * Store chat message
 */
export async function saveChatMessage(messageData) {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert([
      {
        room_id: messageData.roomId,
        user_id: messageData.userId,
        message: messageData.message,
        created_at: new Date()
      }
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get chat messages for a room
 */
export async function getRoomChatMessages(
  roomId,
  limit = 50
) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select(
      'id, message, created_at, profiles(display_name, email)'
    )
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data.reverse(); // Reverse to get chronological order
}

/**
 * Store whiteboard state
 */
export async function saveWhiteboardState(
  roomId,
  whiteboardData
) {
  const { data, error } = await supabase
    .from('whiteboard_states')
    .upsert(
      [
        {
          room_id: roomId,
          data: whiteboardData,
          updated_at: new Date()
        }
      ],
      {
        onConflict: 'room_id'
      }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get whiteboard state
 */
export async function getWhiteboardState(roomId) {
  const { data, error } = await supabase
    .from('whiteboard_states')
    .select('*')
    .eq('room_id', roomId)
    .single();

  if (error && error.code === 'PGRST116') {
    return null; // No whiteboard state yet
  }

  if (error) throw error;
  return data;
}

/**
 * Subscribe to room updates (realtime)
 */
export function subscribeToRoomUpdates(
  roomId,
  callback
) {
  const subscription = supabase
    .channel(`room:${roomId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'room_participants',
        filter: `room_id=eq.${roomId}`
      },
      (payload) => {
        callback({
          type: 'participants',
          payload
        });
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${roomId}`
      },
      (payload) => {
        callback({
          type: 'message',
          payload
        });
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'whiteboard_states',
        filter: `room_id=eq.${roomId}`
      },
      (payload) => {
        callback({
          type: 'whiteboard',
          payload
        });
      }
    )
    .subscribe();

  return subscription;
}

/**
 * Unsubscribe from room updates
 */
export async function unsubscribeFromRoom(subscription) {
  await supabase.removeChannel(subscription);
}
