// Halaman masuk/daftar: dibelah dua jika ada foto, atau formulir terpusat jika belum ada foto.
export function AuthSplit({ image, caption, children }: { image: string; caption: string; children: React.ReactNode }) {
  return (
    <div className={`grid min-h-[calc(100vh-4rem)] ${image ? "lg:grid-cols-2" : ""}`}>
      <div className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="animate-rise w-full max-w-md">{children}</div>
      </div>
      {image && (
        <div className="relative hidden overflow-hidden bg-brand lg:block">
          <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
          {caption && (
            <p className="absolute inset-x-0 bottom-0 bg-gray-900/70 px-8 py-6 text-lg font-semibold text-white">{caption}</p>
          )}
        </div>
      )}
    </div>
  );
}
