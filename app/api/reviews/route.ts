import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { booking_id, comment } = await request.json()

  if (!booking_id) {
    return NextResponse.json({ error: 'booking_idは必須です' }, { status: 400 })
  }

  // ログイン中ユーザーのSupabase上のidを取得
  const { data: me, error: meError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_user_id', userId)
    .single()

  if (meError || !me) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // booking情報を取得(申込者側・キャスト側どちらのuser_idかを判定するため)
  const { data: booking, error: bookingError } = await supabaseAdmin
    .from('bookings')
    .select(`
      id,
      status,
      application_id,
      entry_id,
      applications ( applicant_id ),
      entries ( cast_profiles ( user_id ) )
    `)
    .eq('id', booking_id)
    .single()

  if (bookingError || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  if (booking.status !== 'completed') {
    return NextResponse.json({ error: 'この予約はまだ完了していません' }, { status: 400 })
  }

  const applicantId = (booking.applications as any)?.applicant_id
  const castUserId = (booking.entries as any)?.cast_profiles?.user_id

  if (me.id !== applicantId && me.id !== castUserId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  
  const targetUserId = me.id === applicantId ? castUserId : applicantId

  // レビュー投稿(unique(booking_id, reviewer_id)により二重投稿はDB側でも防止)
  const { data, error } = await supabaseAdmin
    .from('reviews')
    .insert({
      booking_id,
      target_user_id: targetUserId,
      reviewer_id: me.id,
      comment: comment || null,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'この予約には既にレビュー済みです' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}