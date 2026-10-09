import styles from '../components/LegalPage.module.css'
import { OPERATOR } from '../components/legalInfo'

/*
 * 【要法務確認・要確認】
 * - 電話番号の記載方法(請求があれば遅滞なく開示する旨での省略が可能かどうか)
 * - 販売価格の税込/税別
 * - 対応するカードブランド、支払時期、解約・返金の運用(下の ※ 部分は運営者の運用に合わせて確定)
 */
const ROWS: { label: string; body: React.ReactNode }[] = [
  { label: '販売事業者(屋号)', body: OPERATOR.shop },
  { label: '運営責任者', body: OPERATOR.representative },
  { label: '所在地', body: `${OPERATOR.postal} ${OPERATOR.address}` },
  {
    label: '電話番号',
    body: '請求があった場合、遅滞なく開示します。下記のお問い合わせからご連絡ください。',
  },
  {
    label: 'お問い合わせ',
    body: (
      <a href={OPERATOR.contactUrl} target="_blank" rel="noopener noreferrer">
        お問い合わせフォーム(alegria のサイト内「問い合わせ」)
      </a>
    ),
  },
  {
    label: 'サービスの名称',
    body: 'お相手レンタル(時間単位のお相手マッチングの場の提供)',
  },
  {
    label: '販売価格',
    body: (
      <>
        ユーザー: 無料
        <br />
        キャスト(基本プラン): 月額300円
        <br />
        キャスト(プロプラン): 月額3,000円
        <br />
        ※税込・税別の表記は確定後に記載します。
      </>
    ),
  },
  {
    label: '商品代金以外の必要料金',
    body: 'インターネット接続にかかる通信料はお客様のご負担となります。ユーザーとキャストの間で支払われる時給などの報酬は、当事者間で直接やり取りされるもので、運営者は受け取りません。',
  },
  {
    label: 'お支払方法',
    body: 'クレジットカード(決済代行: Stripe)',
  },
  {
    label: 'お支払時期',
    body: 'キャストの月額料金は、初めてマッチングが成立してトライアルが終了した時点から請求が始まり、以降は毎月同じ日に請求されます。ユーザーの利用に料金はかかりません。',
  },
  {
    label: 'サービスの提供時期',
    body: 'お申込み(決済手続きの完了)後、ただちにご利用いただけます。',
  },
  {
    label: '解約・返金',
    body: (
      <>
        キャストの月額プランは、いつでも解約できます。解約を希望する場合は、お問い合わせからご連絡ください。次回の請求日の前までに手続きをいただいた場合、次回以降の請求は発生しません。
        <br />
        サービスの性質上、お支払い済みの料金の返金(日割り返金を含む)は、法令上必要な場合を除き行いません。
      </>
    ),
  },
  {
    label: '動作環境',
    body: '最新版の主要なブラウザ(Chrome、Safari、Edge など)でご利用ください。',
  },
]

export default function Tokushoho() {
  return (
    <section id="tokushoho" className={styles.block}>
      <h2>特定商取引法に基づく表記</h2>
      <table className={styles.table}>
        <tbody>
          {ROWS.map((r) => (
            <tr key={r.label}>
              <th scope="row">{r.label}</th>
              <td>{r.body}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
