import { supabaseAdmin } from '@/lib/supabase'
import type { Me } from '@/lib/me'

/** users.role から、そのユーザーが受け取るお知らせの宛先(target)一覧を返す */
export function noticeTargetsForRole(role: string): string[] {
  const targets = ['all']
  if (role === 'user' || role === 'both') targets.push('user')
  if (role === 'cast' || role === 'both') targets.push('cast')
  return targets
}

/** お知らせを「最後に見た日時」。未設定なら登録日時を基準にする(登録前のお知らせは新着にしない) */
export function noticesLastSeen(me: Me): string {
  return me.notices_last_seen_at ?? me.created_at
}

/** 利用者側の未読状況: 問い合わせへの返信が未読か / 未確認のお知らせ件数 */
export async function getNotificationStatus(me: Me) {
  const { data: thread } = await supabaseAdmin
    .from('inquiry_threads')
    .select('last_admin_message_at, user_last_read_at')
    .eq('user_id', me.id)
    .maybeSingle()

  const inquiryUnread =
    !!thread?.last_admin_message_at &&
    (!thread.user_last_read_at ||
      new Date(thread.last_admin_message_at) > new Date(thread.user_last_read_at))

  const { count } = await supabaseAdmin
    .from('announcements')
    .select('id', { count: 'exact', head: true })
    .in('target', noticeTargetsForRole(me.role))
    .gt('created_at', noticesLastSeen(me))

  return { inquiryUnread, unseenNotices: count ?? 0 }
}
