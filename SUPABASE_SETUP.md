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

## Storage (RLS 示例：私有 backgrounds 存储桶)

下面示例为私有 `backgrounds` 桶设置的策略（要求文件名为 auth.uid()::text || '.png'）：

```sql
create policy "Users can upload own background"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'backgrounds'
  and name = auth.uid()::text || '.png'
);

create policy "Users can view own background"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'backgrounds'
  and name = auth.uid()::text || '.png'
);

create policy "Users can update own background"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'backgrounds'
  and name = auth.uid()::text || '.png'
)
with check (
  bucket_id = 'backgrounds'
  and name = auth.uid()::text || '.png'
);

create policy "Users can delete own background"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'backgrounds'
  and name = auth.uid()::text || '.png'
);

-- 如果你还要支持头像上传，建议创建一个私有桶 `avatars`，并使用与 `backgrounds` 相同的策略，强制文件名为 `<auth.uid()>.png`：

create policy "Users can upload own avatar"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and name = auth.uid()::text || '.png'
  );

create policy "Users can view own avatar"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'avatars'
    and name = auth.uid()::text || '.png'
  );

create policy "Users can update own avatar"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and name = auth.uid()::text || '.png'
  )
  with check (
    bucket_id = 'avatars'
    and name = auth.uid()::text || '.png'
  );

create policy "Users can delete own avatar"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and name = auth.uid()::text || '.png'
  );
```

## Supabase Storage Public URL

如果存储桶为私有，请使用 Supabase 存储的 Signed URL 或在服务端生成访问链接。如果为公共存储桶，上述 `getPublicUrl` 将返回可直接使用的 URL。

---

把上述 SQL 在 Supabase SQL Editor 中执行，并在 Supabase 控制台中创建 `backgrounds` 存储桶。确保在项目中的 `src/utils/supabase.js` 填入正确的 URL 与 ANON KEY。

## realtime

-- 为备份表建立发布（若需要）
create publication realtime_backups for table public.backups;

-- 如果希望对 profiles 也实时订阅，可另建
create publication realtime_profiles for table public.profiles;
