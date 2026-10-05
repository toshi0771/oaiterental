import { NextResponse } from 'next/server'
import { requireCast } from '@/lib/cast'
import { supabaseAdmin } from '@/lib/supabase'
import { stripe } from '@/lib/stripe'

const PRICE_IDS: Record<string, string> = {
  basic: process.env.STRIPE_PRICE_BASIC!,
  pro: process.env.STRIPE_PRICE_PRO!,
}

const PLAN_RANK: Record<string, number> = { basic: 1, pro: 2 }

export async function GET() {
  const cast = await requireCast()
  if (!cast) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('plan_type, status, trial_ends_at, stripe_subscription_id')
    .eq('user_id', cast.userId)
    .single()

  return NextResponse.json({
    plan_type: sub?.plan_type ?? 'free',
    status: sub?.status ?? null,
    trial_ends_at: sub?.trial_ends_at ?? null,
    has_subscription: !!sub?.stripe_subscription_id,
  })
}

export async function PATCH(request: Request) {
  const cast = await requireCast()
  if (!cast) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { plan } = await request.json()
  if (!plan || !PRICE_IDS[plan]) {
    return NextResponse.json({ error: 'プランが不正です' }, { status: 400 })
  }

  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('plan_type, stripe_subscription_id')
    .eq('user_id', cast.userId)
    .single()

  if (!sub?.stripe_subscription_id) {
    return NextResponse.json(
      { error: 'まだプランに登録していません。先にプランを選択してください' },
      { status: 400 }
    )
  }
  if (sub.plan_type === plan) {
    return NextResponse.json({ error: 'すでにこのプランです' }, { status: 400 })
  }

  const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id)
  if (stripeSub.status === 'canceled') {
    return NextResponse.json({ error: '解約済みのため変更できません' }, { status: 400 })
  }

  const isUpgrade = (PLAN_RANK[plan] ?? 0) > (PLAN_RANK[sub.plan_type] ?? 0)

  await stripe.subscriptions.update(sub.stripe_subscription_id, {
    items: [{ id: stripeSub.items.data[0].id, price: PRICE_IDS[plan] }],
    // アップグレードは日割り精算あり、ダウングレードは返金・クレジットなしで即時反映
    proration_behavior: isUpgrade ? 'create_prorations' : 'none',
  })

  // Webhook(customer.subscription.updated)でも同期されるが、画面に即反映するためここでも更新
  await supabaseAdmin
    .from('subscriptions')
    .update({ plan_type: plan })
    .eq('user_id', cast.userId)

  return NextResponse.json({ success: true, plan_type: plan })
}
