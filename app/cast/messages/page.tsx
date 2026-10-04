'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type MessageSummary = {
  application_id: string
  applicant_nickname: string
  status: string
  latest_message: { content: string; created_at: string } | null
}

export default function CastMessagesPage() {
  const [items, setItems] = useState<MessageSummary[] | null>(null)
  const [forbidden, setForbidden] = useState(false)

  useEffect(() => {
    fetch('/api/cast/messages').then(async res => {
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
      <h1 className="text-xl font-bold mb-4">メッセージ管理</h1>
      {items.length === 0 ? (
        <p className="text-sm text-gray-500">まだメッセージはありません。</p>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <Link
              key={item.application_id}
              href="/cast/applications"
              className="block border rounded p-3 bg-white hover:bg-gray-50"
            >
              <p className="font-bold text-sm">{item.applicant_nickname}さん</p>
              <p className="text-sm text-gray-600 truncate">{item.latest_message?.content}</p>
              <p className="text-xs text-gray-400">
                {item.latest_message &&
                  new Date(item.latest_message.created_at).toLocaleString('ja-JP')}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
