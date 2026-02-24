# Supabase Setup for VueBlackNote

## Tables

-- 1. backups 表: 存储每个用户的加密备份数据
```sql
create table if not exists public.backups (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  data text not null,
  updated_at timestamptz default now()
);
```

-- 2. profiles 表 (可选): 存储用户自定义 profile 数据（如背景图片路径）
```sql
create table if not exists public.profiles (
  id uuid references auth.users(id) primary key,
  username text,
  avatar_url text,
  background_url text,
  updated_at timestamptz default now()
);
```

## Storage

创建一个名为 `backgrounds` 的存储桶，用于保存用户上传的背景图片，设为私有或公共按需。

## RLS (Row Level Security) 策略

启用 RLS 并允许用户只访问自己的备份数据：

```sql
-- 启用 RLS
alter table public.backups enable row level security;

-- 允许插入：必须为当前登录用户
create policy "backups_insert_own" on public.backups
  for insert using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 允许选择/更新/删除：仅访问自己的行
create policy "backups_select_own" on public.backups
  for select using (auth.uid() = user_id);

create policy "backups_update_own" on public.backups
  for update using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "backups_delete_own" on public.backups
  for delete using (auth.uid() = user_id);
```

对于 `profiles` 表也类似：

```sql
alter table public.profiles enable row level security;
create policy "profiles_owner" on public.profiles
  for all using (auth.uid() = id)
  with check (auth.uid() = id);
```

## Supabase Storage Public URL

如果存储桶为私有，请使用 Supabase 存储的 Signed URL 或在服务端生成访问链接。如果为公共存储桶，上述 `getPublicUrl` 将返回可直接使用的 URL。

---

把上述 SQL 在 Supabase SQL Editor 中执行，并在 Supabase 控制台中创建 `backgrounds` 存储桶。确保在项目中的 `src/utils/supabase.js` 填入正确的 URL 与 ANON KEY。
