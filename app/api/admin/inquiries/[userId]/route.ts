import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase'

const MAX_LENGTH = 2000

type Params = { params: Promise<{ userId: string }> }

export async function GET(_request: Request, { params }: Params) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId } = await params

  const { data, error } = await supabaseAdmin
    .from('inquiry_messages')
    .select('id, sender_role, content, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ messages: data })
}

export async function POST(request: Request, { params }: Params) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId } = await params
  const { content } = await request.json()
  const text = typeof content === 'string' ? content.trim() : ''
  if (!text) {
    return NextResponse.json({ error: 'メッセージを入力してください' }, { status: 400 })
  }
  if (text.length > MAX_LENGTH) {
    return NextResponse.json(
      { error: `メッセージは${MAX_LENGTH}文字以内にしてください` },
      { status: 400 }
    )
  }

  // 返信は、利用者からの問い合わせ(スレッド)がすでにある相手にだけ送れる
  const { data: thread } = await supabaseAdmin
    .from('inquiry_threads')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (!thread) {
    return NextResponse.json({ error: 'お問い合わせのスレッドがありません' }, { status: 404 })
  }

  const now = new Date().toISOString()

  const { error } = await supabaseAdmin
    .from('inquiry_messages')
    .insert({ user_id: userId, sender_role: 'admin', content: text, created_at: now })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 返信した管理者自身は「読んだ」状態にしておく
  await supabaseAdmin
    .from('inquiry_threads')
    .update({ last_admin_message_at: now, admin_last_read_at: now, updated_at: now })
    .eq('user_id', userId)

  return NextResponse.json({ success: true }, { status: 201 })
}

export async function PATCH(_request: Request, { params }: Params) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId } = await params

  await supabaseAdmin
    .from('inquiry_threads')
    .update({ admin_last_read_at: new Date().toISOString() })
    .eq('user_id', userId)

  return NextResponse.json({ success: true })
}
