import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabaseAdmin
    .from('users')
    .select('nickname, gender, age_range, real_name')
    .eq('clerk_user_id', userId)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    ...data,
    real_name: data.real_name === 'unknown' ? '' : data.real_name,
  })
}
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

  const { nickname, gender, age_range, real_name, age_confirmed, terms_accepted } = body

  if (!nickname?.trim()) {
    return NextResponse.json({ error: 'ニックネームは必須です' }, { status: 400 })
  }
  if (!gender) {
    return NextResponse.json({ error: '性別は必須です' }, { status: 400 })
  }
  if (!age_range) {
    return NextResponse.json({ error: '年代は必須です' }, { status: 400 })
  }
  if (!real_name?.trim()) {
    return NextResponse.json({ error: '本名は必須です' }, { status: 400 })
  }
  if (age_confirmed !== true) {
    return NextResponse.json({ error: '18歳以上であることの確認が必要です' }, { status: 400 })
  }
  if (terms_accepted !== true) {
    return NextResponse.json({ error: '利用規約・プライバシーポリシーへの同意が必要です' }, { status: 400 })
  }
  const now = new Date().toISOString()

  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_user_id', userId)
    .maybeSingle()

  let error
  if (existing) {
  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({ nickname, gender, age_range, real_name: real_name.trim(), age_confirmed_at: now, terms_accepted_at: now })
    .eq('clerk_user_id', userId)
  error = updateError
  } else {
  const user = await currentUser()
  const email = user?.emailAddresses[0]?.emailAddress ?? ''

  const { error: insertError } = await supabaseAdmin
    .from('users')
    .insert({
      clerk_user_id: userId,
      nickname,
      gender,
      age_range,
      real_name: real_name.trim(),
      age_confirmed_at: now,
      terms_accepted_at: now,
      email,
    })
  error = insertError
  }
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
