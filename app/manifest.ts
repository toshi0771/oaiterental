import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'お相手レンタル',
    short_name: 'お相手レンタル',
    description: '今日、近所で、1時間だけ。大阪の時間単位マッチング',
    start_url: '/',
    display: 'standalone',
    background_color: '#1b2440',
    theme_color: '#1b2440',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }
}
