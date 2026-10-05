'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type SubInfo = {
  plan_type: string
  status: string | null
  trial_ends_at: string | null
  has_subscription: boolean
}

const PLANS = [
  {
    id: 'basic',
    name: '基本プラン',
    price: '300円/月',
    features: ['エントリー作成・申込みの承認/見送り', '各申込みでのメッセージ・レビュー'],
  },
  {
    id: 'pro',
    name: 'プロプラン',
    price: '3,000円/月',
    features: ['基本プランの全機能', 'メッセージ管理(一覧)', 'レビュー管理(一覧)', 'マッチング履歴'],
  },
]

const STATUS_LABEL: Record<string, string> = {
  trialing: 'トライアル中',
  active: '有効',
  past_due: '支払い遅延',
  canceled: '解約済み',
}

export default function SubscribeChangePage() {
  const [info, setInfo] = useState<SubInfo | null>(null)
  const [forbidden, setForbidden] = useState(false)
  const [changing, setChanging] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    const res = await fetch('/api/subscribe/change')
    if (res.status === 403) {
      setForbidden(true)
      return
    }
    setInfo(await res.json())
  }

  useEffect(() => {
    load()
  }, [])

  const handleChange = async (plan: (typeof PLANS)[number]) => {
    if (!info) return
    const isDowngrade = plan.id === 'basic' && info.plan_type === 'pro'
    const confirmText = isDowngrade
      ? '基本プランに変更します。\n\n・変更はすぐに反映され、メッセージ管理・レビュー管理・マッチング履歴が使えなくなります。\n・支払い済み分の返金や差額のクレジットはありません。\n\nよろしいですか?'
      : 'プロプランに変更します。\n\n・変更はすぐに反映され、プロ限定機能が使えるようになります。\n・料金は残り期間分を日割りで計算し、次回の請求に反映されます(トライアル中は課金されません)。\n\nよろしいですか?'
    if (!window.confirm(confirmText)) return

    setChanging(plan.id)
    setError('')
    setMessage('')
    try {
      const res = await fetch('/api/subscribe/change', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: plan.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'プラン変更に失敗しました')
      setMessage(`${plan.name}に変更しました`)
      await load()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setChanging(null)
    }
  }

  if (forbidden) {
    return (
      <div className="max-w-md mx-auto p-4">
        <p className="text-gray-600 mb-2">キャスト登録が必要です。</p>
        <Link href="/cast/register" className="text-blue-600 hover:underline text-sm">
          キャスト登録へ
        </Link>
      </div>
    )
  }

  if (!info) return <p className="p-4">読み込み中...</p>

  if (!info.has_subscription) {
    return (
      <div className="max-w-md mx-auto p-4">
        <h1 className="text-xl font-bold mb-2">プラン変更</h1>
        <p className="text-sm text-gray-600 mb-3">まだプランに登録していません。先にプランを選択してください。</p>
        <Link href="/cast/subscribe" className="text-blue-600 hover:underline text-sm">
          プランを選択する
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <Link href="/cast" className="text-sm text-blue-600 hover:underline">
        ← ダッシュボードに戻る
      </Link>
      <h1 className="text-xl font-bold mt-2 mb-1">プラン変更</h1>
      <p className="text-sm text-gray-500 mb-4">
        現在の状態: {info.status ? STATUS_LABEL[info.status] ?? info.status : '-'}
        {info.trial_ends_at &&
          info.status === 'trialing' &&
          `(トライアル終了予定: ${new Date(info.trial_ends_at).toLocaleDateString('ja-JP')})`}
      </p>

      <div className="space-y-3">
        {PLANS.map(p => {
          const current = info.plan_type === p.id
          const isUpgrade = p.id === 'pro'
          return (
            <div
              key={p.id}
              className={`border rounded-xl p-4 bg-white ${current ? 'border-green-500' : ''}`}
            >
              <div className="flex justify-between items-center">
                <span className="font-bold">{p.name}</span>
                <span className="text-green-600 font-bold">{p.price}</span>
              </div>
              <ul className="text-sm text-gray-600 mt-2 list-disc pl-5">
                {p.features.map(f => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              {current ? (
                <p className="text-sm text-green-600 font-bold mt-3">現在のプラン</p>
              ) : (
                <button
                  onClick={() => handleChange(p)}
                  disabled={changing !== null}
                  className="mt-3 w-full bg-green-500 hover:bg-green-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
                >
                  {changing === p.id
                    ? '変更中...'
                    : isUpgrade
                    ? 'プロにアップグレード'
                    : '基本にダウングレード'}
                </button>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-4 rounded-lg bg-gray-100 p-3 text-xs text-gray-600 space-y-1">
        <p className="font-bold">プラン変更についての注意</p>
        <p>・プラン変更はすぐに反映されます。</p>
        <p>
          ・アップグレード: 料金は残り期間分を日割りで計算し、次回の請求に反映されます。
        </p>
        <p>
          ・ダウングレード: プロ限定機能がすぐに使えなくなります。支払い済み分の返金や差額のクレジットはありません。
        </p>
        <p>・トライアル中は課金されません。</p>
      </div>

      {message && <p className="text-green-600 text-sm mt-4 text-center">{message}</p>}
      {error && <p className="text-red-600 text-sm mt-4 text-center">{error}</p>}
    </div>
  )
}
