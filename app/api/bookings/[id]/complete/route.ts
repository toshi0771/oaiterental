import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: bookingId } = await params

  // ログイン中ユーザーのSupabase上のidを取得
  const { data: me, error: meError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_user_id', userId)
    .single()

  if (meError || !me) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // booking情報を取得(キャスト・申込者どちらかを判定するため)
  const { data: booking, error: bookingError } = await supabaseAdmin
    .from('bookings')
    .select(`
      id,
      status,
      application_id,
      entry_id,
      applications (
        applicant_id
      ),
      entries (
        cast_profiles ( user_id )
      )
    `)
    .eq('id', bookingId)
    .single()

  if (bookingError || !booking) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  const applicantId = (booking.applications as any)?.applicant_id
  const castUserId = (booking.entries as any)?.cast_profiles?.user_id

  if (me.id !== applicantId && me.id !== castUserId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (booking.status !== 'confirmed') {
    return NextResponse.json({ error: 'この予約は完了操作できません' }, { status: 400 })
  }

  const { error: updateError } = await supabaseAdmin
    .from('bookings')
    .update({ status: 'completed', completed_at: new Date().toISOString() })
    .eq('id', bookingId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  // entryのstatusもcompletedに更新
  const entryId = (booking as any).entry_id
  if (entryId) {
    await supabaseAdmin.from('entries').update({ status: 'completed' }).eq('id', entryId)
  }

  return NextResponse.json({ ok: true })
}