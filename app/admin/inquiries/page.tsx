'use client'

import { useEffect, useState } from 'react'
import InquiryThread from '../../components/InquiryThread'

type ThreadSummary = {
  user_id: string
  nickname: string
  email: string
  role: string
  unread: boolean
  latest: { content: string; sender_role: string; created_at: string } | null
}

export default function AdminInquiriesPage() {
  const [threads, setThreads] = useState<ThreadSummary[] | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const fetchThreads = async () => {
    const res = await fetch('/api/admin/inquiries')
    if (res.ok) setThreads(await res.json())
  }

  useEffect(() => {
    fetchThreads()
    const timer = setInterval(fetchThreads, 10000)
    return () => clearInterval(timer)
  }, [])

  const select = (id: string) => {
    setSelectedId(id)
    // 開いた時点で未読の印を消す(既読の保存はスレッド側が行う)
    setThreads(prev => prev && prev.map(t => (t.user_id === id ? { ...t, unread: false } : t)))
  }

  if (!threads) return <p>読み込み中...</p>

  const selected = threads.find(t => t.user_id === selectedId) ?? null

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">お問い合わせ</h1>
      {threads.length === 0 ? (
        <p className="text-sm text-gray-500">お問い合わせはまだありません。</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-4 max-w-4xl">
          <div className="space-y-2">
            {threads.map(t => (
              <button
                key={t.user_id}
                onClick={() => select(t.user_id)}
                className={`block w-full text-left border rounded p-3 bg-white hover:bg-gray-50 ${
                  selectedId === t.user_id ? 'border-blue-500' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">{t.nickname}</span>
                  <span className="text-xs text-gray-400">{t.role}</span>
                  {t.unread && (
                    <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                      未対応
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400">{t.email}</p>
                {t.latest && (
                  <p className="text-sm text-gray-600 truncate mt-1">
                    {t.latest.sender_role === 'admin' ? '(運営) ' : ''}
                    {t.latest.content}
                  </p>
                )}
              </button>
            ))}
          </div>

          <div className="border rounded p-3 bg-white">
            {selected ? (
              <>
                <p className="font-bold text-sm mb-2">{selected.nickname}さんとのやり取り</p>
                <InquiryThread
                  endpoint={`/api/admin/inquiries/${selected.user_id}`}
                  mySide="admin"
                />
              </>
            ) : (
              <p className="text-sm text-gray-400">左の一覧から選んでください。</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
