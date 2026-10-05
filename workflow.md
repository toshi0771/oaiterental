# お相手レンタル(Oaiterental) workflow.md

このファイルは開発の進捗・決定事項・残タスクを一元管理するためのものです。
新しいチャットを開始するときは、まずこのファイルを貼るか要約すれば、齟齬なく続きから作業できます。
**作業が進むたびに、このファイルを更新してください。**

---

## プロジェクト概要

- **サービス名**: お相手レンタル(Oaiterental) — 大阪エリア向け、時間制のお相手マッチングサービス
- **スタック**: Next.js / Clerk(認証) / Supabase(DB・Realtime) / Google Maps(地図) / Stripe(サブスク課金) / Render(ホスティング)
- **収益モデル**: レンタルする側(ユーザー)は無料、レンタルされる側(キャスト)が月額課金(基本 300円/月、プロ 3,000円/月)。初回マッチング成立まではキャストも無料(トライアル)。
- **決済方式**: レンタル料自体は現金・当事者間の直接やりとり(エスクロー等は使わない)。Stripeはキャストのサブスク課金のみに使用。
- **GitHub**: github.com/toshi0771/oaiterental (main branch)

---

## フェーズ構成(独自ナンバリング)

| Phase | 内容 | ステータス |
|---|---|---|
| 1〜6 | 法務・事業計画・要件定義(ドキュメントベース) | 完了(ドキュメント上) |
| 7 | キャスト登録 | ✅ 完了 |
| 8 | エントリー・マップ表示 | ✅ 完了 |
| 8.5 | 時給の受取/支払い両対応 | ✅ 完了 |
| 9 | マッチング | ✅ 完了 |
| 10 | レビュー・サブスク | ✅ 完了 |
| 11 | メッセージ機能(申込み後の1対1スレッド) | ✅ 完了(既読管理・未読バッジ含む) |
| 12 | 管理者機能(サイト管理者ページ・キャストページ) | ✅ 完了(2026-10-05、コミット `8215e02` をpush済み) |

**現在地: Phase 12まで完了。次は LP作成 → バグチェック → 本番公開の順。**
本番公開はLPとバグチェックの後に行う(それまで本番へは反映しない)。

---

## Phase 7: キャスト登録(完了)

- `app/api/cast-profile/route.ts`(GET/POST)、`app/cast/register/page.tsx` を実装
- 実名・メールは管理者のみ閲覧可、公開UIはニックネームのみ
- エリアは6ブロック(北摂/京阪沿線/大阪北/大阪南/大阪東/泉州)の固定代表座標+ランダムオフセットでfuzzy化。実GPSは取得しない設計
- サブスク登録はStripe Checkout(長期トライアル)、初回マッチング確定時にAPIでトライアル終了させる設計

## Phase 8: エントリー・マップ表示(完了)

- `app/api/entries/route.ts`(POST)、`app/api/entries/map/route.ts`(GET)実装
- `app/cast/entries/new/page.tsx` でエントリー作成
- Google Maps表示問題(APIキー/Map IDの取り違え)を解消、ピン・InfoWindow表示まで確認済み
- **保留中の不具合**: Stripe Link確認メールが受信できない問題(詳細未特定)

## Phase 8.5: 時給の受取/支払い両対応(完了)

- `entries.transaction_type`('receive'/'pay')を追加
- マップ上で色分け表示(receive=水色、pay=オレンジ)、InfoWindow文言分岐まで確認済み

## Phase 9: マッチング(完了)

- 申込み(`POST /api/applications`)、承認(`PATCH /api/applications/[id]/confirm`)、拒否(`PATCH /api/applications/[id]/reject`)、完了(`PATCH /api/bookings/[id]/complete`)まで一連の流れを実装・動作確認済み
- 自己申込み防止(API側・UI側二重ガード)実装済み
- 未読バッジによる承認通知(`viewed_by_applicant`)実装済み(ヘッダーの「申込み状況」バッジ)
- ユーザー向け一覧(`/my-applications`)、キャスト向け一覧(`/cast/applications`)実装済み

## Phase 10: レビュー・サブスク(完了)

### レビュー機能
- `reviews`テーブル: `booking_id`/`reviewer_id`/`target_user_id`/`comment`/`created_at`(unique: booking_id×reviewer_id)
- 星評価(satisfaction_score)は完全廃止、コメントのみのレビューに変更済み(フォームUI・`POST /api/reviews`・`GET /api/reviews/[userId]`すべて対応済み、DBは`ALTER TABLE reviews ALTER COLUMN satisfaction_score DROP NOT NULL`で対応)
- 双方向レビュー(申込者⇔キャスト)、1予約1人1回の制約あり
- キャスト側画面のボタン文言を「感想」→「レビュー」に統一済み(「この方のレビューを見る」等)
- 実地動作確認済み(星なしでの投稿・表示まで確認)

