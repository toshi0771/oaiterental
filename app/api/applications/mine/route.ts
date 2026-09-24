import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_user_id', userId)
    .single()

  if (userError || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const { data, error } = await supabaseAdmin
    .from('applications')
    .select(`
      id,
      message,
      status,
      created_at,
      viewed_by_applicant,
      applicant_last_read_at,
      bookings ( id, status, reviews ( id, reviewer_id) ),
      entries (
        id,
        entry_date,
        start_time,
        end_time,
        purpose,
        cast_profiles (
          users (
            nickname
          )
        )
      )
    `)
    .eq('applicant_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 各applicationについて「相手(キャスト)からの最新メッセージ日時」を取得し、
  // 自分(applicant)のlast_read_atと比較して未読有無を判定する
  const applicationIds = (data ?? []).map((app: any) => app.id)
  const latestOtherMessageAt: Record<string, string> = {}
  if (applicationIds.length > 0) {
    const { data: messages } = await supabaseAdmin
      .from('messages')
      .select('application_id, sender_id, created_at')
      .in('application_id', applicationIds)
      .neq('sender_id', user.id)
      .order('created_at', { ascending: false })

    for (const m of messages ?? []) {
      if (!latestOtherMessageAt[m.application_id]) {
        latestOtherMessageAt[m.application_id] = m.created_at
      }
    }
  }

  const result = (data ?? []).map((app: any) => {
    const latest = latestOtherMessageAt[app.id]
    const hasUnreadMessages = latest
      ? !app.applicant_last_read_at || new Date(latest) > new Date(app.applicant_last_read_at)
      : false

    return {
      ...app,
      has_unread_messages: hasUnreadMessages,
      bookings: app.bookings
        ? {
            id: app.bookings.id,
            status: app.bookings.status,
            already_reviewed: (app.bookings.reviews ?? []).some(
              (r: any) => r.reviewer_id === user.id
            ),
          }
        : null,
    }
  })

  return NextResponse.json(result)
}