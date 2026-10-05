import { NextResponse } from 'next/server'
import { requireCast } from '@/lib/cast'
import { supabaseAdmin } from '@/lib/supabase'
import { stripe } from '@/lib/stripe'

export async function GET() {
  const cast = await requireCast()
  if (!cast) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('plan_type, status, trial_ends_at, stripe_customer_id')
    .eq('user_id', cast.userId)
    .single()

  let invoices: any[] = []
  if (sub?.stripe_customer_id) {
    const list = await stripe.invoices.list({
      customer: sub.stripe_customer_id,
      limit: 24,
    })
    invoices = list.data.map((inv: any) => ({
      id: inv.id,
      number: inv.number ?? null,
      created: new Date(inv.created * 1000).toISOString(),
      amount: inv.total,
      currency: inv.currency,
      status: inv.status,
      description: inv.lines?.data?.[0]?.description ?? null,
      hosted_invoice_url: inv.hosted_invoice_url ?? null,
    }))
  }

  return NextResponse.json({
    plan_type: sub?.plan_type ?? 'free',
    status: sub?.status ?? null,
    trial_ends_at: sub?.trial_ends_at ?? null,
    invoices,
  })
}
