'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import MessageThread from '../../components/MessageThread'

type Application = {
  id: string
  applicant_id: string
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
    cast_id: string
  }
  users: {
    nickname: string
  }
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [completing, setCompleting] = useState<string | null>(null)
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [comment, setComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [userReviews, setUserReviews] = useState<{
    reviews: { id: string; comment: string | null }[]
  } | null>(null)
  const [viewingReviewsFor, setViewingReviewsFor] = useState<string | null>(null)
  const [openThreadId, setOpenThreadId] = useState<string | null>(null)
  const handleShowReviews = (applicantId: string) => {
    if (viewingReviewsFor === applicantId) {
      setViewingReviewsFor(null)
      return
    }
    fetch(`/api/reviews/${applicantId}`)
      .then(res => res.json())
      .then(data => {
        setUserReviews(data)
        setViewingReviewsFor(applicantId)
      })
  }
  const fetchApplications = () => {
    fetch('/api/applications')
      .then(res => res.json())
      .then(data => {
        setApplications(data)
        setLoading(false)
      })
  }

  useEffect(() => {
    fetchApplications()
  }, [])

  const handleConfirm = async (id: string) => {
    setConfirming(id)
    try {
      const res = await fetch(`/api/applications/${id}/confirm`, { method: 'PATCH' })
      if (res.ok) {
        fetchApplications()
      }
    } finally {
      setConfirming(null)
    }
  }

  const handleReject = async (id: string) => {
    setConfirming(id)
    try {
      const res = await fetch(`/api/applications/${id}/reject`, { method: 'PATCH' })
      if (res.ok) {
        fetchApplications()
      }
    } finally {
      setConfirming(null)
    }
  }

  const handleComplete = async (bookingId: string) => {
    setCompleting(bookingId)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/complete`, { method: 'PATCH' })
      if (res.ok) {
        fetchApplications()
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

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-gray-800">申込み一覧</h1>
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
                <span className="font-medium text-gray-800">{app.users.nickname}さん</span>
                <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700">
                  {app.status === 'pending' ? '承認待ち' : app.status === 'confirmed' ? '確定済み' : '不成立'}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                {app.entries.entry_date} {app.entries.start_time}〜{app.entries.end_time}
              </p>
              <p className="text-sm text-gray-600">目的: {app.entries.purpose}</p>
              {app.message && <p className="text-sm text-gray-700 mt-1">{app.message}</p>}
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
                className="mt-1 mr-3 text-xs text-blue-600 hover:underline"
              >
                {openThreadId === app.id ? 'メッセージを閉じる' : 'メッセージを見る'}
                {app.has_unread_messages && (
                  <span className="ml-1 inline-block w-2 h-2 rounded-full bg-red-500 align-middle" />
                )}
              </button>
              {openThreadId === app.id && <MessageThread applicationId={app.id} />}
              <button
                onClick={() => handleShowReviews(app.applicant_id)}
                className="mt-1 text-xs text-blue-600 hover:underline"
              >
                {viewingReviewsFor === app.applicant_id ? 'レビューを閉じる' : 'この方のレビューを見る'}
              </button>

              {viewingReviewsFor === app.applicant_id && userReviews && (
                <div className="mt-1 border-t pt-1 max-h-24 overflow-y-auto">
                  {userReviews.reviews.some(r => r.comment) ? (
                    userReviews.reviews
                      .filter(r => r.comment)
                      .map(r => (
                        <div key={r.id} className="text-xs text-gray-600 mb-1">
                          {r.comment}
                        </div>
                      ))
                  ) : (
                    <p className="text-xs text-gray-400">まだレビューはありません。</p>
                  )}
                </div>
              )}
              {app.status === 'pending' && (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleConfirm(app.id)}
                    disabled={confirming === app.id}
                    className="flex-1 bg-green-500 text-white text-sm py-1 rounded"
                  >
                    {confirming === app.id ? '処理中...' : 'この人に決める'}
                  </button>
                  <button
                    onClick={() => handleReject(app.id)}
                    disabled={confirming === app.id}
                    className="flex-1 bg-gray-300 text-gray-700 text-sm py-1 rounded"
                  >
                    見送る
                  </button>
                </div>
              )}

              {app.status === 'confirmed' && app.bookings?.status === 'confirmed' && (
                <button
                  onClick={() => handleComplete(app.bookings!.id)}
                  disabled={completing === app.bookings!.id}
                  className="mt-2 w-full bg-blue-500 text-white text-sm py-1 rounded"
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
