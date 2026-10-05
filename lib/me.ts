import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export type Me = {
  id: string
  role: string
  created_at: string
  notices_last_seen_at: string | null
}

/** ログイン中ユーザーのusers行を返す。未ログイン・未登録なら null。 */
export async function getMe(): Promise<Me | null> {
  const { userId } = await auth()
  if (!userId) return null

  const { data } = await supabaseAdmin
    .from('users')
    .select('id, role, created_at, notices_last_seen_at')
    .eq('clerk_user_id', userId)
    .single()

  return (data as Me | null) ?? null
}
