'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Invoice = {
  id: string
  number: string | null
  created: string
  amount: number
  currency: string
  status: string | null
  description: string | null
  hosted_invoice_url: string | null
}

type HistoryData = {
  plan_type: string
  status: string | null
  trial_ends_at: string | null
  invoices: Invoice[]
}

const PLAN_LABEL: Record<string, string> = {
  free: '未登録',
  basic: '基本(300円/月)',
  pro: 'プロ(3000円/月)',
}

const STATUS_LABEL: Record<string, string> = {
  trialing: 'トライアル中',
  active: '有効',
  past_due: '支払い遅延',
  canceled: '解約済み',
}

const INVOICE_STATUS_LABEL: Record<string, string> = {
  paid: '支払い済み',
  open: '未払い',
  draft: '下書き',
  void: '無効',
  uncollectible: '回収不能',
}

export default function SubscribeHistoryPage() {
  const [data, setData] = useState<HistoryData | null>(null)
  const [forbidden, setForbidden] = useState(false)

  useEffect(() => {
    fetch('/api/subscribe/history').then(async res => {
      if (res.status === 403) {
        setForbidden(true)
        return
      }
      setData(await res.json())
    })
  }, [])

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

  if (!data) return <p className="p-4">読み込み中...</p>

  return (
    <div className="max-w-md mx-auto p-4">
      <Link href="/cast" className="text-sm text-blue-600 hover:underline">
        ← ダッシュボードに戻る
      </Link>
      <h1 className="text-xl font-bold mt-2 mb-4">サブスク履歴</h1>

      <div className="border rounded-xl p-4 bg-white mb-4 text-sm">
        <p>
          プラン: <span className="font-bold">{PLAN_LABEL[data.plan_type] ?? data.plan_type}</span>
        </p>
        <p>
          状態:{' '}
          <span className="font-bold">
            {data.status ? STATUS_LABEL[data.status] ?? data.status : '-'}
          </span>
        </p>
        {data.status === 'trialing' && data.trial_ends_at && (
          <p className="text-gray-500">
            トライアル終了予定: {new Date(data.trial_ends_at).toLocaleDateString('ja-JP')}
          </p>
        )}
      </div>

      <h2 className="font-bold mb-2">請求履歴</h2>
      {data.invoices.length === 0 ? (
        <p className="text-sm text-gray-500">請求履歴はまだありません。</p>
      ) : (
        <div className="space-y-2">
          {data.invoices.map(inv => (
            <div key={inv.id} className="border rounded p-3 bg-white text-sm">
              <div className="flex justify-between">
                <span>{new Date(inv.created).toLocaleDateString('ja-JP')}</span>
                <span className="font-bold">
                  {inv.currency.toLowerCase() === 'jpy'
                    ? `${inv.amount.toLocaleString()}円`
                    : `${inv.amount} ${inv.currency.toUpperCase()}`}
                </span>
              </div>
              {inv.description && <p className="text-gray-500 text-xs mt-1">{inv.description}</p>}
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">
                  {inv.status ? INVOICE_STATUS_LABEL[inv.status] ?? inv.status : '-'}
                </span>
                {inv.hosted_invoice_url && (
                  <a
                    href={inv.hosted_invoice_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline"
                  >
                    請求書を見る
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
