import { NextResponse } from 'next/server'
import { getMe } from '@/lib/me'
import { getPendingApplicationCount } from '@/lib/cast-pending'

// キャスト向け: 自分のエントリーへの「承認待ち」申込み件数
export async function GET() {
  const me = await getMe()
  if (!me) {
    return NextResponse.json({ count: 0 })
  }
  const count = await getPendingApplicationCount(me)
  return NextResponse.json({ count })
}
