'use client'

import { useEffect, useState } from 'react'

type AdminUser = {
  id: string
  nickname: string
  real_name: string
  email: string
  gender: string
  role: string
  is_blacklisted: boolean
  blacklist_reason: string | null
  created_at: string
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [reasonDraft, setReasonDraft] = useState<Record<string, string>>({})

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users')
    if (res.ok) {
      setUsers(await res.json())
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const toggleBlacklist = async (user: AdminUser) => {
    const next = !user.is_blacklisted
    const reason = next ? (reasonDraft[user.id] ?? '') : undefined

    await fetch(`/api/admin/users/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_blacklisted: next, blacklist_reason: reason }),
    })
    fetchUsers()
  }

  if (loading) return <p>読み込み中...</p>

  return (
    <div>
      <h1 className="text-xl font-bold mb-4">ユーザー管理</h1>
      <div className="bg-white rounded border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-2">ニックネーム</th>
              <th className="p-2">実名</th>
              <th className="p-2">メール</th>
              <th className="p-2">ロール</th>
              <th className="p-2">登録日</th>
              <th className="p-2">ブラックリスト</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className={`border-t ${u.is_blacklisted ? 'bg-red-50' : ''}`}>
                <td className="p-2">{u.nickname}</td>
                <td className="p-2">{u.real_name}</td>
                <td className="p-2">{u.email}</td>
                <td className="p-2">{u.role}</td>
                <td className="p-2">{new Date(u.created_at).toLocaleDateString('ja-JP')}</td>
                <td className="p-2">
                  {u.is_blacklisted ? (
                    <div>
                      <span className="text-red-600 font-bold">登録済み</span>
                      {u.blacklist_reason && (
                        <p className="text-xs text-gray-500">理由: {u.blacklist_reason}</p>
                      )}
                      <button
                        onClick={() => toggleBlacklist(u)}
                        className="text-xs text-blue-600 hover:underline block mt-1"
                      >
                        解除する
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        placeholder="理由(任意)"
                        value={reasonDraft[u.id] ?? ''}
                        onChange={e =>
                          setReasonDraft(prev => ({ ...prev, [u.id]: e.target.value }))
                        }
                        className="text-xs border rounded px-1 py-0.5 mr-1"
                      />
                      <button
                        onClick={() => toggleBlacklist(u)}
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
