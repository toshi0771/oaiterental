-- ============================================
-- RLSポリシー定義
-- ============================================
-- 前提: Supabase Authではなく Clerk を使うため、
-- JWTのカスタムクレームに role（'admin' / 'user'）と
-- clerk_user_id をセットし、Supabase側で検証する構成。
-- auth.jwt() ->> 'role' / auth.jwt() ->> 'sub' で参照する想定。

-- ============================================
-- USERS
-- ============================================
alter table users enable row level security;

-- 本人は自分の全カラムを参照可能
create policy users_select_self
  on users for select
  using (clerk_user_id = auth.jwt() ->> 'sub');

-- 管理者は全カラム・全行を参照可能
create policy users_select_admin
  on users for select
  using (auth.jwt() ->> 'role' = 'admin');

-- 他ユーザーは nickname / gender / role / kyc_verified のみ見えるビューを別途用意
-- （real_name, email は基本テーブルでは他人から不可視。下記 view 参照）

-- 本人のみ自分の行を更新可能（real_name, email は更新不可カラムとして別途アプリ側で制御）
create policy users_update_self
  on users for update
  using (clerk_user_id = auth.jwt() ->> 'sub');

-- 新規登録は誰でも可能（Clerkでサインアップ後にinsert）
create policy users_insert_self
  on users for insert
  with check (clerk_user_id = auth.jwt() ->> 'sub');

-- 他ユーザーへの公開用ビュー（real_name, email を含まない）
create view public_user_profiles as
  select id, nickname, gender, role, kyc_verified, created_at
  from users;

-- ============================================
-- CAST_PROFILES
-- ============================================
alter table cast_profiles enable row level security;

-- 誰でも閲覧可能（マップ表示・検索のため）
create policy cast_profiles_select_all
  on cast_profiles for select
  using (true);

-- 本人のみ自分のプロフィールを作成・更新可能
create policy cast_profiles_insert_self
  on cast_profiles for insert
  with check (
    user_id in (select id from users where clerk_user_id = auth.jwt() ->> 'sub')
  );

create policy cast_profiles_update_self
  on cast_profiles for update
  using (
    user_id in (select id from users where clerk_user_id = auth.jwt() ->> 'sub')
  );

-- ============================================
-- ENTRIES
-- ============================================
alter table entries enable row level security;

-- 誰でも閲覧可能（マップ・検索のため）
create policy entries_select_all
  on entries for select
  using (true);

-- 本人（キャスト）のみ作成可能
create policy entries_insert_self
  on entries for insert
  with check (
    cast_id in (
      select cp.id from cast_profiles cp
      join users u on u.id = cp.user_id
      where u.clerk_user_id = auth.jwt() ->> 'sub'
    )
  );

-- 本人のみ更新可能（ステータス変更含む）
create policy entries_update_self
  on entries for update
  using (
    cast_id in (
      select cp.id from cast_profiles cp
      join users u on u.id = cp.user_id
      where u.clerk_user_id = auth.jwt() ->> 'sub'
    )
  );

-- ============================================
-- APPLICATIONS
-- ============================================
alter table applications enable row level security;

-- 申込者本人、またはそのエントリーのキャスト本人のみ閲覧可能
create policy applications_select_related
  on applications for select
  using (
    applicant_id in (select id from users where clerk_user_id = auth.jwt() ->> 'sub')
    or
    entry_id in (
      select e.id from entries e
      join cast_profiles cp on cp.id = e.cast_id
      join users u on u.id = cp.user_id
      where u.clerk_user_id = auth.jwt() ->> 'sub'
    )
  );

-- 本人のみ申込作成可能
create policy applications_insert_self
  on applications for insert
  with check (
    applicant_id in (select id from users where clerk_user_id = auth.jwt() ->> 'sub')
  );

-- エントリーのキャスト本人のみステータス更新可能（確定・却下）
create policy applications_update_cast
  on applications for update
  using (
    entry_id in (
      select e.id from entries e
      join cast_profiles cp on cp.id = e.cast_id
      join users u on u.id = cp.user_id
      where u.clerk_user_id = auth.jwt() ->> 'sub'
    )
  );

-- ============================================
-- BOOKINGS
-- ============================================
alter table bookings enable row level security;

-- 関係者（申込者・キャスト）のみ閲覧可能
create policy bookings_select_related
  on bookings for select
  using (
    application_id in (
      select a.id from applications a
      where a.applicant_id in (select id from users where clerk_user_id = auth.jwt() ->> 'sub')
    )
    or
    entry_id in (
      select e.id from entries e
      join cast_profiles cp on cp.id = e.cast_id
      join users u on u.id = cp.user_id
      where u.clerk_user_id = auth.jwt() ->> 'sub'
    )
  );

-- insert/update はサーバー側API（service role）経由のみ許可し、
-- クライアントからの直接書き込みは行わない方針（ポリシー未付与＝拒否）

-- ============================================
-- REVIEWS
-- ============================================
alter table reviews enable row level security;

-- 誰でも閲覧可能（信頼性の可視化のため）
create policy reviews_select_all
  on reviews for select
  using (true);

-- 該当予約の関係者のみレビュー投稿可能
create policy reviews_insert_related
  on reviews for insert
  with check (
    reviewer_id in (select id from users where clerk_user_id = auth.jwt() ->> 'sub')
    and
    booking_id in (
      select b.id from bookings b
      join applications a on a.id = b.application_id
      join entries e on e.id = b.entry_id
      join cast_profiles cp on cp.id = e.cast_id
      join users u on u.id = cp.user_id
      where a.applicant_id in (select id from users where clerk_user_id = auth.jwt() ->> 'sub')
         or u.clerk_user_id = auth.jwt() ->> 'sub'
    )
  );

-- ============================================
-- SUBSCRIPTIONS
-- ============================================
alter table subscriptions enable row level security;

-- 本人のみ閲覧可能
create policy subscriptions_select_self
  on subscriptions for select
  using (
    user_id in (select id from users where clerk_user_id = auth.jwt() ->> 'sub')
  );

-- insert/update はサーバー側API（Stripe Webhook処理）経由のみ
-- （ポリシー未付与＝クライアントから直接の書き込みは拒否）
