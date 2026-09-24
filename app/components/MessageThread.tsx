'use client'

import { useEffect, useRef, useState } from 'react'

type Message = {
  id: string
  sender_id: string
  content: string
  created_at: string
}

const POLL_INTERVAL_MS = 4000

export default function MessageThread({ applicationId }: { applicationId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [myUserId, setMyUserId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/messages?application_id=${applicationId}`)
      if (!res.ok) return
      const data = await res.json()
      setMessages(data.messages)
      setMyUserId(data.my_user_id)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
    fetch('/api/messages/mark-read', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ application_id: applicationId }),
    })
    const timer = setInterval(fetchMessages, POLL_INTERVAL_MS)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'nearest' })
  }, [messages.length])

  const handleSend = async () => {
    if (!input.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: applicationId, content: input }),
      })
      if (res.ok) {
        setInput('')
        fetchMessages()
      }
    } finally {
      setSending(false)
    }
  }

  if (loading) return <p className="text-xs text-gray-400 mt-2">読み込み中...</p>

  return (
    <div className="mt-2 border-t pt-2">
      <div className="max-h-40 overflow-y-auto space-y-1 mb-2 pr-1">
        {messages.length === 0 ? (
          <p className="text-xs text-gray-400">まだメッセージはありません。</p>
        ) : (
          messages.map(m => (
            <div
              key={m.id}
              className={`text-sm px-2 py-1 rounded max-w-[80%] ${
                m.sender_id === myUserId
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
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="メッセージを入力"
          className="flex-1 text-sm border rounded px-2 py-1"
        />
        <button
          onClick={handleSend}
          disabled={sending || !input.trim()}
          className="text-sm bg-blue-500 text-white px-3 py-1 rounded disabled:opacity-50"
        >
          送信
        </button>
      </div>
    </div>
  )
}
