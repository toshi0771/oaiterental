import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  const { userId: clerkUserId } = await auth()
  let myUserId: string | null = null
  if (clerkUserId) {
    const { data: me } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('clerk_user_id', clerkUserId)
      .single()
    myUserId = me?.id ?? null
  }

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  const purpose = searchParams.get('purpose')
  const gender = searchParams.get('gender')

  let query = supabaseAdmin
    .from('entries')
    .select(`
      id,
      entry_date,
      start_time,
      end_time,
      purpose,
      hourly_rate,
      transaction_type, 
      cast_profiles (
        id,
        user_id,
        age_range,
        area,
        lat_fuzzy,
        lng_fuzzy,
        users (
          gender,
          nickname
        )
      )
    `)
    .eq('status', 'open')

  if (date) query = query.eq('entry_date', date)
  if (purpose) query = query.eq('purpose', purpose)
  if (gender) query = query.eq('cast_profiles.users.gender', gender)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  const result = (data ?? []).map((entry: any) => ({
  ...entry,
  is_own: myUserId !== null && entry.cast_profiles?.user_id === myUserId,
  }))

  return NextResponse.json(result)
}
