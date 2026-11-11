// QR pribadi peserta: satu kode untuk semua pelatihan. Panitia memilih pelatihan dan pos saat memindai.
export function MyQrCard({ qr, name, photo }: { qr: string; name: string; photo: string | null }) {
  return (
    <section className="card flex flex-col items-center gap-4 p-5 sm:flex-row sm:items-start">
      <img src={qr} alt="QR pribadi Anda" className="w-44 shrink-0 rounded-md border border-gray-200 p-2" />
      <div className="min-w-0 text-center sm:text-left">
        <h2 className="font-semibold text-gray-900">QR saya</h2>
        <p className="mt-1 text-sm text-gray-600">Tunjukkan ke panitia di setiap pos.</p>
        <div className="mt-3 flex items-center justify-center gap-2 sm:justify-start">
          {photo ? (
            <img src={photo} alt="" referrerPolicy="no-referrer" className="h-8 w-8 rounded-full object-cover" />
          ) : null}
          <span className="text-sm font-medium text-gray-900">{name}</span>
        </div>
        {!photo && (
          <p className="mt-2 text-xs text-amber-700">
            Belum ada foto. <a href="/akun" className="underline">Tambah foto</a>
          </p>
        )}
        <a href={qr} download="qr-saya.png" className="btn btn-secondary btn-sm mt-3">Unduh QR</a>
      </div>
    </section>
  );
}
