// Mengisi akun dan data contoh untuk mencoba aplikasi. Aman dijalankan berulang (npm run db:seed).
// Akun dibaca dari .env: SUPERADMIN_*, PANITIA_*, PESERTA_*.
import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import sharp from "sharp";
import { hashPassword } from "../lib/password.ts";

const db = new PrismaClient();
const env = (key) => {
  const v = process.env[key];
  if (!v) throw new Error(`${key} belum diisi di .env`);
  return v;
};
const day = (offset) => new Date(Date.now() + offset * 86_400_000);

async function admin(prefix, name, role) {
  const email = env(`${prefix}_EMAIL`).toLowerCase();
  const passwordHash = hashPassword(env(`${prefix}_PASSWORD`));
  return db.admin.upsert({
    where: { email },
    update: { name, role, passwordHash, active: true, failedLogins: 0, lockedUntil: null },
    create: { email, name, role, passwordHash },
  });
}

// Gambar banner sederhana (biru brand + judul) agar slider langsung terlihat.
async function banner(title, subtitle, color, order, linkUrl) {
  // Gambar contoh sudah memuat judulnya sendiri, jadi dibuat "gambar saja" (tanpa tulisan tambahan).
  const found = await db.banner.findFirst({ where: { title } });
  if (found) return found.subtitle && found.caption ? db.banner.update({ where: { id: found.id }, data: { caption: false } }) : undefined;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1680" height="640"><rect width="1680" height="640" fill="${color}"/><text x="840" y="300" font-family="Arial, sans-serif" font-size="84" font-weight="700" fill="#fff" text-anchor="middle">${title}</text><text x="840" y="390" font-family="Arial, sans-serif" font-size="40" fill="#fff" fill-opacity="0.85" text-anchor="middle">${subtitle}</text></svg>`;
  const data = await sharp(Buffer.from(svg)).webp({ quality: 82 }).toBuffer();
  const media = await db.media.create({ data: { mime: "image/webp", data, size: data.length } });
  await db.banner.create({ data: { title, subtitle, imageUrl: `/media/${media.id}`, linkUrl, order, caption: false } });
}

async function event(slug, data, checkpoints) {
  const found = await db.event.findUnique({ where: { slug } });
  if (found) return found;
  return db.event.create({
    data: { slug, status: "open", ...data, checkpoints: { create: checkpoints.map(([name, kind], i) => ({ name, kind, order: i + 1 })) } },
    include: { checkpoints: true },
  });
}


// ---------- Foto contoh (ilustrasi datar). Ganti dengan foto asli lewat panel Superadmin. ----------
const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const rng = (seed) => () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
const NAVY = "#15803d";

