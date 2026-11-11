# DESIGN.md — Sistem Barcode Event

Spesifikasi desain untuk Google Stitch. Bagian 1 adalah design system yang berlaku di semua layar. Bagian 3 berisi spesifikasi tiap layar beserta prompt siap tempel.

Cara pakai di Stitch: tempel **Bagian 1** sebagai konteks/tema proyek, lalu buat layar satu per satu dengan prompt di Bagian 3.

---

> Contoh desain visual semua layar utama (publik, peserta, panitia, superadmin) ada di kanvas desain: https://claude.ai/artifact/Rt2QYbTC1ArqtcfD82qmQg — aplikasi sudah mengikuti kanvas itu: kartu tiket peserta dengan bar progres dan "Berikutnya", checkpoint berikutnya disorot biru di layar QR, label "sisa N kursi" / "kuota penuh" dan urutan "Tanggal terdekat" / "Harga termurah" di halaman Pelatihan, durasi "(3 hari)" dan kuota di detail pelatihan, hasil scan "Berhasil · 4/6 checkpoint", dan "oleh Anda" di detail peserta.

## 1. Design system

### Karakter

Enterprise, rapi, tegas, mudah dibaca di lapangan. Referensi rasa: dashboard HR/SaaS korporat (gaya Mekari Talenta). Bukan gaya template AI.

Larangan:
- Tidak ada gradien, glassmorphism, ilustrasi 3D, emoji, atau ikon dekoratif besar.
- Tidak ada sudut membulat besar (`rounded-xl` ke atas) pada kartu, tombol, input, modal.
- Tidak ada kotak pastel warna-warni memenuhi halaman.
- Tidak ada input angka dengan panah spinner browser.

### Warna

| Token | Hex | Pemakaian |
| --- | --- | --- |
| brand | `#1D337F` | Tombol utama, link, header admin, tab aktif, progress bar |
| brand-dark | `#142560` | Hover tombol utama |
| background | `#F9FAFB` | Latar halaman |
| surface | `#FFFFFF` | Kartu, tabel, header publik |
| border | `#E5E7EB` | Border kartu dan pemisah |
| border-input | `#D1D5DB` | Border input dan tombol sekunder |
| row-divider | `#F3F4F6` | Garis antar baris tabel, track progress bar |
| text-strong | `#111827` | Judul, nama, angka penting |
| text | `#1F2937` | Teks isi |
| text-label | `#374151` | Label form, teks nav |
| text-muted | `#4B5563` | Deskripsi |
| text-subtle | `#6B7280` | Keterangan kecil, placeholder |
| success | `#16A34A` | Hasil scan berhasil, centang tracking |
| warning | `#FBBF24` (isi) / `#F59E0B` (border) | Hasil scan "sudah pernah" |
| danger | `#B91C1C` | Hasil scan ditolak, tombol tolak, pesan error |

Badge status (latar sangat tipis + border + teks gelap, sudut 4px):

| Status | Latar | Border | Teks |
| --- | --- | --- | --- |
| Menunggu / Pendaftaran ditutup | `#FFFBEB` | `#FDE68A` | `#92400E` |
| Disetujui / Pendaftaran dibuka | `#F0FDF4` | `#BBF7D0` | `#166534` |
| Ditolak | `#FEF2F2` | `#FECACA` | `#991B1B` |
| Draft / Selesai | `#F9FAFB` | `#E5E7EB` | `#374151` |

### Tipografi

Font: **Plus Jakarta Sans** (semua teks).

| Peran | Ukuran / tebal |
| --- | --- |
| Hero (landing) | 36px / 700, tracking rapat |
| Judul halaman | 20px / 600 (detail event publik 24px / 700) |
| Judul kartu | 16px / 600 |
| Teks isi | 14px / 400 |
| Label form | 14px / 500 |
| Header tabel | 12px / 600, HURUF KAPITAL, tracking lebar, abu-abu |
| Keterangan | 12px / 400 |
| Nama hasil scan | 24px / 700 |

### Bentuk, jarak, bayangan

- Radius: 6px (`rounded-md`) untuk kartu, tombol, input. 4px untuk badge dan tab. Lingkaran penuh hanya untuk titik status 8px dan nomor/centang tracking 20px.
- Bayangan: hanya bayangan sangat tipis pada kartu (`shadow-sm`).
- Jarak dasar 4px; antar kartu 24px; padding kartu 20px; padding sel tabel 16px horizontal, 12px vertikal.
- Lebar konten: publik 1152px, area peserta 896px, admin 1152px. Gutter 16px di mobile.

### Komponen

- **Tombol utama:** latar brand, teks putih 14px/500, padding 8×16, radius 6px.
- **Tombol sekunder:** latar putih, border `#D1D5DB`, teks `#1F2937`.
- **Tombol bahaya:** latar putih, border `#FCA5A5`, teks `#B91C1C`.
- **Tombol kecil:** padding 4×10, teks 12px (dipakai di tabel).
- **Input / select / textarea:** latar putih, border `#D1D5DB`, radius 6px, padding 8×12, teks 14px; fokus = border + ring 1px brand.
- **Input angka:** teks biasa dengan format ribuan titik saat diketik (contoh `1.500`), tanpa spinner.
- **Kartu:** putih, border `#E5E7EB`, radius 6px, bayangan tipis. Kartu berjudul punya header 12×16 dengan garis bawah.
- **Tabel:** di dalam kartu, header abu-abu muda `#F9FAFB`, baris dipisah garis `#F3F4F6`, bisa scroll horizontal di mobile.
- **Tab filter:** deretan tab teks 14px; aktif = latar brand + teks putih, radius 4px; menampilkan jumlah, contoh "Menunggu (12)".
- **Progress bar:** tinggi 6px, track `#F3F4F6`, isi brand, diikuti teks "8 / 120".

