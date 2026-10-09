import styles from './LegalLinks.module.css'

// フッター用。すべて /legal の1ページ内の各項目へ。別ウィンドウ(別タブ)で開く。
// アプリ側の app/layout.tsx のフッターにもそのまま置ける
const LINKS = [
  { href: '/legal#terms', label: '利用規約' },
  { href: '/legal#privacy', label: 'プライバシーポリシー' },
  { href: '/legal#tokushoho', label: '特定商取引法に基づく表記' },
  { href: '/legal#contact', label: 'お問い合わせ' },
]

export default function LegalLinks() {
  return (
    <ul className={styles.row}>
      {LINKS.map((l) => (
        <li key={l.href}>
          <a href={l.href} target="_blank" rel="noopener noreferrer">
            {l.label}
          </a>
        </li>
      ))}
    </ul>
  )
}
