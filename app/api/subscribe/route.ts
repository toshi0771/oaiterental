import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { stripe } from '@/lib/stripe'

const PRICE_IDS: Record<string, string> = {
  basic: process.env.STRIPE_PRICE_BASIC!,
  pro: process.env.STRIPE_PRICE_PRO!,
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { plan } = await request.json()
  if (!plan || !PRICE_IDS[plan]) {
    return NextResponse.json({ error: 'プランが不正です' }, { status: 400 })
  }

  const { data: userRow } = await supabaseAdmin
    .from('users')
    .select('id, email')
    .eq('clerk_user_id', userId)
    .maybeSingle()

  if (!userRow) {
    return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
  }

  const { data: subRow } = await supabaseAdmin
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userRow.id)
    .maybeSingle()
  
  if (!subRow) {
    await supabaseAdmin
      .from('subscriptions')
      .insert({ user_id: userRow.id, plan_type: 'free' })
  }
  let customerId = subRow?.stripe_customer_id

  if (!customerId) {
    const clerkUser = await currentUser()
    const customer = await stripe.customers.create({
      email: clerkUser?.emailAddresses[0]?.emailAddress ?? userRow.email,
      metadata: { user_id: userRow.id },
    })
    customerId = customer.id

    await supabaseAdmin
      .from('subscriptions')
      .update({ stripe_customer_id: customerId })
      .eq('user_id', userRow.id)
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
    subscription_data: {
      trial_period_days: 730,
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/cast/subscribe/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cast/subscribe`,
  })

  return NextResponse.json({ url: session.url })
}
