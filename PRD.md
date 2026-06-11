# PRD — Kedai Cak Kum POS Restaurant

**Versi:** 1.1
**Tanggal:** 6 Juni 2026
**Status:** Draft

---

## 1. Overview

Kedai Cak Kum adalah aplikasi POS (Point of Sale) berbasis web untuk restoran keluarga dengan menu otentik seperti Mie Ayam dan Dimsum. Aplikasi ini memungkinkan customer memesan langsung dari meja mereka via scan QR code, tanpa perlu memanggil pelayan.

**Tujuan Bisnis:**
- Mengurangi waktu tunggu order
- Mendigitalisasi proses pemesanan yang sebelumnya manual
- Memberikan pengalaman makan yang modern namun tetap hangat dan personal
- Mempermudah admin/owner memantau dan mengelola order secara real-time

**Target Pengguna:**
- Customer: pengunjung restoran semua usia, diasumsikan memiliki smartphone
- Admin: pemilik atau staf restoran yang mengelola menu dan order

---

## 2. Goals & Success Metrics

| Goal | Metrik |
|------|--------|
| Customer bisa order mandiri tanpa bantu staf | % order yang selesai tanpa intervensi manual |
| Waktu dari scan QR sampai order submitted < 3 menit | Average time-to-order per session |
| Admin bisa update status menu real-time | Waktu propagasi perubahan status menu ke customer (< 5 detik) |
| Zero order hilang / tidak tercatat | Order success rate = 100% |
| Aplikasi berjalan stabil di mobile browser | Error rate < 0.5% per session |

---

## 3. User Personas

### 3.1 Customer

**Nama fiktif:** Budi, 32 tahun
**Konteks:** Datang makan siang bersama rekan kerja. Scan QR di meja, login Google, pilih menu, bayar.
**Pain point saat ini:** Harus nunggu pelayan, kadang salah catat pesanan.
**Ekspektasi:** Cepat, mudah, tidak perlu install app apapun.

### 3.2 Admin / Pemilik

**Nama fiktif:** Cak Kum, 50 tahun
**Konteks:** Pemilik restoran yang ingin pantau semua order dari satu layar.
**Pain point saat ini:** Tidak tahu berapa order masuk kalau lagi di dapur.
**Ekspektasi:** Dashboard simpel, notifikasi order baru, bisa nonaktifkan menu yang habis dengan cepat.

---

## 4. Functional Requirements

### 4.1 Autentikasi

| ID | Requirement |
|----|-------------|
| AUTH-01 | Customer dan admin login via Google OAuth menggunakan Supabase Auth |
| AUTH-02 | Setelah login, sistem cek role user (customer / admin) dari tabel `users` |
| AUTH-03 | Admin hanya bisa akses dashboard admin, redirect ke `/admin` setelah login |
| AUTH-04 | Customer diarahkan ke halaman menu setelah login |
| AUTH-05 | Session disimpan via Supabase session cookie, expire sesuai setting Supabase |
| AUTH-06 | Jika user belum login dan mencoba checkout, redirect ke halaman login dengan `redirectTo` parameter |
| AUTH-07 | Admin bisa manage role user (promote customer ke admin, demote admin ke customer) via halaman `/admin/users` |

### 4.2 Customer — Browse Menu

| ID | Requirement |
|----|-------------|
| MENU-01 | Halaman menu menampilkan daftar semua menu aktif dengan gambar, nama, harga, dan kategori |
| MENU-02 | Menu dikelompokkan per kategori (misal: Mie, Dimsum, Minuman) |
| MENU-03 | Menu yang non-aktif tidak ditampilkan ke customer |
| MENU-04 | Halaman menu bisa diakses tanpa login (browse only), tapi add to cart butuh login |
| MENU-05 | Gambar menu menggunakan Supabase Storage dengan URL publik |
| MENU-06 | URL menu menyertakan nomor meja dari QR code: `/menu?table=1`, `table` parameter disimpan di session/state dan diteruskan ke order |

### 4.3 Customer — Cart

