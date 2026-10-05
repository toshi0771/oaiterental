'use client'

import Link from 'next/link'
import InquiryThread from '../components/InquiryThread'

export default function ContactPage() {
  return (
    <div className="max-w-xl mx-auto p-4">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-xl font-bold">運営へのお問い合わせ</h1>
        <Link href="/notices" className="text-sm text-blue-600 hover:underline">
          お知らせに戻る
        </Link>
      </div>
      <p className="text-xs text-gray-500 mb-4">
        運営からの返信はこの画面に届きます。返信があるとホーム画面右上の「お知らせ」に印が付きます(メールでの通知は行っていません)。
        お返事にお時間をいただく場合があります。
      </p>
      <div className="border rounded-lg p-3 bg-white">
        <InquiryThread endpoint="/api/inquiries" mySide="user" />
      </div>
    </div>
  )
}
