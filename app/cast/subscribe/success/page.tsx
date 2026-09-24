'use client'

import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

export default function SubscribeSuccessPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
      <h1 className="text-xl font-bold mb-2">お申し込みが完了しました</h1>
      <p className="text-gray-600 mb-8">
        キャストプランの登録が完了しました。
        <br />
        マッチングが成立するまで料金は発生しません。
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition"
      >
        ホームに戻る
      </Link>
    </div>
  )
}
