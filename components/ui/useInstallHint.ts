import { useState, useSyncExternalStore } from "react";

const noSubscribe = () => () => {};

function canHint(key: string) {
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  try {
    return !standalone && !sessionStorage.getItem(key);
  } catch {
    return !standalone;
  }
}

// Petunjuk "pasang aplikasi": tampil bila belum berjalan sebagai PWA dan belum ditutup di sesi ini.
export function useInstallHint(key: string) {
  const eligible = useSyncExternalStore(noSubscribe, () => canHint(key), () => false);
  const [dismissed, setDismissed] = useState(false);

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(key, "true");
    } catch {}
  };

  return { show: eligible && !dismissed, dismiss };
}
