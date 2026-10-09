import type { Metadata } from 'next'
import { Zen_Maru_Gothic, Noto_Sans_JP } from 'next/font/google'
import styles from './lp.module.css'
import ShareButtons from '../components/ShareButtons'
import LegalLinks from '../components/LegalLinks'

const heading = Zen_Maru_Gothic({
  weight: ['500', '700'],
  variable: '--font-heading',
  preload: false,
})
const body = Noto_Sans_JP({
  weight: ['400', '500', '700'],
  variable: '--font-body',
  preload: false,
})

/*
 * ============================================================
 *  弁護士確認用ドラフト版
 *  - 「出会い」「バイト」「便利屋」の表現は、法務確認のために意図的に入れてある。
 *    該当箇所には【要法務確認】コメントを付けた。確認後に表現を差し替える。
 *  - 確認が終わるまで robots を noindex にしてある(公開時に必ず見直すこと)。
 * ============================================================
 */
export const metadata: Metadata = {
  title: 'お相手レンタル | 大阪で、今日、近所で、1時間だけ',
  description:
    '大阪全域で、時給をもらう人と時給を払う人が地図でつながる、時間単位のお相手マッチング。ユーザーは無料。',
  // OGP画像の絶対URLを作るための基準。公開後は NEXT_PUBLIC_SITE_URL に本番URLを設定
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  robots: { index: false, follow: false }, // TODO: 法務確認後に index: true へ
  openGraph: {
    title: 'お相手レンタル',
    description: '今日、近所で、1時間だけ。大阪全域の時間単位マッチング。',
    type: 'website',
    images: [{ url: '/ogp.png', width: 1200, height: 630, alt: 'お相手レンタル' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'お相手レンタル',
    description: '今日、近所で、1時間だけ。大阪全域の時間単位マッチング。',
    images: ['/ogp.png'],
  },
}

// CTAの遷移先。TODO: Clerkのサインアップ後リダイレクト設定に合わせて調整
const CTA_USER = '/?from=lp&role=user'
const CTA_CAST = '/cast/register?from=lp&role=cast'

const BLUE = '#2f9bdb'
const AMBER = '#f28c28'

const AREAS = [
  { name: '北摂', x: 140, y: 70 },
  { name: '大阪北', x: 300, y: 105 },
  { name: '京阪沿線', x: 440, y: 165 },
  { name: '大阪東', x: 440, y: 300 },
  { name: '近鉄沿線', x: 455, y: 425 },
  { name: '大阪南', x: 350, y: 435 },
  { name: '泉州', x: 345, y: 508 },
]

// ダミーのピン(実際の募集ではない)。水色=時給をもらう、オレンジ=時給を払う
const PINS = [
  { x: 190, y: 318, color: BLUE, label: 'ランチ 時給1,000円', pulse: true },
  { x: 130, y: 135, color: AMBER, label: '買い物の手伝い', pulse: false },
  { x: 400, y: 235, color: BLUE, label: '散歩 1時間', pulse: false },
  { x: 400, y: 375, color: AMBER, label: 'ランチの相手', pulse: false },
  { x: 330, y: 478, color: BLUE, label: 'カフェで話し相手', pulse: false },
]

// ランドマークのアイコン(簡略化したオリジナルのイラスト)。原点=足元の中央
function OsakaCastle() {
  return (
    <g>
      <polygon points="-22,0 22,0 18,-8 -18,-8" fill="#9aa6b8" />
      <rect x="-15" y="-18" width="30" height="10" fill="#fff" />
      <polygon points="-20,-18 20,-18 14,-24 -14,-24" fill="#2e7d6b" />
      <rect x="-10" y="-32" width="20" height="8" fill="#fff" />
      <polygon points="-14,-32 14,-32 9,-38 -9,-38" fill="#2e7d6b" />
      <rect x="-6" y="-44" width="12" height="6" fill="#fff" />
      <polygon points="-10,-44 10,-44 0,-52" fill="#2e7d6b" />
      <rect x="-2" y="-56" width="4" height="5" fill="#e0a526" />
    </g>
  )
}

function Tsutenkaku() {
  return (
    <g>
      <polygon points="-13,0 13,0 5,-36 -5,-36" fill="#c9d3e0" stroke="#1b2440" strokeWidth="1.5" />
      <line x1="-9" y1="-12" x2="9" y2="-12" stroke="#1b2440" strokeWidth="1.2" />
      <line x1="-7" y1="-24" x2="7" y2="-24" stroke="#1b2440" strokeWidth="1.2" />
      <rect x="-10" y="-43" width="20" height="7" rx="1.5" fill="#1b2440" />
      <polygon points="-5,-43 5,-43 0,-53" fill="#f28c28" />
      <line x1="0" y1="-53" x2="0" y2="-63" stroke="#1b2440" strokeWidth="1.5" />
    </g>
  )
}

function UmedaSky() {
  return (
    <g>
      <rect x="-14" y="-48" width="9" height="48" fill="#8fb4d4" />
      <rect x="5" y="-48" width="9" height="48" fill="#8fb4d4" />
      <rect x="-14" y="-52" width="28" height="9" rx="2" fill="#6f9cc0" />
      <circle cx="0" cy="-42" r="4.5" fill="#eaf1f6" />
    </g>
  )
}

function Landmark({
  x,
  y,
  name,
  children,
}: {
  x: number
  y: number
  name: string
  children: React.ReactNode
}) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {children}
      <text y="15" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1b2440">
        {name}
      </text>
    </g>
  )
}

