import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { stripe } from '@/lib/stripe'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: applicationId } = await params

  // 申込情報を取得
  const { data: application, error: appError } = await supabaseAdmin
    .from('applications')
    .select(`
      id,
      entry_id,
      entries (
        id,
        cast_id,
        cast_profiles (
          id,
          user_id,
          users (
            clerk_user_id
          )
        )
      )
    `)
    .eq('id', applicationId)
    .single()

  if (appError || !application) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  }

  // キャスト本人かチェック
  const entry = application.entries as any
  const castClerkId = entry?.cast_profiles?.users?.clerk_user_id
  if (castClerkId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 申込を確定
  const { error: confirmError } = await supabaseAdmin
    .from('applications')
    .update({ status: 'confirmed' })
    .eq('id', applicationId)

  if (confirmError) {
    return NextResponse.json({ error: confirmError.message }, { status: 500 })
  }

  // 他の申込を却下
  const { error: rejectError } = await supabaseAdmin
    .from('applications')
    .update({ status: 'rejected' })
    .eq('entry_id', application.entry_id)
    .neq('id', applicationId)

  if (rejectError) {
    return NextResponse.json({ error: rejectError.message }, { status: 500 })
  }

  // エントリーをmatched状態に更新
  const { error: entryError } = await supabaseAdmin
    .from('entries')
    .update({ status: 'matched' })
    .eq('id', application.entry_id)

  if (entryError) {
    return NextResponse.json({ error: entryError.message }, { status: 500 })
  }

  // BOOKINGを作成
  const { data: booking, error: bookingError } = await supabaseAdmin
    .from('bookings')
    .insert({
      application_id: applicationId,
      entry_id: application.entry_id,
      payment_status: 'pending',
    })
    .select()
    .single()

  if (bookingError) {
    return NextResponse.json({ error: bookingError.message }, { status: 500 })
  }

  // first_booking_doneをtrueに更新
  const castUserId = entry?.cast_profiles?.user_id
  await supabaseAdmin
    .from('subscriptions')
    .update({ first_booking_done: true })
    .eq('user_id', castUserId)

    // Stripeトライアルを終了(該当キャストが未登録/未サブスクなら何もしない)
  const { data: subscription } = await supabaseAdmin
    .from('subscriptions')
    .select('stripe_subscription_id')
    .eq('user_id', castUserId)
    .single()

  if (subscription?.stripe_subscription_id) {
    try {
      await stripe.subscriptions.update(subscription.stripe_subscription_id, {
        trial_end: 'now',
        proration_behavior: 'none',
      })
    } catch (stripeError) {
      console.error('Stripe trial end error:', stripeError)
      // Stripe側のエラーでマッチング自体は失敗させない
    }
  }
  return NextResponse.json(booking, { status: 200 })
}
