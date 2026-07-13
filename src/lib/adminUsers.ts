import { supabase } from './supabase'

export async function banUser(userId: string, reason: string) {
  const { error } = await supabase.rpc('admin_set_user_ban', {
    target_user_id: userId,
    should_ban: true,
    reason: reason.trim() || null,
  })
  return { error: error as Error | null }
}

export async function unbanUser(userId: string) {
  const { error } = await supabase.rpc('admin_set_user_ban', {
    target_user_id: userId,
    should_ban: false,
    reason: null,
  })
  return { error: error as Error | null }
}

export async function deleteUser(userId: string) {
  const { error } = await supabase.rpc('admin_delete_user', {
    target_user_id: userId,
  })
  return { error: error as Error | null }
}
