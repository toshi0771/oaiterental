import { NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: Request) {
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET
  if (!webhookSecret) {
    return NextResponse.json({ error: 'No webhook secret' }, { status: 500 })
  }

  const svixId = request.headers.get('svix-id')
  const svixTimestamp = request.headers.get('svix-timestamp')
  const svixSignature = request.headers.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  const body = await request.text()
  const wh = new Webhook(webhookSecret)

  let event: any
  try {
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    })
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // user.created イベント処理
  if (event.type === 'user.created') {
    const { id, email_addresses, first_name, last_name } = event.data
    const email = email_addresses?.[0]?.email_address ?? ''
    const realName = `${first_name ?? ''} ${last_name ?? ''}`.trim()

    // usersテーブルに登録
    const { data: newUser, error: userError } = await supabaseAdmin
      .from('users')
      .insert({
        clerk_user_id: id,
        real_name: realName || 'unknown',
        email,
        gender: 'other',       // 後でプロフィール編集で更新
        nickname: email.split('@')[0],
        role: 'user',
        kyc_verified: false,
      })
      .select()
      .single()

    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }

    // subscriptionsテーブルに初期レコード作成
    await supabaseAdmin
      .from('subscriptions')
      .insert({
        user_id: newUser.id,
        plan_type: 'free',
        first_booking_done: false,
      })
  }

  return NextResponse.json({ received: true })
}
