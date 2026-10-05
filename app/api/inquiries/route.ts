import { NextResponse } from 'next/server'
import { getMe } from '@/lib/me'
import { supabaseAdmin } from '@/lib/supabase'

const MAX_LENGTH = 2000

export async function GET() {
  const me = await getMe()
  if (!me) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabaseAdmin
    .from('inquiry_messages')
    .select('id, sender_role, content, created_at')
    .eq('user_id', me.id)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ messages: data })
}

export async function POST(request: Request) {
  const me = await getMe()
  if (!me) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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

  const now = new Date().toISOString()

  const { error } = await supabaseAdmin
    .from('inquiry_messages')
    .insert({ user_id: me.id, sender_role: 'user', content: text, created_at: now })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 送信者自身は「読んだ」状態にしておく
  await supabaseAdmin.from('inquiry_threads').upsert(
    {
      user_id: me.id,
      last_user_message_at: now,
      user_last_read_at: now,
      updated_at: now,
    },
    { onConflict: 'user_id' }
  )

  return NextResponse.json({ success: true }, { status: 201 })
}

export async function PATCH() {
  const me = await getMe()
  if (!me) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date().toISOString()
  await supabaseAdmin
    .from('inquiry_threads')
    .upsert({ user_id: me.id, user_last_read_at: now }, { onConflict: 'user_id' })

  return NextResponse.json({ success: true })
}