---

## 2. Struktur aplikasi

Tiga peran, tiga pintu login:

| Peran | Login | Bisa |
| --- | --- | --- |
| Peserta | `/login` (Google) | Daftar event, lihat QR dan tracking |
| Admin / panitia | `/admin` (email + password) | Scan QR, lihat peserta dan progres di event yang ditugaskan |
| Superadmin | `/superadmin` (email + password) | Event, approval, tambah peserta, admin/panitia, halaman depan, artikel |

```
Publik (header putih: brand kiri; Tentang, Event, Artikel, Kontak, tombol "Login" kanan (menu: peserta, admin / panitia, superadmin))
├── /                    Beranda / company profile (isi diatur Superadmin)
├── /event/[slug]        Detail event + pendaftaran
├── /blog                Daftar artikel
├── /blog/[slug]         Baca artikel
└── /login               Login peserta (Google)

Peserta (header putih: brand; Dashboard, email, tombol "Keluar")
├── /dashboard           Event saya
└── /tiket/[id]          QR + tracking checkpoint

Admin / panitia (header biru brand; nav: Event saya, Scanner)
├── /admin               Login admin / panitia
├── /admin/events        Event yang ditugaskan
├── /admin/events/[id]   Progres checkpoint + daftar peserta (baca saja)
└── /admin/scan          Scanner QR

Superadmin (header biru brand; nav: Event, Scanner, Admin, Halaman depan, Artikel)
├── /superadmin                 Login superadmin
├── /superadmin/events          Daftar event + form buat event
├── /superadmin/events/[id]     Checkpoint, tambah peserta, approval
├── /superadmin/scan            Scanner QR (layar sama dengan panitia)
├── /superadmin/admins          Admin & panitia
├── /superadmin/site            Editor halaman depan
├── /superadmin/articles        Daftar artikel
└── /superadmin/articles/new    Tulis / edit artikel
```

Header kedua panel sama: bar biru penuh, kanan "Nama · Superadmin" atau "Nama · Panitia" dan tombol "Keluar"; isi nav berbeda per peran.

---

## 3. Layar

### 3.1 Navbar publik dan Beranda (`/`) — desktop

**Navbar (sticky, semua halaman publik):** latar putih, garis bawah abu-abu. Kiri: **logo hitam-putih** — kotak hitam 32px `rounded` berisi "QR" putih tebal, di sebelahnya nama perusahaan hitam tebal ("Sistem Barcode Event"). Tengah-kanan: menu **Beranda · Tentang · Pelatihan · Artikel · Kontak**; setiap menu adalah **halaman sendiri** (`/`, `/tentang`, `/event`, `/blog`, `/kontak`), bukan lompat ke bagian di satu halaman. Menu aktif tebal hitam dan bergaris bawah 2px. Paling kanan: tautan "Masuk" (`/login`) dan tombol **hijau "Daftar"** (hijau 700, teks putih) menuju `/daftar`; bila peserta sudah login keduanya diganti tombol hijau "Tiket saya" menuju `/dashboard`. Di HP: baris atas berisi logo + tombol Daftar, menu menjadi baris kedua yang bisa digeser mendatar. Login admin/panitia dan superadmin tidak ada di navbar; hanya di footer.

**Beranda** (company profile; tampilan lengkap, dari atas):
1. **Slider banner promosi** (hanya bila ada banner aktif): bingkai `rounded-md` abu-abu, rasio 21:8 desktop / 16:9 HP, bar judul solid gelap 70% di bawah, titik indikator kanan atas (aktif memanjang), panah ‹ › saat hover, otomatis tiap 5 detik.
2. **Pelatihan yang sedang dibuka** (di bawah banner, latar putih): judul, satu baris keterangan, **kotak cari** lebar penuh (ikon kaca pembesar kiri, placeholder "Cari pelatihan, kategori, atau kota...") + tombol biru "Cari" (hasil di `/event`); chip filter kategori (kotak `rounded`, aktif hitam teks putih); baris hitungan "2 pelatihan sedang dibuka."; grid 3 kolom kartu pelatihan (maks. 6) dan tombol "Lihat semua N pelatihan" bila lebih banyak. Kartu: foto sampul 16:9, kategori kapital biru, nama tebal, kota, tanggal, garis pemisah, harga (tebal; coret + badge merah "-20%"; atau "Gratis"). Hover: terangkat, foto membesar pelan.
3. **Hero** dua kolom: nama perusahaan kapital biru, judul besar, tombol "Lihat pelatihan" dan "Hubungi kami"; kanan foto 4:3.
4. **Tentang kami:** foto 4:3 kiri, teks + email/telepon kanan.
5. **Layanan kami** (band putih): 3 kartu berfoto 16:10.
6. **Cara kerja untuk peserta:** 4 kartu bernomor.
7. **Blog & artikel** (bila ada artikel): link "Semua artikel →", grid 3 kartu berfoto.
8. **Footer** putih 3 kolom: nama + tagline; Kontak; link "Daftar / login peserta", "Login admin / panitia", "Login superadmin".

