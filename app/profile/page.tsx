'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ProfilePage() {
  const router = useRouter()
  const [nickname, setNickname] = useState('')
  const [gender, setGender] = useState('')
  const [ageRange, setAgeRange] = useState('')
  const [realName, setRealName] = useState('')
  const [ageConfirmed, setAgeConfirmed] = useState(false)
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [alreadyConsented, setAlreadyConsented] = useState(false)
  const [photoUrl, setPhotoUrl] = useState('')
  const [area, setArea] = useState('')
  const [bio, setBio] = useState('')
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
useEffect(() => {
  const loadProfile = async () => {
    try {
      const res = await fetch('/api/profile')
      if (!res.ok) return
      const data = await res.json()
      if (data.nickname) setNickname(data.nickname)
      if (data.gender) setGender(data.gender)
      if (data.age_range) setAgeRange(data.age_range)
      if (data.real_name) setRealName(data.real_name)
      if (data.photo_url) setPhotoUrl(data.photo_url)
      if (data.area) setArea(data.area)
      if (data.bio) setBio(data.bio)
      if (data.already_consented) setAlreadyConsented(true)
    } catch {
      // 初回登録時はデータがなくてもエラーにしない
    }
  }
  loadProfile()
}, [])

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

  const handleSubmit = async () => {
    if (!nickname || !realName.trim() || !gender || !ageRange) {
      setError('すべての項目を入力してください')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, gender, age_range: ageRange, real_name: realName, age_confirmed: ageConfirmed, terms_accepted: termsAccepted, photo_url: photoUrl, area, bio }),
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            プロフィール写真（任意）
          </label>
          <div className="flex items-center gap-3">
            {photoUrl ? (
              <img src={photoUrl} alt="プロフィール写真" className="w-16 h-16 rounded-full object-cover border border-gray-200" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200" />
            )}
            <div className="text-xs text-gray-500">
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} disabled={uploading} className="text-sm" />
              <p className="mt-1">顔写真でなくてもOKです（後ろ姿、アバター、イラストなど）。5MBまで。</p>
              {uploading && <p className="mt-1 text-green-600">アップロード中...</p>}
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
            placeholder="例：山田 太郎"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
          <p className="text-xs text-gray-500 mt-1">
            本名は管理者のみが確認できます。他のユーザーには表示されません。
          </p>
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ニックネーム
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="例：たろう"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
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
                    ? 'bg-green-500 text-white border-green-500'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-green-400'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            年代
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['18〜19歳', '20代', '30代', '40代', '50代', '60代以上'].map((age) => (
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            エリア（任意）
          </label>
          <div className="grid grid-cols-2 gap-2">
            {['北摂', '京阪沿線', '大阪北', '大阪南', '大阪東', '近鉄沿線', '泉州'].map((a) => (
              <button
                key={a}
                onClick={() => setArea(area === a ? '' : a)}
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

        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            自己紹介（任意）
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="例：カフェ巡りが好きです。"
            className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </div>

{!alreadyConsented && (
                <div className="mb-6 space-y-3">
          <label className="flex items-start gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={ageConfirmed}
              onChange={(e) => setAgeConfirmed(e.target.checked)}
              className="mt-1"
            />
            <span>私は18歳以上です</span>
          </label>
          <label className="flex items-start gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(e) => setTermsAccepted(e.target.checked)}
              className="mt-1"
            />
            <span>
              <a href="/legal" target="_blank" rel="noopener noreferrer" className="text-green-600 underline">
                利用規約・プライバシーポリシー
              </a>
              に同意します
            </span>
          </label>
        </div>
        )}

        {error && (
          <p className="text-red-500 text-sm text-center mb-4">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || uploading || (!alreadyConsented && (!ageConfirmed || !termsAccepted))}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? '保存中...' : '保存して始める'}
        </button>
      </div>
    </div>
  )
}
