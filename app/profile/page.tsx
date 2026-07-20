'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const router = useRouter()
  const [nickname, setNickname] = useState('')
  const [gender, setGender] = useState('')
  const [ageRange, setAgeRange] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!nickname || !gender || !ageRange) {
      setError('すべての項目を入力してください')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, gender, age_range: ageRange }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'エラーが発生しました')
      }

      router.push('/')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
          プロフィール設定
        </h1>
        <p className="text-center text-gray-500 text-sm mb-8">
          基本情報を設定してください
        </p>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ニックネーム
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="例：たろう"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-400"
          />
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            性別
          </label>
          <div className="flex gap-3">
            {[{ value: 'male', label: '男性' }, { value: 'female', label: '女性' }].map((g) => (
              <button
                key={g.value}
                onClick={() => setGender(g.value)}
                className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                  gender === g.value
                    ? 'bg-pink-500 text-white border-pink-500'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-pink-400'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            年代
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['10代', '20代', '30代', '40代', '50代', '60代以上'].map((age) => (
              <button
                key={age}
                onClick={() => setAgeRange(age)}
                className={`py-2 rounded-lg border text-sm font-medium transition-colors ${
                  ageRange === age
                    ? 'bg-pink-500 text-white border-pink-500'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-pink-400'
                }`}
              >
                {age}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center mb-4">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? '保存中...' : '保存して始める'}
        </button>
      </div>
    </div>
  )
}
