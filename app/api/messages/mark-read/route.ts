import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function PATCH(request: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { application_id } = await request.json()
  if (!application_id) {
    return NextResponse.json({ error: 'application_idは必須です' }, { status: 400 })
  }

  const { data: me } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_user_id', userId)
    .single()

  if (!me) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  const { data: application } = await supabaseAdmin
    .from('applications')
    .select(`
      id,
      applicant_id,
      entries ( cast_profiles ( user_id ) )
    `)
    .eq('id', application_id)
    .single()

  if (!application) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  }

  const castUserId = (application.entries as any)?.cast_profiles?.user_id
  const now = new Date().toISOString()

  if (me.id === application.applicant_id) {
    await supabaseAdmin
      .from('applications')
      .update({ applicant_last_read_at: now })
      .eq('id', application_id)
  } else if (me.id === castUserId) {
    await supabaseAdmin
      .from('applications')
      .update({ cast_last_read_at: now })
      .eq('id', application_id)
  } else {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ success: true })
}
