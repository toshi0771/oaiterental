import styles from './ShareButtons.module.css'

type Props = {
  tone?: 'light' | 'dark' // 背景が明るいか暗いか
  path?: string // 共有するページ(既定はLP)
}

// 本番のURL。Renderに公開したら .env / Renderの環境変数に設定する
// 例: NEXT_PUBLIC_SITE_URL=https://example.com
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
const TEXT = 'お相手レンタル:今日、近所で、1時間だけ。大阪の時間単位マッチング'
const HASHTAG = 'お相手レンタル'

export default function ShareButtons({ tone = 'light', path = '/lp' }: Props) {
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
      aria: 'LINEで共有(新しいタブで開きます)',
      href: `https://social-plugins.line.me/lineit/share?url=${target('line')}`,
    },
  ]

  return (
    <ul className={`${styles.row} ${tone === 'dark' ? styles.dark : ''}`}>
      {items.map((i) => (
        <li key={i.key}>
          <a
            className={styles.btn}
            href={i.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={i.aria}
          >
            {i.label}
          </a>
        </li>
      ))}
    </ul>
  )
}
