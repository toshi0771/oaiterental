import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function PATCH() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_user_id', userId)
    .single()

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  await supabaseAdmin
    .from('applications')
    .update({ viewed_by_applicant: true })
    .eq('applicant_id', user.id)
    .eq('status', 'confirmed')

  return NextResponse.json({ ok: true })
}