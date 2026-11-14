"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { scanQr, type ScanResult } from "@/src/lib/actions/admin";
import { CameraScanner } from "./CameraScanner";

type Props = {
  checkpoint: { id: string; name: string; number: number };
  eventName: string;
  changeHref: string; // kembali ke pilihan rundown
};

type LastScan = { token: string; at: number; busy: boolean };

// Cegah scan ganda dalam 1.5 detik jika sukses
function claim(last: LastScan, token: string) {
  const now = Date.now();
  if (last.busy || (token === last.token && now - last.at < 1500)) return false;
  Object.assign(last, { token, at: now, busy: true });
  return true;
}

// Suara umpan balik scanner instan berbasis Web Audio API (tanpa delay file audio)
function playScanSound(tone: "success" | "warning" | "error") {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (tone === "success") {
      // Nada lonceng sukses ganda (880Hz -> 1320Hz)
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1320, now + 0.07);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (tone === "warning") {
      // Nada peringatan kuning (660Hz -> 440Hz)
      osc.type = "triangle";
      osc.frequency.setValueAtTime(660, now);
      osc.frequency.setValueAtTime(440, now + 0.08);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.28);
    } else {
      // Nada error penolakan (320Hz -> 220Hz)
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.setValueAtTime(220, now + 0.1);
      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
      osc.start(now);
      osc.stop(now + 0.32);
    }
    setTimeout(() => ctx.close().catch(() => {}), 450);
  } catch {
    // AudioContext tidak didukung / diblokir kebijakan browser
  }
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
  const [flashColor, setFlashColor] = useState<"success" | "warning" | "error" | null>(null);
  const [history, setHistory] = useState<(ScanResult & { at: string; checkpoint: string })[]>([]);
  const last = useRef<LastScan>({ token: "", at: 0, busy: false });

  async function submit(token: string) {
    if (!token || !checkpointId || !claim(last.current, token)) return;
    try {
      const res = await scanQr(checkpointId, token);
      setResult(res);
      setFlashColor(res.tone);
      setTimeout(() => setFlashColor(null), 800);
      playScanSound(res.tone);
      navigator.vibrate?.(res.tone === "success" ? 70 : res.tone === "warning" ? [60, 40, 60] : [100, 50, 100]);
      if (res.tone === "success") {
        setSessionCount((n) => n + 1);
      } else {
        // Pada warning atau ditolak, reset token agar operator bisa langsung scan ulang tanpa menunggu
        last.current.token = "";
      }
      setHistory((h) => [{ ...res, checkpoint: checkpoint.name, at: new Date().toLocaleTimeString("id-ID") }, ...h].slice(0, 10));
    } catch {
      playScanSound("error");
      last.current.token = "";
      setFlashColor("error");
      setTimeout(() => setFlashColor(null), 800);
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

        <div className={`relative rounded-md transition-all duration-200 ${
          flashColor === "success"
            ? "ring-4 ring-green-500"
            : flashColor === "warning"
            ? "ring-4 ring-amber-400"
            : flashColor === "error"
            ? "ring-4 ring-red-500"
            : ""
        }`}>
          <CameraScanner onDecode={submit} />
        </div>

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
          {/* Juga menerima scanner barcode USB/Bluetooth yang mengetik lalu menekan Enter, atau kode peserta PST-001 */}
          <input name="token" className="input" placeholder="Scan barcode atau ketik kode peserta (mis: PST-001)" autoComplete="off" autoFocus />
          <button className="btn btn-primary">Proses</button>
        </form>
      </div>

      <div className="space-y-4">
        <div className={`rounded-md border-2 p-6 transition-all duration-150 ${result ? TONE[result.tone] : "border-dashed border-gray-300 bg-white text-gray-500"}`}>
          {result ? (
            <div className="flex items-center gap-4">
              {result.photo !== undefined && (
                result.photo ? (
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
