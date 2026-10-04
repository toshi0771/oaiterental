import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

/**
 * ログイン中のユーザーが管理者(users.role === 'admin')かどうかを確認する。
 * 管理者でなければ null を返す(呼び出し側でリダイレクト/403を判断する)。
 * 管理者であれば Supabase 上の users.id を返す。
 */
export async function requireAdmin(): Promise<{ userId: string } | null> {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return null

  const { data: me } = await supabaseAdmin
    .from('users')
    .select('id, role')
    .eq('clerk_user_id', clerkUserId)
    .single()

  if (!me || me.role !== 'admin') return null

  return { userId: me.id }
}
