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

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">ダッシュボード</h1>
      <div className="grid grid-cols-3 gap-4 max-w-2xl">
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
      </div>
      <p className="text-sm text-gray-500 mt-6">
        月次サマリー・MRRはこの後のステップで追加します。
      </p>
    </div>
  )
}
