import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase'
import { stripe } from '@/lib/stripe'

const MONTHS = 6
const JST_OFFSET_MS = 9 * 60 * 60 * 1000

// 日本時間での "YYYY-MM"
function jstMonth(date: Date): string {
  return new Date(date.getTime() + JST_OFFSET_MS).toISOString().slice(0, 7)
}

// 直近n か月(日本時間、当月を含む、古い順)の "YYYY-MM" 一覧
function recentMonths(n: number): string[] {
  const jstNow = new Date(Date.now() + JST_OFFSET_MS)
  const y = jstNow.getUTCFullYear()
  const m = jstNow.getUTCMonth()
  const result: string[] = []
  for (let i = n - 1; i >= 0; i--) {
    result.push(new Date(Date.UTC(y, m - i, 1)).toISOString().slice(0, 7))
  }
  return result
}

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const months = recentMonths(MONTHS)
  // 集計開始日時: 最古の月の1日 0:00(日本時間)
  const [sy, sm] = months[0].split('-').map(Number)
  const since = new Date(Date.UTC(sy, sm - 1, 1) - JST_OFFSET_MS)
  const sinceIso = since.toISOString()

  // ---- 単価(Stripeのpriceから取得) ----
  const [basicPrice, proPrice] = await Promise.all([
    stripe.prices.retrieve(process.env.STRIPE_PRICE_BASIC!),
    stripe.prices.retrieve(process.env.STRIPE_PRICE_PRO!),
  ])
  const unit: Record<string, number> = {
    basic: basicPrice.unit_amount ?? 0,
    pro: proPrice.unit_amount ?? 0,
  }

  // ---- MRR(現在のスナップショット) ----
  const { data: subs } = await supabaseAdmin
    .from('subscriptions')
    .select('plan_type, status, stripe_subscription_id')

  const active = { basic: 0, pro: 0 }
  const trialing = { basic: 0, pro: 0 }
  let canceled = 0
  let unsynced = 0 // Stripeの契約はあるが、statusがまだ同期されていない行
  let mrr = 0
  let trialPotential = 0

  for (const s of subs ?? []) {
    const plan = s.plan_type as 'basic' | 'pro'
    if (s.status === 'active' || s.status === 'past_due') {
      if (plan === 'basic' || plan === 'pro') {
        active[plan]++
        mrr += unit[plan]
      }
    } else if (s.status === 'trialing') {
      if (plan === 'basic' || plan === 'pro') {
        trialing[plan]++
        trialPotential += unit[plan]
      }
    } else if (s.status === 'canceled') {
      canceled++
    } else if (!s.status && s.stripe_subscription_id) {
      unsynced++
    }
  }

  // ---- 月次の活動件数 ----
  const [usersRes, castsRes, appsRes, bookingsRes] = await Promise.all([
    supabaseAdmin.from('users').select('created_at').gte('created_at', sinceIso),
    supabaseAdmin.from('cast_profiles').select('created_at').gte('created_at', sinceIso),
    supabaseAdmin.from('applications').select('created_at').gte('created_at', sinceIso),
    supabaseAdmin
      .from('bookings')
      .select('confirmed_at, completed_at')
      .or(`confirmed_at.gte.${sinceIso},completed_at.gte.${sinceIso}`),
  ])

  const rows: Record<
    string,
    {
      month: string
      new_users: number
      new_casts: number
      applications: number
      bookings_confirmed: number
      bookings_completed: number
      revenue: number
    }
  > = {}
  for (const month of months) {
    rows[month] = {
      month,
      new_users: 0,
      new_casts: 0,
      applications: 0,
      bookings_confirmed: 0,
      bookings_completed: 0,
      revenue: 0,
    }
  }
  const bump = (iso: string | null, key: keyof (typeof rows)[string]) => {
    if (!iso) return
    const row = rows[jstMonth(new Date(iso))]
    if (row) (row[key] as number)++
  }

  for (const u of usersRes.data ?? []) bump(u.created_at, 'new_users')
  for (const c of castsRes.data ?? []) bump(c.created_at, 'new_casts')
  for (const a of appsRes.data ?? []) bump(a.created_at, 'applications')
  for (const b of bookingsRes.data ?? []) {
    bump(b.confirmed_at, 'bookings_confirmed')
    bump(b.completed_at, 'bookings_completed')
  }

  // ---- 月次売上(Stripeの支払い済み請求書の合計) ----
  const invoices = await stripe.invoices
    .list({
      status: 'paid',
      created: { gte: Math.floor(since.getTime() / 1000) },
      limit: 100,
    })
    .autoPagingToArray({ limit: 2000 })

  for (const inv of invoices) {
    if (inv.currency !== 'jpy') continue
    const row = rows[jstMonth(new Date(inv.created * 1000))]
    if (row) row.revenue += inv.amount_paid
  }

  return NextResponse.json({
    mrr,
    unit,
    subscriptions: { active, trialing, canceled, unsynced },
    trial_potential_mrr: trialPotential,
    months: months.map(m => rows[m]),
  })
}
