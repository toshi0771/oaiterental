import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data: threads, error } = await supabaseAdmin
    .from('inquiry_threads')
    .select(`
      user_id,
      last_user_message_at,
      last_admin_message_at,
      admin_last_read_at,
      users ( nickname, email, role )
    `)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const userIds = (threads ?? []).map(t => t.user_id)
  const latestByUser: Record<string, { content: string; sender_role: string; created_at: string }> = {}

  if (userIds.length > 0) {
    const { data: messages } = await supabaseAdmin
      .from('inquiry_messages')
      .select('user_id, sender_role, content, created_at')
      .in('user_id', userIds)
      .order('created_at', { ascending: false })

    for (const m of messages ?? []) {
      if (!latestByUser[m.user_id]) {
        latestByUser[m.user_id] = {
          content: m.content,
          sender_role: m.sender_role,
          created_at: m.created_at,
        }
      }
    }
  }

  const result = (threads ?? [])
    .map((t: any) => {
      const unread =
        !!t.last_user_message_at &&
        (!t.admin_last_read_at ||
          new Date(t.last_user_message_at) > new Date(t.admin_last_read_at))
      return {
        user_id: t.user_id,
        nickname: t.users?.nickname ?? '(不明)',
        email: t.users?.email ?? '',
        role: t.users?.role ?? '',
        unread,
        latest: latestByUser[t.user_id] ?? null,
      }
    })
    .sort((a, b) => {
      if (a.unread !== b.unread) return a.unread ? -1 : 1
      return (
        new Date(b.latest?.created_at ?? 0).getTime() -
        new Date(a.latest?.created_at ?? 0).getTime()
      )
    })

  return NextResponse.json(result)
}
