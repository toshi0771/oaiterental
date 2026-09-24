# お相手レンタル 開発ロードマップ（Phase 1〜10）

作成日：2026年8月

---

## Phase 1：設計・計画

- ビジネスコンセプト整理（時間貸しマッチングサービス、大阪近郊）
- 料金体系の決定：ユーザー無料 / キャスト月額サブスク（基本300円、プロ3,000円）
- DB設計・ER図作成（`system_design_v1.md`）
- API設計（エンドポイント一覧の洗い出し）
- 法務・リスク洗い出し（出会い系サイト規制法、旅行業法、資金移動業など）

**状態：完了**

---

## Phase 2：インフラ構築

- 技術スタック確定：Next.js / Clerk / Supabase / Google Maps API / Stripe / Render
- Supabaseプロジェクト作成、`001_schema.sql`（テーブル定義）・`002_rls_policies.sql`（RLSポリシー）作成
- GitHubリポジトリ作成（`github.com/toshi0771/oaiterental`）、`.env.local`除外を確認しpush

**状態：完了**

---

## Phase 3：認証・Next.js基盤

- Next.js 16 プロジェクト作成
- Clerk連携（サインイン・サインアップページ実装）
- Clerk webhook（`user.created`）→ Supabase `users`テーブル自動同期
  - つまずき：`middleware.ts`が`app/proxy/middleware.ts`という誤った場所にあり認識されず、webhookが機能していなかった
  - 修正：プロジェクトルート直下に`proxy.ts`として配置（Next.js 16の命名規則）→ 修正後のサインアップから正常に同期確認
- ヘッダーにUserButton追加（ログイン状態の可視化）
  - つまずき：`@clerk/nextjs@7.5.7`では`SignedIn`/`SignedOut`が存在せず、`<Show when="signed-in">`等に置き換えて対応

**状態：完了**

---

## Phase 4：トップページ・地図表示

- トップページにGoogle Maps APIを組み込み、`AdvancedMarker`でエントリーを表示
- `InfoWindow`でキャスト詳細（ニックネーム・年代・性別・時間・目的・時給）を表示
- 「初めての方へ」ガイドモーダル（GuideModal）実装
  - お相手レンタルとは / 対象エリア / 料金について / 役割について / キャストの方へ / 使い方
- 配色をピンク・オレンジ系からグリーン系に統一

**状態：完了**

---

## Phase 5：プロフィール設定

- `/profile`画面：ニックネーム・性別・年代を入力する初回登録フォーム
- `POST /api/profile`：Supabase `users`テーブルへの保存
- `/profile`を編集画面としても使う設計に変更（初回登録・編集を1画面で兼用）
  - `GET /api/profile`追加：ログイン中ユーザーの既存データを取得しフォームへプリフィル
  - つまずき：保存処理が`UPDATE`のみだったため、Clerk webhookが届かず`users`行が存在しないケースで「保存成功」表示なのに実際は未保存というバグが発生
  - 修正：行の有無を確認し、なければ`INSERT`（`real_name`は仮値、`email`はClerkの`currentUser()`から取得）、あれば`UPDATE`する2段階方式に変更

**状態：完了**

---

## Phase 6：ユーザー基本機能

- ユーザー登録（Clerkサインアップ）→ Supabase `users`行自動作成
- ニックネーム・性別・年代のプロフィール管理（Phase 5で実装済み）
- マップからのキャスト検索・閲覧（Phase 4で実装済み）

**状態：完了（Phase 4・5の内容を統合したユーザー向け基本機能一式）**

---

## Phase 7：キャスト登録

- 一般ユーザーが「キャストになる」を選べる導線の実装
- キャスト用プロフィール入力フォーム
  - 顔なし写真（`photo_url`）
  - 年代（`age_range`）
  - 自己紹介（`bio`）
  - 時給範囲（`hourly_rate_min` / `hourly_rate_max`）
  - エリア（`area`）
- 位置情報のファジー化処理（`lat_fuzzy` / `lng_fuzzy`）
- `cast_profiles`テーブルへの保存API実装
  - Supabase `001_schema.sql`に`cast_profiles`テーブルは定義済み（要確認：カラム構成が設計書と一致しているか）

**状態：これから着手**

---

## Phase 8：エントリー・マップ表示

- キャストがエントリー（募集）を作成する機能
  - `entry_date`, `start_time`, `end_time`, `purpose`, `hourly_rate`
- `POST /api/entries`：エントリー作成API
- `GET /api/entries/map`：ファジー座標のみを返す一覧取得API（本名・メール除外）
- `GET /api/entries/:id`：詳細プロフィール取得API
- トップページの地図表示は実データ（`entries`テーブル）と連携させる

**状態：未着手**

---

## Phase 9：マッチング

- `POST /api/applications`：ユーザーが申込・メッセージ送信
- Supabase Realtimeを使ったキャストへの通知
- `PATCH /api/applications/:id/confirm`：キャストが確定者に返信→マッチング成立
  - 確定した申込以外は自動的に`rejected`
  - `bookings`レコード生成
- `POST /api/bookings/:id/complete`：当日終了後の完了マーク

**状態：未着手**

---

## Phase 10：レビュー・サブスク

- `POST /api/reviews`：相互レビュー投稿機能
- Stripeサブスクリプション実装（キャスト向け月額課金）
  - 基本プラン 300円/月、プロプラン 3,000円/月
  - `subscriptions`テーブルの`first_booking_done`フラグによる「初回マッチングまで無料」ロジック
- カスタマーポータル連携（プラン変更・解約）
- レビュー・通報のモデレーション機能

**状態：未着手**

---

## 参考：ビジネス面での継続課題（実装フェーズと並行して検討）

- 法務確認（出会い系サイト規制法・売春防止法との境界、弁護士相談）
- 決済方式の再検討（現地現金払い vs エスクロー型、資金移動業登録の要否）
- キャスト向け安全機能（緊急連絡先登録、位置情報共有、緊急連絡ボタン）
- コールドスタート対策（開発中からのキャスト候補ウェイティングリスト作成）
- 未成年流入対策、なりすまし対策、キャストの税務処理明示
- 競合差別化（タイムチケット、ユアタイム等との比較）
- ジェンダー設計（現状は女性キャスト×男性ユーザーが暗黙の前提、双方向対応の検討）
- インフラのスケーラビリティ（Render無料〜Starterプランの負荷試験）
