import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase'

const TARGETS = ['all', 'user', 'cast']

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin
    .from('announcements')
    .select('id, title, body, target, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const admin = await requireAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { title, body, target } = await request.json()
  const t = typeof title === 'string' ? title.trim() : ''
  const b = typeof body === 'string' ? body.trim() : ''

  if (!t || !b) {
    return NextResponse.json({ error: 'タイトルと本文を入力してください' }, { status: 400 })
  }
  if (t.length > 100) {
    return NextResponse.json({ error: 'タイトルは100文字以内にしてください' }, { status: 400 })
  }
  if (b.length > 2000) {
    return NextResponse.json({ error: '本文は2000文字以内にしてください' }, { status: 400 })
  }
  if (!TARGETS.includes(target)) {
    return NextResponse.json({ error: '宛先が不正です' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('announcements')
    .insert({ title: t, body: b, target })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true }, { status: 201 })
}
