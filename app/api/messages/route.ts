import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

// ログイン中ユーザーがそのapplicationの関係者(申込者 or キャスト)かを確認し、
// 問題なければ Supabase上の user.id を返す
async function getAuthorizedUserId(applicationId: string, clerkUserId: string) {
  const { data: me, error: meError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_user_id', clerkUserId)
    .single()

  if (meError || !me) return { error: 'User not found', status: 404 as const }

  const { data: application, error: appError } = await supabaseAdmin
    .from('applications')
    .select(`
      id,
      applicant_id,
      entries ( cast_profiles ( user_id ) )
    `)
    .eq('id', applicationId)
    .single()

  if (appError || !application) return { error: 'Application not found', status: 404 as const }

  const castUserId = (application.entries as any)?.cast_profiles?.user_id
  if (me.id !== application.applicant_id && me.id !== castUserId) {
    return { error: 'Forbidden', status: 403 as const }
  }

  return { userId: me.id as string }
}

export async function GET(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const applicationId = searchParams.get('application_id')
  if (!applicationId) {
    return NextResponse.json({ error: 'application_idは必須です' }, { status: 400 })
  }

  const authResult = await getAuthorizedUserId(applicationId, userId)
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  const { data, error } = await supabaseAdmin
    .from('messages')
    .select('id, sender_id, content, created_at')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ messages: data, my_user_id: authResult.userId })
}

export async function POST(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { application_id, content } = await request.json()

  if (!application_id || !content || !content.trim()) {
    return NextResponse.json({ error: 'application_id, contentは必須です' }, { status: 400 })
  }

  const authResult = await getAuthorizedUserId(application_id, userId)
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  const { data, error } = await supabaseAdmin
    .from('messages')
    .insert({
      application_id,
      sender_id: authResult.userId,
      content: content.trim(),
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
