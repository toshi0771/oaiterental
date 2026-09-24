import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: applicationId } = await params

  // 申込情報を取得
  const { data: application, error: appError } = await supabaseAdmin
    .from('applications')
    .select(`
      id,
      status,
      entries (
        cast_profiles (
          users ( clerk_user_id )
        )
      )
    `)
    .eq('id', applicationId)
    .single()

  if (appError || !application) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  }

  // キャスト本人かチェック
  const entry = application.entries as any
  const castClerkId = entry?.cast_profiles?.users?.clerk_user_id
  if (castClerkId !== userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (application.status !== 'pending') {
    return NextResponse.json({ error: 'この申込みは既に処理済みです' }, { status: 400 })
  }

  const { error: rejectError } = await supabaseAdmin
    .from('applications')
    .update({ status: 'rejected' })
    .eq('id', applicationId)

  if (rejectError) {
    return NextResponse.json({ error: rejectError.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}