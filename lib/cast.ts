import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

type CastContext = {
  userId: string
  castProfileId: string
  planType: string
  firstBookingDone: boolean
  trialEndsAt: string | null
}

/**
 * ログイン中ユーザーがキャスト登録済みかどうかを確認する。
 * 未登録・未ログインなら null。
 */
export async function requireCast(): Promise<CastContext | null> {
  const { userId: clerkUserId } = await auth()
  if (!clerkUserId) return null

  const { data: me } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_user_id', clerkUserId)
    .single()

  if (!me) return null

  const { data: castProfile } = await supabaseAdmin
    .from('cast_profiles')
    .select('id')
    .eq('user_id', me.id)
    .single()

  if (!castProfile) return null

  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('plan_type, first_booking_done, trial_ends_at')
    .eq('user_id', me.id)
    .single()

  // 料金プランの free は一般ユーザー専用。加入していない人・解約した人はキャストとして扱わない
  const planType = subscription?.plan_type ?? 'free'
  if (planType === 'free') return null

  return {
    userId: me.id,
    castProfileId: castProfile.id,
    planType,
    firstBookingDone: subscription?.first_booking_done ?? false,
    trialEndsAt: subscription?.trial_ends_at ?? null,
  }
}

/**
 * requireCast に加え、プロプラン(pro)であることを確認する。
 * キャスト未登録、または basic 以下なら null。
 */
export async function requireCastPro(): Promise<CastContext | null> {
  const ctx = await requireCast()
  if (!ctx || ctx.planType !== 'pro') return null
  return ctx
}
