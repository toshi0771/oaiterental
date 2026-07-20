import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
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
      cast_profiles (
        id,
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

  return NextResponse.json(data)
}
