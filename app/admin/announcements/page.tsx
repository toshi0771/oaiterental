'use client'

import { useEffect, useState } from 'react'

type Announcement = {
  id: string
  title: string
  body: string
  target: 'all' | 'user' | 'cast'
  created_at: string
}

const TARGET_LABEL: Record<string, string> = {
  all: '全員',
  user: 'ユーザーのみ',
  cast: 'キャストのみ',
}

export default function AdminAnnouncementsPage() {
  const [items, setItems] = useState<Announcement[] | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [target, setTarget] = useState<'all' | 'user' | 'cast'>('all')
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    const res = await fetch('/api/admin/announcements')
    if (res.ok) setItems(await res.json())
  }

  useEffect(() => {
    load()
  }, [])

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) {
      setError('タイトルと本文を入力してください')
      return
    }
    if (!window.confirm(`「${TARGET_LABEL[target]}」にお知らせを配信します。よろしいですか?`)) return

    setSending(true)
    setError('')
    setMessage('')
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, target }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || '配信に失敗しました')
      setTitle('')
      setBody('')
      setMessage('配信しました')
      load()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  const handleDelete = async (item: Announcement) => {
    if (!window.confirm(`「${item.title}」を削除します。利用者の画面からも消えます。よろしいですか?`)) return
    await fetch(`/api/admin/announcements/${item.id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-bold mb-4">お知らせ配信</h1>

      <div className="bg-white border rounded p-4 mb-6 space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">宛先</label>
          <select
            value={target}
            onChange={e => setTarget(e.target.value as 'all' | 'user' | 'cast')}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="all">全員</option>
            <option value="user">ユーザーのみ</option>
            <option value="cast">キャストのみ</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">タイトル</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={100}
            className="w-full border rounded px-2 py-1 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">本文</label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={5}
            maxLength={2000}
            className="w-full border rounded px-2 py-1 text-sm"
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={sending}
          className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2 rounded disabled:opacity-50"
        >
          {sending ? '配信中...' : '配信する'}
        </button>
        {message && <p className="text-green-600 text-sm">{message}</p>}
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <p className="text-xs text-gray-400">
          配信するとアプリ内のお知らせに表示されます(メールでの通知は行いません)。
        </p>
      </div>

      <h2 className="font-bold mb-2">配信済み</h2>
      {!items ? (
        <p className="text-sm text-gray-500">読み込み中...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-500">まだ配信していません。</p>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="bg-white border rounded p-3">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">{item.title}</span>
                <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                  {TARGET_LABEL[item.target]}
                </span>
                <span className="text-xs text-gray-400 ml-auto">
                  {new Date(item.created_at).toLocaleString('ja-JP')}
                </span>
              </div>
              <p className="text-sm text-gray-600 whitespace-pre-wrap break-words mt-1">
                {item.body}
              </p>
              <button
                onClick={() => handleDelete(item)}
                className="text-xs text-red-600 hover:underline mt-2"
              >
                削除する
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
