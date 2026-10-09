import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
const AREA_COORDS: Record<string, { lat: number; lng: number }> = {
  '北摂': { lat: 34.7998, lng: 135.4989 },
  '京阪沿線': { lat: 34.6971, lng: 135.5350 },
  '大阪北': { lat: 34.7025, lng: 135.4959 },
  '大阪南': { lat: 34.6656, lng: 135.5008 },
  '大阪東': { lat: 34.685, lng: 135.575 },
  '近鉄沿線': { lat: 34.57, lng: 135.59 },
  '泉州': { lat: 34.5044, lng: 135.4113 },
}

// キャストプロフィール取得
export async function GET() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: userRow } = await supabaseAdmin
    .from('users')
    .select('id, real_name')
    .eq('clerk_user_id', userId)
    .maybeSingle()

  if (!userRow) {
    return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
  }

  const { data, error } = await supabaseAdmin
    .from('cast_profiles')
    .select('photo_url, age_range, bio, hourly_rate_min, hourly_rate_max, area')
    .eq('user_id', userRow.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

return NextResponse.json({ ...(data ?? {}), real_name: userRow.real_name })
}

// キャストプロフィール登録・更新
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

  const { photo_url, age_range, bio, hourly_rate_min, hourly_rate_max, area, realName } = body

  if (!age_range) {
    return NextResponse.json({ error: '年代は必須です' }, { status: 400 })
  }
  if (!hourly_rate_min || !hourly_rate_max) {
    return NextResponse.json({ error: '時給の範囲は必須です' }, { status: 400 })
  }
  if (hourly_rate_max < hourly_rate_min) {
    return NextResponse.json({ error: '時給上限は下限以上にしてください' }, { status: 400 })
  }
  if (!area || !AREA_COORDS[area]) {
    return NextResponse.json({ error: 'エリアは必須です' }, { status: 400 })
  }
  const { lat, lng } = AREA_COORDS[area]

  const { data: userRow } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('clerk_user_id', userId)
    .maybeSingle()

  if (!userRow) {
    return NextResponse.json({ error: 'ユーザーが見つかりません' }, { status: 404 })
  }

  // 位置情報のファジー化（半径約300〜800m相当のランダムオフセット）
  const offset = () => (Math.random() - 0.5) * 0.008
  const lat_fuzzy = lat + offset()
  const lng_fuzzy = lng + offset()

  const { data: existing } = await supabaseAdmin
    .from('cast_profiles')
    .select('id')
    .eq('user_id', userRow.id)
    .maybeSingle()

  let error
  if (existing) {
    const { error: updateError } = await supabaseAdmin
      .from('cast_profiles')
      .update({ photo_url, age_range, bio, hourly_rate_min, hourly_rate_max, area, lat_fuzzy, lng_fuzzy })
      .eq('user_id', userRow.id)
    error = updateError
  } else {
    const { error: insertError } = await supabaseAdmin
      .from('cast_profiles')
      .insert({ user_id: userRow.id, photo_url, age_range, bio, hourly_rate_min, hourly_rate_max, area, lat_fuzzy, lng_fuzzy })
    error = insertError
  }

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // role を cast または both に更新
  await supabaseAdmin
    .from('users')
    .update({ role: 'cast', real_name: realName })
    .eq('id', userRow.id)

  return NextResponse.json({ success: true })
}