### Stripeサブスク・トライアル終了処理
- `PATCH /api/applications/[id]/confirm` にてマッチング確定時、Stripeの`trial_end: 'now'`を呼ぶ処理を実装済み・実地確認済み
- **`trial_ends_at`同期バグを修正済み**: `app/api/webhooks/stripe/route.ts`に`customer.subscription.updated`イベントのハンドラを追加。`trial_end`の変化をSupabaseの`subscriptions.trial_ends_at`に反映するようにした(`stripe_subscription_id`優先、無ければ`stripe_customer_id`でフォールバック)。Stripe CLIの`stripe subscriptions update <id> -d "metadata[x]=1"`でイベントを発火させ、Webhook受信→DB反映まで実地確認済み。
- **デバッグで判明した注意点**: ターミナルへの手入力・コピペで発生した不可視文字混入により、正しいはずのサブスクIDで`stripe subscriptions retrieve`が「存在しない」エラーになる現象が発生した。`$SUB_ID`のようにシェル変数経由で渡すことで解決。同様の「IDが存在しないと言われる」系のエラーが出た場合はこの可能性を疑うこと。

### テストデータ整理
- 「としさん」(okatoshi06+test1@gmail.com)と「幸子さん」(okatoshi06+test@gmail.com)は別アカウントと判明(同一メールという認識は誤りだった)
- 混乱の原因だった「幸子さんが自分のエントリーに自己申込みした」古いapplications行(自己申込み防止ガード実装前のテストデータ)をSupabaseから削除して解消

## Phase 11: メッセージ機能(完了)

### 設計
- 要件: 新着メッセージは即時ではなくポーリング(4秒間隔)で取得、メッセージ開始は「申込みボタンを押した後」から(申込み前の閲覧段階では不要)
- この要件により、スレッドは`entry_id`+`applicant_id`ではなく**`applications.id`に直接紐づける**シンプルな設計を採用(applications行が既に存在する前提のため)
- リアルタイム(Supabase Realtime)は、認証がClerkでSupabase Authを使っていないためRLS連携が複雑になる懸念から見送り、ポーリング方式を採用

### 実装
- `messages`テーブル: `id`/`application_id`(→applications.id)/`sender_id`(→users.id)/`content`/`created_at`。RLSは有効化済み(申込者本人・キャスト本人のみselect可、insertはサーバーAPI経由のみ)
- `GET/POST /api/messages`(application_idでスレッド取得・送信、本人確認あり)
- `app/components/MessageThread.tsx`: 共通コンポーネント、4秒ポーリング、自分の発言は右寄せ青・相手は左寄せグレー
- `app/my-applications/page.tsx`・`app/cast/applications/page.tsx`双方に「メッセージを見る」ボタンとスレッド表示を追加
- キャスト側画面の「メッセージを見る」「この方のレビューを見る」ボタン間のスペース不足を修正済み

### 既読管理・未読バッジ
- `applications`テーブルに`applicant_last_read_at`/`cast_last_read_at`(timestamptz、NULL許容)を追加。スレッドの参加者が2人だけなので汎用の既読テーブルは使わずシンプルな2カラム設計にした
- `PATCH /api/messages/mark-read`: スレッドを開いたら自分側のlast_read_atを更新
- `GET /api/applications/mine`・`GET /api/applications`: 各applicationに`has_unread_messages`(相手の最新メッセージ日時 > 自分のlast_read_at)を計算して付与
- 一覧画面の「メッセージを見る」ボタン横に赤丸バッジを表示、開くと消える(ローカルstateで即時反映+バックエンドでも保存)。リロードしても再表示されないことを実地確認済み

### 送信操作の修正
- 不具合修正: メッセージ入力欄でEnterキー(日本語入力の変換確定含む)を押すと誤って送信される問題があったため、Enterキーでの送信を廃止。**送信ボタンを押した時のみ**投稿される仕様に変更済み

