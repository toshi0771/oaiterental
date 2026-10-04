import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: casts, error } = await supabaseAdmin
    .from('cast_profiles')
    .select(`
      id,
      area,
      hourly_rate_min,
      hourly_rate_max,
      created_at,
      users ( id, nickname, is_blacklisted, blacklist_reason )
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const userIds = (casts ?? []).map((c: any) => c.users?.id).filter(Boolean)
  let subscriptionsByUserId: Record<string, any> = {}

  if (userIds.length > 0) {
    const { data: subs } = await supabaseAdmin
      .from('subscriptions')
      .select('user_id, plan_type, status, trial_ends_at')
      .in('user_id', userIds)

    for (const s of subs ?? []) {
      subscriptionsByUserId[s.user_id] = s
    }
  }

  const result = (casts ?? []).map((c: any) => ({
    id: c.id,
    user_id: c.users?.id,
    nickname: c.users?.nickname,
    is_blacklisted: c.users?.is_blacklisted,
    blacklist_reason: c.users?.blacklist_reason,
    area: c.area,
    hourly_rate_min: c.hourly_rate_min,
    hourly_rate_max: c.hourly_rate_max,
    created_at: c.created_at,
    subscription: subscriptionsByUserId[c.users?.id] ?? null,
  }))

  return NextResponse.json(result)
}
