'use client'

import { useState } from 'react'

const PLANS = [
  { id: 'basic', name: '基本プラン', price: '300円/月', desc: 'キャスト活動を始めたい方向け' },
  { id: 'pro', name: 'プロプラン', price: '3,000円/月', desc: '本格的に活動したい方向け' },
]

export default function SubscribePage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState('')

  const handleSelect = async (plan: string) => {
    setLoading(plan)
    setError('')
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'エラーが発生しました')
      }
      const data = await res.json()
      window.location.href = data.url
    } catch (err: any) {
      setError(err.message)
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">プランを選択</h1>
        <p className="text-center text-gray-500 text-sm mb-8">
          いつでもプラン変更・解約できます。
        </p>

        <div className="space-y-4">
          {PLANS.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelect(p.id)}
              disabled={loading !== null}
              className="w-full text-left border border-gray-300 rounded-xl p-5 hover:border-green-600 hover:bg-green-50 transition disabled:opacity-50"
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-800">{p.name}</span>
                <span className="text-green-600 font-bold">{p.price}</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">{p.desc}</p>
              {loading === p.id && (
                <p className="text-xs text-gray-400 mt-2">決済ページに移動しています...</p>
              )}
            </button>
          ))}
        </div>

        {error && <p className="text-red-600 text-sm mt-4 text-center">{error}</p>}
      </div>
    </div>
  )
}