### 見送った拡張
- ヘッダーの「申込み状況」バッジ(マッチング確定の未読通知)とメッセージの未読バッジを1つに統合する案を検討したが、「キャストにとってはマッチング確定が最重要で、それを確認しに来た流れでメッセージにも気づける」という理由で、**当面は別々の表示のままでよい**と判断(将来的に再検討の余地あり)
- 注: 下記Phase 12のお知らせ・問い合わせ通知は、ヘッダー「お知らせ」の赤バッジとして別枠で実装した(申込み状況・メッセージの未読バッジとは別)

## Phase 12: 管理者機能(完了 2026-10-05)

### 決定事項
- 「メッセージ通知」は、管理者へのメッセージ(問い合わせ)と、管理者からユーザー・キャストへのお知らせの双方向機能と定義
- 管理者権限は`users.role`に`'admin'`を追加する方式(`users_role_check`制約を変更)
- キャストページの「メッセージ管理」「レビュー管理」「マッチング履歴」は**プロプラン(3000円/月)限定機能**。「プロフィール管理」「プラン変更」「サブスク履歴」は全プラン共通
- お知らせ・問い合わせは**アプリ内表示のみ**で、メール通知は行わない

### サイト管理者ページ(完了)
- マイグレーション`006_add_admin_foundation.sql`: `users.role`に`'admin'`追加、`users.is_blacklisted`/`blacklist_reason`追加、`subscriptions.status`追加
- `lib/admin.ts`: `requireAdmin()`共通関数(Clerk認証→`users.role==='admin'`判定)
- `app/admin/layout.tsx`: アクセス制御付き共通レイアウト、管理者でなければ`/`にリダイレクト。ナビ: ダッシュボード / ユーザー管理 / キャスト管理 / 月次サマリー / お問い合わせ / お知らせ配信 / サイトに戻る
- `app/admin/page.tsx`: ダッシュボード(総ユーザー数・キャスト登録数・ブラックリスト件数、お問い合わせの件数など)
- `app/admin/users/page.tsx` + `app/api/admin/users/route.ts`・`app/api/admin/users/[id]/route.ts`: ユーザー一覧、ブラックリストの追加/解除(理由付き)
- `app/admin/casts/page.tsx` + `app/api/admin/casts/route.ts`: キャスト一覧(エリア・時給レンジ・サブスクプラン・トライアル終了日)、ブラックリスト操作も同画面から可能
- `app/admin/announcements/page.tsx` + `app/api/admin/announcements/route.ts`・`[id]/route.ts`: お知らせ配信。宛先は全員 / キャストのみ、タイトル・本文、配信済み一覧、削除
- `app/admin/inquiries/page.tsx` + `app/api/admin/inquiries/route.ts`・`[userId]/route.ts`: 問い合わせ一覧(未対応バッジ)、スレッド表示、管理者が返信
- `app/admin/summary/page.tsx` + `app/api/admin/summary/route.ts`: 月次サマリー・MRR。`app/api/webhooks/stripe/route.ts`で`subscriptions.status`をWebhook同期する処理を追加済み
- 実地動作確認済み: ダッシュボード表示、ユーザー/キャスト一覧、ブラックリスト登録・解除、非管理者のアクセス制御(リダイレクト)、お知らせ配信、問い合わせの受信・返信

**管理者アカウント**: `nre46682@yahoo.co.jp`(普段使いのメールアドレス)を管理者に設定済み。

### ユーザー・キャスト向けのお知らせ・問い合わせ(完了)
- 追加テーブル: `announcements`、`inquiry_threads`、`inquiry_messages`(`add_notifications`等のマイグレーション)
- `app/notices/page.tsx` + `app/api/notices/route.ts`: お知らせ一覧。未読は赤い「NEW」、開くと既読(PATCH)。宛先が「キャストのみ」のお知らせはキャスト(role=cast)にだけ表示される
- `app/contact/page.tsx` + `app/api/inquiries/route.ts` + `app/components/InquiryThread.tsx`: 運営への問い合わせ。管理者の返信があると`/notices`の「運営へのお問い合わせ」に赤い「返信あり」が付き、`/contact`を開くと消える
- `app/api/notifications/route.ts` + `lib/notifications.ts` + `lib/me.ts`: ヘッダーの「お知らせ」赤バッジ(未読お知らせ数 + 返信あり件数の合計)
- 実地動作確認済み: 全員宛がユーザー・キャスト双方に届く / キャストのみ宛がユーザーには出ない / NEWが開くと消える / 返信ありの印が付く・消える / ヘッダーバッジの件数が一致

