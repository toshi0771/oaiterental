import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { nickname, gender, age_range } = body

  if (!nickname?.trim()) {
    return NextResponse.json({ error: 'ニックネームは必須です' }, { status: 400 })
  }
  if (!gender) {
    return NextResponse.json({ error: '性別は必須です' }, { status: 400 })
  }
  if (!age_range) {
    return NextResponse.json({ error: '年代は必須です' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('users')
    .update({ nickname, gender, age_range })
    .eq('clerk_user_id', userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
