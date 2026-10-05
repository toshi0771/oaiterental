import Link from 'next/link'
import { supabaseAdmin } from '@/lib/supabase'

export default async function AdminDashboardPage() {
  const { count: userCount } = await supabaseAdmin
    .from('users')
    .select('*', { count: 'exact', head: true })

  const { count: castCount } = await supabaseAdmin
    .from('cast_profiles')
    .select('*', { count: 'exact', head: true })

  const { count: blacklistCount } = await supabaseAdmin
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('is_blacklisted', true)

  const { data: threads } = await supabaseAdmin
    .from('inquiry_threads')
    .select('last_user_message_at, admin_last_read_at')
  const unreadInquiryCount = (threads ?? []).filter(
    t =>
      !!t.last_user_message_at &&
      (!t.admin_last_read_at || new Date(t.last_user_message_at) > new Date(t.admin_last_read_at))
  ).length

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">ダッシュボード</h1>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl">
        <div className="bg-white rounded border p-4">
          <p className="text-xs text-gray-400">総ユーザー数</p>
          <p className="text-2xl font-bold">{userCount ?? 0}</p>
        </div>
        <div className="bg-white rounded border p-4">
          <p className="text-xs text-gray-400">キャスト登録数</p>
          <p className="text-2xl font-bold">{castCount ?? 0}</p>
        </div>
        <div className="bg-white rounded border p-4">
          <p className="text-xs text-gray-400">ブラックリスト件数</p>
          <p className="text-2xl font-bold text-red-600">{blacklistCount ?? 0}</p>
        </div>
        <Link href="/admin/inquiries" className="bg-white rounded border p-4 block hover:bg-gray-50">
          <p className="text-xs text-gray-400">未対応のお問い合わせ</p>
          <p className="text-2xl font-bold text-red-600">{unreadInquiryCount}</p>
        </Link>
      </div>
      <p className="text-sm mt-6">
        <Link href="/admin/summary" className="text-blue-600 hover:underline">
          月次サマリー・MRRを見る →
        </Link>
      </p>
    </div>
  )
}