function MapIllustration() {
  return (
    <figure className={styles.mapBox}>
      <svg
        className={styles.mapSvg}
        viewBox="0 0 520 520"
        role="img"
        aria-label="大阪全域の地図のイメージ。淀川が北東から南西の大阪湾へ流れ、大阪城・通天閣・梅田スカイビルのほか、時給をもらう募集(水色)と時給を払う募集(オレンジ)のピンが並んでいます"
      >
        <rect width="520" height="520" fill="#eaf1f6" />

        {/* 道路 */}
        <g stroke="#ffffff" strokeWidth="4" fill="none">
          <path d="M0 260 L520 290" />
          <path d="M210 0 L250 520" />
          <path d="M470 0 L430 520" />
          <path d="M0 400 L520 380" />
        </g>

        {/* 大阪湾(西〜南西) */}
        <path
          d="M0 0 L40 0 C70 90 100 170 118 215 C140 290 190 380 240 440 C265 475 285 500 300 520 L0 520 Z"
          fill="#cfe6f4"
        />
        <text x="40" y="330" fontSize="13" fontWeight="700" fill="#4a8ab5">
          大阪湾
        </text>

        {/* 淀川: 北東(右上)から南西(左下)の湾へ */}
        <path
          d="M520 30 C440 70 380 130 300 165 C230 195 170 205 118 215"
          fill="none"
          stroke="#cfe6f4"
          strokeWidth="24"
          strokeLinecap="round"
        />
        <text
          transform="translate(420 66) rotate(-31)"
          fontSize="12"
          fontWeight="700"
          fill="#4a8ab5"
        >
          淀川
        </text>

        {/* エリア名(アプリのエリア区分と同じ7ブロック) */}
        <g fill="#4a5572" fontSize="14" fontWeight="500">
          {AREAS.map((a) => (
            <text key={a.name} x={a.x} y={a.y} textAnchor="middle">
              {a.name}
            </text>
          ))}
        </g>

        {/* ランドマーク */}
        <Landmark x={232} y={262} name="梅田スカイビル">
          <UmedaSky />
        </Landmark>
        <Landmark x={345} y={248} name="大阪城">
          <OsakaCastle />
        </Landmark>
        <Landmark x={300} y={392} name="通天閣">
          <Tsutenkaku />
        </Landmark>

        {/* ピン */}
        {PINS.map((p) => (
          <g key={p.label}>
            {p.pulse && (
              <circle className={styles.pulse} cx={p.x} cy={p.y} r="14" fill={p.color} />
            )}
            <polygon
              points={`${p.x - 8},${p.y + 4} ${p.x + 8},${p.y + 4} ${p.x},${p.y + 22}`}
              fill={p.color}
            />
            <circle cx={p.x} cy={p.y} r="12" fill={p.color} stroke="#fff" strokeWidth="3" />
            <g transform={`translate(${p.x + 16} ${p.y - 30})`}>
              <rect width={p.label.length * 13 + 16} height="26" rx="13" fill="#fff" />
              <text x="10" y="18" fontSize="12" fontWeight="700" fill="#1b2440">
                {p.label}
              </text>
            </g>
          </g>
        ))}
      </svg>
      <figcaption className={styles.mapNote}>
        ※画面はイメージです。実際の位置はぼかして表示されます。
      </figcaption>
    </figure>
  )
}

