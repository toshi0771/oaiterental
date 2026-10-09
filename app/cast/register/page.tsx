'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const AGE_RANGES = ['10代', '20代', '30代', '40代', '50代', '60代以上']
const AREAS = ['北摂', '京阪沿線', '大阪北', '大阪南', '大阪東', '近鉄沿線', '泉州']

export default function CastRegisterPage() {
  const router = useRouter()
  const [photoUrl, setPhotoUrl] = useState('')
  const [ageRange, setAgeRange] = useState('')
  const [bio, setBio] = useState('')
  const [realName, setRealName] = useState('')
  const [rateMin, setRateMin] = useState('')
  const [rateMax, setRateMax] = useState('')
  const [area, setArea] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [uploading, setUploading] = useState(false)

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/cast-profile/photo', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'アップロードに失敗しました')
      setPhotoUrl(data.url)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch('/api/cast-profile')
        if (!res.ok) return
        const data = await res.json()
        if (data.photo_url) setPhotoUrl(data.photo_url)
        if (data.age_range) setAgeRange(data.age_range)
        if (data.bio) setBio(data.bio)
        if (data.hourly_rate_min) setRateMin(String(data.hourly_rate_min))
        if (data.hourly_rate_max) setRateMax(String(data.hourly_rate_max))
        if (data.area) setArea(data.area)
        if (data.real_name && data.real_name !== 'unknown') setRealName(data.real_name)
      } catch {
        // 初回登録時はデータがなくてもエラーにしない
      }
    }
    loadProfile()
  }, [])

    const handleSubmit = async () => {
      if (!ageRange || !rateMin || !rateMax || !area) {
        setError('すべての項目を入力してください')
        return
    }

      setLoading(true)
       setError('')

      try {
        const res = await fetch('/api/cast-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
          photo_url: photoUrl,
          age_range: ageRange,
          bio,
          hourly_rate_min: Number(rateMin),
          hourly_rate_max: Number(rateMax),
          area,
          realName,
          }),
       })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'エラーが発生しました')
      }

        setSubmitted(true)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
     }
    }
  
    if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
        <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md text-center">
          <div className="text-4xl mb-4">✅</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">キャスト登録が完了しました</h1>
          <p className="text-sm text-gray-500 mb-6">
            プロフィールはいつでも「キャスト登録」画面から編集できます。
            </p>
            <button
            onClick={() => router.push('/cast/subscribe')}
            className="w-full bg-green-600 text-white rounded-lg py-3 font-medium hover:bg-green-700"
          >
            プラン選択へ進む
          </button>
        </div>
      </div>
      )
    }

    return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-8">
      <div className="bg-white rounded-2xl shadow-md p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-2">
          キャスト登録
        </h1>
        <p className="text-center text-gray-500 text-sm mb-8">
          レンタルされる側(キャスト)として活動するための情報を設定してください。<br />
          本名は運営の確認のみに使用され、公開されることはありません。<br />
          内容はあとからこの画面でいつでも編集できます。
        </p>
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            プロフィール写真
          </label>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gray-100 border border-gray-300 overflow-hidden flex items-center justify-center shrink-0">
              {photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoUrl} alt="プロフィール写真" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-300 text-xs">未設定</span>
              )}
            </div>
            <div>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                disabled={uploading}
                className="text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">
                顔写真でなくてもOKです(後ろ姿、アバター、イラストなど)。5MBまで。
              </p>
              {uploading && <p className="text-xs text-green-600 mt-1">アップロード中...</p>}
            </div>
          </div>
        </div>

        <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 mb-1">
            本名
        </label>
        <input
            type="text"
            value={realName}
            onChange={(e) => setRealName(e.target.value)}
            placeholder="例：山田花子"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        />
        <p className="text-xs text-gray-400 mt-1">
            本名は運営のみが確認し、他のユーザーには公開されません
        </p>
        </div>
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            自己紹介
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="よろしくお願いします！"
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            年代
          </label>
          <div className="grid grid-cols-3 gap-2">
            {AGE_RANGES.map((age) => (
              <button
                key={age}
                onClick={() => setAgeRange(age)}
                className={`py-2 rounded-lg border text-sm font-medium transition-colors ${
                  ageRange === age
                    ? 'bg-green-500 text-white border-green-500'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
                }`}
              >
                {age}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            時給の目安（円）(受取・支払い共通)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={rateMin}
              onChange={(e) => setRateMin(e.target.value)}
              placeholder="1000"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <span className="text-gray-500">〜</span>
            <input
              type="number"
              value={rateMax}
              onChange={(e) => setRateMax(e.target.value)}
              placeholder="2000"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            実際の金額はエントリー作成時に都度設定できます
          </p>
        </div>

        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            エリア
          </label>
          <div className="grid grid-cols-2 gap-2">
            {AREAS.map((a) => (
              <button
                key={a}
                onClick={() => setArea(a)}
                className={`py-2 rounded-lg border text-sm font-medium transition-colors ${
                  area === a
                    ? 'bg-green-500 text-white border-green-500'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
                }`}
              >
                {a}
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
          className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? '登録中...' : 'キャスト登録する'}
        </button>
      </div>
    </div>
  )
}
