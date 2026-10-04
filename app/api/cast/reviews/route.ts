import { NextResponse } from 'next/server'
import { requireCastPro } from '@/lib/cast'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const cast = await requireCastPro()
  if (!cast) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await supabaseAdmin
    .from('reviews')
    .select('id, comment, created_at')
    .eq('target_user_id', cast.userId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