### キャストページ(完了)
- `lib/cast.ts`: `requireCast()`(キャスト登録済みか)・`requireCastPro()`(プロプランか)の共通関数
- `app/cast/page.tsx`: ダッシュボード、プラン表示、プロ限定機能には🔒マーク表示(クリックするとプラン変更ページへ誘導)
- `app/cast/messages/page.tsx` + `app/api/cast/messages/route.ts`(プロ限定): 全申込みの最新メッセージをまとめて一覧表示、クリックで`/cast/applications`へ
- `app/cast/reviews/page.tsx` + `app/api/cast/reviews/route.ts`(プロ限定): 受け取ったレビューの一覧
- `app/cast/history/page.tsx` + `app/api/cast/history/route.ts`(プロ限定): 過去の確定・完了予約の一覧(`bookings.status`で判定)
- プロフィール写真アップロード: マイグレーション`007_add_cast_photo_bucket.sql`でSupabase Storageの`cast-photos`バケット(public)を作成、`app/api/cast-profile/photo/route.ts`でアップロード処理(Clerk認証→本人確認→Storageアップロード→公開URL返却、5MB・jpg/png/webp制限)、`app/cast/register/page.tsx`にアップロードUI・丸型プレビューを追加。リロード後の復元表示まで実地確認済み
- `app/cast/subscribe/change/page.tsx` + `app/api/subscribe/change/route.ts`: プラン変更(基本⇔プロ)
- `app/cast/subscribe/history/page.tsx` + `app/api/subscribe/history/route.ts`: サブスク履歴

### Phase 12のコミット
- `8215e02` feat: Phase 12 管理者機能・お知らせ/問い合わせ・キャストのプラン管理を追加(25ファイル、+1740/-15、2026-10-05にmainへpush済み)

---

## 技術的なメモ・注意点

- `@clerk/nextjs@7.5.7` は `<SignedIn>`/`<SignedOut>` ではなく `<Show when="signed-in">` 系を使う
- Next.js側の仕様変更で`params`がPromiseになっている(動的ルートは`await params`が必要)
- Webhook(Clerk・Stripe)は`proxy.ts`(旧`middleware.ts`)の`isPublicRoute`に含めないと307/404になる
- `subscriptions`テーブルの行が存在しない場合、UPDATE系の処理は「0件更新」で静かに失敗する(upsertやフォールバックinsertで対策済みの箇所と未対策の箇所がないか都度注意)
- ディレクトリ名に`[id]`を使う場合、zshでは特殊文字展開されるためダブルクォートで囲む必要がある
- ターミナルへの手入力・コピペでIDに不可視文字が混入し、Stripe CLIで「存在しない」エラーになることがある。シェル変数経由で渡すと確実
- Clerkのアカウント表示名(「おか とし」等)とアプリ内の`users.nickname`(「幸子」等)は完全に別の仕組みで連動していない。テストアカウントを複数作る際に混同しやすいので注意
- テストアカウントは`users`テーブルで4件(管理者 nre46682 / とし=test1・user / さぶろう=test9・user / 幸子=test・cast)。Gmailの`+`付きアドレスは受信箱が同じでもClerkでは別アカウントになるため、重複ではない
- 開発サーバーは `http://localhost:3000`(ポート番号の打ち間違いに注意)

---

## 未解決・保留中の課題一覧(まとめ)

1. Stripe Link確認メールが受信できない問題(詳細未特定、優先度低)
2. 本番前チェックリストの継続的な洗い出し(法務・eKYC・安全対策など、事業計画書レベルの課題は別途)
3. (将来的な検討事項)ヘッダー通知バッジとメッセージ未読バッジの統合
4. **本番反映の準備**: Phase 12のpushで、Renderが自動デプロイしていないか確認する(本番公開はLP・バグチェック後の予定。必要なら Auto-Deploy を Off にする)。本番Supabaseが開発と別プロジェクトの場合は、Phase 12のマイグレーション(`announcements`/`inquiry_threads`/`inquiry_messages`など)を本番側にも実行する
5. Phase 12で追加したプラン変更・サブスク履歴・月次サマリー(MRR)は、本番相当のStripeデータでの確認がまだ(バグチェックで実施)

---

## 次にやること(直近のTODO)

1. **LP(ランディングページ)作成**
2. **バグチェック**(Phase 12の新機能、プラン変更・サブスク履歴・月次サマリーを中心に、全体の通し確認)
3. 本番公開(本番Supabaseへのマイグレーション反映、Renderのデプロイ確認、本番での動作確認)
4. 本番リリース前チェックリストの洗い出し(法務・安全対策など)
