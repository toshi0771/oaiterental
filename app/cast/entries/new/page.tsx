'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewEntryPage() {
  const router = useRouter()
  const [entryDate, setEntryDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [purpose, setPurpose] = useState('')
  const [hourlyRate, setHourlyRate] = useState('')
  const [transactionType, setTransactionType] = useState<'receive' | 'pay'>('receive')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const res = await fetch('/api/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entry_date: entryDate,
          start_time: startTime,
          end_time: endTime,
          purpose,
          hourly_rate: Number(hourlyRate),
          transaction_type: transactionType,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'エントリーの作成に失敗しました')
        setSubmitting(false)
        return
      }

      router.push('/')
    } catch (err) {
      setError('通信エラーが発生しました')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen px-6 py-10 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-6">エントリー作成</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1">種別</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setTransactionType('receive')}
              className={`flex-1 py-2 rounded-lg border text-sm font-medium transition ${
                transactionType === 'receive'
                  ? 'bg-sky-500 text-white border-sky-500'
                  : 'bg-white text-gray-600 border-gray-300'
         }`}
      >
              時給をもらう
            </button>
            <button
              type="button"
              onClick={() => setTransactionType('pay')}
              className={`flex-1 py-2 rounded-lg border text-sm font-medium transition ${
                transactionType === 'pay'
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-white text-gray-600 border-gray-300'
        }`}
      >
             時給を払う
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">日付</label>
          <input
            type="date"
            required
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">開始時刻</label>
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">終了時刻</label>
            <input
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">目的</label>
          <input
            type="text"
            required
            placeholder="例: カフェでお話し相手"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">時給(円)</label>
          <input
            type="number"
            required
            min={0}
            value={hourlyRate}
            onChange={(e) => setHourlyRate(e.target.value)}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition disabled:opacity-50"
        >
          {submitting ? '作成中...' : 'エントリーを作成'}
        </button>
      </form>
    </div>
  )
}
