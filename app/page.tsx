'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { APIProvider, Map, AdvancedMarker, InfoWindow, Pin } from '@vis.gl/react-google-maps'
import { Show, UserButton } from '@clerk/nextjs'

type Entry = {
  id: string
  entry_date: string
  start_time: string
  end_time: string
  purpose: string
  hourly_rate: number
  transaction_type: 'receive' | 'pay'
  is_own: boolean
  cast_profiles: {
    id: string
    user_id: string
    age_range: string
    area: string
    lat_fuzzy: number
    lng_fuzzy: number
    users: {
      gender: string
      nickname: string
    }
  }
}

function GuideModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-6 pt-6 pb-3 border-b flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">初めての方へ</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>
        <div className="px-6 py-5 space-y-5 text-sm text-gray-700 leading-relaxed">

          <section>
            <h3 className="font-bold text-gray-900 mb-1">🤝 お相手レンタルとは？</h3>
            <p>「時間を共有したい人」と「時間を提供したい人」をつなぐマッチングサービスです。食事・お茶・スポーツ観戦・お買い物同行など、目的に合ったお相手を見つけることができます。</p>
          </section>

          <section>
            <h3 className="font-bold text-gray-900 mb-1">📍 対象エリア</h3>
            <p>現在は<strong>大阪府内</strong>（北摂、大阪、泉州など）を中心にサービスを提供しています。</p>
          </section>

          <section>
            <h3 className="font-bold text-gray-900 mb-1">💰 料金について</h3>
            <p>
              料金はキャストが自由に設定します(目安:1,000〜2,000円/時)。
             「時給をもらう」エントリーはキャストが報酬を受け取り、
              「時給を払う」エントリーはキャストが相手に対価を支払う形式です。
            </p>  
          </section>
          
          <section>
              <h3 className="font-bold text-gray-900 mb-1">👥 役割について</h3>
              <p>お相手レンタルには「レンタルする人」と「レンタルされる人(キャスト)」の2つの役割があります。まずは全員「レンタルする人」として登録し、キャストとして活動したい方は登録後にキャスト申請ができます。</p>
          </section>

          <section>
              <h3 className="font-bold text-gray-900 mb-1">💳 キャストの方へ</h3>
              <p>
                レンタルする側は完全無料でご利用いただけます。
                キャストは「時給をもらう」エントリーと「時給を払う」エントリーの