> **Prompt Stitch:** Desktop home page of an Indonesian training-course marketplace, flat enterprise style, 6px radius, Plus Jakarta Sans, black/white/grey with navy and green accents. Sticky white navbar with a thin grey bottom border: on the left a black 32px rounded square logo with a white bold "QR" and next to it the bold black wordmark "Sistem Barcode Event"; centre-right the menu "Beranda", "Tentang", "Pelatihan", "Artikel", "Kontak" (active item bold black with a 2px underline); far right a solid green (#15803D) button "Daftar" with white text. Below it a bordered promotional banner slider with a solid dark caption bar. Then a white band with the heading "Pelatihan yang sedang dibuka", one grey line, a full-width search input with a magnifier icon and placeholder "Cari pelatihan, kategori, atau kota..." plus a navy button "Cari"; square-cornered category chips (active chip black with white text); a small grey line "2 pelatihan sedang dibuka."; then a 3-column grid of training cards each with a 16:9 cover photo, small uppercase navy category, bold title, city, date range, a thin divider, and the price (bold, grey strikethrough old price, small red "-20%" badge, or "Gratis"). Then a two-column hero (company name, large headline, two buttons, 4:3 photo), "Tentang kami" (photo left, text right), "Layanan kami" (three cards with 16:10 photos), four numbered step cards, and "Blog & artikel" with three article cards. White three-column footer.

### 3.1a Halaman Tentang (`/tentang`), Pelatihan (`/event`), Kontak (`/kontak`)

- **Tentang** (`/tentang`): hero dua kolom (nama perusahaan kapital, judul besar, tombol "Lihat pelatihan" dan "Hubungi kami", foto 4:3 di kanan), bagian "Tentang kami" (foto kiri, teks dan kontak singkat kanan), "Layanan kami" (3 kartu berfoto 16:10 di band putih), "Cara kerja untuk peserta" (4 kartu bernomor) dan tombol hijau "Daftar sekarang". Semua foto dan teks diatur Superadmin (3.13).
- **Pelatihan** (`/event`): judul "Pelatihan", keterangan "Pelatihan dan event yang sedang membuka pendaftaran. Klik untuk melihat detail dan foto.", lalu komponen cari + chip kategori + grid kartu yang sama dengan beranda tetapi **semua** hasil. Pencarian berdasarkan nama, kategori, kota, dan deskripsi (huruf besar/kecil tidak berpengaruh) dan bisa digabung dengan kategori. Hasil tampil sebagai "1 dari 2 pelatihan ditemukan untuk "k3"." dengan tautan "Reset". Tanpa hasil: "Tidak ada pelatihan yang cocok. Coba kata kunci atau kategori lain." Hanya event berstatus Pendaftaran dibuka yang tampil.
- **Kontak** (`/kontak`): kolom 768px, judul "Kontak", satu kalimat pengantar, kartu daftar berlabel kapital kecil: Email (tautan mailto), Telepon / WhatsApp (tautan tel), Alamat.
- **Artikel** (`/blog`): lihat 3.11.

### 3.2 Detail event (`/event/[slug]`) — desktop + mobile

Dua kolom (2:1). Kiri:
- **Galeri foto:** foto utama 16:9 lebar penuh dalam bingkai `rounded-md`, penghitung kecil "2 / 5" di pojok kanan bawah, panah ‹ › (muncul saat hover di desktop, selalu terlihat di HP), dan di bawahnya deretan thumbnail 96px yang bisa digeser (yang aktif berborder biru, lainnya agak pudar). Foto berganti dengan animasi muncul. Urutan: foto sampul, lalu galeri. Tanpa foto, bagian ini hilang.
- Label kategori kecil kapital biru, judul event 24px, baris "Bali · 1 Des 2026 – 3 Des 2026", deskripsi, kartu "Rangkaian acara" berisi daftar bernomor checkpoint.

Kanan: kartu "Pendaftaran" — di bawah judul tampil harga 18px (format sama dengan kartu beranda, atau "Gratis"); bila berbayar ada teks kecil abu "Info pembayaran dikirim panitia setelah Anda mendaftar. QR terbit setelah pendaftaran disetujui." Lalu garis pemisah dan salah satu dari 4 keadaan:
- **Belum login:** teks "Masuk dengan Google untuk mendaftar." + tombol sekunder Google (logo G berwarna).
- **Sudah login, belum daftar:** form "No. HP / WhatsApp" (wajib), "Instansi / perusahaan", tombol penuh "Daftar event".
- **Sudah daftar:** "Status:" + badge, alasan bila ditolak, tombol "Lihat tiket".
- **Ditutup:** teks "Pendaftaran untuk event ini sudah ditutup."

Mobile: kolom kanan turun ke bawah konten.

> **Prompt Stitch:** Event detail page. Left column: a photo gallery with a large 16:9 main photo in a 6px-radius frame, a small "2 / 5" counter bottom right, previous/next arrow buttons, and a row of 96px thumbnails below (active one with a navy border); then small uppercase navy category, event title, location and dates, description, and a card "Rangkaian acara" listing numbered checkpoints. Right sticky card "Pendaftaran" showing the price (bold "Rp 2.000.000", strikethrough "Rp 2.500.000", red "-20%" badge) and a small grey payment note, then fields "No. HP / WhatsApp" and "Instansi / perusahaan" and a full-width navy button "Daftar event". Show a variant where the card shows status badge "Menunggu" and a button "Lihat tiket".

### 3.3 Masuk (`/login`) dan Daftar (`/daftar`) peserta

Layar dibelah dua di desktop (di bawah navbar publik): **kiri formulir** (kolom 448px di tengah), **kanan foto** setinggi layar (`object-cover`) dengan bar keterangan solid gelap 70% berisi tagline perusahaan. Foto diatur Superadmin ("Foto halaman Masuk / Daftar"; kosong = foto hero; tanpa foto = blok biru brand). Di HP foto disembunyikan.

- **Masuk:** judul "Masuk", keterangan "Masuk untuk mendaftar pelatihan dan melihat QR tiket Anda.", input Email dan Password, tombol biru penuh "Masuk"; pemisah garis "atau"; **di bawahnya** tombol sekunder penuh "Masuk dengan Google" (logo G); teks "Belum punya akun? **Daftar sekarang**" (hijau); garis tipis lalu teks kecil "Panitia atau pengelola? Login admin / panitia · Login superadmin". Pesan gagal merah: "Email atau password salah, atau akun terkunci sementara (5 kali gagal = 15 menit). Akun yang dibuat dengan Google: gunakan tombol Google di bawah."
- **Daftar:** judul "Daftar akun peserta", keterangan "Satu akun untuk mendaftar semua pelatihan dan menyimpan QR tiket Anda.", input Nama lengkap, Email, No. HP / WhatsApp, Password + Ulangi password (2 kolom), catatan "Minimal 8 karakter.", tombol **hijau** penuh "Daftar"; "atau"; tombol "Daftar dengan Google"; "Sudah punya akun? Masuk". Setelah berhasil langsung masuk dan kembali ke halaman asal (mis. halaman event).
- Navbar publik saat belum masuk: tautan "Masuk" + tombol hijau "Daftar". Kartu pendaftaran di detail event untuk tamu: "Masuk atau buat akun untuk mendaftar pelatihan ini." + tombol biru "Masuk" dan hijau "Daftar akun".

> **Prompt Stitch:** Desktop split-screen sign-in page under a white sticky navbar (black square "QR" logo, menu, a "Masuk" text link and a green "Daftar" button). Left half: a centered 448px form with heading "Masuk", grey helper line, Email and Password inputs, a full-width navy "Masuk" button, an "atau" divider with thin lines, then a full-width outlined "Masuk dengan Google" button with the colored G logo, the line "Belum punya akun? Daftar sekarang" with the link in green, and a small grey footer line with admin login links. Right half: a full-height photo (object-cover) with a solid dark 70% caption bar at the bottom showing the company tagline in white. Flat enterprise style, 6px radius, no gradients. Also show the "Daftar akun peserta" variant: name, email, phone, password and confirm side by side, a full-width green "Daftar" button, divider, "Daftar dengan Google".

### 3.4 Dashboard peserta — Event saya (`/dashboard`) — mobile-first

Judul "Event saya" + tombol kecil "Cari event". Kartu tabel: kolom Event (nama + lokasi), Tanggal, Status (badge; bila ditolak ada alasan kecil di bawahnya), aksi tombol kecil "QR & tracking" (disetujui) atau "Detail". Kosong: "Anda belum mendaftar event. Lihat event yang dibuka."

> **Prompt Stitch:** Participant dashboard "Event saya", mobile and desktop. White header with brand, "Dashboard", user email and "Keluar" button. A table card listing registered events with status badges Menunggu (amber), Disetujui (green), Ditolak (red, with small reason text) and a small outline button "QR & tracking". Flat enterprise style.

### 3.5 Tiket QR & tracking (`/tiket/[id]`) — mobile-first

Judul event + lokasi dan tanggal. Dua kartu (berdampingan di desktop, bertumpuk di mobile):
- **Kartu QR (tengah):** QR 256px, nama peserta tebal, keterangan "Tunjukkan QR ini kepada panitia di setiap checkpoint.", tombol kecil "Unduh QR". Bila belum disetujui: badge "Menunggu" + "QR akan muncul di sini setelah pendaftaran disetujui panitia." Bila ditolak: badge "Ditolak" + alasan.
- **Kartu Tracking:** judul "Tracking" + teks kanan "3 dari 8 checkpoint". Daftar vertikal: lingkaran 20px (hijau berisi centang bila sudah, outline abu-abu bernomor bila belum), nama checkpoint, keterangan "Di-scan 30 Okt, 23.23" atau "Belum".

> **Prompt Stitch:** Mobile ticket screen. Event name and dates at top. Card with a large QR code, participant name, hint "Tunjukkan QR ini kepada panitia di setiap checkpoint." and a small outline button "Unduh QR". Below, card "Tracking" with "3 dari 8 checkpoint" and a vertical checklist of 8 checkpoints: first 3 with solid green circle check and "Di-scan 30 Okt, 23.23", the rest grey numbered outline circles with "Belum".

### 3.6 Login admin / panitia (`/admin`) dan Login superadmin (`/superadmin`)

Satu desain, dua varian. Kartu tengah 384px: label kecil biru kapital nama brand, judul, keterangan, input Email, Password, pesan error merah "Email atau password salah, akun nonaktif, atau akun tidak punya akses ke halaman ini.", tombol penuh "Masuk". Di bawah kartu, baris link kecil ke pintu lain.

| Varian | Judul | Keterangan | Link bawah |
| --- | --- | --- | --- |
| `/admin` | Login admin / panitia | Untuk panitia yang memindai QR di event yang ditugaskan. | Login superadmin · Login peserta |
| `/superadmin` | Login superadmin | Pengelola event, peserta, halaman depan, dan artikel. | Login panitia · Login peserta |

### 3.7 Superadmin — Daftar event (`/superadmin/events`) — desktop

**Header panel:** bar biru brand penuh, teks putih: nama brand, nav "Event · Scanner · Admin · Halaman depan · Artikel" (putih 80%, aktif putih penuh), kanan "Nama · Superadmin" + tombol "Keluar". Panel panitia memakai header yang sama dengan nav "Event saya · Scanner" dan label "Nama · Panitia".

Isi dua kolom (2:1):
- Kiri: judul "Event & pelatihan", kartu tabel kolom Event (nama link biru + "Kategori · Lokasi"), Tanggal, Harga (harga akhir, coret + badge diskon, atau "Gratis"), Status (badge), Menunggu (angka rata kanan), Disetujui (contoh "86 / 120").
- Kanan: kartu "Buat event / pelatihan baru" — Nama event / pelatihan, Foto sampul (unggah dari perangkat; kotak pratinjau 16:9 dan tombol "Pilih gambar"), **Galeri foto** (maks. 8: kotak thumbnail 16:9 dengan tombol × di pojok untuk menghapus, tombol "Tambah foto" boleh memilih banyak file sekaligus), Kategori (input teks bebas dengan saran kategori yang pernah dipakai, placeholder "contoh: Pelatihan K3, Seminar, Workshop"), Lokasi, Mulai + Selesai (date, 2 kolom), Harga (Rp, kosong = gratis; placeholder "contoh: 2.500.000") + Diskon (%) dalam 2 kolom, baris kecil "Harga tampil: Rp 2.000.000", "Kuota peserta (kosongkan jika tanpa batas)" placeholder "contoh: 1.500", Deskripsi (textarea), checkbox "Isi checkpoint standar (bandara, hotel, kit, makan, kepulangan). Bisa diubah nanti.", tombol penuh "Buat event".

> **Prompt Stitch:** Admin dashboard, desktop. Full-width navy (#1D337F) top bar with white brand name, nav "Event", "Scanner", "Admin", right side "Superadmin · Superadmin" and an outline "Keluar" button. Two columns: left a table card "Event" with columns Event, Tanggal, Status, Menunggu, Disetujui (e.g. 86 / 120) and status badges; an extra "Harga" column showing final price with strikethrough and a small red discount badge; right a form card "Buat event / pelatihan baru" with name, category text field with suggestions, location, start/end dates, price in rupiah with thousands separator and discount percent side by side, a small line "Harga tampil: Rp 2.000.000", quota with thousands separator placeholder "contoh: 1.500", description, a checkbox for standard checkpoints, and a full-width navy button. Dense, corporate, 6px radius.

### 3.8 Superadmin — Detail event (`/superadmin/events/[id]`) — desktop

1. **Header halaman:** link kecil "← Semua event", judul event, baris kategori · lokasi · tanggal · "Kuota 120", baris harga (format sama dengan 3.7). Kanan: select status (Draft / Pendaftaran dibuka / Pendaftaran ditutup / Selesai) + tombol "Simpan status", tombol "Halaman publik", tombol "Ekspor CSV".
2. **Kartu lipat "Ubah info, harga & diskon"** (tertutup secara default; klik judul untuk membuka): form yang sama dengan "Buat event / pelatihan baru" tanpa checkbox checkpoint, tombol "Simpan perubahan", pesan hijau "Tersimpan.".
3. **Kartu "Checkpoint & progres"** (keterangan "Urutan titik scan. Progres dihitung dari peserta yang disetujui."): tabel #, Checkpoint, Jenis (Kehadiran / Konsumsi / Pengambilan barang), Progres (bar + "86 / 120"), aksi tombol kecil ↑ ↓ "Hapus" (hapus hanya bila belum ada scan). Footer kartu: input "Nama checkpoint, misal: Makan siang hari 2", select jenis, tombol "Tambah".
4. **Kartu "Tambah peserta":** keterangan "Satu orang per baris: `Nama, email, No. HP, Instansi`. Bisa ditempel dari Excel. Peserta bisa melihat QR-nya dengan login Google memakai email yang sama." Textarea monospace 4 baris dengan contoh placeholder. Bawah: checkbox "Langsung setujui dan terbitkan QR (mengikuti kuota)" kiri, tombol "Tambahkan" kanan. Setelah simpan muncul ringkasan, contoh "3 peserta ditambahkan, 2 disetujui (sisanya menunggu karena kuota), baris tidak valid: 4."
5. **Kartu approval peserta:** tab "Menunggu (12) · Disetujui (86) · Ditolak (3) · Semua (101)" dan tombol "Setujui semua yang menunggu" di kanan. Tabel: Peserta (nama + instansi), Kontak (email + HP), Daftar (tanggal-jam), Status (badge + alasan), Checkpoint ("3 / 8"), aksi: "QR" (sekunder kecil, membuka gambar QR, hanya baris disetujui), "Setujui" (utama kecil), input kecil "Alasan" + "Tolak" (bahaya kecil).

> **Prompt Stitch:** Superadmin event detail page under the navy admin bar. Page header with back link, event title, meta line (category · location · dates · quota), price line, status select with "Simpan status", and outline buttons "Halaman publik" and "Ekspor CSV". A collapsed card "Ubah info, harga & diskon". Card "Checkpoint & progres": table of 8 ordered checkpoints with type, a thin navy progress bar and count "86 / 120", small up/down arrow buttons and a red outline "Hapus"; an inline add row at the bottom. Card "Tambah peserta" with a monospace textarea for pasting "Nama, email, No. HP, Instansi" rows, a checkbox "Langsung setujui dan terbitkan QR (mengikuti kuota)" and a navy "Tambahkan" button. Card below with filter tabs "Menunggu (12)", "Disetujui (86)", "Ditolak (3)", "Semua (101)" (active tab navy), a button "Setujui semua yang menunggu", and a participant table with name, organization, email, phone, registered time, status badge, checkpoint count, and row actions "QR", "Setujui" plus a small "Alasan" input with red "Tolak".

### 3.9 Superadmin — Admin & panitia (`/superadmin/admins`)

Dua kolom (2:1). Kiri: judul "Admin & panitia", keterangan "Admin/panitia login di /admin, lalu memindai QR dan melihat peserta hanya di event yang ditugaskan.", tabel Nama (nama + email), Peran (Superadmin / Panitia), Event yang ditugaskan (Superadmin: "Semua event"; Panitia: daftar checkbox event + tombol kecil "Simpan"), Status (teks hijau "Aktif" / abu "Nonaktif" + tombol "Nonaktifkan"/"Aktifkan"). Kanan: kartu "Tambah admin": Nama, Email, Password (min. 8 karakter), Peran (select: "Admin / panitia", "Superadmin"), "Tugaskan ke event" (checkbox), tombol "Tambah admin".

### 3.10 Scanner (`/admin/scan` dan `/superadmin/scan`) — mobile-first, dipakai di lapangan

Prioritas: cepat dibaca dari jarak 1 meter, satu tangan.

Mobile (atas ke bawah), desktop jadi 2 kolom:
1. Kartu pilihan: select "Event" dan select "Checkpoint" (contoh "2. Check-in hotel").
2. **Area kamera** persegi, latar `#111827`, radius 6px, bingkai area pindai di tengah. Error kamera: strip merah di bawah "Kamera tidak bisa dibuka. Izinkan akses kamera, atau gunakan input manual."
3. Baris input "Input kode QR manual" + tombol "Proses" (juga untuk scanner USB).
4. **Panel hasil** besar, border 2px, radius 6px, padding 24px:
   - Berhasil: latar hijau `#16A34A`, teks putih — label kecil kapital "BERHASIL", nama 24px tebal "Andi Pratama", baris "PT Contoh Abadi".
   - Sudah pernah: latar kuning `#FBBF24`, teks gelap — "SUDAH PERNAH", "Andi Pratama sudah di-scan", "Pertama kali 30 Okt, 23.23".
   - Ditolak: latar merah `#B91C1C`, teks putih — "DITOLAK", "QR tidak dikenal" / "Event berbeda", detail.
   - Kosong: border putus-putus abu, "Arahkan kamera ke QR peserta."
5. Kartu "Riwayat di perangkat ini": baris titik status 8px + nama, kanan "Check-in hotel · 23.23.10".

> **Prompt Stitch:** Mobile QR scanner screen for event staff under a navy top bar. Two selects "Event" and "Checkpoint". A square dark camera viewfinder with a scan frame. A manual input "Input kode QR manual" with a navy "Proses" button. A large result panel in solid green with small caps "BERHASIL", big bold participant name and organization. Below, a card "Riwayat di perangkat ini" with rows: colored 8px dot (green, amber, red), name, and checkpoint · time. Also generate the amber "SUDAH PERNAH" and red "DITOLAK" variants of the result panel. High contrast, readable at arm's length.

### 3.11 Artikel — daftar (`/blog`) dan baca (`/blog/[slug]`)

**Daftar:** header publik, judul 24px "Artikel", grid 3 kolom kartu artikel. Kartu: gambar sampul 16:9 di atas (opsional, tanpa sudut tambahan di dalam kartu), tanggal kecil abu "3 Nov 2026", judul 16px/600, ringkasan maks. 3 baris. Hover: border brand. Kosong: "Belum ada artikel."

**Baca:** kolom teks 768px di tengah: link "← Semua artikel", judul 30px/700, tanggal, gambar sampul penuh lebar (radius 6px, border tipis), isi paragraf 16px dengan line-height lega.

> **Prompt Stitch:** Blog list and article page for the same company site. List: page title "Artikel" and a 3-column grid of article cards with 16:9 cover image, small grey date, bold title and 3-line excerpt. Article page: centered 768px reading column with back link "← Semua artikel", large title, date, full-width cover image with 6px radius, and comfortable body paragraphs. Same white header and footer as the landing page.

### 3.12 Panitia — Event saya dan detail (`/admin/events`, `/admin/events/[id]`)

**Event saya:** judul "Event saya", keterangan "Event yang ditugaskan Superadmin kepada Anda.", kartu tabel: Event (link biru + lokasi), Tanggal, Status (badge), Peserta (angka disetujui), Checkpoint (jumlah). Kosong: "Belum ada event yang ditugaskan."

**Detail:** link "← Event saya", judul event, baris lokasi · tanggal, tombol utama kanan "Buka scanner". Lalu kartu "Checkpoint & progres" seperti 3.8 tanpa kolom aksi dan tanpa baris tambah, dan kartu peserta dengan tab (default "Disetujui") tanpa tombol setujui/tolak. Data diperbarui otomatis tiap 20 detik.

> **Prompt Stitch:** Event staff ("Panitia") panel under the same navy bar with nav "Event saya", "Scanner" and "Panitia A · Panitia" on the right. Event detail view, read-only: back link, event title and meta, a navy "Buka scanner" button on the right; card "Checkpoint & progres" with ordered checkpoints, type and thin navy progress bars with counts, no action buttons; card with tabs "Menunggu", "Disetujui (86)", "Ditolak", "Semua" and a participant table (name, organization, email, phone, registered time, status badge, checkpoints "3 / 8") with no action column.

### 3.13 Superadmin — Editor halaman depan (`/superadmin/site`)

Kolom 768px. Judul "Halaman depan", keterangan "Konten company profile di halaman utama. Daftar event dan artikel tampil otomatis.", tombol sekunder kecil kanan "Lihat halaman". Empat kartu form bertumpuk:
1. **Identitas & hero:** Nama perusahaan / brand, Judul hero (textarea 2 baris), **Foto hero** (kotak pratinjau 4:3 + tombol "Pilih gambar" / "Ganti gambar" + tautan merah "Hapus gambar"), Tentang perusahaan (textarea 4 baris), **Foto bagian Tentang kami** (komponen unggah yang sama).
2. **Layanan (maks. 3, kosongkan judul untuk menyembunyikan):** 3 blok dipisah garis tipis, masing-masing baris input "Layanan n" (1/3 lebar) + "Keterangan" (2/3 lebar), lalu komponen unggah "Foto layanan" (16:10).
3. **Cara kerja untuk peserta:** textarea "Satu langkah per baris".
4. **Kontak:** Email, Telepon, Alamat dalam 3 kolom.

Bawah kanan: pesan hijau "Tersimpan. Halaman depan sudah diperbarui." + tombol "Simpan".

> **Prompt Stitch:** Superadmin "Halaman depan" content editor, 768px centered column under the navy admin bar. Title with a small outline button "Lihat halaman". Four stacked form cards: "Identitas & hero" (brand name, hero headline, about textarea), "Layanan" (three rows of title + description inputs), "Cara kerja untuk peserta" (textarea, one step per line), "Kontak" (email, phone, address in three columns). Bottom right a green success text and a navy "Simpan" button. Plain, dense, enterprise form styling.

### 3.16 Aplikasi HP: bar menu bawah dan gerak (peserta + publik)

Di layar < 768px, halaman publik dan area peserta memakai bar menu bawah tetap (tinggi 64px, putih, garis atas abu-abu, mengikuti safe-area iPhone) dengan 4 tab beri ikon garis 24px dan label 11px: **Beranda** (rumah), **Pelatihan** (kalender, menuju `/event`), **Tiket** (tiket bergerigi), **Akun** (orang). Tab aktif: ikon dan label biru brand, ikon sedikit tebal dan "memantul" sekali (skala 0,85 → 1,18 → 1), garis biru 2px memanjang di tepi atas tab. Tap: latar abu sangat muda. Di desktop bar ini hilang dan header biasa dipakai.

**Akun (`/akun`):** kartu profil (avatar lingkaran inisial biru, nama, email, HP · instansi), kartu daftar dua baris bertautan beri ikon ("Tiket dan status pendaftaran saya", "Cari event dan pelatihan"), tombol "Keluar".

**Gerak** (semua dimatikan bila pengguna memilih kurangi animasi): kartu event muncul bergantian naik 14px sambil memudar (jeda 70 ms antarkartu); kartu yang bisa diklik terangkat 2px dengan bayangan tipis saat disorot dan fotonya membesar pelan (105%, 500 ms); tombol mengecil 3% saat ditekan; titik indikator slider yang aktif memanjang jadi kapsul; saat memuat, beranda dan dasbor menampilkan kerangka abu-abu berkilau pelan, bukan layar kosong.

> **Prompt Stitch:** Mobile participant app, 390px wide. Fixed white bottom tab bar with a thin grey top border and four tabs, each a 24px line icon over an 11px label: Beranda (house), Event (calendar), Tiket (ticket), Akun (person). The active tab is navy (#1D337F) with a short 2px navy indicator line on its top edge; inactive tabs are grey. Above it, show the Akun screen: a card with a navy circular initial avatar, name, email and phone; a card with two linked rows with navy icons; and an outline "Keluar" button. Flat enterprise style, 6px radius, no gradients.

### 3.15 Superadmin — Banner beranda (`/superadmin/banners`)

Dua kolom (2:1). Kiri: judul "Banner beranda", keterangan "Slide promosi di bagian atas beranda. Urutan dari atas ke bawah = urutan tampil; berganti otomatis tiap 5 detik.", kartu tabel kolom Banner (thumbnail 96×48 + judul tebal + keterangan + tautan biru kecil), Status (badge hijau "Tampil" / abu "Disembunyikan"), aksi tombol kecil ↑ ↓ "Sembunyikan/Tampilkan" dan merah "Hapus". Kanan: kartu "Tambah banner" — Judul, Keterangan singkat, Gambar banner (kotak pratinjau 16:9 + tombol "Pilih gambar" / "Ganti gambar" + tautan merah "Hapus gambar"; unggah dari perangkat, JPEG/PNG/WebP maks. 4 MB, otomatis diubah ke WebP dan dikecilkan; disarankan 1680 × 640 px), Tautan saat diklik (path internal atau http(s)), tombol penuh "Tambah banner".

> **Prompt Stitch:** Superadmin banner management under the navy admin bar. Left: title "Banner beranda", helper text, and a table card with columns Banner (96×48 thumbnail, bold title, grey subtitle, small blue link), Status (green badge "Tampil" or grey "Disembunyikan"), and small buttons ↑ ↓ "Sembunyikan" and red outline "Hapus". Right: form card "Tambah banner" with Judul, Keterangan singkat, URL gambar, Tautan saat diklik, full-width navy button. Dense corporate, 6px radius.

### 3.14 Superadmin — Artikel (`/superadmin/articles`, `/new`, `/[id]`)

**Daftar:** judul "Artikel" + tombol utama kecil "Tulis artikel". Kartu tabel: Judul (link biru + ringkasan 1 baris), Status (badge hijau "Terbit" / abu "Draft"), Terbit (tanggal), Diubah (tanggal), aksi "Lihat" untuk yang terbit.

**Tulis / edit:** kolom 768px, link "← Semua artikel", judul "Tulis artikel" / "Edit artikel". Satu kartu form: Judul, Ringkasan (textarea 2 baris), URL gambar sampul (placeholder "https://..."), Isi artikel (textarea 16 baris, "pisahkan paragraf dengan baris kosong"). Bawah: checkbox "Terbitkan di halaman publik" kiri; kanan tombol bahaya "Hapus" (hanya saat edit) dan tombol utama "Simpan". Error merah di bawah, contoh "URL gambar harus diawali http:// atau https://".

> **Prompt Stitch:** Superadmin article management. List page: title "Artikel" with a small navy "Tulis artikel" button and a table card (title link with one-line excerpt, status badge "Terbit" green or "Draft" grey, published date, updated date, "Lihat" button). Editor page: 768px column with back link, one form card with title, excerpt, cover image URL, a tall plain textarea for the body, a "Terbitkan di halaman publik" checkbox, and red outline "Hapus" plus navy "Simpan" buttons. No rich-text toolbar.

---

### 3.17 Fitur operasional panel (panitia, superadmin, peserta)

- **Detail peserta** (`/admin/events/[id]/peserta/[regId]`, `/superadmin/events/[id]/peserta/[regId]`), dibuka dengan klik nama di tabel pendaftar. Kolom 768px: link kembali ke event; kartu identitas (avatar inisial, nama, instansi, email · HP, waktu mendaftar, badge status, tombol "Lihat QR" khusus superadmin); kartu "Checkpoint" dengan hitungan "2 dari 6" dan daftar berurutan: lingkaran hijau ✓ + "Hadir 30 Okt, 23.23 oleh Panitia A" atau lingkaran abu bernomor + "Belum". Baris belum: tombol sekunder kecil "Tandai hadir" (check-in manual bila QR tak bisa dipindai). Baris sudah: tombol merah kecil "Batalkan" (panitia: hanya scan miliknya ≤ 15 menit; superadmin: semua). Semua tombol minta konfirmasi. Peserta belum disetujui: pita kuning "Check-in hanya untuk peserta yang sudah disetujui."
- **Pencarian di tabel pendaftar** (superadmin dan panitia): baris di bawah tab status, input "Cari nama, email, no. HP, atau instansi" + tombol "Cari", lalu "1 hasil untuk "citra"" dan "Reset".
- **Riwayat scan saya** (`/admin/riwayat`, panitia): tabel 100 scan terakhir (Waktu, Peserta → link detail, Event · checkpoint, tombol "Batalkan" bila masih ≤ 15 menit).
- **Akun** (`/admin/akun`, `/superadmin/akun`): kartu identitas + tombol Keluar; kartu "Ganti password" (lama, baru, ulangi) dengan pesan hijau/merah.
- **Dasbor superadmin** (`/superadmin/dashboard`, halaman awal superadmin): 4 kartu angka (Event dibuka, Menunggu persetujuan — kuning bila > 0, Peserta disetujui, Check-in hari ini); kiri tabel "Event mendatang" (event, mulai, disetujui/kuota, menunggu); kanan daftar "Menunggu persetujuan" (nama, event · waktu, tombol "Tinjau").
- **Peserta** (`/superadmin/peserta`): cari nama/email/HP/instansi; tabel Peserta, Kontak, Pendaftaran (nama event → detail + badge status), Bergabung.
- **Admin & panitia**: di kolom status tiap admin lain ada input kecil "Password baru" + "Reset" (sekaligus membuka kunci akun) dan keterangan kuning "Terkunci sementara" bila terkunci.
- **Hapus event**: di bawah form "Ubah info, harga & diskon", tombol merah "Hapus event" hanya bila belum ada pendaftar; jika sudah ada: teks kecil "Event yang sudah punya pendaftar tidak bisa dihapus. Ubah statusnya menjadi "Selesai"..."
- **Peserta** — `/akun`: kartu "Profil" (Nama lengkap, Email terkunci "Mengikuti akun Google", No. HP / WhatsApp, Instansi, tombol "Simpan profil"). `/tiket/[id]` saat status Menunggu: tombol merah kecil "Batalkan pendaftaran" (dengan konfirmasi).
- **Menu panel** menandai halaman aktif (latar putih transparan). Superadmin: Dasbor · Event · Peserta · Scanner · Admin · Halaman depan · Banner · Artikel · Riwayat · Akun. Panitia: Event saya · Scanner · Riwayat scan · Akun.

## 4. Teks dan format

- Seluruh UI berbahasa Indonesia.
- Tanggal: "1 Des 2026"; tanggal-jam: "30 Okt, 23.23" (zona Asia/Jakarta).
- Angka: pemisah ribuan titik, contoh "1.500", "86 / 120".
- Harga: "Rp 2.500.000"; harga 0 atau diskon 100% tampil "Gratis". Diskon dalam persen: "-20%".
- Status pendaftaran: Menunggu, Disetujui, Ditolak. Status event: Draft, Pendaftaran dibuka, Pendaftaran ditutup, Selesai. Jenis checkpoint: Kehadiran, Konsumsi, Pengambilan barang. Status artikel: Terbit, Draft.
- Nama peran di UI: Peserta, Panitia (atau "Admin / panitia"), Superadmin.
