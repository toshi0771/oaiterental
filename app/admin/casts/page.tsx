'use client'

import { useEffect, useState } from 'react'

type AdminCast = {
  id: string
  user_id: string
  nickname: string
  is_blacklisted: boolean
  blacklist_reason: string | null
  area: string
  hourly_rate_min: number
  hourly_rate_max: number
  created_at: string
  subscription: {
    plan_type: string
    status: string | null
    trial_ends_at: string | null
  } | null
}

const PLAN_LABEL: Record<string, string> = {
  free: 'なし(登録前)',
  basic: '基本(300円/月)',
  pro: 'プロ(3000円/月)',
}

export default function AdminCastsPage() {
  const [casts, setCasts] = useState<AdminCast[]>([])
  const [loading, setLoading] = useState(true)
  const [reasonDraft, setReasonDraft] = useState<Record<string, string>>({})

  const fetchCasts = async () => {
    const res = await fetch('/api/admin/casts')
    if (res.ok) {
      setCasts(await res.json())
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchCasts()
  }, [])

  const toggleBlacklist = async (cast: AdminCast) => {
    const next = !cast.is_blacklisted
    const reason = next ? (reasonDraft[cast.user_id] ?? '') : undefined

    await fetch(`/api/admin/users/${cast.user_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_blacklisted: next, blacklist_reason: reason }),
    })
    fetchCasts()
  }

  if (loading) return <p>読み込み中...</p>

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">キャスト管理</h1>
      <div className="bg-white rounded border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-2">ニックネーム</th>
              <th className="p-2">エリア</th>
              <th className="p-2">時給レンジ</th>
              <th className="p-2">プラン</th>
              <th className="p-2">トライアル終了日</th>
              <th className="p-2">登録日</th>
              <th className="p-2">ブラックリスト</th>
            </tr>
          </thead>
          <tbody>
            {casts.map(c => (
              <tr key={c.id} className={`border-t ${c.is_blacklisted ? 'bg-red-50' : ''}`}>
                <td className="p-2">{c.nickname}</td>
                <td className="p-2">{c.area}</td>
                <td className="p-2">
                  {c.hourly_rate_min}〜{c.hourly_rate_max}円
                </td>
                <td className="p-2">
                  {c.subscription ? PLAN_LABEL[c.subscription.plan_type] ?? c.subscription.plan_type : '-'}
                </td>
                <td className="p-2">
                  {c.subscription?.trial_ends_at
                    ? new Date(c.subscription.trial_ends_at).toLocaleDateString('ja-JP')
                    : '-'}
                </td>
                <td className="p-2">{new Date(c.created_at).toLocaleDateString('ja-JP')}</td>
                <td className="p-2">
                  {c.is_blacklisted ? (
                    <div>
                      <span className="text-red-600 font-bold">登録済み</span>
                      {c.blacklist_reason && (
                        <p className="text-xs text-gray-500">理由: {c.blacklist_reason}</p>
                      )}
                      <button
                        onClick={() => toggleBlacklist(c)}
                        className="text-xs text-blue-600 hover:underline block mt-1"
                      >
                        解除する
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        placeholder="理由(任意)"
                        value={reasonDraft[c.user_id] ?? ''}
                        onChange={e =>
                          setReasonDraft(prev => ({ ...prev, [c.user_id]: e.target.value }))
                        }
                        className="text-xs border rounded px-1 py-0.5 mr-1"
                      />
                      <button
                        onClick={() => toggleBlacklist(c)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        追加する
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
