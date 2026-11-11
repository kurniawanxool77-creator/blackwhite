# Sistem Barcode Event

Web app untuk mengontrol event dengan satu QR per peserta: pendaftaran via Google, approval Superadmin, lalu QR dipindai di setiap checkpoint (bandara, hotel, makan, pengambilan barang, kepulangan).

Stack: Next.js 16 (App Router), NextAuth v4, Prisma 6 (SQLite lokal, PostgreSQL untuk produksi), Tailwind CSS 4.

## Menjalankan lokal

```bash
npm install
cp .env.example .env        # isi NEXTAUTH_SECRET, Google OAuth, dan akun superadmin
npm run db:push             # buat tabel
npm run db:seed             # opsional: akun dan data contoh dari .env (aman diulang)
npm run dev
```

Buka http://localhost:3000.

- **Akun contoh:** `npm run db:seed` membuat Superadmin, panitia, peserta demo, dua event, banner, dan artikel contoh. Akunnya dibaca dari `.env` (`SUPERADMIN_*`, `PANITIA_*`, `PESERTA_*`).
- **Login peserta:** email + password (daftar sendiri di `/daftar`) atau Google, keduanya di `/login`. Pendaftaran email tidak bisa memakai email yang sudah terdaftar; bila pemilik email kemudian masuk lewat Google, password lama yang belum terverifikasi dihapus.
- **Superadmin pertama:** buka `/superadmin`, login dengan `SUPERADMIN_EMAIL` dan `SUPERADMIN_PASSWORD` dari `.env`. Akun dibuat otomatis selama belum ada superadmin. Admin/panitia dibuat dari menu Admin, lalu login di `/admin`.
- **Login Google peserta:** buat OAuth client ID (tipe Web application) di Google Cloud Console, dengan redirect URI `http://localhost:3000/api/auth/callback/google`.
- **Gambar:** diunggah Superadmin dari perangkat (JPEG/PNG/WebP, maks. 4 MB). Server mengubah semuanya ke WebP (lebar maks. 1680 px, kualitas 82, data EXIF/lokasi dibuang) dan menyimpannya di tabel `Media` pada database dan dilayani lewat `/media/[id]`; tipe file dicek dari isinya, SVG ditolak. Foto formulir (mis. KTP), bukti transfer, dan selfie absensi bersifat privat (`Media.ownerId`): hanya pemilik dan admin aktif yang bisa membukanya.
- **Di HP:** semua halaman responsif, peserta mendapat bar menu bawah beri ikon (Beranda, Event, Tiket, Akun). Buka lewat browser HP lalu pilih *Tambahkan ke layar utama* (Android/iPhone) agar tampil seperti aplikasi (manifest + ikon sudah disiapkan; tanpa mode offline).
- **Kamera scanner** hanya jalan di `localhost` atau HTTPS. Untuk mencoba di HP saat development, gunakan tunnel HTTPS (misalnya ngrok atau Cloudflare Tunnel).

## Struktur

Tiga pintu login:

| Peran | Login | Area | Bisa |
| --- | --- | --- | --- |
| Peserta | `/login` (Google) | `app/(user)`: `/dashboard`, `/tiket/[id]`, `/akun` | Daftar event, lihat QR dan tracking, ubah profil, batalkan pendaftaran yang masih menunggu |
| Admin / panitia | `/admin` | `app/admin`: `/admin/events`, `/admin/events/[id]` (+ `/peserta/[regId]`), `/admin/scan`, `/admin/riwayat`, `/admin/akun` | Di event yang ditugaskan: scan QR, cari peserta, check-in manual, batalkan scan sendiri (15 menit), riwayat scan, ganti password |
| Superadmin | `/superadmin` | `app/superadmin`: `dashboard`, `events` (+ `/peserta/[regId]`), `peserta`, `scan`, `admins`, `site`, `banners`, `articles`, `audit`, `akun` | Semua: dasbor, event (hapus bila tanpa pendaftar), approval, tambah & cari peserta, check-in manual / batal scan, admin (reset password), halaman depan, artikel, riwayat |

Navbar publik punya halaman sendiri-sendiri: Beranda (`/`, kotak cari + pelatihan yang sedang dibuka, banner, artikel), Tentang (`/tentang`), Pelatihan (`/event`, cari + filter kategori), Artikel (`/blog`), Kontak (`/kontak`); tombol hijau Daftar menuju login peserta. Foto dan teks company profile diatur Superadmin; tiap event punya foto sampul dan galeri (maks. 8) di halaman detailnya.

Halaman publik ada di `app/(landing)`: `/` (daftar event & pelatihan, filter `?kategori=`), `/event/[slug]`, `/blog`, `/blog/[slug]`.

- `components/` — `ui/` (badge, harga, kartu artikel, auto-refresh), `auth/` (tombol Google, form login), `admin/` (shell panel, tabel, dan semua form Superadmin), `scanner/` (kamera + layar scan).
- `lib/` — logika non-tampilan: auth (termasuk kunci akun 5x gagal = 15 menit), audit log, db, format, helper form, scan, detail event, isi halaman depan.
- Tiap halaman Superadmin punya `actions.ts` sendiri; di `events/` dipecah per topik: `actions.ts` (event), `checkpoint-actions.ts`, `registration-actions.ts` (approval + impor peserta).
- `proxy.ts` — middleware: tiap peran hanya bisa masuk areanya sendiri.
- `lib/auth.ts` — login Google + login admin (dibedakan per portal), helper `requireUser` / `requireAdmin`.
- `prisma/schema.prisma` — model data.
- `lib/site.ts` — isi awal halaman depan; setelah disimpan dari `/superadmin/site`, isinya dibaca dari database.

