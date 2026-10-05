import { redirect } from 'next/navigation'
import Link from 'next/link'
import { requireAdmin } from '@/lib/admin'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin()
  if (!admin) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gray-900 text-white px-4 py-3 flex items-center gap-6">
        <span className="font-bold">管理者ページ</span>
        <nav className="flex gap-4 text-sm">
          <Link href="/admin" className="hover:underline">ダッシュボード</Link>
          <Link href="/admin/users" className="hover:underline">ユーザー管理</Link>
          <Link href="/admin/casts" className="hover:underline">キャスト管理</Link>
          <Link href="/admin/summary" className="hover:underline">月次サマリー</Link>
          <Link href="/admin/inquiries" className="hover:underline">お問い合わせ</Link>
          <Link href="/admin/announcements" className="hover:underline">お知らせ配信</Link>
        </nav>
        <Link href="/" className="ml-auto text-sm text-gray-300 hover:underline">
          サイトに戻る
        </Link>
      </header>
      <main className="p-4">{children}</main>
    </div>
  )
}
