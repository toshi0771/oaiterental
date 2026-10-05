'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Notice = {
  id: string
  title: string
  body: string
  created_at: string
}

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[] | null>(null)
  const [lastSeenAt, setLastSeenAt] = useState<string | null>(null)
  const [inquiryUnread, setInquiryUnread] = useState(false)
  const [unauthorized, setUnauthorized] = useState(false)

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/notices')
      if (res.status === 401) {
        setUnauthorized(true)
        return
      }
      const data = await res.json()
      setNotices(data.notices)
      setLastSeenAt(data.last_seen_at)

      // 一覧を表示したら「見た」ことにする(強調表示は更新前の日時で判定済み)
      fetch('/api/notices', { method: 'PATCH' })
    }
    load()

    fetch('/api/notifications')
      .then(res => (res.ok ? res.json() : null))
      .then(data => data && setInquiryUnread(data.inquiry_unread))
  }, [])

  if (unauthorized) {
    return (
      <div className="max-w-xl mx-auto p-4">
        <p className="text-gray-600 mb-2">お知らせを見るにはログインが必要です。</p>
        <Link href="/sign-in" className="text-blue-600 hover:underline text-sm">
          ログインする
        </Link>
      </div>
    )
  }

  if (!notices) return <p className="p-4">読み込み中...</p>

  return (
    <div className="max-w-xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">お知らせ</h1>
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ホームに戻る
        </Link>
      </div>

      <Link
        href="/contact"
        className="block border rounded-lg p-3 bg-white hover:bg-gray-50 mb-4 text-sm"
      >
        <span className="font-bold">運営へのお問い合わせ</span>
        {inquiryUnread && (
          <span className="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
            返信あり
          </span>
        )}
        <p className="text-gray-500 text-xs mt-1">
          ご質問・ご要望・トラブルのご相談はこちらから
        </p>
      </Link>

      {notices.length === 0 ? (
        <p className="text-sm text-gray-500">お知らせはまだありません。</p>
      ) : (
        <div className="space-y-3">
          {notices.map(n => {
            const isNew = lastSeenAt ? new Date(n.created_at) > new Date(lastSeenAt) : false
            return (
              <div key={n.id} className="border rounded-lg p-4 bg-white">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">{n.title}</span>
                  {isNew && (
                    <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">
                      NEW
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mb-2">
                  {new Date(n.created_at).toLocaleDateString('ja-JP')}
                </p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{n.body}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
