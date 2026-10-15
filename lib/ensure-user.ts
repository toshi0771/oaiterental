import { auth, currentUser } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * ログイン中ユーザーの users.id を返す。
 * users に行が無ければ作る(Clerk Webhook が失敗したときの保険)。未ログインなら null。
 */
export async function ensureUserId(): Promise<string | null> {
  const { userId } = await auth()
  if (!userId) return null

  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_user_id', userId)
    .maybeSingle()
  if (existing) return existing.id

  const user = await currentUser()
  const email = user?.emailAddresses[0]?.emailAddress ?? ''

  const { data: created } = await supabaseAdmin
    .from('users')
    .insert({
      clerk_user_id: userId,
      real_name: 'unknown',
      email,
      nickname: email.split('@')[0] || 'user',
      gender: 'other',
    })
    .select('id')
    .single()
  if (created) return created.id

  // Webhook と同時に作られて insert が衝突した場合は、引き直す
  const { data: retry } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_user_id', userId)
    .maybeSingle()
  return retry?.id ?? null
}
