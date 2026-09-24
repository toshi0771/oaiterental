import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: 'No webhook secret' }, { status: 500 })
  }

  const signature = request.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  const body = await request.text()

  let event: any
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as any

    const customerId = session.customer as string
    const subscriptionId = session.subscription as string

    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const priceId = subscription.items.data[0].price.id

    let planType: 'basic' | 'pro' | null = null
    if (priceId === process.env.STRIPE_PRICE_BASIC) planType = 'basic'
    if (priceId === process.env.STRIPE_PRICE_PRO) planType = 'pro'

    const trialEndsAt = subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null

    const { data: userRow } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', session.metadata?.user_id ?? '')
      .maybeSingle()

    // metadataにuser_idが無い場合はcustomer_idで既存レコードを探す
    const targetUserId = userRow?.id

    if (targetUserId) {
      await supabaseAdmin
        .from('subscriptions')
        .update({
          plan_type: planType,
          stripe_subscription_id: subscriptionId,
          stripe_customer_id: customerId,
          trial_ends_at: trialEndsAt,
        })
        .eq('user_id', targetUserId)
    } else {
      await supabaseAdmin
        .from('subscriptions')
        .update({
          plan_type: planType,
          stripe_subscription_id: subscriptionId,
          trial_ends_at: trialEndsAt,
        })
        .eq('stripe_customer_id', customerId)
    }
  }

  if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as any

    const subscriptionId = subscription.id as string
    const customerId = subscription.customer as string
    const trialEndsAt = subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null

    // stripe_subscription_idで一致する行を優先して更新し、
    // 見つからなければstripe_customer_idで更新する(念のためのフォールバック)
    const { data: updatedRows } = await supabaseAdmin
      .from('subscriptions')
      .update({ trial_ends_at: trialEndsAt })
      .eq('stripe_subscription_id', subscriptionId)
      .select('user_id')

    if (!updatedRows || updatedRows.length === 0) {
      await supabaseAdmin
        .from('subscriptions')
        .update({ trial_ends_at: trialEndsAt })
        .eq('stripe_customer_id', customerId)
    }
  }

  return NextResponse.json({ received: true })
}