| ID | Requirement |
|----|-------------|
| CART-01 | Customer bisa tambah item ke cart, atur quantity, dan hapus item |
| CART-02 | Cart disimpan di database (tabel `carts` dan `cart_items`) agar persist antar session |
| CART-03 | Total harga dihitung otomatis berdasarkan quantity x harga menu |
| CART-04 | Jika menu di-nonaktifkan admin saat item sudah di cart, tampilkan warning di halaman cart |
| CART-05 | Customer tidak bisa checkout jika ada item non-aktif di cart |
| CART-06 | Setiap item di cart bisa diberi catatan per-item (misal: "tanpa bawang", "ekstra sambel"), input text opsional max 100 karakter |

### 4.4 Customer — Checkout & Payment

| ID | Requirement |
|----|-------------|
| PAY-01 | Halaman checkout menampilkan ringkasan order dan total harga |
| PAY-02 | Customer klik "Bayar" lalu tampilkan QR code statis (gambar QR QRIS/transfer) |
| PAY-03 | Setelah konfirmasi manual ("Sudah Bayar"), order dibuat dengan status `pending_confirmation` |
| PAY-04 | Customer diarahkan ke success page dengan nomor order |
| PAY-05 | Ada tombol "Batal" yang mengarahkan ke cancel page |
| PAY-06 | Order yang dibatalkan customer disimpan dengan status `cancelled` |

### 4.5 Admin — Dashboard Order

| ID | Requirement |
|----|-------------|
| ORD-01 | Admin melihat semua order masuk secara real-time via Supabase Realtime |
| ORD-02 | Order ditampilkan dalam format kartu: nomor order, item, total, waktu, status |
| ORD-03 | Admin bisa update status order: `pending_confirmation` ke `processing` ke `ready` ke `completed` |
| ORD-04 | Admin bisa tandai order sebagai `cancelled` |
| ORD-05 | Filter order berdasarkan status |

### 4.6 Admin — Manajemen Menu

| ID | Requirement |
|----|-------------|
| ADM-01 | Admin bisa tambah menu baru (nama, harga, kategori, gambar, status aktif/non-aktif) |
| ADM-02 | Admin bisa edit menu yang sudah ada |
| ADM-03 | Admin bisa hapus menu (soft delete recommended untuk audit trail) |
| ADM-04 | Admin bisa toggle aktif/non-aktif menu dengan satu klik |
| ADM-05 | Upload gambar menu ke Supabase Storage, simpan URL di tabel `menus` |
| ADM-06 | Validasi: nama wajib diisi, harga harus angka positif, gambar opsional dengan fallback placeholder |

### 4.7 Admin — Manajemen User

| ID | Requirement |
|----|-------------|
| ADM-07 | Admin bisa lihat semua user yang terdaftar di halaman `/admin/users` |
| ADM-08 | Admin bisa toggle role user antara `customer` dan `admin` |
| ADM-09 | Admin tidak bisa mengubah role dirinya sendiri (prevent self-demotion) |
| ADM-10 | Perubahan role langsung efektif — user yang di-promote/demote akan merasakan efeknya di request berikutnya |

---

## 5. Non-Functional Requirements

### 5.1 Performance
- Halaman menu harus load dalam < 2 detik pada koneksi 4G
- Realtime order update latency < 3 detik
- Gambar menu di-optimize (pakai Next.js Image component dengan lazy loading)

### 5.2 Security
- Role-based access control: endpoint admin diproteksi di server-side (Next.js middleware)
- Row Level Security (RLS) di Supabase untuk semua tabel
- User hanya bisa akses cart dan order milik mereka sendiri
- Admin endpoint tidak bisa diakses oleh user dengan role customer

### 5.3 Responsiveness
- Mobile-first design (primary target: smartphone 375px+)
- Tetap usable di tablet dan desktop
- Touch-friendly: tombol minimal 44x44px, spacing cukup untuk jari

### 5.4 Availability
- Target uptime 99.5% (Supabase managed + Vercel)
- Graceful error handling: user dapat pesan yang jelas jika terjadi error, bukan blank screen

