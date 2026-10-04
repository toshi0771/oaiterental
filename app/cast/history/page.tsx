'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type HistoryItem = {
  id: string
  status: string
  confirmed_at: string
  entry_date: string
  purpose: string
  applicant_nickname: string
}

const STATUS_LABEL: Record<string, string> = {
  confirmed: '確定済み',
  completed: '完了',
}

export default function CastHistoryPage() {
  const [items, setItems] = useState<HistoryItem[] | null>(null)
  const [forbidden, setForbidden] = useState(false)

  useEffect(() => {
    fetch('/api/cast/history').then(async res => {
      if (res.status === 403) {
        setForbidden(true)
        return
      }
      setItems(await res.json())
    })
  }, [])

  if (forbidden) {
    return (
      <div className="max-w-xl mx-auto p-4">
        <p className="text-gray-600">この機能はプロプラン限定です。</p>
        <Link href="/cast/subscribe/change" className="text-blue-600 hover:underline text-sm">
          プランを変更する
        </Link>
      </div>
    )
  }

  if (!items) return <p className="p-4">読み込み中...</p>

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">マッチング履歴</h1>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">まだ履歴はありません。</p>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="border rounded p-3 bg-white">
              <div className="flex justify-between items-center">
                <p className="font-bold text-sm">{item.applicant_nickname}さん</p>
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                  {STATUS_LABEL[item.status] ?? item.status}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {item.entry_date} / {item.purpose}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
