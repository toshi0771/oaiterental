'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import MessageThread from '../components/MessageThread'

type MyApplication = {
  id: string
  message: string
  status: string
  created_at: string
  has_unread_messages: boolean
  bookings: { id: string; status: string; already_reviewed: boolean } | null
  entries: {
    id: string
    entry_date: string
    start_time: string
    end_time: string
    purpose: string
    cast_profiles: {
      users: {
        nickname: string
      }
    }
  }
}

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<MyApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState<string | null>(null)
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [comment, setComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [openThreadId, setOpenThreadId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/applications/mine')
      .then(res => res.json())
      .then(data => {
        setApplications(data)
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    fetch('/api/applications/mine/mark-viewed', { method: 'PATCH' })
  }, [])

  const handleComplete = async (bookingId: string) => {
    setCompleting(bookingId)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/complete`, { method: 'POST' })
      if (res.ok) {
        fetch('/api/applications/mine')
          .then(res => res.json())
          .then(data => setApplications(data))
      }
    } finally {
      setCompleting(null)
    }
  }

  const handleSubmitReview = async (bookingId: string) => {
    setSubmittingReview(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: bookingId,
          comment,
        }),
      })
      if (res.ok) {
        setApplications(prev =>
          prev.map(app =>
            app.bookings?.id === bookingId
              ? { ...app, bookings: { ...app.bookings, already_reviewed: true } }
              : app
          )
        )
        setReviewingId(null)
        setComment('')
      }
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loading) return <div className="p-4">読み込み中...</div>

  const statusLabel = (status: string) => {
    if (status === 'pending') return '承認待ち'
    if (status === 'confirmed') return '確定済み'
    return '不成立'
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-gray-800">申込み状況</h1>
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ホームに戻る
        </Link>
      </div>

      {applications.length === 0 ? (
        <p className="text-sm text-gray-500">まだ申込みはありません。</p>
      ) : (
        <div className="space-y-3">
          {applications.map(app => (
            <div key={app.id} className="border rounded p-3 bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-800">
                  {app.entries.cast_profiles.users.nickname}さん
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    app.status === 'confirmed'
                      ? 'bg-green-100 text-green-700'
                      : app.status === 'rejected'
                      ? 'bg-gray-100 text-gray-500'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {statusLabel(app.status)}
                </span>
              </div>

              <p className="text-sm text-gray-600 mt-1">
                {app.entries.entry_date} {app.entries.start_time}〜{app.entries.end_time}
              </p>
              <p className="text-sm text-gray-600">目的: {app.entries.purpose}</p>

              <button
                onClick={() => {
                  const opening = openThreadId !== app.id
                  setOpenThreadId(opening ? app.id : null)
                  if (opening && app.has_unread_messages) {
                    setApplications(prev =>
                      prev.map(a => (a.id === app.id ? { ...a, has_unread_messages: false } : a))
                    )
                  }
                }}
                className="mt-1 text-xs text-blue-600 hover:underline"
              >
                {openThreadId === app.id ? 'メッセージを閉じる' : 'メッセージを見る'}
                {app.has_unread_messages && (
                  <span className="ml-1 inline-block w-2 h-2 rounded-full bg-red-500 align-middle" />
                )}
              </button>
              {openThreadId === app.id && <MessageThread applicationId={app.id} />}


              {app.bookings?.status === 'confirmed' && (
                <button
                  onClick={() => handleComplete(app.bookings!.id)}
                  disabled={completing === app.bookings!.id}
                  className="mt-2 w-full bg-blue-500 text-white text-sm py-1 rounded hover:opacity-90"
                >
                  {completing === app.bookings!.id ? '処理中...' : '完了にする'}
                </button>
              )}

              {app.bookings?.status === 'completed' && !app.bookings.already_reviewed && (
                reviewingId === app.bookings.id ? (
                  <div className="mt-2 border-t pt-2">
                    <textarea
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      placeholder="コメント(任意)"
                      className="w-full text-sm border rounded p-1"
                    />
                    <button
                      onClick={() => handleSubmitReview(app.bookings!.id)}
                      disabled={submittingReview}
                      className="mt-1 w-full bg-green-500 text-white text-sm py-1 rounded"
                    >
                      {submittingReview ? '送信中...' : 'レビューを送信'}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setReviewingId(app.bookings!.id)}
                    className="mt-2 w-full bg-yellow-500 text-white text-sm py-1 rounded"
                  >
                    レビューを書く
                  </button>
                )
              )}

              {app.bookings?.status === 'completed' && app.bookings.already_reviewed && (
                <p className="mt-2 text-xs text-gray-400">レビュー投稿済み</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
