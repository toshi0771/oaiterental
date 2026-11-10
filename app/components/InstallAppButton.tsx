'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// beforeinstallprompt はページ読み込み直後に発火するため、読み込み時に受け取って保持する
let deferredPrompt: InstallPromptEvent | null = null
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((f) => f())

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e as InstallPromptEvent
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null
    notify()
  })
}

export default function InstallAppButton({ size = 32 }: { size?: number }) {
  const [open, setOpen] = useState(false)
  const [canInstall, setCanInstall] = useState(false)
  const [standalone, setStandalone] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    const sync = () => setCanInstall(deferredPrompt !== null)
    sync()
    listeners.add(sync)
    setStandalone(window.matchMedia('(display-mode: standalone)').matches)
    setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent))
    return () => {
      listeners.delete(sync)
    }
  }, [])

  const install = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    await deferredPrompt.userChoice
    deferredPrompt = null
    setCanInstall(false)
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="アプリとして追加する方法を見る"
        title="アプリとして追加"
        className="shrink-0 rounded-lg overflow-hidden"
        style={{ width: size, height: size }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/icon-192.png" alt="" width={size} height={size} />
      </button>

      {open &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
              <div className="px-6 pt-6 pb-3 border-b flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800">アプリとして追加</h2>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="閉じる"
                  className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
              <div className="px-6 py-5 space-y-4 text-sm text-gray-700 leading-relaxed">
                <p>
                  お相手レンタルを、スマホやパソコンのアプリのように、アイコンから一度のタップで開けるようにできます。ブラウザでURLを探す手間がなくなります。
                </p>

                {standalone ? (
                  <p className="font-bold text-green-700">すでにアプリとして開いています。</p>
                ) : canInstall ? (
                  <button
                    type="button"
                    onClick={install}
                    className="w-full rounded-full bg-green-600 text-white font-bold py-3 hover:bg-green-500"
                  >
                    アプリとして追加する
                  </button>
                ) : isIOS ? (
                  <p>
                    画面下の共有ボタン(四角から上向きの矢印)を押して、「ホーム画面に追加」を選んでください。
                  </p>
                ) : (
                  <p>
                    ブラウザのアドレスバーの右側にあるインストールのアイコン、またはメニューの「インストール」「アプリとして保存」から追加できます(Chrome・Edge)。Macの Safari は、共有ボタンから「Dockに追加」を選んでください。
                  </p>
                )}

                <p className="text-xs text-gray-500">
                  パソコンでは、Dockやスタートメニュー、アプリ一覧に追加されます。そこからデスクトップへのショートカット作成や、タスクバーへの固定ができます。
                </p>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
