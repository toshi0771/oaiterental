import styles from './ShareButtons.module.css'

type Props = {
  tone?: 'light' | 'dark' // 背景が明るいか暗いか
  size?: 'md' | 'sm' // sm はヘッダー用の小さいサイズ
  path?: string // 共有するページ(既定はLP)
}

// 本番のURL。Renderに公開したら .env / Renderの環境変数に設定する
// 例: NEXT_PUBLIC_SITE_URL=https://oaiterental.info
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
const TEXT = 'お相手レンタル:今日、近所で、1時間だけ。大阪の時間単位マッチング'
const HASHTAG = 'お相手レンタル'

const ICONS: Record<string, string> = {
  x: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  facebook:
    'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
  line:
    'M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314',
}

export default function ShareButtons({ tone = 'light', size = 'md', path = '/lp' }: Props) {
  // 共有された経路をGA4で見分けるため、utm_source を付ける
  const target = (network: string) =>
    encodeURIComponent(`${SITE_URL}${path}?utm_source=${network}&utm_medium=share`)
  const text = encodeURIComponent(TEXT)

  const items = [
    {
      key: 'x',
      label: 'X',
      aria: 'Xで共有(新しいタブで開きます)',
      href: `https://twitter.com/intent/tweet?text=${text}&url=${target('x')}&hashtags=${encodeURIComponent(HASHTAG)}`,
    },
    {
      key: 'facebook',
      label: 'Facebook',
      aria: 'Facebookで共有(新しいタブで開きます)',
      href: `https://www.facebook.com/sharer/sharer.php?u=${target('facebook')}`,
    },
    {
      key: 'line',
      label: 'LINE',
      aria: 'LINEで友達に知らせる(新しいタブで開きます)',
      href: `https://social-plugins.line.me/lineit/share?url=${target('line')}&text=${text}`,
    },
  ]

  return (
    <ul
      className={`${styles.row} ${tone === 'dark' ? styles.dark : ''} ${size === 'sm' ? styles.sm : ''}`}
    >
      {items.map((i) => (
        <li key={i.key}>
          <a
            className={styles.btn}
            href={i.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={i.aria}
            title={i.label}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
              <path d={ICONS[i.key]} />
            </svg>
          </a>
        </li>
      ))}
    </ul>
  )
}
