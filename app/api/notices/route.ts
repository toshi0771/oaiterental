import { NextResponse } from 'next/server'
import { getMe } from '@/lib/me'
import { noticeTargetsForRole, noticesLastSeen } from '@/lib/notifications'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const me = await getMe()
  if (!me) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabaseAdmin
    .from('announcements')
    .select('id, title, body, created_at')
    .in('target', noticeTargetsForRole(me.role))
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // last_seen_at は「更新前」の値を返す(画面で新着の強調表示に使うため)
  return NextResponse.json({ notices: data, last_seen_at: noticesLastSeen(me) })
}

export async function PATCH() {
  const me = await getMe()
  if (!me) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  await supabaseAdmin
    .from('users')
    .update({ notices_last_seen_at: new Date().toISOString() })
    .eq('id', me.id)

  return NextResponse.json({ success: true })
}