---

## 6. System Architecture Overview

```
Customer / Admin Browser
        |
        v
   Next.js App (Vercel)
   +-- App Router
   +-- Server Components (SSR untuk menu)
   +-- Client Components (cart, realtime, interactive UI)
   +-- Middleware (auth guard, role check)
        |
        v
   Supabase
   +-- Auth (Google OAuth provider)
   +-- PostgreSQL Database
   |   +-- users, menus, categories
   |   +-- orders, order_items
   |   +-- carts, cart_items
   +-- Realtime (order updates untuk admin dashboard)
   +-- Storage (gambar menu)
```

**Auth Flow:**
1. User klik "Login dengan Google"
2. Supabase redirect ke Google OAuth consent screen
3. Google callback ke Supabase Auth callback URL
4. Supabase buat/update session, redirect ke app
5. Next.js middleware baca session, cek role, route ke halaman yang sesuai

---

## 7. Database Schema (High-Level)

### `users`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | uuid (PK) | Sama dengan Supabase Auth user ID |
| email | text | Email Google |
| full_name | text | Nama dari Google profile |
| avatar_url | text | Foto profil Google |
| role | text | `customer` atau `admin` |
| created_at | timestamptz | |

### `categories`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | uuid (PK) | |
| name | text | Nama kategori (Mie, Dimsum, Minuman, dll) |
| sort_order | int | Urutan tampil di menu |

### `menus`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | uuid (PK) | |
| category_id | uuid (FK) | Referensi ke `categories` |
| name | text | Nama menu |
| description | text | Deskripsi singkat (opsional) |
| price | numeric | Harga dalam Rupiah |
| image_url | text | URL dari Supabase Storage |
| is_active | boolean | Status aktif/non-aktif |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `orders`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | uuid (PK) | |
| order_number | serial / int | Human-friendly nomor urut: #001, #002, dst. Di-generate otomatis |
| user_id | uuid (FK) | Referensi ke `users` |
| status | text | `pending_confirmation`, `processing`, `ready`, `completed`, `cancelled` |
| total_amount | numeric | Total harga order |
| table_number | text | Nomor meja dari QR parameter `?table=N` |
| payment_reference | text | Kosong di Phase 1, diisi saat integrasi gateway |
| payment_method | text | Kosong di Phase 1 |
| paid_at | timestamptz | Kosong di Phase 1 |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `order_items`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | uuid (PK) | |
| order_id | uuid (FK) | Referensi ke `orders` |
| menu_id | uuid (FK) | Referensi ke `menus` |
| quantity | int | |
| unit_price | numeric | Harga saat order dibuat (snapshot, bukan FK ke price) |
| subtotal | numeric | quantity x unit_price |
| notes | text | Catatan per-item dari customer (maks 100 karakter, opsional) |

### `carts`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | uuid (PK) | |
| user_id | uuid (FK, unique) | Satu cart per user |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `cart_items`
| Kolom | Tipe | Keterangan |
|-------|------|------------|
| id | uuid (PK) | |
| cart_id | uuid (FK) | Referensi ke `carts` |
| menu_id | uuid (FK) | Referensi ke `menus` |
| quantity | int | |
| notes | text | Catatan per-item (maks 100 karakter, opsional) |

---

## 8. User Flow

### 8.1 Customer Flow

```
Scan QR Code di meja
        |
        v
Landing di /menu (browse tanpa login)
        |
        v
Klik "Tambah ke Cart"
        |
        v
[Sudah login?]
  No ----> Redirect ke /login?redirectTo=/menu
               |
               v
          Login via Google OAuth
               |
               v
          Redirect balik ke /menu
  Yes ---> Item ditambahkan ke cart
               |
               v
          Buka halaman /cart
          - Review item
          - Atur quantity
          - Lihat total harga
               |
               v
          Klik "Checkout"
               |
               v
          Halaman /checkout
          - Ringkasan order
          - Klik "Bayar"
               |
               v
          Tampilkan QR statis (QRIS/Transfer)
               |
          [Konfirmasi atau Batal?]
          |                    |
          v                    v
   "Sudah Bayar"           "Batal"
          |                    |
          v                    v
 Order dibuat            Order dibatalkan
 status:                 status: cancelled
 pending_confirmation         |
          |                   v
          v             /order/cancel
 /order/success
```

