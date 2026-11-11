// Foto profil peserta, atau inisial nama bila belum ada foto. Dipakai di daftar dan detail peserta.
export function UserAvatar({ name, image, size = 32 }: { name: string; image: string | null; size?: number }) {
  const style = { width: size, height: size };
  return image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={image} alt={`Foto ${name}`} style={style} referrerPolicy="no-referrer" loading="lazy" className="shrink-0 rounded-full border border-gray-200 object-cover" />
  ) : (
    <span
      style={{ ...style, fontSize: Math.round(size * 0.4) }}
      className="flex shrink-0 items-center justify-center rounded-full bg-brand font-semibold text-white"
      title="Belum ada foto"
    >
      {name.charAt(0).toUpperCase()}
    </span>
  );
}
