# Aturan Arsitektur Anti-Monolith & Prinsip Ponytail

## 1. Batas Ukuran File (Anti-Monolith)
* **Target Panjang File**: Targetkan komponen halaman berukuran kurang dari 400 baris.
* **Larangan File Raksasa**: Dilarang keras menumpuk ribuan baris kode (2000+ baris) ke dalam satu file halaman utama.
* **Ekstraksi Komponen Modular**: Setiap kali ada modal dialog, tabel detail berat, scanner widget, atau sub-formulir kompleks, WAJIB diekstrak ke dalam file terpisah di dalam subfolder `components/` (misalnya: `components/BarcodeScannerModal.jsx`, `components/ItemDetailDrawer.jsx`).

## 2. Prinsip Ponytail & YAGNI
* Selesaikan masalah dengan kode seminimal mungkin yang bekerja dengan benar dan andal.
* Jangan menambahkan abstraksi berulang, wrapper berlebihan, atau fitur spekulatif yang tidak diminta.
* Gunakan kembali (*reuse*) state management (Zustand, Context, atau React Query) dan utilitas yang sudah tersedia.

## 3. Nol Error & Integritas Build
* Setiap selesai melakukan refaktor atau penambahan fitur, pastikan bundle berhasil dibangun dengan `npm run build` tanpa error sintaks atau regresi.
