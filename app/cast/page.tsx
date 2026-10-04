import { redirect } from 'next/navigation'
import Link from 'next/link'
import { requireCast } from '@/lib/cast'

const PLAN_LABEL: Record<string, string> = {
  free: '未登録',
  basic: '基本(300円/月)',
  pro: 'プロ(3000円/月)',
}

export default async function CastDashboardPage() {
  const cast = await requireCast()
  if (!cast) {
    redirect('/cast/register')
  }

  const isPro = cast.planType === 'pro'

  const items = [
    { href: '/cast/register', title: 'プロフィール管理', desc: '基本情報・エリア・時給の編集', gated: false },
    { href: '/cast/messages', title: 'メッセージ管理', desc: 'すべての申込者とのやり取りを一覧で確認', gated: true },
    { href: '/cast/reviews', title: 'レビュー管理', desc: '受け取った感想の一覧', gated: true },
    { href: '/cast/history', title: 'マッチング履歴', desc: '過去の確定・完了した予約一覧', gated: true },
    { href: '/cast/subscribe/change', title: 'プラン変更', desc: '基本⇔プロの切り替え', gated: false },
    { href: '/cast/subscribe/history', title: 'サブスク履歴', desc: '請求履歴の確認', gated: false },
  ]

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-1">キャストダッシュボード</h1>
      <p className="text-sm text-gray-500 mb-6">
        現在のプラン: <span className="font-bold">{PLAN_LABEL[cast.planType] ?? cast.planType}</span>
      </p>

      <div className="grid gap-3">
        {items.map(item => {
          const locked = item.gated && !isPro
          return (
            <Link
              key={item.href}
              href={locked ? '/cast/subscribe/change' : item.href}
              className={`border rounded p-4 bg-white hover:bg-gray-50 ${locked ? 'opacity-60' : ''}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold">{item.title}</span>
                {locked && (
                  <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                    🔒 プロ限定
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
