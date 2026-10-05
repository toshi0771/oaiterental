'use client'

import { useEffect, useRef, useState } from 'react'

type InquiryMessage = {
  id: string
  sender_role: 'user' | 'admin'
  content: string
  created_at: string
}

const POLL_INTERVAL_MS = 4000

/**
 * endpoint: GET(履歴) / POST(送信) / PATCH(既読) を持つAPIのパス
 * mySide : このコンポーネントを見ている側('user' = 利用者, 'admin' = 管理者)
 */
export default function InquiryThread({
  endpoint,
  mySide,
}: {
  endpoint: string
  mySide: 'user' | 'admin'
}) {
  const [messages, setMessages] = useState<InquiryMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastMarkedId = useRef<string | null>(null)

  const markRead = () => {
    fetch(endpoint, { method: 'PATCH' })
  }

  const fetchMessages = async () => {
    try {
      const res = await fetch(endpoint)
      if (res.status === 401 || res.status === 403) {
        setUnauthorized(true)
        return
      }
      if (!res.ok) return
      const data = await res.json()
      const list: InquiryMessage[] = data.messages
      setMessages(list)

      // 相手からの最新メッセージを表示したら既読にする(同じメッセージでは1回だけ)
      const last = list[list.length - 1]
      if (last && last.sender_role !== mySide && lastMarkedId.current !== last.id) {
        lastMarkedId.current = last.id
        markRead()
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    lastMarkedId.current = null
    setMessages([])
    setLoading(true)
    fetchMessages()
    const timer = setInterval(fetchMessages, POLL_INTERVAL_MS)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'nearest' })
  }, [messages.length])

  const handleSend = async () => {
    if (!input.trim()) return
    setSending(true)
    setError('')
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: input }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || '送信に失敗しました')
      setInput('')
      fetchMessages()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  if (unauthorized) {
    return <p className="text-sm text-gray-500">ログインが必要です。</p>
  }
  if (loading) return <p className="text-xs text-gray-400">読み込み中...</p>

  return (
    <div>
      <div className="max-h-80 overflow-y-auto space-y-1 mb-2 pr-1">
        {messages.length === 0 ? (
          <p className="text-xs text-gray-400">まだメッセージはありません。</p>
        ) : (
          messages.map(m => (
            <div
              key={m.id}
              className={`text-sm px-2 py-1 rounded max-w-[80%] whitespace-pre-wrap break-words ${
                m.sender_role === mySide
                  ? 'bg-blue-500 text-white ml-auto'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {m.content}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-1">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="メッセージを入力"
          rows={2}
          className="flex-1 text-sm border rounded px-2 py-1"
        />
        <button
          onClick={handleSend}
          disabled={sending || !input.trim()}
          className="text-sm bg-blue-500 text-white px-3 py-1 rounded disabled:opacity-50 self-end"
        >
          送信
        </button>
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}
