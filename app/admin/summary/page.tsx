'use client'

import { useEffect, useState } from 'react'

type MonthRow = {
  month: string
  new_users: number
  new_casts: number
  applications: number
  bookings_confirmed: number
  bookings_completed: number
  revenue: number
}

type Summary = {
  mrr: number
  unit: { basic: number; pro: number }
  subscriptions: {
    active: { basic: number; pro: number }
    trialing: { basic: number; pro: number }
    canceled: number
    unsynced: number
  }
  trial_potential_mrr: number
  months: MonthRow[]
}

const yen = (n: number) => `${n.toLocaleString('ja-JP')}円`

export default function AdminSummaryPage() {
  const [data, setData] = useState<Summary | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/summary').then(async res => {
      if (!res.ok) {
        setError('集計の取得に失敗しました')
        return
      }
      setData(await res.json())
    })
  }, [])

  if (error) return <p className="text-red-600">{error}</p>
  if (!data) return <p>集計中...</p>

  const { subscriptions: s } = data

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">月次サマリー・MRR</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mb-2">
        <div className="bg-white rounded border p-4">
          <p className="text-xs text-gray-400">現在のMRR(課金中)</p>
          <p className="text-2xl font-bold">{yen(data.mrr)}</p>
          <p className="text-xs text-gray-500 mt-1">
            基本 {s.active.basic}件 × {yen(data.unit.basic)} / プロ {s.active.pro}件 ×{' '}
            {yen(data.unit.pro)}
          </p>
        </div>
        <div className="bg-white rounded border p-4">
          <p className="text-xs text-gray-400">トライアル中(見込み)</p>
          <p className="text-2xl font-bold text-gray-700">{yen(data.trial_potential_mrr)}</p>
          <p className="text-xs text-gray-500 mt-1">
            基本 {s.trialing.basic}件 / プロ {s.trialing.pro}件(まだ課金なし)
          </p>
        </div>
        <div className="bg-white rounded border p-4">
          <p className="text-xs text-gray-400">解約済み</p>
          <p className="text-2xl font-bold text-gray-700">{s.canceled}件</p>
        </div>
      </div>

      {s.unsynced > 0 && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2 max-w-3xl mb-2">
          ステータス未同期の契約が{s.unsynced}件あります。この件数はMRRに含まれていません。
          Stripe側で更新があると自動で同期されます。
        </p>
      )}
      <p className="text-xs text-gray-400 mb-6">
        MRRは現在の契約状態の集計です(過去月のMRRは保存していません)。課金中は状態が「有効」「支払い遅延」の契約を数えています。
      </p>

      <h2 className="font-bold mb-2">月次の推移(直近6か月・日本時間)</h2>
      <div className="bg-white rounded border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-2">月</th>
              <th className="p-2 text-right">売上(請求実績)</th>
              <th className="p-2 text-right">新規ユーザー</th>
              <th className="p-2 text-right">新規キャスト</th>
              <th className="p-2 text-right">申込み</th>
              <th className="p-2 text-right">確定</th>
              <th className="p-2 text-right">完了</th>
            </tr>
          </thead>
          <tbody>
            {[...data.months].reverse().map(m => (
              <tr key={m.month} className="border-t">
                <td className="p-2">{m.month}</td>
                <td className="p-2 text-right">{yen(m.revenue)}</td>
                <td className="p-2 text-right">{m.new_users}</td>
                <td className="p-2 text-right">{m.new_casts}</td>
                <td className="p-2 text-right">{m.applications}</td>
                <td className="p-2 text-right">{m.bookings_confirmed}</td>
                <td className="p-2 text-right">{m.bookings_completed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 mt-2">
        売上はStripeの支払い済み請求書の合計です(円建てのみ)。確定・完了はマッチングの確定日・完了日で数えています。
      </p>
    </div>
  )
}
