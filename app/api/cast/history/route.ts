import { NextResponse } from 'next/server'
import { requireCastPro } from '@/lib/cast'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const cast = await requireCastPro()
  if (!cast) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: entries } = await supabaseAdmin
    .from('entries')
    .select('id, entry_date, purpose')
    .eq('cast_id', cast.castProfileId)

  const entryMap: Record<string, { entry_date: string; purpose: string }> = {}
  for (const e of entries ?? []) {
    entryMap[e.id] = { entry_date: e.entry_date, purpose: e.purpose }
  }

  const entryIds = Object.keys(entryMap)
  if (entryIds.length === 0) {
    return NextResponse.json([])
  }

  const { data: bookings, error } = await supabaseAdmin
    .from('bookings')
    .select(`
      id,
      status,
      confirmed_at,
      entry_id,
      applications ( users:applicant_id ( nickname ) )
    `)
    .in('entry_id', entryIds)
    .order('confirmed_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const result = (bookings ?? []).map((b: any) => ({
    id: b.id,
    status: b.status,
    confirmed_at: b.confirmed_at,
    entry_date: entryMap[b.entry_id]?.entry_date,
    purpose: entryMap[b.entry_id]?.purpose,
    applicant_nickname: b.applications?.users?.nickname ?? '(不明)',
  }))

  return NextResponse.json(result)
}
