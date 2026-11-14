"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { fmtTime } from "@/lib/format";
import { manualCheckin, scanQr, type ScanResult } from "@/src/lib/actions/admin";
import { CameraScanner } from "./CameraScanner";
import { ScannerRosterList, type RosterItem } from "./ScannerRosterList";

export type RecentScanItem = {
  id: string;
  registrationId: string;
  userName: string;
  userCode: string | null;
  userImage: string | null;
  userOrg: string | null;
  adminName: string;
  createdAt: string;
};

type Props = {
  eventId: string;
  checkpoint: { id: string; name: string; number: number };
  eventName: string;
  changeHref: string;
  initialRoster?: RosterItem[];
  initialRecent?: RecentScanItem[];
  initialServerTime?: string;
};

type LastScan = { token: string; at: number; busy: boolean };

function claim(last: LastScan, token: string) {
  const now = Date.now();
  if (last.busy) return false;
  // Jika token sama persis: jeda 1.5 detik untuk cegah re-scan peserta yang sama berkali-kali saat HP masih di depan kamera
  if (token === last.token && now - last.at < 1500) return false;
  // Jika peserta berbeda: jeda sangat singkat (200ms) agar kamera dapat langsung membaca peserta berikutnya seketika
  if (token !== last.token && now - last.at < 200) return false;
  Object.assign(last, { token, at: now, busy: true });
  return true;
}

function normalizeToken(raw: string): string {
  let t = raw.trim();
  if (!t) return "";
  try {
    if (t.includes("%")) t = decodeURIComponent(t);
  } catch {
    // Abaikan jika bukan format URI
  }
  if (t.startsWith("http://") || t.startsWith("https://")) {
    try {
      const url = new URL(t);
      const qToken = url.searchParams.get("token") || url.searchParams.get("t") || url.searchParams.get("code") || url.searchParams.get("q");
      if (qToken) return qToken.trim();
      const segments = url.pathname.split("/").filter(Boolean);
      if (segments.length > 0) return segments[segments.length - 1].trim();
    } catch {
      // Abaikan jika bukan URL valid
    }
  }
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    t = t.slice(1, -1).trim();
  }
  return t;
}

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!sharedAudioCtx || sharedAudioCtx.state === "closed") {
      sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx.state === "suspended") {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

export function playScanSound(tone: "success" | "warning" | "error") {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (tone === "success") {
      // Suara bip scanner kasir / pos Zebra autentik: 2400Hz nada tinggi tajam & punchy (80ms)
      osc.type = "sine";
      osc.frequency.setValueAtTime(2400, now);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (tone === "warning") {
      // Dua nada peringatan turun (sudah di-scan / double scan)
      osc.type = "triangle";
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.setValueAtTime(450, now + 0.08);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    } else {
      // Nada error dengung rendah (tidak terdaftar / invalid)
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(160, now + 0.12);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.28);
    }
  } catch (e) {
    console.warn("[playScanSound] audio error:", e);
  }
}

const TONE = {
  success: "border-green-600 bg-green-600 text-white",
  warning: "border-amber-500 bg-amber-400 text-gray-900",
  error: "border-red-700 bg-red-700 text-white",
};

