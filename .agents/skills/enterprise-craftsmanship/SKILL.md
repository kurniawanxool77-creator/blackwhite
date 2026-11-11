---
name: enterprise-craftsmanship
description: Panduan dan checklist kualitas untuk memastikan implementasi UI/UX dan arsitektur kode bebas dari AI Slop dan memenuhi standar Enterprise / Mekari Talenta.
---

# Enterprise Craftsmanship Checklist (Anti-AI Slop)

Skill ini digunakan untuk memvalidasi dan memandu pembuatan antarmuka pengguna agar selalu berstandar *Enterprise Grade*.

## Checklist Validasi Sebelum Submit Perubahan:

1. **Border Radius Audit**:
   - [ ] Apakah ada `rounded-xl`, `rounded-2xl`, atau `rounded-3xl`? (Jika ada, ganti segera dengan `rounded` atau `rounded-md`).
   - [ ] Apakah tombol, input, modal, dan container berpenampilan tegas, rapat, dan profesional?

2. **Form & Data Formatting Audit**:
   - [ ] Apakah kolom nominal angka / mata uang menggunakan format dengan titik ribuan (contoh: `Rp 15.000` atau `1.200 pcs`)?
   - [ ] Apakah panah spinner browser pada `<input type="number">` telah dihilangkan atau diganti input terformat yang bersih?
   - [ ] Apakah input memiliki focus ring korporat yang jelas (contoh: `focus:ring-1 focus:ring-[#1D337F] focus:border-[#1D337F]`)?

3. **Modular Architecture Audit**:
   - [ ] Apakah modal, scanner drawer, atau form besar dipisahkan ke dalam folder `components/` terpisah?
   - [ ] Apakah ukuran file halaman utama tetap ramping (< 400 baris) dan mudah dirawat?

4. **Kesesuaian Warna & Tipografi**:
   - [ ] Apakah warna primer konsisten menggunakan palet korporat (seperti `#1D337F` / deep slate)?
   - [ ] Apakah tipografi bersih dan berkarakter tegas (seperti `Plus Jakarta Sans` atau `Inter`)?
   - [ ] Apakah terhindar dari warna pastel jenuh yang kekanak-kanakan (AI slop pills)?