### 8.2 Admin Flow

```
Login via Google OAuth (role: admin)
        |
        v
Redirect ke /admin/dashboard
        |
        +---------------------------+---------------------------+
        |                           |                           |
        v                           v                           v
/admin/orders               /admin/menus               /admin/users
- Lihat order real-time     - Daftar semua menu        - Daftar semua user
- Update status order       - Toggle aktif/non-aktif   - Toggle role:
- Filter by status          - Tambah menu baru           customer ↔ admin
                            - Edit menu
                            - Hapus menu
                            - Upload gambar
```

---

## 9. UI/UX Requirements

### 9.1 Visual Style
- **Tone:** Warm, otentik, street food vibe. Bukan fine dining, bukan fast food corporate.
- **Warna:** Palet hangat, dominan merah/oranye, aksen kuning, background putih bersih atau cream.
- **Typography:** Font mudah dibaca di mobile. Display font berkarakter untuk nama menu.
- **Gambar menu:** Prominently displayed, rasio konsisten (4:3 atau 1:1).

### 9.2 Halaman Menu (Customer)
- Sticky header dengan nama restoran dan cart icon + badge jumlah item
- Filter/tab per kategori di bawah header
- Grid 2 kolom di mobile, 3-4 kolom di tablet/desktop
- Card menu: gambar, nama, harga, tombol "+" yang langsung bisa diklik

### 9.3 Halaman Cart
- List item dengan quantity control (- / +) dan tombol hapus
- Total harga sticky di bawah layar (tidak perlu scroll untuk lihat total)
- Tombol "Checkout" prominently visible

### 9.4 Admin Dashboard
- Layout table/list untuk order (bukan card grid)
- Color coding per status: kuning = pending, biru = processing, hijau = ready/completed, merah = cancelled
- Tombol toggle menu: switch sederhana, langsung update tanpa konfirmasi dialog

### 9.5 Aksesibilitas
- Semua gambar punya alt text deskriptif
- Konten bisa diakses dengan keyboard
- Contrast ratio memenuhi WCAG AA minimum

---

## 10. Out of Scope (Phase 1)

- Integrasi payment gateway (Midtrans, Xendit, dll)
- Notifikasi push / SMS ke customer ketika order siap
- Loyalty points atau sistem promo/diskon
- Multi-outlet / multi-branch support
- Laporan penjualan / analytics dashboard
- Manajemen stok yang otomatis berkurang saat order
- Printer receipt integration
- Reservasi meja

---

## 11. Edge Cases & Risks

### 11.1 Session & Auth

| Edge Case | Handling |
|-----------|----------|
| User belum login, coba akses `/cart` atau `/checkout` | Redirect ke `/login?redirectTo=/cart`, setelah login balik ke URL asal |
| Session expired di tengah order | Supabase auto-refresh token. Jika gagal, tampilkan modal "Sesi habis, silakan login ulang" |
| User login dengan akun Google berbeda | Cart tidak tercampur karena cart tied ke user_id |

### 11.2 QR Statis sebagai Placeholder Payment

| Risiko | Mitigasi |
|--------|----------|
| Customer konfirmasi "sudah bayar" padahal belum | Admin harus manual verify. Status `pending_confirmation` wajib di-review admin sebelum diproses |
| Migrasi ke payment gateway butuh schema baru | Kolom `payment_reference`, `payment_method`, `paid_at` sudah disiapkan di tabel `orders` sejak Phase 1 meski nilainya null |
| QR statis bisa disalahgunakan | Acceptable untuk Phase 1. Wajib diganti dengan QR dinamis per transaksi di Phase 2 |

### 11.3 Concurrent Orders & Stok

