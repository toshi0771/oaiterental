import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { entry_date, start_time, end_time, purpose, hourly_rate } = body

  // clerk_user_idからusers.idを取得
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_user_id', userId)
    .single()

  if (userError || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // cast_profilesを取得
  const { data: castProfile, error: castError } = await supabaseAdmin
    .from('cast_profiles')
    .select('id, lat_fuzzy, lng_fuzzy')
    .eq('user_id', user.id)
    .single()

  if (castError || !castProfile) {
    return NextResponse.json({ error: 'Cast profile not found' }, { status: 404 })
  }

  // サブスク確認（初回マッチング前は無料）
  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('first_booking_done, plan_type')
    .eq('user_id', user.id)
    .single()

  if (subscription?.first_booking_done && subscription?.plan_type === 'free') {
    return NextResponse.json({ error: 'Subscription required' }, { status: 403 })
  }

  // エントリー作成
  const { data, error } = await supabaseAdmin
    .from('entries')
    .insert({
      cast_id: castProfile.id,
      entry_date,
      start_time,
      end_time,
      purpose,
      hourly_rate,
      status: 'open',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