export default function LandingPage() {
  return (
    <div className={`${styles.page} ${heading.variable} ${body.variable}`}>
      {/* ---------- ファーストビュー ---------- */}
      <header className={styles.hero}>
        <div className={`${styles.wrap} ${styles.heroGrid}`}>
          <div>
            <p className={styles.brand}>お相手レンタル</p>
            <h1 className={`${styles.heading} ${styles.heroTitle}`}>
              今日、
              <br />
              近所で、
              <br />
              1時間だけ。
            </h1>
            <p className={styles.heroSub}>
              大阪全域で、時給をもらう人と、時給を払う人が地図でつながります。ユーザーは無料で使えます。
            </p>
            <div className={styles.heroCtas}>
              <a className={`${styles.btn} ${styles.btnPrimary}`} href={CTA_USER}>
                使ってみる(無料)
              </a>
              <a className={`${styles.btn} ${styles.btnGhost}`} href={CTA_CAST}>
                キャストとして登録
              </a>
            </div>
          </div>
          <MapIllustration />
        </div>
      </header>

      <main>
        {/* ---------- 仕組み ---------- */}
        <section className={styles.section} aria-labelledby="how">
          <div className={styles.wrap}>
            <h2 id="how" className={`${styles.heading} ${styles.sectionTitle}`}>
              使い方は、4ステップ
            </h2>
            <p className={styles.lead}>地図を開いて、気になる募集に申し込むだけです。</p>
            <ol className={styles.steps}>
              <li className={styles.step}>
                <h3 className={`${styles.heading} ${styles.stepTitle}`}>探す</h3>
                <p>地図で、近所の今日の募集を探します。</p>
              </li>
              <li className={styles.step}>
                <h3 className={`${styles.heading} ${styles.stepTitle}`}>申し込む</h3>
                <p>気になる募集に申し込みます。相手が承認すると成立します。</p>
              </li>
              <li className={styles.step}>
                <h3 className={`${styles.heading} ${styles.stepTitle}`}>会う</h3>
                <p>アプリ内のメッセージで待ち合わせを決めて、会います。</p>
              </li>
              <li className={styles.step}>
                <h3 className={`${styles.heading} ${styles.stepTitle}`}>レビューする</h3>
                <p>会ったあとは、お互いにレビューを残します。</p>
              </li>
            </ol>
          </div>
        </section>

        {/* ---------- 使える場面 ---------- */}
        <section className={`${styles.section} ${styles.sectionAlt}`} aria-labelledby="scenes">
          <div className={styles.wrap}>
            <h2 id="scenes" className={`${styles.heading} ${styles.sectionTitle}`}>
              時給をもらう人と、払う人
            </h2>
            <p className={styles.lead}>
              募集は2種類あります。空いた時間を使いたい人と、誰かの時間がほしい人が、同じ地図に並びます。
            </p>
            <div className={styles.types}>
              <div className={`${styles.type} ${styles.typeReceive}`}>
                <h3 className={`${styles.heading} ${styles.typeTitle}`}>時給をもらう</h3>
                <p>自分の空き時間と時給を決めて、募集を出します。</p>
                <ul>
                  <li>ランチやカフェの相手</li>
                  <li>散歩や買い物の同行</li>
                  <li>ちょっとした話し相手</li>
                </ul>
              </div>
              <div className={`${styles.type} ${styles.typePay}`}>
                <h3 className={`${styles.heading} ${styles.typeTitle}`}>時給を払う</h3>
                <p>手伝いや相手がほしい内容を書いて、募集を出します。</p>
                <ul>
                  <li>ランチや食事の相手</li>
                  <li>買い物の付き添い</li>
                  {/* 【要法務確認】「便利屋」表現(意図的に使用)。重作業・金銭預かりを含むか、禁止事項の書き方 */}
                  <li>便利屋のような、ちょっとした作業の手伝い</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- こんな方に ---------- */}
        <section className={styles.section} aria-labelledby="people">
          <div className={styles.wrap}>
            <h2 id="people" className={`${styles.heading} ${styles.sectionTitle}`}>
              こんな方に
            </h2>
            <ul className={styles.people}>
              <li>
                <h3 className={`${styles.heading} ${styles.peopleTitle}`}>
                  近所で、ゆるく話せる相手がほしい
                </h3>
                <p>ひまな時間に、誰かとお茶をしたり、散歩したりできます。</p>
              </li>
              <li>
                {/* 【要法務確認】「出会い」表現(意図的に使用)。異性紹介事業・広告審査との関係 */}
                <h3 className={`${styles.heading} ${styles.peopleTitle}`}>
                  新しい出会いがほしい
                </h3>
                <p>近所に住む人と、気軽に知り合うきっかけになります。</p>
              </li>
              <li>
                {/* 【要法務確認】「バイト」表現(意図的に使用)。職業紹介・雇用との関係、報酬の位置づけ */}
                <h3 className={`${styles.heading} ${styles.peopleTitle}`}>
                  空いた1時間で、バイト感覚で稼ぎたい
                </h3>
                <p>学生、主婦・主夫、フリーランスの方が、自分のペースで時給をもらえます。</p>
              </li>
              <li>
                {/* 【要法務確認】「便利屋」表現(意図的に使用)。事故時の責任、買い物代行の金銭預かり */}
                <h3 className={`${styles.heading} ${styles.peopleTitle}`}>
                  便利屋のように、ちょっと手を借りたい
                </h3>
                <p>買い物の付き添いや、軽い手伝いを、近所の人にお願いできます。</p>
              </li>
            </ul>
          </div>
        </section>

        {/* ---------- 安心・安全(実装済みの内容のみ) ---------- */}
        {/*
          年齢確認・本人確認・通報/ブロックは未実装のため載せない。
          実装したら、この節に追記する。
        */}
        <section className={`${styles.section} ${styles.sectionAlt}`} aria-labelledby="safety">
          <div className={styles.wrap}>
            <h2 id="safety" className={`${styles.heading} ${styles.sectionTitle}`}>
              安心して使うために
            </h2>
            <div className={styles.safety}>
              <div>
                <h3 className={styles.heading}>実名は公開されません</h3>
                <p>公開されるのはニックネームだけです。</p>
              </div>
              <div>
                <h3 className={styles.heading}>位置はぼかして表示されます</h3>
                <p>地図には、おおまかなエリアだけが表示されます。</p>
              </div>
              <div>
                <h3 className={styles.heading}>お互いにレビューできます</h3>
                <p>会ったあとに、双方がレビューを残します。申し込む前に、過去のレビューを確認できます。</p>
              </div>
              <div>
                <h3 className={styles.heading}>やり取りはアプリの中で</h3>
                <p>待ち合わせの相談は、アプリ内のメッセージでできます。</p>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- 料金 ---------- */}
        <section className={styles.section} aria-labelledby="price">
          <div className={styles.wrap}>
            <h2 id="price" className={`${styles.heading} ${styles.sectionTitle}`}>
              料金
            </h2>
            <p className={styles.lead}>
              申し込む側は無料です。募集を出すキャストは、初めて成立するまで無料です。
            </p>
            <div className={styles.price}>
              <div className={styles.priceRow}>
                <h3 className={`${styles.heading} ${styles.priceName}`}>ユーザー</h3>
                <p className={styles.priceValue}>無料</p>
                <p className={styles.priceNote}>申し込む側はずっと無料です。</p>
              </div>
              <div className={styles.priceRow}>
                <h3 className={`${styles.heading} ${styles.priceName}`}>キャスト(基本)</h3>
                <p className={styles.priceValue}>月額300円</p>
                <p className={styles.priceNote}>初めて成立するまでは無料です。</p>
              </div>
              <div className={styles.priceRow}>
                <h3 className={`${styles.heading} ${styles.priceName}`}>キャスト(プロ)</h3>
                <p className={styles.priceValue}>月額3,000円</p>
                <p className={styles.priceNote}>
                  メッセージ管理、レビュー管理、マッチング履歴が使えます。
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- FAQ ---------- */}
        <section className={`${styles.section} ${styles.sectionAlt}`} aria-labelledby="faq">
          <div className={`${styles.wrap} ${styles.faq}`}>
            <h2 id="faq" className={`${styles.heading} ${styles.sectionTitle}`}>
              よくある質問
            </h2>
            <details>
              <summary>どのエリアで使えますか?</summary>
              <p>大阪全域です。北摂、大阪北、京阪沿線、大阪東、近鉄沿線、大阪南、泉州の7エリアで募集を探せます。</p>
            </details>
            <details>
              <summary>実名は見えますか?</summary>
              <p>見えません。公開されるのはニックネームだけで、位置もおおまかなエリアに変換されます。</p>
            </details>
            <details>
              <summary>お金はどうやって払いますか?</summary>
              {/* 【要法務確認】当事者間の現金払いの整理(契約関係、トラブル時の証跡) */}
              <p>
                時給は、会った当日に、当事者どうしで直接やり取りします。お相手レンタルは時給を預かりません。
              </p>
            </details>
            <details>
              <summary>キャストの月額はいつから払いますか?</summary>
              <p>初めて成立するまでは無料です。成立した時点から、選んだプランの月額がかかります。</p>
            </details>
            <details>
              <summary>会ったあと、何をしますか?</summary>
              <p>お互いにレビューを書きます。レビューは、次に申し込む人の参考になります。</p>
            </details>
          </div>
        </section>

        {/* ---------- 最終CTA ---------- */}
        <section className={`${styles.section} ${styles.final}`} aria-labelledby="start">
          <div className={styles.wrap}>
            <h2 id="start" className={`${styles.heading} ${styles.sectionTitle}`}>
              まずは、地図を見てみてください。
            </h2>
            <p className={styles.lead}>登録は数分です。ユーザーはずっと無料です。</p>
            <div className={styles.heroCtas}>
              <a className={`${styles.btn} ${styles.btnPrimary}`} href={CTA_USER}>
                使ってみる(無料)
              </a>
              <a className={`${styles.btn} ${styles.btnGhost}`} href={CTA_CAST}>
                キャストとして登録
              </a>
            </div>
            <div className={styles.shareArea}>
              <p className={styles.shareLead}>友だちにも教える</p>
              <ShareButtons tone="dark" />
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.wrap}>
          <LegalLinks />
          <p className={styles.copy}>© お相手レンタル(運営: alegria)</p>
        </div>
      </footer>
    </div>
  )
}
