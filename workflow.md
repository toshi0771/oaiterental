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
| 12 | 管理者機能(サイト管理者ページ・キャストページ) | 🔧 進行中(下記参照) |

**現在、Phase 12(管理者機能)が進行中。**

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

## Phase 12: 管理者機能(進行中)

### 決定事項
- 「メッセージ通知」は、管理者へのメッセージ(問い合わせ)と、管理者からユーザー・キャストへのお知らせの双方向機能と定義(未実装)
- 管理者権限は`users.role`に`'admin'`を追加する方式(`users_role_check`制約を変更)
- キャストページの「メッセージ管理」「レビュー管理」「マッチング履歴」は**プロプラン(3000円/月)限定機能**。「プロフィール管理」「プラン変更」「サブスク履歴」は全プラン共通

### サイト管理者ページ(土台完了)
- マイグレーション`006_add_admin_foundation.sql`: `users.role`に`'admin'`追加、`users.is_blacklisted`/`blacklist_reason`追加、`subscriptions.status`追加(今後Webhookで同期予定、現状は未使用)
- `lib/admin.ts`: `requireAdmin()`共通関数(Clerk認証→`users.role==='admin'`判定)
- `app/admin/layout.tsx`: アクセス制御付き共通レイアウト、管理者でなければ`/`にリダイレクト
- `app/admin/page.tsx`: ダッシュボード(総ユーザー数・キャスト登録数・ブラックリスト件数の簡易サマリー)
- `app/admin/users/page.tsx` + `app/api/admin/users/route.ts`・`app/api/admin/users/[id]/route.ts`: ユーザー一覧、ブラックリストの追加/解除(理由付き)
- `app/admin/casts/page.tsx` + `app/api/admin/casts/route.ts`: キャスト一覧(エリア・時給レンジ・サブスクプラン・トライアル終了日)、ブラックリスト操作も同画面から可能
- 実地動作確認済み: ダッシュボード表示、ユーザー/キャスト一覧表示、ブラックリスト登録・解除、非管理者アカウントでのアクセス制御(リダイレクト)

**管理者アカウント**: `nre46682@yahoo.co.jp`(普段使いのメールアドレス)を管理者に設定済み。としさん・幸子さんはテスト用アカウントのまま。

### サイト管理者ページ(未着手)
- メッセージ通知(管理者⇔ユーザー/キャストの問い合わせ、管理者からのお知らせ配信)
- 月次サマリー・MRR(`subscriptions.status`を使う設計になるが、現状Webhookでstatusを同期する処理が未実装のため、先にそちらの対応が必要)

### キャストページ(一部完了)
- `lib/cast.ts`: `requireCast()`(キャスト登録済みか)・`requireCastPro()`(プロプランか)の共通関数
- `app/cast/page.tsx`: ダッシュボード、プラン表示、プロ限定機能には🔒マーク表示(クリックするとプラン変更ページへ誘導)
- `app/cast/messages/page.tsx` + `app/api/cast/messages/route.ts`(プロ限定): 全申込みの最新メッセージをまとめて一覧表示、クリックで`/cast/applications`へ
- `app/cast/reviews/page.tsx` + `app/api/cast/reviews/route.ts`(プロ限定): 受け取ったレビューの一覧
- `app/cast/history/page.tsx` + `app/api/cast/history/route.ts`(プロ限定): 過去の確定・完了予約の一覧(`bookings.status`で判定)
- プロフィール写真アップロード機能を追加: マイグレーション`007_add_cast_photo_bucket.sql`でSupabase Storageの`cast-photos`バケット(public)を作成、`app/api/cast-profile/photo/route.ts`でアップロード処理(Clerk認証→本人確認→Storageアップロード→公開URL返却、5MB・jpg/png/webp制限)、`app/cast/register/page.tsx`にアップロードUI・丸型プレビューを追加。リロード後の復元表示まで実地確認済み

### キャストページ(未着手)
- `/cast/subscribe/change`: プラン変更(基本⇔プロ)。Stripeの`stripe.subscriptions.update()`でprice差し替えが必要
- `/cast/subscribe/history`: サブスク履歴(請求履歴)。Stripeの`invoices.list()`等を使う想定
- ダッシュボードの「プラン変更」「サブスク履歴」カードは、現状リンク先が未実装(404になる)

---

## 技術的なメモ・注意点

- `@clerk/nextjs@7.5.7` は `<SignedIn>`/`<SignedOut>` ではなく `<Show when="signed-in">` 系を使う
- Next.js側の仕様変更で`params`がPromiseになっている(動的ルートは`await params`が必要)
- Webhook(Clerk・Stripe)は`proxy.ts`(旧`middleware.ts`)の`isPublicRoute`に含めないと307/404になる
- `subscriptions`テーブルの行が存在しない場合、UPDATE系の処理は「0件更新」で静かに失敗する(upsertやフォールバックinsertで対策済みの箇所と未対策の箇所がないか都度注意)
- ディレクトリ名に`[id]`を使う場合、zshでは特殊文字展開されるためダブルクォートで囲む必要がある
- ターミナルへの手入力・コピペでIDに不可視文字が混入し、Stripe CLIで「存在しない」エラーになることがある。シェル変数経由で渡すと確実
- Clerkのアカウント表示名(「おか とし」等)とアプリ内の`users.nickname`(「幸子」等)は完全に別の仕組みで連動していない。テストアカウントを複数作る際に混同しやすいので注意

---

## 未解決・保留中の課題一覧(まとめ)

1. Stripe Link確認メールが受信できない問題(詳細未特定、優先度低)
2. 本番前チェックリストの継続的な洗い出し(法務・eKYC・安全対策など、事業計画書レベルの課題は別途)
3. (将来的な検討事項)ヘッダー通知バッジとメッセージ未読バッジの統合

---

## 次にやること(直近のTODO)

1. キャストページ: プラン変更(`/cast/subscribe/change`、Stripeのprice差し替え)
2. キャストページ: サブスク履歴(`/cast/subscribe/history`)
3. サイト管理者ページ: メッセージ通知(問い合わせ・お知らせ)
4. サイト管理者ページ: 月次サマリー・MRR(`subscriptions.status`のWebhook同期が前提)
5. Phase 12完了後、本番リリース前チェックリストの洗い出しに戻る
