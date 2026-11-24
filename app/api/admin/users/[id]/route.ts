import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase'
import { stripe } from '@/lib/stripe'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id: targetUserId } = await params
  const { is_blacklisted, blacklist_reason } = await request.json()

  const { error } = await supabaseAdmin
    .from('users')
    .update({
      is_blacklisted,
      blacklist_reason: is_blacklisted ? (blacklist_reason ?? null) : null,
    })
    .eq('id', targetUserId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 資格取消(ブラックリスト登録)時は Stripe の課金を即時停止する。
  // 返金・日割り請求はしない(規約:取消月の月額料金は返金しない)。
  // プラン・役割・募集中投稿の後処理は Webhook(customer.subscription.deleted)が行う。
  if (is_blacklisted) {
    const { data: sub } = await supabaseAdmin
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', targetUserId)
      .maybeSingle()

    if (sub?.stripe_subscription_id) {
      try {
        const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id)
        if (stripeSub.status !== 'canceled') {
          await stripe.subscriptions.cancel(sub.stripe_subscription_id, {
            invoice_now: false,
            prorate: false,
          })
        }
      } catch (e: any) {
        return NextResponse.json(
          { error: '資格取消は完了しましたが、Stripeの解約に失敗しました。Stripeダッシュボードで手動解約してください: ' + (e?.message ?? '') },
          { status: 500 }
        )
      }
    }

    // Webhook(customer.subscription.deleted)と同じ後処理をここでも行う。
    // Webhookが届かない環境でも整合が取れるようにするため(何度実行しても結果は同じ)。
    await supabaseAdmin
      .from('subscriptions')
      .update({ plan_type: 'free', status: 'canceled' })
      .eq('user_id', targetUserId)
      .not('stripe_subscription_id', 'is', null)

    await supabaseAdmin
      .from('users')
      .update({ role: 'user' })
      .eq('id', targetUserId)
      .eq('role', 'cast')

    const { data: castProfile } = await supabaseAdmin
      .from('cast_profiles')
      .select('id')
      .eq('user_id', targetUserId)
      .maybeSingle()

    if (castProfile) {
      await supabaseAdmin
        .from('entries')
        .update({ status: 'cancelled' })
        .eq('cast_id', castProfile.id)
        .eq('status', 'open')
    }
  }

  return NextResponse.json({ success: true })
}
