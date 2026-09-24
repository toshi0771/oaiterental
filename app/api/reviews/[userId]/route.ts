import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params

  const { data, error } = await supabaseAdmin
    .from('reviews')
    .select('id, comment, created_at')
    .eq('target_user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    count: data.length,
    reviews: data,
  })
}