export function Scanner({
  eventId,
  checkpoint,
  eventName,
  changeHref,
  initialRoster = [],
  initialRecent = [],
  initialServerTime,
}: Props) {
  const checkpointId = checkpoint.id;
  const [roster, setRoster] = useState<RosterItem[]>(initialRoster);
  const [recent, setRecent] = useState<RecentScanItem[]>(initialRecent);
  const [sessionCount, setSessionCount] = useState(0);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [flashColor, setFlashColor] = useState<"success" | "warning" | "error" | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const last = useRef<LastScan>({ token: "", at: 0, busy: false });
  const lastSyncTimeRef = useRef<string>(initialServerTime || new Date().toISOString());

  // Pastikan AudioContext aktif saat pengguna berinteraksi dengan layar
  useEffect(() => {
    const unlockAudio = () => {
      const ctx = getAudioContext();
      if (ctx && ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }
    };
    window.addEventListener("pointerdown", unlockAudio, { passive: true });
    window.addEventListener("touchstart", unlockAudio, { passive: true });
    window.addEventListener("click", unlockAudio, { passive: true });
    window.addEventListener("keydown", unlockAudio, { passive: true });
    unlockAudio();
    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("touchstart", unlockAudio);
      window.removeEventListener("click", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, []);

  // Indeks pencarian instan RAM (< 1ms)
  const rosterLookup = useMemo(() => {
    const map = new Map<string, RosterItem>();
    for (const item of roster) {
      if (item.code) {
        map.set(item.code, item);
        map.set(item.code.toLowerCase(), item);
        map.set(item.code.toUpperCase(), item);
      }
      map.set(item.id, item);
      for (const t of item.tokens) {
        if (t) {
          map.set(t, item);
          map.set(t.toLowerCase(), item);
          map.set(t.toUpperCase(), item);
        }
      }
    }
    return map;
  }, [roster]);

  // Background Delta Polling (Sinkronisasi antar-petugas setiap ~600ms)
  useEffect(() => {
    let active = true;
    let timer: NodeJS.Timeout | null = null;

    async function poll() {
      if (!active || document.hidden) {
        timer = setTimeout(poll, 700);
        return;
      }
      try {
        setIsSyncing(true);
        const url = `/api/admin/events/${encodeURIComponent(eventId)}/scan/${encodeURIComponent(checkpointId)}/sync?since=${encodeURIComponent(lastSyncTimeRef.current)}`;
        const res = await fetch(url);
        if (res.ok) {
          const data = (await res.json()) as { serverTime: string; scans: RecentScanItem[] };
          if (active && data.serverTime) {
            lastSyncTimeRef.current = data.serverTime;
            if (data.scans && data.scans.length > 0) {
              const newScanMap = new Map(data.scans.map((s) => [s.registrationId, s]));
              setRoster((prev) =>
                prev.map((item) => {
                  const s = newScanMap.get(item.id);
                  if (s && !item.scanned) {
                    return { ...item, scanned: true, scannedAt: s.createdAt, scannedBy: s.adminName };
                  }
                  return item;
                })
              );
              setRecent((prev) => {
                const existingIds = new Set(prev.map((p) => p.id));
                const fresh = data.scans.filter((s) => !existingIds.has(s.id));
                return [...fresh, ...prev].slice(0, 20);
              });
            }
          }
        }
      } catch {
        // Abaikan gangguan koneksi sementara
      } finally {
        if (active) {
          setIsSyncing(false);
          timer = setTimeout(poll, 600);
        }
      }
    }

    timer = setTimeout(poll, 600);
    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [eventId, checkpointId]);

  // Eksekusi Scan Super Cepat: Validasi Lokal (< 0.01 detik) + Sync Asinkron
  async function submit(rawToken: string) {
    if (!rawToken || !checkpointId) return;
    const token = normalizeToken(rawToken);
    if (!token || !claim(last.current, token)) return;

    try {
      // 1. FAST LOCAL LOOKUP DALAM RAM (< 1ms)
      const localMatch = rosterLookup.get(token) || rosterLookup.get(token.toLowerCase());

      if (localMatch) {
        if (localMatch.scanned) {
          // Umpan balik langsung: sudah pernah scan
          playScanSound("warning");
          setFlashColor("warning");
          setTimeout(() => setFlashColor(null), 800);
          navigator.vibrate?.([60, 40, 60]);
          setResult({
            tone: "warning",
            title: localMatch.code ? `${localMatch.code} · ${localMatch.name}` : localMatch.name,
            detail: `Sudah di-scan pada ${localMatch.scannedAt ? fmtTime(new Date(localMatch.scannedAt)) : "hari ini"} oleh ${localMatch.scannedBy || "Panitia"}`,
            photo: localMatch.image,
          });
          return;
        }

        // Umpan balik instan sukses (< 5ms)
        playScanSound("success");
        setFlashColor("success");
        setTimeout(() => setFlashColor(null), 800);
        navigator.vibrate?.(70);
        setSessionCount((n) => n + 1);

        const title = localMatch.code ? `${localMatch.code} · ${localMatch.name}` : localMatch.name;
        const detail = localMatch.organization || localMatch.email || "Peserta Terdaftar";

        setResult({
          tone: "success",
          title,
          detail,
          photo: localMatch.image,
          progress: "Tercatat",
        });

        // Update instan state lokal
        const nowIso = new Date().toISOString();
        setRoster((prev) =>
          prev.map((p) =>
            p.id === localMatch.id ? { ...p, scanned: true, scannedAt: nowIso, scannedBy: "Anda" } : p
          )
        );
        setRecent((prev) => [
          {
            id: "local-" + Date.now(),
            registrationId: localMatch.id,
            userName: localMatch.name,
            userCode: localMatch.code,
            userImage: localMatch.image,
            userOrg: localMatch.organization,
            adminName: "Anda",
            createdAt: nowIso,
          },
          ...prev.slice(0, 19),
        ]);

        // Kirim mutasi scan ke database di latar belakang
        scanQr(checkpointId, token).catch((err) => {
          console.error("[Scanner] Background scanQr error:", err);
        });
        return;
      }

      // 2. FALLBACK DATABASE JIKA TIDAK ADA DI DAFTAR PRELOAD (mis. tiket telat atau peserta beda pos)
      const res = await scanQr(checkpointId, token);
      setResult(res);
      setFlashColor(res.tone);
      setTimeout(() => setFlashColor(null), 800);
      playScanSound(res.tone);
      navigator.vibrate?.(res.tone === "success" ? 70 : res.tone === "warning" ? [60, 40, 60] : [100, 50, 100]);
      if (res.tone === "success") {
        setSessionCount((n) => n + 1);
        setRecent((prev) => [
          {
            id: "fallback-" + Date.now(),
            registrationId: token,
            userName: res.title,
            userCode: null,
            userImage: res.photo ?? null,
            userOrg: res.detail ?? null,
            adminName: "Anda",
            createdAt: new Date().toISOString(),
          },
          ...prev.slice(0, 19),
        ]);
      }
    } catch {
      playScanSound("error");
      setFlashColor("error");
      setTimeout(() => setFlashColor(null), 800);
      setResult({ tone: "error", title: "Gagal terhubung ke server", detail: "Periksa koneksi lalu scan ulang." });
    } finally {
      // KRUSIAL: busy HARUS selalu dilepas agar scanner langsung siap membaca user berikutnya seketika!
      last.current.busy = false;
    }
  }

  // Handler Check-in Manual dari Daftar Peserta
  async function handleManualCheckin(item: RosterItem) {
    const nowIso = new Date().toISOString();
    setRoster((prev) =>
      prev.map((p) => (p.id === item.id ? { ...p, scanned: true, scannedAt: nowIso, scannedBy: "Anda" } : p))
    );
    setRecent((prev) => [
      {
        id: "manual-" + Date.now(),
        registrationId: item.id,
        userName: item.name,
        userCode: item.code,
        userImage: item.image,
        userOrg: item.organization,
        adminName: "Anda",
        createdAt: nowIso,
      },
      ...prev.slice(0, 19),
    ]);
    setSessionCount((n) => n + 1);
    playScanSound("success");
    setResult({
      tone: "success",
      title: item.code ? `${item.code} · ${item.name}` : item.name,
      detail: "Check-in manual berhasil",
      photo: item.image,
      progress: "Tercatat",
    });
    await manualCheckin(item.id, checkpointId);
  }

  return (
    <div className="space-y-6">
      {/* Baris Atas: Informasi Pos & Kamera & Kotak Hasil */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Kolom Kiri: Kamera Scanner & Input */}
        <div className="space-y-4">
          <div className="card flex flex-wrap items-center justify-between gap-3 border-brand/30 bg-green-50/60 p-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold tracking-wide text-brand uppercase">Sedang memindai</p>
                <span className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 text-[10px] font-medium text-emerald-800 border border-emerald-200">
                  <span className={`h-1.5 w-1.5 rounded-full bg-emerald-500 ${isSyncing ? "animate-ping" : "animate-pulse"}`} />
                  Sync Aktif
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const ctx = getAudioContext();
                    ctx?.resume().catch(() => {});
                    playScanSound("success");
                  }}
                  className="inline-flex items-center gap-1 rounded bg-white px-2 py-0.5 text-[10px] font-medium text-emerald-800 border border-emerald-200 hover:bg-emerald-50 transition cursor-pointer"
                  title="Klik untuk tes suara bip scanner"
                >
                  <span>🔊 Bip Siap</span>
                </button>
              </div>
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
              last.current.token = "";
              submit(input.value.trim());
              input.value = "";
            }}
          >
            <input
              name="token"
              className="input text-sm"
              placeholder="Scan barcode atau ketik kode peserta (mis: PST-001)"
              autoComplete="off"
            />
            <button className="btn btn-primary text-sm">Proses</button>
          </form>
        </div>

        {/* Kolom Kanan: Hasil Verifikasi & Riwayat Live Terbaru */}
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
                    {result.progress && ` · ${result.progress}`}
                  </p>
                  <p className="mt-1 text-2xl font-bold break-words">{result.title}</p>
                  {result.detail && <p className="mt-1">{result.detail}</p>}
                  {result.tone === "success" && <p className="mt-2 text-xs opacity-80">Cocokkan foto dengan wajah peserta.</p>}
                </div>
              </div>
            ) : (
              <p>Arahkan kamera ke QR peserta. Scanner merespon instan dalam 0,1 detik.</p>
            )}
          </div>

          {/* Riwayat Live Seluruh Petugas di Pos Ini */}
          <div className="card">
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
              <h2 className="text-sm font-semibold text-gray-900">Riwayat Terkini di Pos Ini (Semua Petugas)</h2>
              <span className="text-[11px] text-gray-500">{recent.length} scan terakhir</span>
            </div>
            <ul className="divide-y divide-gray-100 text-sm max-h-56 overflow-y-auto">
              {recent.length === 0 && <li className="px-4 py-3 text-gray-500 text-xs">Belum ada scan di pos ini.</li>}
              {recent.map((h) => (
                <li key={h.id} className="flex items-center justify-between gap-3 px-4 py-2 hover:bg-gray-50">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <UserAvatar name={h.userName} image={h.userImage} size={28} />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-900 truncate">
                        {h.userCode ? `${h.userCode} · ` : ""}{h.userName}
                      </p>
                      <p className="text-[10px] text-gray-500 truncate">{h.adminName}</p>
                    </div>
                  </div>
                  <span className="text-[11px] whitespace-nowrap text-gray-600 font-mono">
                    {fmtTime(new Date(h.createdAt))}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Baris Bawah: Daftar Lengkap Peserta Sudah Scan dan Belum Scan */}
      <ScannerRosterList
        roster={roster}
        onManualCheckin={handleManualCheckin}
        isSyncing={isSyncing}
      />
    </div>
  );
}
