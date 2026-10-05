import { NextResponse } from 'next/server'
import { getMe } from '@/lib/me'
import { getNotificationStatus } from '@/lib/notifications'

export async function GET() {
  const me = await getMe()
  if (!me) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const status = await getNotificationStatus(me)

  return NextResponse.json({
    inquiry_unread: status.inquiryUnread,
    unseen_notices: status.unseenNotices,
    badge: status.unseenNotices + (status.inquiryUnread ? 1 : 0),
  })
}
