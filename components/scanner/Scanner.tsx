"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { scanQr, type ScanResult } from "@/lib/scan";
import { CameraScanner } from "./CameraScanner";

type Props = {
  checkpoint: { id: string; name: string; number: number };
  eventName: string;
  changeHref: string; // kembali ke pilihan rundown
};

type LastScan = { token: string; at: number; busy: boolean };

// Kamera membaca QR yang sama berkali-kali; abaikan token yang sama selama 3 detik.
function claim(last: LastScan, token: string) {
  const now = Date.now();
  if (last.busy || (token === last.token && now - last.at < 3000)) return false;
  Object.assign(last, { token, at: now, busy: true });
  return true;
}

const TONE = {
  success: "border-green-600 bg-green-600 text-white",
  warning: "border-amber-500 bg-amber-400 text-gray-900",
  error: "border-red-700 bg-red-700 text-white",
};

// Langkah 3 scan: layar terkunci ke satu item rundown. Kamera dibuka sekali dan terus memindai ke item ini saja.
export function Scanner({ checkpoint, eventName, changeHref }: Props) {
  const checkpointId = checkpoint.id;
  const [sessionCount, setSessionCount] = useState(0);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<(ScanResult & { at: string; checkpoint: string })[]>([]);
  const last = useRef<LastScan>({ token: "", at: 0, busy: false });

  async function submit(token: string) {
    if (!token || !checkpointId || !claim(last.current, token)) return;
    try {
      const res = await scanQr(checkpointId, token);
      setResult(res);
      navigator.vibrate?.(res.tone === "success" ? 80 : [80, 60, 80]);
      if (res.tone === "success") setSessionCount((n) => n + 1);
      setHistory((h) => [{ ...res, checkpoint: checkpoint.name, at: new Date().toLocaleTimeString("id-ID") }, ...h].slice(0, 10));
    } catch {
      setResult({ tone: "error", title: "Gagal terhubung ke server", detail: "Periksa koneksi lalu scan ulang." });
    } finally {
      last.current.busy = false;
    }
  }

  return (
    <div className="mt-4 grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div className="card flex flex-wrap items-center justify-between gap-3 border-brand/30 bg-green-50/60 p-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold tracking-wide text-brand uppercase">Sedang memindai</p>
            <p className="mt-0.5 text-lg font-bold text-gray-900">
              {checkpoint.number}. {checkpoint.name}
            </p>
            <p className="text-sm text-gray-600">{eventName} · {sessionCount} berhasil di sesi ini</p>
          </div>
          <Link href={changeHref} className="btn btn-secondary btn-sm">Ganti rundown</Link>
        </div>

        <CameraScanner onDecode={submit} />

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const input = e.currentTarget.elements.namedItem("token") as HTMLInputElement;
            last.current.token = ""; // input manual selalu diproses
            submit(input.value.trim());
            input.value = "";
          }}
        >
          {/* Juga menerima scanner barcode USB/Bluetooth yang mengetik lalu menekan Enter. */}
          <input name="token" className="input" placeholder="Input kode QR manual" autoComplete="off" autoFocus />
          <button className="btn btn-primary">Proses</button>
        </form>
      </div>

      <div className="space-y-4">
        <div className={`rounded-md border-2 p-6 ${result ? TONE[result.tone] : "border-dashed border-gray-300 bg-white text-gray-500"}`}>
          {result ? (
            <div className="flex items-center gap-4">
              {result.photo !== undefined && (
                result.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={result.photo} alt="Foto peserta" referrerPolicy="no-referrer" className="h-24 w-24 shrink-0 rounded-md border-2 border-white object-cover shadow" />
                ) : (
                  <span className="flex h-24 w-24 shrink-0 items-center justify-center rounded-md border-2 border-dashed border-current text-center text-xs opacity-70">
                    Belum ada foto
                  </span>
                )
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium uppercase opacity-80">
                  {result.tone === "success" ? "Berhasil" : result.tone === "warning" ? "Sudah pernah" : "Ditolak"}
                  {result.progress && ` · ${result.progress} checkpoint`}
                </p>
                <p className="mt-1 text-2xl font-bold break-words">{result.title}</p>
                {result.detail && <p className="mt-1">{result.detail}</p>}
                {result.tone === "success" && <p className="mt-2 text-xs opacity-80">Cocokkan foto dengan wajah peserta.</p>}
              </div>
            </div>
          ) : (
            <p>Arahkan kamera ke QR peserta.</p>
          )}
        </div>

        <div className="card">
          <h2 className="border-b border-gray-200 px-4 py-3 text-sm font-semibold text-gray-900">Riwayat di perangkat ini</h2>
          <ul className="divide-y divide-gray-100 text-sm">
            {history.length === 0 && <li className="px-4 py-3 text-gray-500">Belum ada scan.</li>}
            {history.map((h, i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      h.tone === "success" ? "bg-green-600" : h.tone === "warning" ? "bg-amber-500" : "bg-red-700"
                    }`}
                  />
                  <span className="text-gray-900">{h.title}</span>
                </span>
                <span className="text-xs whitespace-nowrap text-gray-500">{h.checkpoint} · {h.at}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
