-- ============================================
-- お相手レンタルシステム DBスキーマ定義
-- ============================================

-- 拡張機能の有効化（位置情報・UUID）
create extension if not exists "uuid-ossp";
create extension if not exists postgis;

-- ============================================
-- USERS（全ユーザー共通）
-- ============================================
create table users (
  id uuid primary key default uuid_generate_v4(),
  clerk_user_id text unique not null,
  real_name text not null,                 -- 管理者のみ参照（RLSで制限）
  email text not null,                      -- 管理者のみ参照（RLSで制限）
  gender text not null check (gender in ('male', 'female', 'other')),
  nickname text not null,
  role text not null default 'user' check (role in ('user', 'cast', 'both')),
  kyc_verified boolean not null default false,
  created_at timestamptz not null default now()
);

comment on column users.real_name is '管理者のみ参照可。出会い系サイト規制法対応のため一般公開しない';
comment on column users.email is '管理者のみ参照可';

-- ============================================
-- CAST_PROFILES（キャストの公開プロフィール）
-- ============================================
create table cast_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references users(id) on delete cascade,
  photo_url text,                           -- 顔なし写真など
  age_range text not null,                  -- 例: '40代'
  bio text,
  hourly_rate_min int not null check (hourly_rate_min > 0),
  hourly_rate_max int not null check (hourly_rate_max >= hourly_rate_min),
  area text not null,                       -- 例: '梅田', '難波'
  lat_fuzzy double precision not null,       -- ファジー座標（実座標+ランダムオフセット）
  lng_fuzzy double precision not null,
  created_at timestamptz not null default now()
);

-- ============================================
-- ENTRIES（エントリー：日時・目的・金額の募集情報）
-- ============================================
create table entries (
  id uuid primary key default uuid_generate_v4(),
  cast_id uuid not null references cast_profiles(id) on delete cascade,
  entry_date date not null,
  start_time time not null,
  end_time time not null,
  purpose text not null,                    -- 例: '食事', 'お茶', '野球観戦', '同伴'
  hourly_rate int not null check (hourly_rate > 0),
  status text not null default 'open' check (status in ('open', 'matched', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  check (end_time > start_time)
);

create index idx_entries_status on entries(status);
create index idx_entries_date on entries(entry_date);

-- ============================================
-- APPLICATIONS（申込）
-- ============================================
create table applications (
  id uuid primary key default uuid_generate_v4(),
  entry_id uuid not null references entries(id) on delete cascade,
  applicant_id uuid not null references users(id) on delete cascade,
  message text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  created_at timestamptz not null default now(),
  unique (entry_id, applicant_id)            -- 同一エントリーへの重複申込を防止
);

create index idx_applications_entry on applications(entry_id);

-- ============================================
-- BOOKINGS（マッチング成立）
-- ============================================
create table bookings (
  id uuid primary key default uuid_generate_v4(),
  application_id uuid not null unique references applications(id) on delete cascade,
  entry_id uuid not null references entries(id) on delete cascade,
  payment_status text not null default 'pending' check (payment_status in ('pending', 'paid_onsite', 'no_show')),
  confirmed_at timestamptz not null default now()
);

-- ============================================
-- REVIEWS（相互レビュー）
-- ============================================
create table reviews (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid not null references bookings(id) on delete cascade,
  reviewer_id uuid not null references users(id) on delete cascade,
  satisfaction_score int not null check (satisfaction_score between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (booking_id, reviewer_id)           -- 1予約につき1人1レビューまで
);

-- ============================================
-- SUBSCRIPTIONS（サブスク管理）
-- ============================================
create table subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique references users(id) on delete cascade,
  plan_type text not null default 'free' check (plan_type in ('free', 'standard')),
  stripe_subscription_id text,
  first_booking_done boolean not null default false,
  trial_ends_at timestamptz,
  created_at timestamptz not null default now()
);