+               どちらも登録できます。ご自身のスタイルに合わせてお選びください。
                月額プランへのご加入が必要です(基本プラン 300円/月、プロプラン 3,000円/月)。
              </p>
              <p className="mt-2 text-sm text-gray-600">
                登録の流れ:「初めての方へ」を閉じたあと、右上のメニューから「キャスト登録」を選び、本名(運営確認用、非公開)・年代・自己紹介・時給の目安・活動エリアを入力して送信します。あとから何度でも「キャスト登録」画面で内容を編集できます。
              </p>
          </section>

          <section>
            <h3 className="font-bold text-gray-900 mb-1">🗺️ 使い方</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li>マップ上のピンをタップしてキャストを探す</li>
              <li>プロフィール・日時・目的を確認して申し込む</li>
              <li>キャストから返信が届いたらマッチング成立</li>
              <li>当日、待ち合わせ場所でお会いしてレンタル開始</li>
              <li>終了後、お互いにレビューを投稿</li>
            </ol>
          </section>

          <section>
            <h3 className="font-bold text-gray-900 mb-1">🔒 安全への取り組み</h3>
            <p>全ユーザーの本人確認を実施しています。不適切な行為はレビューで即時共有され、悪質なユーザーはアカウント停止の対象となります。</p>
          </section>

          <section>
            <h3 className="font-bold text-gray-900 mb-1">⚠️ ご注意</h3>
            <p>本サービスは出会い系サイト規制法に基づき適切に運営されています。18歳未満の方はご利用いただけません。性的なサービスの提供・要求は固く禁じています。</p>
          </section>

        </div>
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full bg-green-500 text-white py-2 rounded-xl font-medium hover:bg-green-600"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [selected, setSelected] = useState<Entry | null>(null)
  const [showGuide, setShowGuide] = useState(false)
  const [applying, setApplying] = useState(false)
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set()) 
  const [unreadCount, setUnreadCount] = useState(0)
  const [castReviews, setCastReviews] = useState<{
    average: number
    count: number
    reviews: { id: string; satisfaction_score: number; comment: string | null }[]
  } | null>(null)

  useEffect(() => {
    fetch('/api/entries/map')
      .then(res => res.json())
      .then(data => setEntries(data))
  }, [])

  useEffect(() => {
    fetch('/api/applications/mine/unread-count')
      .then(res => res.json())
      .then(data => setUnreadCount(data.count))
  }, [])
  
    useEffect(() => {
    if (selected?.cast_profiles?.user_id) {
      fetch(`/api/reviews/${selected.cast_profiles.user_id}`)
        .then(res => res.json())
        .then(data => setCastReviews(data))
    } else {
      setCastReviews(null)
    }
  }, [selected])

  const handleApply = async (entryId: string) => {
    setApplying(true)
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry_id: entryId, message: '' }),
      })
      if (res.ok) {
        setAppliedIds(prev => new Set(prev).add(entryId))
      }
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-white shadow px-4 py-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-800">お相手レンタル</h1>
        <nav className="flex items-center gap-4">
          <button
            onClick={() => setShowGuide(true)}
            className="text-sm text-gray-600 hover:text-green-500"
          >
            初めての方へ
          </button>

          <Link href="/my-applications" className="relative text-sm text-gray-600 hover:text-green-500">
            申込み状況
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Link>

          <Show when="signed-out">
          <a href="/sign-in" className="text-sm text-blue-600 hover:underline">
            ログイン
          </a>
          </Show>
          <Show when="signed-in">
          <UserButton />
          </Show>
        </nav>
      </header>

      {showGuide && <GuideModal onClose={() => setShowGuide(false)} />}

      <main className="flex-1">
        <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
          <Map
            mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_ID}
            defaultCenter={{ lat: 34.6937, lng: 135.5023 }}
            defaultZoom={12}
            
            style={{ width: '100%', height: '100%' }}
          >
            {entries.map(entry => (
              <AdvancedMarker
                key={entry.id}
                position={{
                  lat: entry.cast_profiles?.lat_fuzzy,
                  lng: entry.cast_profiles?.lng_fuzzy,
                }}
                onClick={() => setSelected(entry)}
              
              >
                <Pin
                  background={entry.transaction_type === 'pay' ? '#f97316' : '#0ea5e9'}
                  borderColor={entry.transaction_type === 'pay' ? '#c2410c' : '#0369a1'}
                  glyphColor={entry.transaction_type === 'pay' ? '#fed7aa' : '#e0f2fe'}
                />
              </AdvancedMarker>              
            ))}

            {selected && (
              <InfoWindow
                position={{
                  lat: selected.cast_profiles?.lat_fuzzy,
                  lng: selected.cast_profiles?.lng_fuzzy,
                }}
                onCloseClick={() => setSelected(null)}
              >
                <div className="p-2 min-w-[160px]">
                  <p className="font-bold text-gray-800">
                    {selected.cast_profiles?.users?.nickname}
                  </p>
                  <p className="text-xs font-medium mb-1">
                    <span
                      className={`px-2 py-0.5 rounded-full ${
                        selected.transaction_type === 'pay'
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-sky-100 text-sky-700'
                      }`}           
                    >
                      {selected.transaction_type === 'pay' ? '時給を払う' : '時給をもらう'}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    {selected.cast_profiles?.age_range}・
                    {selected.cast_profiles?.users?.gender === 'female' ? '女性' :
                     selected.cast_profiles?.users?.gender === 'male' ? '男性' : 'その他'}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selected.entry_date} {selected.start_time}〜{selected.end_time}
                  </p>
                  <p className="text-sm text-gray-600">
                    目的：{selected.purpose}
                  </p>
                  <p className="text-sm font-medium text-green-600">
                    ¥{selected.hourly_rate.toLocaleString()}/時
                    {selected.transaction_type === 'pay' ? '(お支払い)' : '(お受け取り)'}
                  </p>

                  {!selected.is_own && (
                    <button
                      className="mt-2 w-full bg-green-500 text-white ..."
                      onClick={() => handleApply(selected.id)}
                      disabled={applying || appliedIds.has(selected.id)}
                    >
                      {appliedIds.has(selected.id) ? '申込済み' : applying ? '送信中...' : '申し込む'}
                    </button>
                  )} 

                  {castReviews && castReviews.reviews.some(r => r.comment) && (
                    <div className="mt-2 border-t pt-1 max-h-24 overflow-y-auto">
                      <p className="text-xs text-gray-400 mb-1">いただいたレビュー</p>
                      {castReviews.reviews
                        .filter(r => r.comment)
                        .map(r => (
                          <div key={r.id} className="text-xs text-gray-600 mb-1">
                            {r.comment}
                          </div>
                      ))}
                    </div>
                  )}             
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      </main>
    </div>
  )
}
