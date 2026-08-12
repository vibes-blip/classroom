import { createContext, useContext, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const ClassroomContext = createContext();

export function ClassroomProvider({ children }) {
  const { user, profile } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [participants, setParticipants] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Create or join a room
  const createOrJoinRoom = useCallback(
    async (roomName, roomConfig = {}) => {
      if (!user) throw new Error('User not authenticated');

      try {
        setError(null);

        // Check if room exists, if not create it
        const { data: existingRoom, error: fetchError } = await supabase
          .from('rooms')
          .select('*')
          .eq('name', roomName)
          .single();

        let room;

        if (fetchError && fetchError.code === 'PGRST116') {
          // Room doesn't exist, create it
          const { data: newRoom, error: createError } = await supabase
            .from('rooms')
            .insert([
              {
                name: roomName,
                created_by: user.id,
                description: roomConfig.description || '',
                is_active: true,
                created_at: new Date()
              }
            ])
            .select()
            .single();

          if (createError) throw createError;
          room = newRoom;
        } else if (fetchError) {
          throw fetchError;
        } else {
          room = existingRoom;
        }

        // Add participant record
        const { error: participantError } = await supabase
          .from('room_participants')
          .insert([
            {
              room_id: room.id,
              user_id: user.id,
              joined_at: new Date(),
              role: profile?.role || 'student'
            }
          ]);

        if (
          participantError &&
          participantError.code !== '23505'
        ) {
          // Ignore duplicate key error
          throw participantError;
        }

        return room;
      } catch (err) {
        console.error('Error creating/joining room:', err);
        setError(err.message);
        throw err;
      }
    },
    [user, profile]
  );

  // Leave a room
  const leaveRoom = useCallback(
    async (roomId) => {
      if (!user) throw new Error('User not authenticated');

      try {
        setError(null);

        const { error } = await supabase
          .from('room_participants')
          .delete()
          .eq('room_id', roomId)
          .eq('user_id', user.id);

        if (error) throw error;
      } catch (err) {
        console.error('Error leaving room:', err);
        setError(err.message);
        throw err;
      }
    },
    [user]
  );

  // Get room participants
  const getRoomParticipants = useCallback(
    async (roomId) => {
      try {
        setError(null);

        const { data, error } = await supabase
          .from('room_participants')
          .select('user_id, role, joined_at, profiles(display_name, email)')
          .eq('room_id', roomId);

        if (error) throw error;

        setParticipants((prev) => ({
          ...prev,
          [roomId]: data
        }));

        return data;
      } catch (err) {
        console.error('Error fetching participants:', err);
        setError(err.message);
        throw err;
      }
    },
    []
  );

  // Get user's rooms
  const getUserRooms = useCallback(async () => {
    if (!user) throw new Error('User not authenticated');

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('rooms')
        .select(
          '*, room_participants(user_id, role)'
        )
        .returns(
          supabase
            .from('room_participants')
            .select('room_id, user_id')
            .eq('user_id', user.id)
        );

      if (error) throw error;

      // Filter rooms where user is a participant
      const userRooms = data.filter((room) =>
        room.room_participants.some(
          (p) => p.user_id === user.id
        )
      );

      setRooms(userRooms);
      return userRooms;
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Store presence (user is in room, camera/mic status)
  const updatePresence = useCallback(
    async (roomId, presenceData) => {
      if (!user) throw new Error('User not authenticated');

      try {
        const { error } = await supabase
          .from('presence')
          .upsert(
            [
              {
                room_id: roomId,
                user_id: user.id,
                camera_enabled: presenceData.cameraEnabled,
                microphone_enabled: presenceData.microphoneEnabled,
                screen_shared: presenceData.screenShared,
                last_update: new Date()
              }
            ],
            {
              onConflict: 'room_id,user_id'
            }
          );

        if (error) throw error;
      } catch (err) {
        console.error('Error updating presence:', err);
      }
    },
    [user]
  );

  return (
    <ClassroomContext.Provider
      value={{
        rooms,
        participants,
        loading,
        error,
        createOrJoinRoom,
        leaveRoom,
        getRoomParticipants,
        getUserRooms,
        updatePresence
      }}
    >
      {children}
    </ClassroomContext.Provider>
  );
}

export function useClassroom() {
  const context = useContext(ClassroomContext);
  if (!context) {
    throw new Error(
      'useClassroom must be used within ClassroomProvider'
    );
  }
  return context;
}
