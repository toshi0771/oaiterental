import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ count: 0 })
  }

  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_user_id', userId)
    .single()

  if (!user) {
    return NextResponse.json({ count: 0 })
  }

  const { count } = await supabaseAdmin
    .from('applications')
    .select('id', { count: 'exact', head: true })
    .eq('applicant_id', user.id)
    .eq('status', 'confirmed')
    .eq('viewed_by_applicant', false)

  return NextResponse.json({ count: count ?? 0 })
}
