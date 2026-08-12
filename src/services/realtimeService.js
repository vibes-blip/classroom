/**
 * Unified Realtime Service
 * Combines LiveKit (media) + Supabase Realtime (chat, whiteboard, presence, attendance)
 * Replaces Socket.IO logic with Supabase Realtime channels
 */

import { supabase } from '../lib/supabase';

class RealtimeService {
  constructor() {
    this.subscriptions = new Map();
    this.roomChannels = new Map();
  }

  /**
   * Subscribe to room updates (chat, whiteboard, participants, presence)
   * Replaces all Socket.IO event listeners
   */
  subscribeToRoom(roomId, callbacks) {
    if (this.roomChannels.has(roomId)) {
      return this.roomChannels.get(roomId);
    }

    const channel = supabase.channel(`room:${roomId}`, {
      config: {
        broadcast: { self: true }
      }
    });

    // ============================================
    // Chat Messages (broadcast realtime)
    // ============================================
    channel.on('broadcast', { event: 'chat-message' }, (payload) => {
      if (callbacks.onChatMessage) {
        callbacks.onChatMessage({
          id: payload.payload.id,
          message: payload.payload.message,
          user_id: payload.payload.user_id,
          user_name: payload.payload.user_name,
          created_at: payload.payload.created_at
        });
      }
    });

    // ============================================
    // Participant Updates (presence)
    // ============================================
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState();
      if (callbacks.onParticipantsSync) {
        callbacks.onParticipantsSync(state);
      }
    });

    channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      if (callbacks.onParticipantJoined) {
        newPresences.forEach((presence) => {
          callbacks.onParticipantJoined({
            id: presence.user_id,
            name: presence.display_name,
            camera: presence.camera_enabled,
            microphone: presence.microphone_enabled,
            screen: presence.screen_shared
          });
        });
      }
    });

    channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      if (callbacks.onParticipantLeft) {
        leftPresences.forEach((presence) => {
          callbacks.onParticipantLeft({
            id: presence.user_id,
            name: presence.display_name
          });
        });
      }
    });

    // ============================================
    // Whiteboard Actions (broadcast)
    // ============================================
    channel.on('broadcast', { event: 'whiteboard-action' }, (payload) => {
      if (callbacks.onWhiteboardAction) {
        callbacks.onWhiteboardAction(payload.payload);
      }
    });

    channel.on('broadcast', { event: 'whiteboard-clear' }, (payload) => {
      if (callbacks.onWhiteboardClear) {
        callbacks.onWhiteboardClear();
      }
    });

    // ============================================
    // Presence Updates (camera/mic/screen status)
    // ============================================
    channel.on('broadcast', { event: 'presence-update' }, (payload) => {
      if (callbacks.onPresenceUpdate) {
        callbacks.onPresenceUpdate({
          user_id: payload.payload.user_id,
          camera_enabled: payload.payload.camera_enabled,
          microphone_enabled: payload.payload.microphone_enabled,
          screen_shared: payload.payload.screen_shared
        });
      }
    });

    // ============================================
    // Attendance (participant joined/left)
    // ============================================
    channel.on('broadcast', { event: 'attendance-event' }, (payload) => {
      if (callbacks.onAttendanceEvent) {
        callbacks.onAttendanceEvent({
          type: payload.payload.type, // 'joined' or 'left'
          user_id: payload.payload.user_id,
          user_name: payload.payload.user_name,
          timestamp: payload.payload.timestamp
        });
      }
    });

    // Subscribe to the channel
    channel.subscribe((status) => {
      console.log(`[Realtime] Channel ${roomId} status:`, status);
      if (status === 'SUBSCRIBED') {
        if (callbacks.onReady) {
          callbacks.onReady();
        }
      }
    });

    this.roomChannels.set(roomId, channel);
    return channel;
  }

  /**
   * Send chat message
   */
  async sendChatMessage(roomId, userId, userName, message) {
    try {
      // Save to database
      const { error } = await supabase.from('chat_messages').insert([
        {
          room_id: roomId,
          user_id: userId,
          message,
          created_at: new Date()
        }
      ]);

      if (error) throw error;

      // Broadcast via realtime
      const channel = this.roomChannels.get(roomId);
      if (channel) {
        channel.send({
          type: 'broadcast',
          event: 'chat-message',
          payload: {
            id: `msg-${Date.now()}`,
            message,
            user_id: userId,
            user_name: userName,
            created_at: new Date().toISOString()
          }
        });
      }

      return { success: true };
    } catch (err) {
      console.error('Error sending chat message:', err);
      throw err;
    }
  }

  /**
   * Broadcast whiteboard action
   */
  async broadcastWhiteboardAction(roomId, action) {
    try {
      const channel = this.roomChannels.get(roomId);
      if (channel) {
        channel.send({
          type: 'broadcast',
          event: 'whiteboard-action',
          payload: action
        });
      }

      // Save to database for persistence
      const { data } = await supabase
        .from('whiteboard_states')
        .select('*')
        .eq('room_id', roomId)
        .single();

      if (data) {
        await supabase
          .from('whiteboard_states')
          .update({
            data: { ...data.data, lastAction: action },
            updated_at: new Date()
          })
          .eq('room_id', roomId);
      }

      return { success: true };
    } catch (err) {
      console.error('Error broadcasting whiteboard action:', err);
      throw err;
    }
  }

  /**
   * Clear whiteboard
   */
  async clearWhiteboard(roomId) {
    try {
      const channel = this.roomChannels.get(roomId);
      if (channel) {
        channel.send({
          type: 'broadcast',
          event: 'whiteboard-clear'
        });
      }

      await supabase
        .from('whiteboard_states')
        .update({
          data: {},
          updated_at: new Date()
        })
        .eq('room_id', roomId);

      return { success: true };
    } catch (err) {
      console.error('Error clearing whiteboard:', err);
      throw err;
    }
  }

  /**
   * Update user presence (camera/mic/screen status)
   */
  async updatePresence(roomId, userId, displayName, presenceData) {
    try {
      const channel = this.roomChannels.get(roomId);

      if (channel) {
        // Broadcast presence update
        channel.send({
          type: 'broadcast',
          event: 'presence-update',
          payload: {
            user_id: userId,
            camera_enabled: presenceData.camera_enabled,
            microphone_enabled: presenceData.microphone_enabled,
            screen_shared: presenceData.screen_shared
          }
        });

        // Update presence state
        channel.track({
          user_id: userId,
          display_name: displayName,
          camera_enabled: presenceData.camera_enabled,
          microphone_enabled: presenceData.microphone_enabled,
          screen_shared: presenceData.screen_shared,
          timestamp: new Date().toISOString()
        });
      }

      // Save to database
      await supabase.from('presence').upsert(
        [
          {
            room_id: roomId,
            user_id: userId,
            camera_enabled: presenceData.camera_enabled,
            microphone_enabled: presenceData.microphone_enabled,
            screen_shared: presenceData.screen_shared,
            last_update: new Date()
          }
        ],
        { onConflict: 'room_id,user_id' }
      );

      return { success: true };
    } catch (err) {
      console.error('Error updating presence:', err);
      throw err;
    }
  }

  /**
   * Log attendance event
   */
  async logAttendanceEvent(roomId, userId, userName, eventType) {
    try {
      const channel = this.roomChannels.get(roomId);

      if (channel) {
        channel.send({
          type: 'broadcast',
          event: 'attendance-event',
          payload: {
            type: eventType, // 'joined' or 'left'
            user_id: userId,
            user_name: userName,
            timestamp: new Date().toISOString()
          }
        });
      }

      // Log to database
      await supabase.from('attendance_logs').insert([
        {
          room_id: roomId,
          user_id: userId,
          event_type: eventType,
          timestamp: new Date()
        }
      ]);

      return { success: true };
    } catch (err) {
      console.error('Error logging attendance:', err);
      throw err;
    }
  }

  /**
   * Load chat history
   */
  async loadChatHistory(roomId, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*, profiles(display_name)')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data.reverse();
    } catch (err) {
      console.error('Error loading chat history:', err);
      throw err;
    }
  }

  /**
   * Load whiteboard state
   */
  async loadWhiteboardState(roomId) {
    try {
      const { data, error } = await supabase
        .from('whiteboard_states')
        .select('*')
        .eq('room_id', roomId)
        .single();

      if (error && error.code === 'PGRST116') {
        return null;
      }

      if (error) throw error;

      return data;
    } catch (err) {
      console.error('Error loading whiteboard state:', err);
      throw err;
    }
  }

  /**
   * Get room participants with current presence
   */
  async getRoomParticipants(roomId) {
    try {
      const { data, error } = await supabase
        .from('presence')
        .select('*, profiles(display_name, email)')
        .eq('room_id', roomId);

      if (error) throw error;

      return data;
    } catch (err) {
      console.error('Error fetching participants:', err);
      throw err;
    }
  }

  /**
   * Get attendance report
   */
  async getAttendanceReport(roomId) {
    try {
      const { data, error } = await supabase
        .from('attendance_logs')
        .select('*')
        .eq('room_id', roomId)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      return data;
    } catch (err) {
      console.error('Error fetching attendance report:', err);
      throw err;
    }
  }

  /**
   * Unsubscribe from room
   */
  async unsubscribeFromRoom(roomId) {
    try {
      const channel = this.roomChannels.get(roomId);
      if (channel) {
        await supabase.removeChannel(channel);
        this.roomChannels.delete(roomId);
      }
      return { success: true };
    } catch (err) {
      console.error('Error unsubscribing from room:', err);
      throw err;
    }
  }

  /**
   * Clean up all subscriptions
   */
  async cleanup() {
    try {
      for (const [roomId, channel] of this.roomChannels.entries()) {
        await supabase.removeChannel(channel);
      }
      this.roomChannels.clear();
      this.subscriptions.clear();
      return { success: true };
    } catch (err) {
      console.error('Error cleaning up subscriptions:', err);
      throw err;
    }
  }
}

export const realtimeService = new RealtimeService();