async function store(svg) {
  const data = await sharp(Buffer.from(svg)).webp({ quality: 82 }).toBuffer();
  const media = await db.media.create({ data: { mime: "image/webp", data, size: data.length } });
  return `/media/${media.id}`;
}
const svg = (w, h, bg, inner) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="${bg}"/>${inner}</svg>`;

// Pola mirip QR: tiga kotak sudut + modul acak.
function qr(x, y, size, seed, fg) {
  const n = 21, c = size / n, r = rng(seed);
  let out = "";
  const finder = (fx, fy) =>
    `<rect x="${x + fx * c}" y="${y + fy * c}" width="${7 * c}" height="${7 * c}" fill="${fg}"/><rect x="${x + (fx + 1) * c}" y="${y + (fy + 1) * c}" width="${5 * c}" height="${5 * c}" fill="#fff"/><rect x="${x + (fx + 2) * c}" y="${y + (fy + 2) * c}" width="${3 * c}" height="${3 * c}" fill="${fg}"/>`;
  out += finder(0, 0) + finder(n - 7, 0) + finder(0, n - 7);
  for (let i = 0; i < n; i++)
    for (let j = 0; j < n; j++) {
      const inFinder = (i < 8 && j < 8) || (i >= n - 8 && j < 8) || (i < 8 && j >= n - 8);
      if (!inFinder && r() > 0.5) out += `<rect x="${x + i * c}" y="${y + j * c}" width="${c}" height="${c}" fill="${fg}"/>`;
    }
  return out;
}
const checkRows = (x, y, w, rows, fg) =>
  Array.from({ length: rows }, (_, i) => {
    const cy = y + i * 70;
    return `<circle cx="${x + 20}" cy="${cy}" r="20" fill="${fg}"/><path d="M${x + 10} ${cy} l7 8 l14 -16" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><rect x="${x + 56}" y="${cy - 9}" width="${w - i * 40}" height="18" rx="4" fill="${fg}" fill-opacity="0.25"/>`;
  }).join("");

const heroScene = () => svg(1200, 900, NAVY, `<rect x="290" y="130" width="620" height="640" rx="14" fill="#fff"/>${qr(340, 180, 520, 7, NAVY)}`);
const aboutScene = () =>
  svg(1200, 900, "#eef1f9", `<rect x="190" y="90" width="340" height="720" rx="44" fill="${NAVY}"/><rect x="210" y="130" width="300" height="640" rx="24" fill="#fff"/>${qr(240, 240, 240, 11, NAVY)}<rect x="240" y="530" width="240" height="22" rx="5" fill="${NAVY}" fill-opacity="0.25"/><rect x="240" y="580" width="170" height="22" rx="5" fill="${NAVY}" fill-opacity="0.25"/>${checkRows(640, 270, 340, 4, NAVY)}`);
const serviceScene = (kind) => {
  const card = `<rect x="200" y="90" width="500" height="420" rx="14" fill="#fff"/>`;
  const inner = [
    checkRows(260, 190, 300, 4, NAVY),
    qr(290, 130, 340, 5, NAVY),
    [60, 140, 100, 190, 160].map((h, i) => `<rect x="${260 + i * 84}" y="${450 - h}" width="56" height="${h}" rx="4" fill="${NAVY}" fill-opacity="${0.35 + i * 0.13}"/>`).join("") + `<rect x="250" y="452" width="420" height="4" fill="${NAVY}"/>`,
  ][kind];
  return svg(900, 600, "#e3e8f5", card + inner);
};
function wrapPosterLines(text, max = 24) {
  const lines = [];
  let cur = "";
  for (const w of text.split(/\s+/)) {
    if (cur && `${cur} ${w}`.length > max && lines.length < 1) {
      lines.push(cur);
      cur = w;
    } else cur = cur ? `${cur} ${w}` : w;
  }
  if (cur) lines.push(cur);
  return lines;
}

const posterScene = (title, sub, bg, v) => {
  const lines = wrapPosterLines(title);
  const maxLen = Math.max(...lines.map((l) => l.length));
  const size = lines.length > 1 ? (maxLen > 24 ? 52 : 60) : (maxLen > 22 ? 62 : 76);
  const firstY = lines.length > 1 ? 260 : 330;
  const titles = lines.map((l, i) => `<text x="80" y="${firstY + i * Math.round(size * 1.25)}" font-family="Arial, sans-serif" font-size="${size}" font-weight="700" fill="#fff">${esc(l)}</text>`).join("");
  return svg(1200, 675, bg, `<rect x="${760 + v * 30}" y="-60" width="520" height="520" fill="#fff" fill-opacity="0.07" transform="rotate(${20 + v * 8} 1000 200)"/><rect x="${860 - v * 40}" y="300" width="420" height="420" fill="#fff" fill-opacity="0.07" transform="rotate(${-15 - v * 6} 1070 510)"/>${titles}<text x="80" y="420" font-family="Arial, sans-serif" font-size="38" fill="#fff" fill-opacity="0.85">${esc(sub)}</text><rect x="80" y="455" width="120" height="8" rx="3" fill="#fff"/>`);
};

async function ensureSite() {
  if (await db.setting.findUnique({ where: { key: "site" } })) return;
  const site = {
    name: "BlackWhite",
    tagline: "Event dan kegiatan dengan pendaftaran online dan absensi QR",
    about: "Kami membantu penyelenggara event mengelola peserta secara tertib: pendaftaran, persetujuan, hingga pemindaian QR di setiap titik acara seperti bandara, hotel, konsumsi, dan pengambilan barang.\n\nSetiap peserta mendapat satu QR. Panitia memindainya di setiap checkpoint, dan peserta dapat memantau progresnya langsung dari ponsel.",
    heroImage: await store(heroScene()),
    aboutImage: await store(aboutScene()),
    services: [
      { title: "Pendaftaran & persetujuan", body: "Peserta mendaftar dengan akun Google, panitia menyetujui dari satu dasbor.", image: await store(serviceScene(0)) },
      { title: "QR per checkpoint", body: "Satu QR per peserta dipindai di setiap titik acara, berurutan sesuai jadwal.", image: await store(serviceScene(1)) },
      { title: "Laporan langsung", body: "Lihat siapa yang sudah dan belum hadir di tiap checkpoint, lalu ekspor ke CSV.", image: await store(serviceScene(2)) },
    ],
    steps: ["Buat akun atau masuk dengan Google, lalu daftar event", "Tunggu persetujuan panitia", "Tunjukkan QR di setiap checkpoint", "Pantau progres Anda di dasbor"],
    contact: { email: "admin@blackwhite.co.id", phone: "+62 821-5615-7217", address: "Jakarta, Indonesia" },
  };
  await db.setting.create({ data: { key: "site", value: JSON.stringify(site) } });
}

// Foto sampul + galeri untuk event yang belum punya foto.
async function ensurePhotos(ev, title, bg, labels) {
  if (ev.coverUrl) return;
  const cover = await store(posterScene(title, labels[0], bg, 0));
  const gallery = [];
  for (const [i, label] of labels.slice(1).entries()) gallery.push(await store(posterScene(label, title, bg, i + 1)));
  await db.event.update({ where: { id: ev.id }, data: { coverUrl: cover, gallery: JSON.stringify(gallery) } });
}

async function ensureArticle(slug, title, excerpt, content, color) {
  const found = await db.article.findUnique({ where: { slug } });
  if (found) {
    if (!found.coverUrl) await db.article.update({ where: { id: found.id }, data: { coverUrl: await store(posterScene(title, "Blog", color, 2)) } });
    return;
  }
  await db.article.create({
    data: { slug, title, excerpt, content, coverUrl: await store(posterScene(title, "Blog", color, 2)), published: true, publishedAt: new Date() },
  });
}

async function main() {
  const superadmin = await admin("SUPERADMIN", "Superadmin", "superadmin");
  const panitia = await admin("PANITIA", "Panitia Lapangan", "scanner");
  const demoEmail = env("PESERTA_EMAIL").toLowerCase();
  const demoPassword = hashPassword(env("PESERTA_PASSWORD"));
  const demo = await db.user.upsert({
    where: { email: demoEmail },
    update: { passwordHash: demoPassword, failedLogins: 0, lockedUntil: null },
    create: { email: demoEmail, name: "Peserta Contoh", phone: "081234567890", organization: "PT Contoh Sejahtera", passwordHash: demoPassword, emailVerified: true },
  });

  const k3 = await event(
    "pelatihan-k3-umum-demo",
    {
      name: "Pelatihan K3 Umum",
      category: "Pelatihan K3",
      location: "Semarang",
      description: "Pelatihan Keselamatan dan Kesehatan Kerja (K3) umum selama tiga hari, termasuk sertifikasi.",
      startDate: day(14),
      endDate: day(16),
      price: 2_500_000,
      discount: 20,
      quota: 30,
    },
    [["Tiba di bandara", "attendance"], ["Check-in hotel", "attendance"], ["Ambil kit peserta", "item"], ["Registrasi venue hari 1", "attendance"], ["Makan siang hari 1", "meal"], ["Check-out hotel", "attendance"]],
  );
  // Contoh formulir pendaftaran lengkap (format lib/registration-form.ts). Diisi bila kosong / format lama tanpa kelompok.
  if (!k3.formFields || k3.formFields === "[]" || !k3.formFields.includes('"group"')) {
    const f = (id, label, type, group, required, options = [], hint = "") => ({ id, label, type, group, required, options, hint });
    await db.event.update({
      where: { id: k3.id },
      data: {
        formFields: JSON.stringify([
          f("lahir001", "Tanggal lahir", "date", "umum", true),
          f("kota0001", "Kota domisili", "text", "umum", true),
          f("paket001", "Pilih paket", "package", "umum", true, ["Reguler | 0 | Pelatihan 3 hari + sertifikat", "Paket Lengkap | 1.250.000 | Tambahan hotel 2 malam + antar-jemput bandara"]),
          f("kaos0001", "Ukuran kaos", "select", "umum", true, ["S", "M", "L", "XL", "XXL"]),
          f("barang01", "Barang yang dibawa", "textarea", "barang", false, [], "Sebutkan jenis, merek, warna, atau ciri khusus"),
          f("fotobrg1", "Foto barang bawaan", "file", "barang", false, [], "Agar panitia mudah mengenali barang Anda"),
          f("sehat001", "Riwayat penyakit / alergi", "textarea", "kesehatan", false, [], "Kosongkan bila tidak ada"),
          f("obat0001", "Obat yang rutin diminum", "text", "kesehatan", false),
          f("drtnama1", "Nama kontak darurat", "text", "darurat", true),
          f("drtnomr1", "Nomor kontak darurat", "tel", "darurat", true),
          f("ktp00001", "Foto identitas (KTP)", "file", "umum", false, [], "JPG, PNG, atau WebP, maks. 4 MB"),
          f("setuju01", "Saya menyatakan data yang diisi benar dan bersedia mematuhi aturan panitia", "checkbox", "umum", true),
        ]),
      },
    });
    // Rundown khusus Paket Lengkap: hanya peserta paket itu yang dijadwalkan dan dipindai di pos ini.
    await db.checkpoint.updateMany({
      where: { eventId: k3.id, name: { in: ["Tiba di bandara", "Check-in hotel", "Check-out hotel"] }, audience: "[]" },
      data: { audience: JSON.stringify(["paket001:Paket Lengkap"]) },
    });
  }
  const seminar = await event(
    "seminar-digital-marketing-demo",
    {
      name: "Seminar Digital Marketing",
      category: "Seminar",
      location: "Jakarta",
      description: "Seminar satu hari tentang strategi pemasaran digital untuk perusahaan.",
      startDate: day(30),
      endDate: day(30),
      price: 0,
      discount: 0,
      quota: null,
    },
    [["Registrasi", "attendance"], ["Makan siang", "meal"]],
  );

  await db.event.update({ where: { id: k3.id }, data: { admins: { connect: { id: panitia.id } } } });
  await db.event.update({ where: { id: seminar.id }, data: { mode: "online", location: "Online (Zoom)" } });

  // Data tim contoh: jabatan, kontak, dan tugas (halaman Tim panitia). Relawan memakai password panitia dari .env.
  await db.admin.update({ where: { id: superadmin.id }, data: { phone: "0811 0000 1111", position: "Penanggung jawab acara" } });
  await db.admin.update({
    where: { id: panitia.id },
    data: {
      position: "Koordinator lapangan",
      phone: "0812 3456 0001",
      duties: "Koordinasi semua pos checkpoint\nScan registrasi venue\nMenangani peserta tanpa QR (check-in manual)",
    },
  });
  const relawanEmail = "relawan@contoh.co.id";
  const relawan = await db.admin.upsert({
    where: { email: relawanEmail },
    update: {},
    create: {
      email: relawanEmail,
      name: "Rudi Hartono",
      role: "scanner",
      position: "Penjemputan bandara",
      phone: "0813 5555 0002",
      duties: "Menjemput peserta di bandara\nScan kedatangan peserta\nMengantar ke hotel",
      passwordHash: hashPassword(env("PANITIA_PASSWORD")),
    },
  });
  await db.event.update({ where: { id: k3.id }, data: { admins: { connect: { id: relawan.id } } } });

  // Pelatihan yang berlangsung HARI INI (tanggal Jakarta), agar absensi tim dan alur scan langsung bisa dicoba.
  const todayKey = new Date(Date.now() + 7 * 3_600_000).toISOString().slice(0, 10);
  const t0 = new Date(`${todayKey}T00:00:00.000Z`);
  const live = await event(
    `workshop-hari-ini-${todayKey}`,
    {
      name: "Workshop Manajemen Event (hari ini)",
      category: "Workshop",
      location: "Semarang",
      description: "Contoh pelatihan yang sedang berlangsung untuk mencoba absensi tim dan scan.",
      startDate: t0,
      endDate: new Date(+t0 + 86_400_000),
      price: 0,
      discount: 0,
      quota: 50,
    },
    [["Registrasi pagi", "attendance"], ["Sesi materi 1", "attendance"], ["Makan siang", "meal"]],
  );
  await db.checkpoint.updateMany({ where: { eventId: live.id, name: "Sesi materi 1" }, data: { scan: false } });
  await db.event.update({ where: { id: live.id }, data: { admins: { connect: [{ id: panitia.id }, { id: relawan.id }] } } });
  await db.registration.upsert({
    where: { userId_eventId: { userId: demo.id, eventId: live.id } },
    update: {},
    create: { userId: demo.id, eventId: live.id, status: "approved", approvedAt: new Date() },
  });
  await db.attendance.upsert({
    where: { adminId_eventId_date: { adminId: relawan.id, eventId: live.id, date: todayKey } },
    update: {},
    create: { adminId: relawan.id, eventId: live.id, date: todayKey, checkIn: new Date(+t0 + 45 * 60_000) }, // 07.45 WIB
  });
  await ensurePhotos(k3, "Pelatihan K3 Umum", "#15803d", ["Semarang, 3 hari", "Ruang pelatihan", "Praktik lapangan", "Sertifikasi Kemnaker", "Fasilitas hotel"]);
  await ensurePhotos(seminar, "Seminar Digital Marketing", "#16a34a", ["Jakarta, 1 hari", "Ruang seminar", "Sesi tanya jawab"]);
  await ensureSite();

  // Peserta demo: sudah disetujui dan sudah melewati 3 checkpoint pertama, agar QR dan tracking terlihat.
  const people = [
    ["Budi Santoso", "budi@contoh.co.id", "PT Nusantara", "approved"],
    ["Citra Lestari", "citra@contoh.co.id", "CV Maju Jaya", "approved"],
    ["Dewi Anggraini", "dewi@contoh.co.id", "PT Sinar Mas", "pending"],
    ["Eko Prasetyo", "eko@contoh.co.id", "PT Karya Utama", "pending"],
    ["Fajar Nugroho", "fajar@contoh.co.id", "PT Bumi Raya", "rejected"],
  ];
  const regs = [[demo, "approved"], ...[]];
  for (const [name, email, organization, status] of people) {
    const user = await db.user.upsert({ where: { email }, update: {}, create: { email, name, organization, phone: "0812" + Math.floor(1e7 + Math.random() * 9e7) } });
    regs.push([user, status]);
  }
  for (const [user, status] of regs) {
    await db.registration.upsert({
      where: { userId_eventId: { userId: user.id, eventId: k3.id } },
      update: {},
      create: {
        userId: user.id,
        eventId: k3.id,
        status,
        rejectReason: status === "rejected" ? "Dokumen pendukung belum lengkap." : null,
        qrToken: status === "approved" ? randomBytes(18).toString("base64url") : null,
        approvedAt: status === "approved" ? new Date() : null,
      },
    });
  }
  await db.registration.upsert({
    where: { userId_eventId: { userId: demo.id, eventId: seminar.id } },
    update: {},
    create: { userId: demo.id, eventId: seminar.id },
  });

  const demoReg = await db.registration.findUniqueOrThrow({ where: { userId_eventId: { userId: demo.id, eventId: k3.id } } });
  const cps = await db.checkpoint.findMany({ where: { eventId: k3.id }, orderBy: { order: "asc" } });
  for (const cp of cps.slice(0, 3)) {
    await db.scan.upsert({
      where: { registrationId_checkpointId: { registrationId: demoReg.id, checkpointId: cp.id } },
      update: {},
      create: { registrationId: demoReg.id, checkpointId: cp.id, adminId: panitia.id },
    });
  }

  await banner("Pelatihan K3 Umum", "Diskon 20% — pendaftaran dibuka", "#15803d", 1, `/event/${k3.slug}`);
  await banner("Seminar Digital Marketing", "Gratis untuk semua peserta", "#16a34a", 2, `/event/${seminar.slug}`);

  // Kategori dikelola di menu Kategori; daftarkan kategori yang sudah dipakai event.
  const used = await db.event.findMany({ where: { category: { not: "" } }, distinct: ["category"], select: { category: true } });
  for (const { category } of used) await db.category.upsert({ where: { name: category }, update: {}, create: { name: category } });

  // Contoh kuis dan sertifikat untuk Pelatihan K3 (hanya bila belum ada). Video materi ditambahkan Superadmin sendiri.
  if ((await db.question.count({ where: { eventId: k3.id } })) === 0) {
    const q = (order, text, options, answer) => ({ eventId: k3.id, order, text, options: JSON.stringify(options), answer });
    await db.question.createMany({
      data: [
        q(1, "Apa kepanjangan K3?", ["Keselamatan dan Kesehatan Kerja", "Kebersihan, Keamanan, Ketertiban", "Kerja Keras Kompak"], 0),
        q(2, "APD yang melindungi kepala adalah...", ["Sarung tangan", "Helm keselamatan", "Sepatu boot"], 1),
        q(3, "Langkah pertama saat terjadi kebakaran kecil?", ["Lari keluar gedung", "Membunyikan alarm dan memakai APAR bila aman", "Menunggu petugas"], 1),
      ],
    });
    await db.event.update({ where: { id: k3.id }, data: { certificate: true, passScore: 70 } });
  }

  await ensureArticle(
    "tips-persiapan-peserta-demo",
    "Tips persiapan sebelum mengikuti pelatihan",
    "Hal-hal yang perlu disiapkan peserta agar proses check-in berjalan lancar.",
    "Pastikan QR tiket Anda sudah terbit dan dapat dibuka di ponsel.\n\nSiapkan identitas dan tiba lebih awal agar proses registrasi tidak antre.",
    "#15803d",
  );
  await ensureArticle(
    "panduan-check-in-qr-demo",
    "Panduan check-in dengan QR di hari acara",
    "Langkah singkat dari tiba di bandara sampai kepulangan, semuanya dengan satu QR.",
    "Tunjukkan QR Anda kepada panitia di setiap checkpoint. Setelah dipindai, status Anda langsung tampil di halaman tiket.\n\nBila QR tidak terbaca, sebutkan kode yang tertera agar panitia memasukkannya secara manual.",
    "#16a34a",
  );
  await ensureArticle(
    "mengapa-k3-penting-demo",
    "Mengapa pelatihan K3 penting bagi perusahaan",
    "Keselamatan kerja bukan sekadar kewajiban, tetapi investasi bagi karyawan dan perusahaan.",
    "Pelatihan K3 membantu karyawan mengenali risiko sejak dini dan mengurangi kecelakaan kerja.\n\nPerusahaan juga lebih siap menghadapi audit dan memenuhi regulasi.",
    "#14532d",
  );

  console.log(`  Relawan    : ${relawanEmail} (password sama dengan panitia)`);
  console.log(`Seed selesai.\n  Superadmin : ${superadmin.email}\n  Panitia    : ${panitia.email} (ditugaskan ke "${k3.name}")\n  Peserta    : ${demo.email} (login di /login)`);
}

main().finally(() => db.$disconnect());
