# Kedai Cak Kum — POS Restaurant

Aplikasi POS (Point of Sale) untuk Kedai Cak Kum. Customer scan QR di meja, pilih menu, bayar, lalu admin pantau pesanan secara real-time.

**Stack:**

- **Next.js 16** (App Router + Turbopack) · **Tailwind v4** · **shadcn/ui** · **TypeScript**
- **Drizzle ORM** + **postgres-js** untuk semua data access (queries + transactions)
- **Supabase** untuk Auth (Google OAuth), Storage (image upload), Realtime (admin orders)

**Dokumen pendukung:**

- [`PRD.md`](./PRD.md) — Product Requirements Document
- [`DESIGN.md`](./DESIGN.md) — Design tokens (LottieFiles style reference)

---

## Daftar isi

1. [Prasyarat](#1-prasyarat)
2. [Setup Supabase](#2-setup-supabase)
3. [Setup Google OAuth](#3-setup-google-oauth)
4. [Setup Project Lokal](#4-setup-project-lokal)
5. [Bootstrap Admin Pertama](#5-bootstrap-admin-pertama)
6. [Isi Data Awal](#6-isi-data-awal-kategori--menu)
7. [Test End-to-End](#7-test-end-to-end)
8. [Database Workflow (Drizzle)](#8-database-workflow-drizzle)
9. [Generate QR Meja](#9-generate-qr-meja)
10. [Deploy ke Vercel](#10-deploy-ke-vercel)
11. [Troubleshooting](#11-troubleshooting)
12. [Struktur Project](#struktur-project)
13. [Roadmap](#roadmap)

---

## 1. Prasyarat

- **Node.js 20+** dan **npm 10+**
- **Akun Supabase** (free tier cukup untuk development)
- **Akun Google Cloud Platform** (untuk OAuth credentials)
- **Akun Vercel** (opsional, untuk deploy)

---

## 2. Setup Supabase

### 2.1 Buat project baru

1. Buka [supabase.com](https://supabase.com) → **New project**
2. Isi nama project, password database (catat untuk `DATABASE_URL`), region terdekat (Singapore untuk Indonesia)
3. Tunggu sampai status **"Project is ready"** (~1-2 menit)

### 2.2 Apply migrations awal

Initial schema termasuk RLS policies, triggers, storage bucket, dan Realtime publication — hal-hal yang Drizzle Kit tidak generate otomatis. Semuanya udah di-bundle sebagai SQL files di `drizzle/migrations/`.

Setelah `.env.local` terisi (lihat step 4), jalankan satu command:

```bash
npm run db:migrate
```

Migrator akan apply semua file SQL yang belum pernah dijalankan, urut by timestamp prefix. Track-nya di tabel `_migrations`. Aman untuk re-run — kalau tidak ada pending migration, dia exit cepat tanpa side-effect.

> **Apa yang ada di initial migrations:**
>
> - `*_init.sql` — Tabel + enum + sequence + index
> - `*_rls.sql` — Row Level Security policies + `is_admin()` helper
> - `*_triggers.sql` — Auto-mirror auth.users → public.users + updated_at
> - `*_storage.sql` — Bucket `menu-images` (public read, admin write)
> - `*_realtime.sql` — Realtime publication untuk tabel `orders`

### 2.3 Ambil credentials

Setelah migrations awal selesai, buka **Settings → API**:

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (jangan pernah expose ke browser)

Lalu buka **Settings → Database → Connection string → Transaction**:

- Copy connection string ke `DATABASE_URL`
- Ganti `[YOUR-PASSWORD]` dengan database password yang lo set di step 2.1
- **Pakai Transaction Pooler (port 6543)**, bukan direct connection — Drizzle butuh ini untuk pgbouncer

---

## 3. Setup Google OAuth

### 3.1 Buat OAuth client di Google Cloud Console

1. Buka [console.cloud.google.com](https://console.cloud.google.com) → buat project baru atau pilih existing
2. Aktifkan **Google+ API** (atau cukup dengan default OAuth 2.0)
3. Buka **APIs & Services → OAuth consent screen** → pilih **External** → isi nama app, email support, dan email developer. Save.
4. Buka **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - Name: bebas (misal "Kedai Cak Kum")
   - Authorized JavaScript origins: kosongkan dulu (cukup pakai redirect URIs)
   - Authorized redirect URIs: `https://<your-project-ref>.supabase.co/auth/v1/callback`

   > **Tips:** ganti `<your-project-ref>` dengan ref project Supabase kamu (lihat di Supabase Settings → General → Project ID).
5. Klik **Create** → copy **Client ID** dan **Client Secret**

### 3.2 Daftarkan di Supabase

1. Di Supabase dashboard, buka **Authentication → Providers**
2. Cari **Google** → toggle **Enable**
3. Paste **Client ID** dan **Client Secret** dari Google Cloud
4. Save

### 3.3 (Opsional) Tambah redirect URI lokal

Untuk dev di `localhost`, Supabase sudah auto-handle redirect ke `http://localhost:3000/auth/callback`. Tidak perlu setup tambahan di Google Cloud.

---

## 4. Setup Project Lokal

### 4.1 Clone & install

```bash
git clone <repo-url> kedai-cak-kum
cd kedai-cak-kum
npm install
```

### 4.2 Buat `.env.local`

Copy template dari `.env.local.example`:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` dengan credentials dari step 2.3:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgres://postgres.your-project-ref:your-db-password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4.3 Verifikasi koneksi Drizzle

Setelah migrasi awal di-apply (step 2.2) dan `.env.local` terisi, verifikasi koneksi Drizzle:

```bash
npm run db:studio
```

Drizzle Studio akan terbuka di browser. Lo bisa lihat semua tabel dan data via UI ini.

### 4.4 Jalankan dev server

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

> **Catatan:** Build production gunakan `npm run build` lalu `npm start`. Project ini pakai Turbopack secara default.

---

## 5. Bootstrap Admin Pertama

User baru selalu mendapat role `customer` secara default. Untuk admin pertama, set manual via SQL:

1. Login ke aplikasi sekali via Google OAuth (di `/login`)
2. Buka **SQL Editor** di Supabase → run query berikut, ganti email dengan email Google kamu:

```sql
update public.users
set role = 'admin'
where email = 'your-email@gmail.com';
```

3. Refresh halaman → kamu sekarang bisa akses `/admin` dan promote user lain via UI di **/admin/users**

> **Setelah ada satu admin**, semua promote/demote berikutnya bisa dilakukan via UI tanpa SQL lagi.

---

## 6. Isi Data Awal (Kategori + Menu)

Sebelum customer bisa lihat menu, kamu perlu setup data awal sebagai admin:

### 6.1 Tambah kategori

1. Buka `/admin/categories`
2. Tambah kategori menu, misal:
   - **Mie** (urutan 0)
   - **Dimsum** (urutan 1)
   - **Minuman** (urutan 2)
3. Urutan menentukan posisi tampil di halaman customer (kecil = lebih dulu)

### 6.2 Tambah menu

1. Buka `/admin/menus` → klik **Tambah menu**
2. Isi form:
   - Nama menu (misal "Mie Ayam Spesial")
   - Pilih kategori
   - Harga dalam Rupiah (angka, tanpa titik/koma)
   - Deskripsi singkat (opsional)
   - Upload gambar (JPG/PNG/WebP, maks 2MB)
   - Toggle "Aktif" (default: aktif)
3. Klik **Buat menu**

Menu yang non-aktif tidak akan tampil di halaman customer tapi tetap bisa di-edit oleh admin.

---

## 7. Test End-to-End

### 7.1 Customer flow

1. Buka di **incognito** atau device kedua: [http://localhost:3000/menu?table=1](http://localhost:3000/menu?table=1)
2. Browse menu (bisa tanpa login)
3. Klik tombol **+** pada menu yang dipilih → akan diminta login Google
4. Setelah login, lanjut tambah item ke cart
5. Klik FAB **"Lihat keranjang"** di bottom → buka `/cart?table=1`
6. Atur quantity, tambah catatan per-item ("tanpa bawang"), atau hapus item
7. Klik **Checkout** → review pesanan
8. Klik **Bayar** → tampil QR statis
9. Klik **Sudah bayar** → order created → redirect ke `/order/success` dengan nomor pesanan

### 7.2 Admin flow

1. Login dengan akun admin (lihat step 5)
2. Buka `/admin` → lihat ringkasan: pesanan aktif, hari ini, pendapatan
3. Buka `/admin/orders` → pesanan dari step 7.1 muncul real-time tanpa refresh
4. Update status pesanan: **Sedang diproses** → **Siap diambil** → **Selesai**
5. Atau klik **Dibatalkan** kalau pembayaran tidak valid

### 7.3 Test Realtime

Buka 2 tab: tab 1 = `/admin/orders` (admin), tab 2 = `/menu?table=2` (customer di incognito). Order baru di tab 2 → muncul instant di tab 1 dengan toast notification.

---

## 8. Database Workflow (Drizzle)

Semua migrations — initial setup maupun future schema changes — duduk di satu folder: `drizzle/migrations/`. Migrator custom (`scripts/migrate.ts`) akan apply file SQL secara berurutan berdasarkan timestamp prefix.

| Sumber                          | Untuk apa                                                                  |
| ------------------------------- | -------------------------------------------------------------------------- |
| `src/lib/db/schema.ts`          | Tabel, kolom, enum, FK, index, relations — yang Drizzle Kit handle         |
| `drizzle/migrations/*.sql`      | Migration SQL files (auto-generated + hand-written) — semua di sini        |

Drizzle Kit generate diff dari `schema.ts` saja. Hal seperti RLS policies, triggers, storage buckets, dan Realtime publication tetap ditulis tangan sebagai SQL file di folder yang sama.

### 8.1 Available scripts

```bash
npm run db:migrate    # Apply semua migration SQL yang pending (initial + future)
npm run db:generate   # Generate migration SQL dari diff schema.ts vs database
npm run db:reset      # Drop schema public dan reset DB (butuh konfirmasi)
npm run db:studio     # Buka Drizzle Studio (UI explorer)
npm run db:check      # Check apakah ada drift antara schema.ts dan migrations
```

> **`db:reset`** akan menghapus semua data. Pakai hanya untuk dev environment atau saat lo perlu ulangi setup dari awal. Pakai flag `-- --yes` untuk skip prompt: `npm run db:reset -- --yes`.

### 8.2 Migration file naming

Format: `YYYYMMDDHHMMSS_<description>.sql`

Contoh: `20260607121629_init.sql`, `20260615084215_add_loyalty_points.sql`

Naming convention ini bikin urutan lexical = urutan kronologis, sehingga migrator bisa sort sederhana via filename. Drizzle Kit juga di-set `prefix: "timestamp"` di `drizzle.config.ts` supaya output `db:generate` ikut pola yang sama.

### 8.3 Workflow: ubah schema

Misalkan lo mau tambah kolom `phone_number` di tabel `users`:

1. **Edit `src/lib/db/schema.ts`** — tambah field di Drizzle schema:

   ```typescript
   export const users = pgTable("users", {
     // ... fields existing
     phoneNumber: text("phone_number"),  // <-- baru
   });
   ```

2. **Generate migration:**

   ```bash
   npm run db:generate
   ```

   Output: file SQL baru di `drizzle/migrations/<timestamp>_<auto_name>.sql` dengan ALTER TABLE statement-nya.

3. **Review migration** — buka file SQL yang di-generate, pastikan benar.

4. **Apply ke database:**

   ```bash
   npm run db:migrate
   ```

5. **(Opsional) Update RLS jika perlu** — kalau kolom baru perlu RLS policy berbeda, bikin file SQL baru manual:

   ```bash
   echo "-- Add RLS for phone_number" > drizzle/migrations/$(date +%Y%m%d%H%M%S)_users_phone_rls.sql
   ```

   Edit file tersebut, lalu jalankan `npm run db:migrate` lagi.

### 8.4 Why bypass RLS in Drizzle?

Drizzle pakai connection string langsung (port 6543) yang authenticate sebagai database owner. Itu bypass RLS. Tapi ini aman karena:

1. **Drizzle hanya jalan di server** (Server Components, Server Actions) — tidak pernah di browser
2. **Auth gating dilakukan di app layer** via `requireAuth()` dan `requireAdmin()` di `src/lib/auth/session.ts`
3. **RLS tetap aktif** untuk client-side Supabase calls (Realtime subscription, OAuth) dan untuk koneksi langsung ke DB dari luar app

Pattern ini cocok untuk project dengan single-tenant + role-based access. Kalau kamu butuh per-row authz yang ketat, set context manual di setiap query.

---

## 9. Generate QR Meja

Setiap meja butuh QR code unik yang point ke `/menu?table=<nomor-meja>`. Ada beberapa cara:

### 9.1 Online QR generator (cepat)

1. Buka [qr-code-generator.com](https://www.qr-code-generator.com) atau service serupa
2. Isi URL: `https://<your-domain>.com/menu?table=1` (untuk meja 1)
3. Download → cetak → tempel di meja 1
4. Ulangi untuk meja 2, 3, dst dengan ganti `table=N`

### 9.2 Pakai library (untuk batch)

```bash
npm install -g qrcode
qrcode -o table-1.png "https://your-domain.com/menu?table=1"
qrcode -o table-2.png "https://your-domain.com/menu?table=2"
```

> **Tips:** Cetak QR dengan ukuran minimal 4×4 cm agar mudah di-scan dari jarak normal.

---

## 10. Deploy ke Vercel

### 10.1 Push ke GitHub

```bash
git add .
git commit -m "feat: initial commit"
git push origin main
```

### 10.2 Import di Vercel

1. Buka [vercel.com/new](https://vercel.com/new) → import repository GitHub
2. Framework preset auto-detect **Next.js**
3. Set environment variables (semua dari `.env.local`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DATABASE_URL`
   - `NEXT_PUBLIC_APP_URL` → ganti ke domain Vercel kamu (misal `https://kedai-cak-kum.vercel.app`)
4. Deploy

### 10.3 Update Supabase + Google OAuth

Setelah punya domain production:

1. **Supabase → Authentication → URL Configuration**:
   - Site URL: `https://<your-domain>.com`
   - Redirect URLs: tambahkan `https://<your-domain>.com/auth/callback`
2. **Google Cloud Console**: tambahkan production domain ke Authorized redirect URIs (langkah 3.1 di atas)

---

## 11. Troubleshooting

### "DATABASE_URL must be set"

- Pastikan `.env.local` ada di root project dan punya `DATABASE_URL`
- Cek connection string pakai port **6543** (Transaction Pooler), bukan 5432
- Restart dev server setelah edit `.env.local`

### "Failed to load menus" / "permission denied"

- Pastikan `npm run db:migrate` sukses dan tidak ada migration yang skipped
- Cek RLS aktif di tabel: Supabase → Database → Tables → klik tabel → **RLS enabled** harus on
- Pastikan user sudah punya row di `public.users` (otomatis via trigger `on_auth_user_created`)

### Drizzle query error "prepared statement does not exist"

- pgbouncer (Transaction Pooler) tidak support prepared statements
- Pastikan `prepare: false` ada di `src/lib/db/index.ts` (sudah di-set by default)

### Realtime tidak mengirim event

- Pastikan migration `*_realtime.sql` sudah berhasil di-apply (`npm run db:migrate` log harus menampilkan ✓)
- Verify di Supabase: **Database → Publications → supabase_realtime** → tabel `orders` harus tercentang
- Cek browser console untuk error WebSocket

### Login Google "redirect_uri_mismatch"

- Pastikan redirect URI di Google Cloud Console persis: `https://<project-ref>.supabase.co/auth/v1/callback`
- Tidak boleh ada trailing slash atau typo
- Tunggu beberapa menit setelah update — Google butuh propagasi

### Image upload gagal "exceeded size limit"

- Cek file < 2MB
- Cek format JPG/PNG/WebP (bukan HEIC, GIF, dll)
- Storage bucket `menu-images` di Supabase → **Configuration** → harus public + 2MB limit

### Admin pertama tidak bisa akses `/admin`

- Pastikan `update public.users set role = 'admin' where email = ...` sudah dijalankan
- Logout + login lagi untuk refresh session
- Cek role di SQL: `select id, email, role from public.users where email = 'your-email@gmail.com';`

### Build error "useActionState is not exported"

- Pastikan React 19+ dan Next.js 16+ ter-install: `npm list react next`

### `npm run db:generate` bilang "no schema changes"

- Ini bukan error — artinya `schema.ts` sudah sinkron dengan database
- Edit `schema.ts` dulu kalau mau add/modify kolom

---

## Struktur Project

```
kedai-cak-kum/
├── proxy.ts                     # Next.js 16 Proxy (was middleware.ts)
├── next.config.ts               # Image domain config (Supabase Storage)
├── drizzle.config.ts            # Drizzle Kit config (schema + DATABASE_URL)
├── PRD.md                       # Product requirements
├── DESIGN.md                    # Design tokens
├── public/
│   └── payment-qr.svg           # Static payment QR (Phase 1 placeholder)
├── drizzle/migrations/          # All migrations (initial + auto-generated)
│   ├── 20260607121629_init.sql
│   ├── 20260607121630_rls.sql
│   ├── 20260607121631_triggers.sql
│   ├── 20260607121632_storage.sql
│   └── 20260607121633_realtime.sql
├── scripts/
│   └── migrate.ts               # Custom migrator (npm run db:migrate)
└── src/
    ├── app/                     # Next.js App Router
    ├── components/              # shadcn primitives + feature components
    ├── lib/
    │   ├── db/
    │   │   ├── schema.ts        # Drizzle schema (single source of truth)
    │   │   └── index.ts         # postgres-js + drizzle client
    │   ├── supabase/            # Auth + storage + realtime clients
    │   ├── auth/                # session helpers (Drizzle-backed)
    │   ├── menus/               # queries + actions (Drizzle)
    │   ├── categories/          # actions (Drizzle)
    │   ├── cart/                # queries + actions (Drizzle)
    │   ├── orders/              # queries + status + actions (Drizzle, transactional)
    │   ├── users/               # queries + admin-actions (Drizzle)
    │   ├── format.ts            # formatRupiah
    │   └── utils.ts             # shadcn cn()
    └── types/
        └── database.ts          # Empty stub for @supabase/ssr generic
```

---

## Roadmap

### Phase 1 — Foundation (selesai)

- ✅ Auth Google OAuth via Supabase
- ✅ Customer menu browse + cart + checkout dengan QR statis
- ✅ Admin: orders dashboard real-time + menu/category/user CRUD
- ✅ RLS + role-based access control + Drizzle ORM untuk type safety

### Phase 2 — Payment Gateway (next)

- [ ] Integrasi Midtrans atau Xendit
- [ ] Generate QR dinamis per transaksi
- [ ] Webhook auto-update status order setelah payment confirmed
- [ ] Isi `payment_reference`, `payment_method`, `paid_at` di tabel `orders`

### Phase 3 — Growth Features

- [ ] PWA + push notifications saat order siap
- [ ] Sales analytics + export laporan
- [ ] Multi-outlet support
- [ ] Customer loyalty points
- [ ] Stock counter (auto-decrement saat order)

---

## Lisensi

Private — internal use untuk Kedai Cak Kum.
