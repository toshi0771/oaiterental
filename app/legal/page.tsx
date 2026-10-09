import type { Metadata } from 'next'
import LegalPage from '../components/LegalPage'
import styles from '../components/LegalPage.module.css'
import { OPERATOR } from '../components/legalInfo'
import Terms from './Terms'
import Privacy from './Privacy'
import Tokushoho from './Tokushoho'

/*
 * 利用規約・プライバシーポリシー・特定商取引法に基づく表記・お問い合わせを1ページにまとめたページ。
 * ページ内アンカー: /legal#terms /legal#privacy /legal#tokushoho /legal#contact
 * 【ドラフト・要法務確認】各部品(Terms / Privacy / Tokushoho)の冒頭コメントを参照。
 */
export const metadata: Metadata = {
  title: '利用規約・プライバシーポリシー・特定商取引法に基づく表記 | お相手レンタル',
  robots: { index: false, follow: false }, // TODO: 公開時に見直す
}

const TOC = [
  { id: 'terms', label: '利用規約' },
  { id: 'privacy', label: 'プライバシーポリシー' },
  { id: 'tokushoho', label: '特定商取引法に基づく表記' },
  { id: 'contact', label: 'お問い合わせ' },
]

export default function LegalIndexPage() {
  return (
    <LegalPage title="お相手レンタルのご利用について" enacted={OPERATOR.enacted}>
      <nav aria-label="このページの内容" className={styles.toc}>
        <ul>
          {TOC.map((t) => (
            <li key={t.id}>
              <a href={`#${t.id}`}>{t.label}</a>
            </li>
          ))}
        </ul>
      </nav>

      <Terms />
      <Privacy />
      <Tokushoho />

      <section id="contact" className={styles.block}>
        <h2>お問い合わせ</h2>
        <p>
          本サービスに関するお問い合わせは、運営者(
          {OPERATOR.shop}、代表 {OPERATOR.representative})のサイトにある問い合わせフォームからご連絡ください。
        </p>
        <p>
          <a href={OPERATOR.contactUrl} target="_blank" rel="noopener noreferrer">
            お問い合わせフォームを開く
          </a>
        </p>
      </section>
    </LegalPage>
  )
}
