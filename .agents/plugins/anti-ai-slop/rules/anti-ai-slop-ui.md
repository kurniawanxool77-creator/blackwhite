# Aturan Standar UI/UX Enterprise (Anti-AI Slop)

Standar ini WAJIB ditaati oleh asisten kecerdasan buatan (AI) saat mengedit, merefaktor, atau membuat komponen UI.

## 1. Bentuk Sudut (Border Radius) — Sangat Ketat
* Semua elemen antarmuka di Dashboard Web HARUS menggunakan sudut yang tegas dan profesional (Mekari Talenta / Enterprise style).
* **Wajib Gunakan Class Tailwind:** `rounded` atau `rounded-md`.
* **DILARANG KERAS MENGGUNAKAN:** `rounded-xl`, `rounded-2xl`, `rounded-3xl`, atau `rounded-full` pada komponen form, kartu (*container*), *modal*, dialog, atau tombol aksi.
* **Pengecualian:** Hanya *avatar* foto profil pengguna atau status badge sirkular kecil yang diperbolehkan memakai `rounded-full`.

## 2. Kontrol Input Formulir & Angka / Barcode
* **Dilarang Menampilkan Input Angka Mentah**: Jangan gunakan `<input type="number">` standar browser yang memunculkan panah *spinner* kaku dan angka panjang tanpa pemisah format.
* **Format Angka & Mata Uang**: Selalu gunakan komponen input dengan pemisah ribuan titik (contoh: `Rp 14.000.000` atau `1.500 pcs`).
* **Input Barcode & Scanner**:
  - Kolom input barcode wajib mendukung auto-focus, trigger `Enter` otomatis saat scanner membaca barcode, dan status feedback cepat (sukses/gagal scan).
* **Styling Form**: Selalu pastikan elemen form memiliki kelas border halus (`border-gray-300`), teks jelas (`text-gray-800`), dan *focus ring* korporat (`focus:ring-1 focus:ring-[#1D337F] focus:border-[#1D337F]`).

## 3. Palet Warna & Visual
* **Warna Primer Korporat:** `#1D337F` (tombol utama, aksen aktif, status primer).
* **Latar Belakang:** `bg-gray-50` untuk latar dashboard, `bg-white` untuk kartu konten dengan border halus `border-gray-200` dan bayangan tipis `shadow-xs` / `shadow-sm`.
* **Dilarang Warna Pastel AI Slop:** Hindari kotak-kotak pastel tebal mencolok (`bg-blue-100`, `bg-purple-100`, `bg-emerald-100`) yang berlebihan di sekujur halaman yang membuatnya tampak seperti mainan atau template AI murah.
* **Teks Keterbacaan Tinggi:** Teks isi utama wajib kontras (`text-gray-800` atau `text-gray-900`), label menggunakan `text-gray-700` atau `text-gray-600`.
