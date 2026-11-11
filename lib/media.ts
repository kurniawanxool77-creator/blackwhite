import sharp from "sharp";

// Gambar unggahan disimpan di database dan dilayani lewat /media/[id]. Hanya JPEG, PNG, WebP (tanpa SVG agar tidak bisa membawa skrip).
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

const MAX_WIDTH = 1680;
const MAX_PIXELS = 40_000_000; // tolak "gambar bom" yang kecil di file tapi raksasa saat dibuka
const WEBP_QUALITY = 82;

// Semua gambar disimpan sebagai WebP: diputar sesuai EXIF, dikecilkan, dan metadata (termasuk lokasi GPS) dibuang.
export async function toWebp(input: Uint8Array): Promise<Buffer> {
  return sharp(input, { limitInputPixels: MAX_PIXELS })
    .rotate()
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
}

export function sniffImageType(b: Uint8Array): "image/jpeg" | "image/png" | "image/webp" | null {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length > 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((v, i) => b[i] === v)) return "image/png";
  const tag = (from: number) => String.fromCharCode(...b.slice(from, from + 4));
  if (b.length > 12 && tag(0) === "RIFF" && tag(8) === "WEBP") return "image/webp";
  return null;
}

// Foto profil: dipotong persegi 400×400 dari tengah, WebP, metadata dibuang.
export async function toAvatarWebp(input: Uint8Array): Promise<Buffer> {
  return sharp(input, { limitInputPixels: MAX_PIXELS })
    .rotate()
    .resize(400, 400, { fit: "cover", position: "attention" })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
}

// Foto selfie absensi: lebar maks. 720 px, WebP, metadata (termasuk lokasi) dibuang.
export async function toSelfieWebp(input: Uint8Array): Promise<Buffer> {
  return sharp(input, { limitInputPixels: MAX_PIXELS })
    .rotate()
    .resize({ width: 720, height: 720, fit: "inside", withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
}
