export type SysReq = { cpu?: string; gpu?: string; ram?: string };

export type Comment = {
  id: string;
  gameId: string;
  author: string;
  text: string;
  createdAt: number;
};

export type Game = {
  id: string;
  name: string;
  description: string;
  story?: string;
  filename: string;
  originalFilename: string;
  fileSize: number;
  cover?: string | null;
  screenshots: string[];
  systemMin?: SysReq;
  systemRec?: SysReq;
  downloadCount: number;
  viewCount: number;
  createdAt: number;
  comments?: Comment[];
};

const BASE = `${import.meta.env.BASE_URL}api`
  .replace(/\/+/g, "/")
  .replace(/\/$/, "");

function apiUrl(path: string) {
  const cleanBase = BASE.startsWith("/") ? BASE : `/${BASE}`;
  return `${cleanBase}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function listGames(): Promise<Game[]> {
  const res = await fetch(apiUrl("/games"));
  if (!res.ok) return [];
  const data = await res.json().catch(() => ({ games: [] }));
  return Array.isArray(data.games) ? (data.games as Game[]) : [];
}

export async function getGame(id: string): Promise<Game> {
  const res = await fetch(apiUrl(`/games/${id}`));
  if (!res.ok) throw new Error("اللعبة غير موجودة");
  return (await res.json()) as Game;
}

export async function uploadGame(form: FormData): Promise<Game> {
  const res = await fetch(apiUrl("/games"), {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    let msg = "فشل رفع اللعبة";
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return (await res.json()) as Game;
}

export async function updateGame(id: string, payload: Partial<Pick<Game, "filename" | "originalFilename" | "fileSize">>): Promise<Game> {
  const res = await fetch(apiUrl(`/games/${id}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    let msg = "فشل تحديث اللعبة";
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return (await res.json()) as Game;
}

export async function deleteGame(id: string): Promise<void> {
  const res = await fetch(apiUrl(`/games/${id}`), { method: "DELETE" });
  if (!res.ok) throw new Error("فشل حذف اللعبة");
}

export async function trackView(id: string): Promise<void> {
  try {
    await fetch(apiUrl(`/games/${id}/view`), { method: "POST" });
  } catch {
    /* ignore */
  }
}

export function gameDownloadUrl(id: string) {
  return apiUrl(`/games/${id}/download`);
}

export async function downloadGameFile(id: string) {
  const a = document.createElement("a");
  a.href = gameDownloadUrl(id);
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function gameCoverUrl(id: string) {
  return apiUrl(`/games/${id}/cover`);
}

export function gameScreenshotUrl(id: string, idx: number) {
  return apiUrl(`/games/${id}/screenshots/${idx}`);
}

export function formatBytes(b: number): string {
  if (!b || b <= 0) return "—";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function formatNumber(n: number): string {
  if (!n) return "0";
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}K`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}
