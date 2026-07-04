import { useEffect, useState, type FormEvent } from "react";
import { Link } from "wouter";
import {
  ArrowRight,
  Trash2,
  Upload,
  Gamepad2,
  FileBox,
  ImageIcon,
  Cpu,
  MonitorPlay,
  MemoryStick,
  Download,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  Wrench,
} from "lucide-react";
import {
  deleteGame,
  formatBytes,
  gameCoverUrl,
  listGames,
  updateGame,
  type Game,
} from "@/lib/api";
import config from "@/config";

const logoUrl = "/logo.png";

const SESSION_KEY = "gameblaze_admin_auth";

function LoginScreen({ onAuth }: { onAuth: () => void }) {
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const base = `${import.meta.env.BASE_URL}api/admin/auth`.replace(/\/+/g, "/");
      const res = await fetch(base, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw }),
      });
      if (res.ok) {
        const storage = remember ? localStorage : sessionStorage;
        storage.setItem(SESSION_KEY, "1");
        onAuth();
      } else {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? "كلمة السر غير صحيحة");
      }
    } catch {
      setError("خطأ في الاتصال، حاول مرة أخرى");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center">
      <div className="bg-cosmos" />
      <div className="bg-grid" />
      <div className="relative w-full max-w-sm mx-auto px-4">
        <div className="neon-border rounded-3xl p-8 text-center">
          <div className="size-16 rounded-2xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 grid place-items-center mx-auto mb-5 ring-1 ring-white/10">
            <Lock className="size-8 text-fuchsia-300" />
          </div>
          <img src={logoUrl} alt={config.siteName} className="size-16 rounded-full object-cover mx-auto mb-3 ring-2 ring-white/20" />
          <h1 className="text-2xl font-extrabold text-shimmer mb-1">لوحة الإدارة</h1>
          <p className="text-white/50 text-sm mb-8">{config.siteName}</p>

          <form onSubmit={handleLogin} className="space-y-4 text-right">
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="كلمة السر"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-fuchsia-500/50 transition pr-4 pl-10"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition"
              >
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>

            <label className="flex items-center gap-2 text-sm text-white/70">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="accent-fuchsia-400"
              />
              تذكرني في هذا المتصفح
            </label>

            {error && (
              <p className="text-red-400 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !pw}
              className="w-full btn-primary py-3 rounded-xl font-bold text-white disabled:opacity-50 transition"
            >
              {loading ? "جاري التحقق..." : "دخول"}
            </button>
          </form>

          <Link href="/" className="mt-6 inline-block text-xs text-white/30 hover:text-white/60 transition">
            ← العودة للموقع
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const [authed, setAuthed] = useState(() => localStorage.getItem(SESSION_KEY) === "1" || sessionStorage.getItem(SESSION_KEY) === "1");
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [story, setStory] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [minCpu, setMinCpu] = useState("");
  const [minGpu, setMinGpu] = useState("");
  const [minRam, setMinRam] = useState("");
  const [recCpu, setRecCpu] = useState("");
  const [recGpu, setRecGpu] = useState("");
  const [recRam, setRecRam] = useState("");
  const [progress, setProgress] = useState<number | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [repairingId, setRepairingId] = useState<string | null>(null);

  async function refresh() {
    try {
      const g = await listGames();
      setGames(g);
    } catch {
      setGames([]);
      setMessage({ type: "error", text: "تعذّر تحميل الألعاب" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!localStorage.getItem(SESSION_KEY) && !sessionStorage.getItem(SESSION_KEY)) {
      setAuthed(false);
    }
  }, []);

  function resetForm() {
    setName("");
    setDescription("");
    setStory("");
    setFile(null);
    setCover(null);
    setScreenshots([]);
    setMinCpu("");
    setMinGpu("");
    setMinRam("");
    setRecCpu("");
    setRecGpu("");
    setRecRam("");
    ["game-file", "cover-file", "screenshots-file"].forEach((id) => {
      const el = document.getElementById(id) as HTMLInputElement | null;
      if (el) el.value = "";
    });
  }

  async function uploadFileChunked(
    gameFile: File,
    onProgress: (pct: number) => void,
  ): Promise<{ fileId: string; ext: string; fileSize: number; gcsPath: string }> {
    const CHUNK_SIZE = 10 * 1024 * 1024; // use 10MB chunks for more stable uploads
    const totalChunks = Math.ceil(gameFile.size / CHUNK_SIZE);
    const sessionId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const base = new URL("/api/games/chunk", window.location.origin).toString();

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const chunk = gameFile.slice(start, Math.min(start + CHUNK_SIZE, gameFile.size));
      const fd = new FormData();
      fd.append("sessionId", sessionId);
      fd.append("chunkIndex", String(i));
      fd.append("totalChunks", String(totalChunks));
      fd.append("originalName", gameFile.name);
      fd.append("chunk", chunk, "chunk");
      const res = await fetch(base, { method: "POST", body: fd });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `فشل الجزء ${i + 1}`);
      }
      const data = (await res.json()) as {
        assembled: boolean;
        fileId?: string;
        ext?: string;
        fileSize?: number;
        gcsPath?: string;
      };
      onProgress(Math.round(((i + 1) / totalChunks) * 85));
      if (data.assembled && data.fileId != null && data.gcsPath) {
        return {
          fileId: data.fileId,
          ext: data.ext ?? "",
          fileSize: data.fileSize ?? 0,
          gcsPath: data.gcsPath,
        };
      }
    }
    throw new Error("لم يكتمل تجميع الملف");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!file) {
      setMessage({ type: "error", text: "الرجاء اختيار ملف اللعبة" });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    setProgress(0);
    try {
      const { fileId, ext, fileSize, gcsPath } = await uploadFileChunked(file, setProgress);
      setProgress(90);
      const fd = new FormData();
      fd.append("name", name);
      fd.append("description", description);
      fd.append("story", story);
      fd.append("fileId", fileId);
      fd.append("fileExt", ext);
      fd.append("fileOriginalName", file.name);
      fd.append("fileSize", String(fileSize));
      fd.append("gcsPath", gcsPath);
      if (cover) fd.append("cover", cover);
      screenshots.forEach((s) => fd.append("screenshots", s));
      fd.append("minCpu", minCpu);
      fd.append("minGpu", minGpu);
      fd.append("minRam", minRam);
      fd.append("recCpu", recCpu);
      fd.append("recGpu", recGpu);
      fd.append("recRam", recRam);
      const base = `${import.meta.env.BASE_URL}api/games`.replace(/\/+/g, "/");
      const res = await fetch(base, { method: "POST", body: fd });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? "فشل حفظ اللعبة");
      }
      setProgress(100);
      setMessage({ type: "success", text: "تمت إضافة اللعبة بنجاح ✓" });
      resetForm();
      await refresh();
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "فشل رفع اللعبة" });
    } finally {
      setSubmitting(false);
      setProgress(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("هل أنت متأكد من حذف هذه اللعبة؟")) return;
    try {
      await deleteGame(id);
      setGames((prev) => prev.filter((g) => g.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "فشل الحذف");
    }
  }

  async function handleRepair(game: Game) {
    setRepairingId(game.id);
    setMessage(null);
    try {
      const updated = await updateGame(game.id, {
        filename: game.filename,
        originalFilename: game.originalFilename,
        fileSize: game.fileSize,
      });
      setGames((prev) => prev.map((g) => (g.id === game.id ? updated : g)));
      setMessage({ type: "success", text: `تم إصلاح ${game.name}` });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "فشل الإصلاح" });
    } finally {
      setRepairingId(null);
    }
  }

  if (!authed) {
    return <LoginScreen onAuth={() => setAuthed(true)} />;
  }

  return (
    <div className="min-h-screen relative">
      <div className="bg-cosmos" />
      <div className="bg-grid" />

      <header className="glass-strong sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 group min-w-0">
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 blur-md opacity-60 group-hover:opacity-100 transition" />
              <img src={logoUrl} alt={config.siteName} className="relative size-14 rounded-full object-cover ring-2 ring-white/20" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-extrabold text-shimmer">لوحة الإدارة</h1>
              <p className="text-[11px] text-white/50">{config.siteName} · إضافة وإدارة الألعاب</p>
            </div>
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl glass hover:bg-white/10 transition text-sm font-bold">
            <span>الرئيسية</span>
            <ArrowRight className="size-4 rotate-180" />
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid lg:grid-cols-5 gap-8 relative">
        <section className="lg:col-span-3">
          <div className="neon-border rounded-2xl p-5 sm:p-6 relative overflow-hidden">
            <div className="orb size-48 bg-violet-500/30 -top-10 -right-10" />
            <div className="relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="size-11 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 grid place-items-center shadow-lg shadow-violet-500/40">
                  <Upload className="size-5 text-white" />
                </div>
                <div>
                  <h2 className="font-extrabold text-lg">رفع لعبة جديدة</h2>
                  <p className="text-xs text-white/50">أضف لعبة قابلة للتنزيل مع تفاصيلها</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <fieldset className="space-y-4">
                  <Legend icon={<Sparkles className="size-3.5" />}>معلومات اللعبة</Legend>
                  <Field label="اسم اللعبة" required>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="مثال: لعبة المحاكاة DrainSim" className="input" />
                  </Field>
                  <Field label="وصف قصير" hint="(يظهر تحت الاسم في كرت اللعبة)">
                    <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="مثال: لعبة محاكاة إدارة وتصميم أنظمة تصريف المياه" className="input" />
                  </Field>
                  <Field label="حكاية اللعبة" hint="(نص طويل يظهر في صفحة التنزيل)">
                    <textarea value={story} onChange={(e) => setStory(e.target.value)} rows={5} placeholder="اكتب قصة اللعبة، طريقة اللعب، المميزات..." className="input resize-none" />
                  </Field>
                </fieldset>

                <fieldset className="space-y-4">
                  <Legend icon={<FileBox className="size-3.5" />}>الملفات</Legend>
                  <Field label="ملف اللعبة" required hint="(أي صيغة — حتى 5 جيجابايت)">
                    <label htmlFor="game-file" className="flex flex-col items-center justify-center gap-2 w-full px-3.5 py-6 rounded-lg bg-white/5 border-2 border-dashed border-white/15 hover:border-violet-400/50 hover:bg-white/8 cursor-pointer transition">
                      <FileBox className="size-7 text-violet-300" />
                      <span className="text-sm text-white/80 text-center break-all px-2">{file ? `${file.name} (${formatBytes(file.size)})` : "اضغط لاختيار ملف اللعبة (ZIP, EXE, HTML, ...)"}</span>
                    </label>
                    <input id="game-file" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="hidden" />
                  </Field>
                  <Field label="صورة الغلاف" hint="(عمودية 3:4 يفضّل)">
                    <label htmlFor="cover-file" className="flex items-center gap-3 w-full px-3.5 py-3 rounded-lg bg-white/5 border-2 border-dashed border-white/15 hover:border-violet-400/50 cursor-pointer transition">
                      <ImageIcon className="size-5 text-violet-300 shrink-0" />
                      <span className="text-sm text-white/70 truncate">{cover ? cover.name : "اختر صورة .png أو .jpg"}</span>
                    </label>
                    <input id="cover-file" type="file" accept="image/*" onChange={(e) => setCover(e.target.files?.[0] ?? null)} className="hidden" />
                  </Field>
                  <Field label="صور من اللعبة" hint={`(${screenshots.length} مختارة — حتى 8 صور)`}>
                    <label htmlFor="screenshots-file" className="flex items-center gap-3 w-full px-3.5 py-3 rounded-lg bg-white/5 border-2 border-dashed border-white/15 hover:border-violet-400/50 cursor-pointer transition">
                      <ImageIcon className="size-5 text-fuchsia-300 shrink-0" />
                      <span className="text-sm text-white/70">اضغط لاختيار صور متعددة من اللعبة</span>
                    </label>
                    <input id="screenshots-file" type="file" accept="image/*" multiple onChange={(e) => setScreenshots(Array.from(e.target.files ?? []).slice(0, 8))} className="hidden" />
                    {screenshots.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {screenshots.map((s, i) => (
                          <span key={i} className="text-[11px] px-2 py-1 rounded-md bg-white/5 border border-white/10 text-white/70 truncate max-w-[160px]">{s.name}</span>
                        ))}
                      </div>
                    )}
                  </Field>
                </fieldset>

                <fieldset className="space-y-4">
                  <Legend icon={<Cpu className="size-3.5" />}>متطلبات النظام (اختياري)</Legend>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <ReqGroup title="الحد الأدنى" cpu={minCpu} gpu={minGpu} ram={minRam} onCpu={setMinCpu} onGpu={setMinGpu} onRam={setMinRam} />
                    <ReqGroup title="الموصى بها" cpu={recCpu} gpu={recGpu} ram={recRam} onCpu={setRecCpu} onGpu={setRecGpu} onRam={setRecRam} />
                  </div>
                </fieldset>

                {message && (
                  <div className={`rounded-lg px-3.5 py-2.5 text-sm ${message.type === "success" ? "bg-emerald-500/15 text-emerald-200 border border-emerald-500/30" : "bg-red-500/15 text-red-200 border border-red-500/30"}`}>
                    {message.text}
                  </div>
                )}

                {progress !== null && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white/60">جاري الرفع...</span>
                      <span className="text-violet-300 font-bold">{progress}%</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                )}

                <button type="submit" disabled={submitting} className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold text-white">
                  {submitting ? "جاري الرفع..." : (<><Upload className="size-4" />رفع اللعبة</>)}
                </button>
              </form>
            </div>
          </div>
        </section>

        <section className="lg:col-span-2">
          <div className="flex items-center justify-between mb-5 px-1">
            <div>
              <div className="text-xs text-fuchsia-300/90 font-bold mb-1">المكتبة</div>
              <h2 className="font-extrabold text-2xl">الألعاب الحالية</h2>
            </div>
            <span className="text-xs px-3 py-1.5 rounded-full glass">{loading ? "..." : `${games.length} لعبة`}</span>
          </div>

          {message && message.type === "error" && (
            <div className="mb-4 rounded-lg px-3.5 py-2.5 text-sm bg-red-500/15 text-red-200 border border-red-500/30">{message.text}</div>
          )}

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (<div key={i} className="glass rounded-xl h-20 animate-pulse" />))}
            </div>
          ) : games.length === 0 ? (
            <div className="glass rounded-2xl p-10 text-center">
              <Gamepad2 className="size-10 mx-auto mb-3 text-white/30" />
              <p className="text-white/60 text-sm">لم يتم رفع أي لعبة بعد</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {games.map((g) => (
                <li key={g.id} className="neon-border rounded-2xl p-3 flex items-center gap-3 hover:bg-white/[0.02] transition group">
                  <div className="size-16 rounded-xl overflow-hidden bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 shrink-0 grid place-items-center ring-1 ring-white/10">
                    {g.cover ? <img src={gameCoverUrl(g.id)} alt="" className="w-full h-full object-cover" /> : <Gamepad2 className="size-6 text-white/60" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold truncate">{g.name}</h3>
                    <div className="flex items-center gap-2 text-[11px] text-white/50 mt-0.5">
                      <span className="flex items-center gap-1"><Download className="size-3" />{g.downloadCount}</span>
                      <span>·</span>
                      <span>{formatBytes(g.fileSize)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => handleRepair(g)} disabled={repairingId === g.id} className="px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-200 text-xs font-bold transition inline-flex items-center gap-1.5 disabled:opacity-50" title="إصلاح">
                      <Wrench className="size-3.5" />
                      {repairingId === g.id ? "..." : "إصلاح"}
                    </button>
                    <Link href={`/game/${g.id}`} className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-500/80 to-fuchsia-500/80 hover:opacity-90 text-xs font-bold transition text-white">عرض</Link>
                    <button onClick={() => handleDelete(g.id)} className="size-9 grid place-items-center rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 transition" title="حذف"><Trash2 className="size-4" /></button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <style>{`
        .input {
          width: 100%;
          padding: 0.625rem 0.875rem;
          border-radius: 0.5rem;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          font-size: 0.875rem;
          color: #fff;
          transition: border-color .2s, box-shadow .2s;
        }
        .input:focus {
          outline: none;
          border-color: #a78bfa;
          box-shadow: 0 0 0 3px rgba(139,92,246,0.3);
        }
        .input::placeholder { color: rgba(255,255,255,0.3); }
      `}</style>
    </div>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode; }) {
  return (<div><label className="block text-sm font-medium mb-1.5">{label}{required && <span className="text-fuchsia-400 mr-1">*</span>}{hint && <span className="text-white/40 mr-2 text-xs">{hint}</span>}</label>{children}</div>);
}

function Legend({ icon, children }: { icon: React.ReactNode; children: React.ReactNode; }) {
  return (<div className="flex items-center gap-2 text-xs text-fuchsia-300/90 font-bold border-b border-white/5 pb-2">{icon}{children}</div>);
}

function ReqGroup({ title, cpu, gpu, ram, onCpu, onGpu, onRam, }: { title: string; cpu: string; gpu: string; ram: string; onCpu: (v: string) => void; onGpu: (v: string) => void; onRam: (v: string) => void; }) {
  return (<div className="space-y-2.5 p-3 rounded-xl bg-white/[0.02] border border-white/5"><h4 className="text-xs font-bold text-white/80">{title}</h4><div className="space-y-2"><IconInput icon={<Cpu className="size-3.5" />} placeholder="المعالج (مثال: Intel i5 7600)" value={cpu} onChange={onCpu} /><IconInput icon={<MonitorPlay className="size-3.5" />} placeholder="كرت الفيديو (GTX 1060 6GB)" value={gpu} onChange={onGpu} /><IconInput icon={<MemoryStick className="size-3.5" />} placeholder="الرام (8 GB)" value={ram} onChange={onRam} /></div></div>);
}

function IconInput({ icon, placeholder, value, onChange, }: { icon: React.ReactNode; placeholder: string; value: string; onChange: (v: string) => void; }) {
  return (<div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus-within:border-violet-400 transition"><span className="text-white/40">{icon}</span><input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="bg-transparent outline-none text-xs flex-1 placeholder:text-white/30" /></div>);
}
