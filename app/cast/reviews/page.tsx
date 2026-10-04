'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type Review = {
  id: string
  comment: string | null
  created_at: string
}

export default function CastReviewsPage() {
  const [reviews, setReviews] = useState<Review[] | null>(null)
  const [forbidden, setForbidden] = useState(false)

  useEffect(() => {
    fetch('/api/cast/reviews').then(async res => {
      if (res.status === 403) {
        setForbidden(true)
        return
      }
      setReviews(await res.json())
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

  if (!reviews) return <p className="p-4">読み込み中...</p>

  return (
    <div className="max-w-xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">レビュー管理</h1>
      {reviews.length === 0 ? (
        <p className="text-sm text-gray-500">まだレビューはありません。</p>
      ) : (
        <div className="space-y-2">
          {reviews
            .filter(r => r.comment)
            .map(r => (
              <div key={r.id} className="border rounded p-3 bg-white">
                <p className="text-sm">{r.comment}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(r.created_at).toLocaleDateString('ja-JP')}
                </p>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