## Alur

1. Superadmin membuat event atau pelatihan (kategori bebas, harga, diskon %, kuota) + checkpoint berurutan, lalu ubah status ke **Pendaftaran dibuka**. Info dan harga bisa diubah kapan saja di halaman event.
2. Peserta login Google dan mendaftar, atau Superadmin menempel daftar peserta (`Nama, email, HP, instansi`) di halaman event.
3. Superadmin menyetujui (satuan atau semua, mengikuti kuota); untuk pelatihan berbayar, setujui setelah pembayaran dicek manual. QR terbit per pendaftaran.
4. Superadmin membuat akun panitia dan menugaskannya ke event. Panitia login di `/admin`, membuka Scanner, memilih checkpoint, lalu memindai QR.
5. Peserta melihat tracking di `/tiket/[id]`. Panitia dan Superadmin melihat progres per checkpoint; Superadmin bisa ekspor CSV dan membuka gambar QR peserta.
6. Superadmin mengatur slider banner promosi di `/superadmin/banners` (unggah gambar dari perangkat, urutan, tampil/sembunyikan), foto sampul tiap event dan artikel, mengubah isi halaman depan di `/superadmin/site` dan menulis artikel di `/superadmin/articles`.

## QR, rundown, dan foto peserta

- **Satu QR per peserta** (`User.qrToken`) untuk semua pelatihan. Panitia memilih pelatihan dan pos di scanner; sistem mencari pendaftaran orang itu di pelatihan tersebut. Ditolak bila tidak terdaftar atau belum disetujui. QR lama per pendaftaran (`Registration.qrToken`) tetap diterima.
- **Alur scan panitia:** menu Scanner (atau ikon Scan di daftar/detail event dan di Rundown) → pilih pelatihan (yang sedang berlangsung di atas) → pilih item rundown → layar scan terkunci ke item itu (`/admin/events/[id]/scan/[cpId]`, sama untuk `/superadmin`). Kamera dibuka sekali dan semua QR dicatat ke rundown yang dipilih; QR yang sama di rundown yang sama ditandai "sudah di-scan", tidak dobel. "Ganti rundown" kembali ke pilihan.
- **Item rundown** punya tanda `scan`: "Perlu scan" (muncul di scanner, dihitung di progres) atau "Agenda saja" (hanya tampil di rundown). Diatur Superadmin di kartu "Rundown & checkpoint" pada halaman event; pos yang sudah punya riwayat scan tidak bisa dijadikan agenda saja.
- **Foto profil peserta** diunggah sendiri di `/akun` (dipotong persegi 400×400, WebP, foto lama dihapus). Foto tampil di hasil scan, detail peserta, dan tabel peserta agar panitia bisa mencocokkan wajah.

## Panel admin & tim

- Panel Superadmin dan Panitia memakai **sidebar** yang bisa dibuka/tutup dengan tombol hamburger (desktop) dan laci menu + tab bawah (HP); foto, nama, dan peran ada di kanan atas. Scan dibuka dari Event (menu Scanner terpisah dihapus untuk panitia).
- **Tim panitia** (`/admin/tim`): anggota tim (panitia dan relawan diperlakukan sama) per pelatihan yang ditugaskan, plus Superadmin sebagai penanggung jawab: foto, jabatan, status absensi hari ini, tugas, dan kontak (telepon, WhatsApp, email). Klik nama → **detail anggota** (`/admin/tim/[id]`, `/superadmin/tim/[id]`): profil, statistik (hari hadir, jam bertugas, peserta dipindai), pelatihan yang dipegang, riwayat absensi. Panitia hanya bisa membuka rekan di pelatihan yang sama.
- **Absensi tim** (gaya HRIS): panitia **absen datang** dan **absen selesai acara** dengan **foto selfie wajib** (kamera depan di HP), per pelatihan yang berlangsung hari itu, masing-masing sekali per hari (`POST /api/attendance`). **Fitur event (scan, check-in manual, batal scan) baru terbuka setelah absen datang** dan terkunci lagi setelah absen selesai; aturan ini dicek di server. Superadmin melihat rekap per tanggal beserta foto di **Absensi tim** (`/superadmin/absensi`).
- Data tim diatur Superadmin di **Tim & admin** (jabatan, No. HP, tugas satu per baris). Panitia bisa mengubah foto dan No. HP sendiri di Profil.
- Seed membuat anggota tim kedua `relawan@contoh.co.id` (password sama dengan panitia) dan satu pelatihan yang berlangsung hari ini dengan contoh absensi.

## Produksi (PostgreSQL)

Ubah `provider = "postgresql"` di `prisma/schema.prisma`, isi `DATABASE_URL` Postgres, jalankan `npm run db:push` (atau beralih ke `prisma migrate`), lalu `npm run build && npm start`. Database yang sudah berisi data sebelum kolom `Media.ownerId` ada: jalankan sekali `node --no-warnings --env-file=.env prisma/backfill-media-owner.mjs` agar foto lama menjadi privat.

