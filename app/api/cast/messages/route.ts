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
    .select('id')
    .eq('cast_id', cast.castProfileId)

  const entryIds = (entries ?? []).map(e => e.id)
  if (entryIds.length === 0) {
    return NextResponse.json([])
  }

  const { data: applications } = await supabaseAdmin
    .from('applications')
    .select('id, entry_id, status, users:applicant_id ( nickname )')
    .in('entry_id', entryIds)

  const applicationIds = (applications ?? []).map(a => a.id)
  if (applicationIds.length === 0) {
    return NextResponse.json([])
  }

  const { data: messages } = await supabaseAdmin
    .from('messages')
    .select('application_id, content, created_at')
    .in('application_id', applicationIds)
    .order('created_at', { ascending: false })

  const latestByApplication: Record<string, { content: string; created_at: string }> = {}
  for (const m of messages ?? []) {
    if (!latestByApplication[m.application_id]) {
      latestByApplication[m.application_id] = { content: m.content, created_at: m.created_at }
    }
  }

  const result = (applications ?? [])
    .map((a: any) => ({
      application_id: a.id,
      applicant_nickname: a.users?.nickname ?? '(不明)',
      status: a.status,
      latest_message: latestByApplication[a.id] ?? null,
    }))
    .filter(a => a.latest_message !== null)
    .sort(
      (a, b) =>
        new Date(b.latest_message!.created_at).getTime() -
        new Date(a.latest_message!.created_at).getTime()
    )

  return NextResponse.json(result)
}
