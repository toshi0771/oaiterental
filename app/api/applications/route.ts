import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { entry_id, message } = body

  // clerk_user_idからusers.idを取得
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_user_id', userId)
    .single()

  if (userError || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // 自己申込みチェック
  const { data: targetEntry, error: entryCheckError } = await supabaseAdmin
    .from('entries')
    .select('cast_profiles (user_id)')
    .eq('id', entry_id)
    .single()

  if (entryCheckError || !targetEntry) {
    return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
  }

  const castUserId = (targetEntry.cast_profiles as any)?.user_id
  if (castUserId === user.id) {
    return NextResponse.json({ error: '自分のエントリーには申し込めません' }, { status: 403 })
  }
  
  // 申込作成
  const { data, error } = await supabaseAdmin
    .from('applications')
    .insert({
      entry_id,
      applicant_id: user.id,
      message,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // clerk_user_idからusers.idを取得
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_user_id', userId)
    .single()

  if (userError || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // users.idからcast_profiles.idを取得
  const { data: castProfile, error: castError } = await supabaseAdmin
    .from('cast_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (castError || !castProfile) {
    return NextResponse.json({ error: 'Cast profile not found' }, { status: 404 })
  }

  // 自分のentriesに紐づくapplications一覧を取得
  const { data, error } = await supabaseAdmin
    .from('applications')
    .select(`
      id,
      applicant_id,
      message,
      status,
      created_at,
      cast_last_read_at,
      bookings ( id, status, reviews ( id, reviewer_id) ),
      entries!inner (
        id,
        entry_date,
        start_time,
        end_time,
        purpose,
        cast_id
      ),
      users!applications_applicant_id_fkey (
        nickname
      )
    `)
    .eq('entries.cast_id', castProfile.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 各applicationについて「相手(申込者)からの最新メッセージ日時」を取得し、
  // 自分(キャスト)のlast_read_atと比較して未読有無を判定する
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
      ? !app.cast_last_read_at || new Date(latest) > new Date(app.cast_last_read_at)
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
