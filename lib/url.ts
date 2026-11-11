// Path internal saja. Tolak "//host" dan "/\host" yang oleh browser dianggap alamat situs lain.
const isInternalPath = (v: string) => /^\/(?![/\\])/.test(v);
const isHttpUrl = (v: string) => /^https?:\/\/\S+$/i.test(v);

// Gambar: hasil unggahan ("/media/<id>") atau http(s). Selain itu (javascript:, data:) ditolak.
export const isImageUrl = (v: string) => /^\/media\/[a-z0-9]+$/i.test(v) || isHttpUrl(v);

// Tautan banner: path internal ("/event/...") atau http(s).
export const isLinkUrl = (v: string) => isInternalPath(v) || isHttpUrl(v);

// Tujuan setelah login atau daftar.
export const safeCallback = (v: string | string[] | undefined, fallback = "/dashboard") =>
  typeof v === "string" && isInternalPath(v) ? v : fallback;
