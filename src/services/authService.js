import { supabase } from '../lib/supabase';

/**
 * Get the current user's session and verify it with the backend.
 */
export async function getAuthToken() {
  const {
    data: { session },
    error
  } = await supabase.auth.getSession();

  if (error || !session) {
    throw new Error('Not authenticated');
  }

  return session.access_token;
}

/**
 * Update user profile
 */
export async function updateUserProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get user profile
 */
export async function getUserProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Change user role (admin only)
 */
export async function changeUserRole(userId, newRole) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get user's presence in all rooms
 */
export async function getUserPresence(userId) {
  const { data, error } = await supabase
    .from('presence')
    .select('*')
    .eq('user_id', userId);

  if (error) throw error;
  return data;
}