| Edge Case | Handling |
|-----------|----------|
| Menu di-nonaktifkan saat item sudah di cart | Validasi saat checkout: cek `is_active` semua item. Jika ada yang non-aktif, blokir checkout dan tampilkan warning |
| Banyak customer order item sama bersamaan | Phase 1 tidak ada stok counter, admin handle manual |
| Customer double-submit order | Disable tombol "Sudah Bayar" setelah satu klik, gunakan loading state |

### 11.4 Role Admin vs Customer

| Skenario | Handling |
|----------|----------|
| User baru login pertama kali | Default role: `customer`. Admin di-set via UI `/admin/users` oleh admin yang sudah ada |
| Customer coba akses `/admin/*` | Next.js middleware cek role, redirect ke `/menu` jika bukan admin |
| Role stale di JWT | Selalu fetch role dari tabel `users` di database, bukan dari JWT claims saja |
| Admin pertama kali (bootstrap) | Set manual via Supabase dashboard SQL — satu kali saja saat setup awal |
| Admin manage user roles | Halaman `/admin/users` menampilkan semua user, admin bisa toggle role customer ↔ admin |

### 11.5 Menu Non-Aktif di Cart

- Saat customer buka halaman cart, sistem query ulang status `is_active` semua item di cart
- Item non-aktif ditandai label "Tidak tersedia saat ini", tombol checkout di-disable
- Customer perlu hapus item tersebut sebelum bisa checkout
- Tidak ada auto-remove otomatis untuk menghindari UX yang mengejutkan

### 11.6 Mobile-First Considerations

- QR statis harus cukup besar di layar mobile agar bisa di-scan kamera QRIS
- Keyboard virtual tidak menutupi tombol penting saat input. Gunakan scroll adjustment atau `padding-bottom`
- Touch target minimal 44x44px untuk semua interactive element
- Hindari hover-only interactions
- Test di Safari iOS karena behavior berbeda dari Chrome Android

### 11.7 Image Upload untuk Menu (Supabase Storage)

| Concern | Handling |
|---------|----------|
| File size besar, load lambat | Batasi upload maksimal 2MB. Tampilkan error jika melewati batas |
| Format file tidak konsisten | Terima jpg, png, webp saja. Validasi di client dan server |
| Gambar lama tidak dihapus saat update | Saat admin upload gambar baru, hapus gambar lama dari Storage |
| Storage bucket perlu public access | Buat bucket `menu-images` dengan policy public read, write hanya untuk admin |
| Broken image URL | Gunakan fallback placeholder di Next.js Image component |

---

## 12. Roadmap

### Phase 1 — Foundation (Sekarang)

**Timeline:** 4-6 minggu
**Goal:** Aplikasi bisa dipakai customer untuk order, admin bisa pantau dan kelola menu.

- Setup project Next.js + Supabase + Shadcn UI
- Auth Google OAuth via Supabase
- Halaman menu customer dengan browse dan filter kategori
- Cart (add, update, remove item)
- Checkout dengan QR statis
- Success & cancel page
- Admin dashboard order real-time
- Admin manajemen menu (CRUD + image upload + toggle aktif)
- Deploy ke Vercel + Supabase production

### Phase 2 — Payment Gateway

**Timeline:** 2-3 bulan setelah Phase 1 stabil
**Goal:** Automated payment confirmation, tidak perlu manual verify.

- Integrasi Midtrans atau Xendit
- Generate payment link / QR dinamis per transaksi
- Webhook untuk auto-update status order setelah pembayaran confirmed
- Isi kolom `payment_reference`, `payment_method`, `paid_at` di tabel `orders`
- Refund flow (opsional)

### Phase 3 — Growth Features (Masa Depan)

- Notifikasi push (PWA) atau WhatsApp ketika order siap diambil
- Laporan penjualan dan analitik sederhana
- Sistem promo / voucher diskon
- Multi-outlet support
- Customer loyalty program

---

*PRD ini akan diupdate seiring perkembangan produk. Setiap perubahan requirement harus didiskusikan dan di-versi ulang.*
