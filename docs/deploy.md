# Home Budget deploy memo

## 1. Supabase project

1. SupabaseでOrganizationを作る
2. New Projectを作る
3. Project Settings > Data API で以下を確認
   - Enable Data API: ON
   - Automatically expose new tables: OFF
   - Enable automatic RLS: ON
4. SQL Editorで `supabase/schema.sql` を実行

## 2. Local env

Supabaseの Project Settings > API から次をコピーして `.env.local` に入れる。

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxx
```

`secret` key / `service_role` key はブラウザに出るので入れない。

## 3. Local check

```bash
npm run dev
```

`http://localhost:3000` を開く。

## 4. GitHub

```bash
git init
git add .
git commit -m "Initial Home Budget app"
git branch -M main
git remote add origin https://github.com/<your-name>/<repo>.git
git push -u origin main
```

すでに `.git` がある場合は `git init` は不要。

## 5. Vercel

1. Vercelで Add New > Project
2. GitHub repositoryをImport
3. Environment Variablesに `.env.local` と同じ値を登録
4. Deploy

## 6. Next tasks before real use

- Supabase Authを入れる
- 同じ household だけ読めるRLS policyを追加
- 予算変更を `settings` に保存
- 家電/家具カテゴリと商品候補をSupabaseから追加・編集・選択できるようにする
- URLから商品名/価格/メーカー候補を読み取るAPIを追加
