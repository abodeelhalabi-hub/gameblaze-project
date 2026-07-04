import { useEffect, useState } from "react";
import { Link, useRoute } from "wouter";
import {
  ArrowRight,
  Download,
  Eye,
  HardDrive,
  Cpu,
  MonitorPlay,
  MemoryStick,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Image as ImageIcon,
  X,
  Facebook,
  Twitter,
  Star,
  Calendar,
  Gamepad2,
  Link2,
  Check,
  Heart,
  MessageCircle,
} from "lucide-react";
import {
  formatBytes,
  formatNumber,
  downloadGameFile,
  gameCoverUrl,
  gameScreenshotUrl,
  getGame,
  trackView,
  type Game,
} from "@/lib/api";
import {
  addFavoriteGame,
  isFavoriteGame,
  removeFavoriteGame,
  toggleFavoriteGame,
} from "@/lib/favorites";
import config from "@/config";
import Footer from "@/components/Footer";
import { useSidebar } from "@/App";
const logoUrl = "/logo.png";

export default function GameDetail() {
  const { setOpen: setSidebarOpen } = useSidebar();
  const [, params] = useRoute<{ id: string }>("/game/:id");
  const id = params?.id;
  const [game, setGame] = useState<Game | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;
    getGame(id)
      .then((g) => {
        if (active) {
          setGame(g);
          trackView(id);
        }
      })
      .catch((e: Error) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [id]);

  async function submitComment() {
    if (!id || !commentText.trim()) {
      setCommentError("اكتب تعليقك أولاً");
      return;
    }
    setSubmittingComment(true);
    setCommentError(null);
    try {
      const res = await fetch(`/api/games/${id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author: "زوّار", text: commentText.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || "فشل إرسال التعليق");
      }
      const comment = await res.json();
      setGame((prev) => prev ? { ...prev, comments: [comment, ...(prev.comments ?? [])] } : prev);
      setCommentText("");
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : "فشل إرسال التعليق");
    } finally {
      setSubmittingComment(false);
    }
  }

  useEffect(() => {
    if (!id) return;
    setFavorite(isFavoriteGame(id));
  }, [id]);

  const [copied, setCopied] = useState(false);
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const fbShare = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  const twShare = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(game?.name ?? "")}`;
  const waShare = `https://wa.me/?text=${encodeURIComponent(`${game?.name ?? ""} - حمّلها الحين مجاناً 🎮\n${shareUrl}`)}`;
  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  const handleDownload = async () => {
    if (!game || downloading) return;
    setDownloadError(null);
    setDownloading(true);
    try {
      await downloadGameFile(game.id);
    } catch (e) {
      setDownloadError(e instanceof Error ? e.message : "فشل تنزيل اللعبة");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen relative">
      <div className="bg-cosmos" />
      <div className="bg-grid" />

      <header className="glass-strong sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 min-w-0 group">
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 blur-md opacity-60 group-hover:opacity-100 transition" />
              <img
                src={logoUrl}
                alt={config.siteName}
                className="relative size-12 rounded-full object-cover ring-2 ring-white/20"
              />
            </div>
            <div className="min-w-0">
              <h1 className="font-extrabold text-shimmer">{config.siteName}</h1>
              <p className="text-[11px] text-white/50 truncate">
                {config.siteTagline}
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl glass hover:bg-white/10 transition text-sm font-bold"
            >
              <span>الرئيسية</span>
              <ArrowRight className="size-4 rotate-180" />
            </Link>
            <button
              onClick={() => setSidebarOpen(true)}
              className="size-10 rounded-xl glass hover:bg-white/10 transition grid place-items-center shrink-0"
              aria-label="فتح القائمة"
            >
              <span className="flex flex-col gap-1.5 items-center">
                <span className="w-5 h-0.5 bg-white/70 rounded-full" />
                <span className="w-4 h-0.5 bg-white/70 rounded-full" />
                <span className="w-5 h-0.5 bg-white/70 rounded-full" />
              </span>
            </button>
          </div>
        </div>
      </header>

      {error && (
        <main className="max-w-3xl mx-auto px-6 py-20">
          <div className="neon-border rounded-2xl p-10 text-center text-red-300">
            {error}
          </div>
        </main>
      )}

      {!game && !error && (
        <main className="max-w-7xl mx-auto px-6 py-20">
          <div className="glass rounded-2xl h-96 animate-pulse" />
        </main>
      )}

      {game && (
        <>
          <section>
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-10">
              <nav className="text-xs text-white/50 mb-6 flex items-center gap-2">
                <Link href="/" className="hover:text-white transition">
                  الرئيسية
                </Link>
                <span>›</span>
                <span className="text-white/80">تنزيل {game.name}</span>
              </nav>

              <div className="grid lg:grid-cols-[180px_1fr] gap-6 lg:gap-10 items-start">
                <div className="aspect-[3/4] w-[150px] max-w-[150px] sm:w-[170px] sm:max-w-[170px] lg:w-[180px] lg:max-w-[180px] mx-auto lg:mx-0 rounded-2xl overflow-hidden ring-1 ring-white/10 shadow-2xl shadow-violet-900/40 bg-gradient-to-br from-violet-600/30 to-fuchsia-600/30">
                  {game.cover ? (
                    <img
                      src={gameCoverUrl(game.id)}
                      alt={game.name}
                      className="w-full h-full object-cover object-center"
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center">
                      <Gamepad2 className="size-20 text-white/40" />
                    </div>
                  )}
                </div>

                <div className="text-center lg:text-right">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full neon-border text-[11px] text-white/80 mb-4">
                    <Sparkles className="size-3 text-amber-300" />
                    تنزيل لعبة
                  </div>
                  <h1 className="text-3xl sm:text-5xl font-black mb-4 leading-tight">
                    <span className="text-shimmer">{game.name}</span>
                  </h1>
                  <div className="text-[11px] text-emerald-300 mb-3 font-bold">
                    UI {"v2"}
                  </div>
                  {game.description && (
                    <p className="text-white/70 text-base sm:text-lg max-w-2xl mb-5 mx-auto lg:mx-0">
                      {game.description}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-3 sm:gap-5 justify-center lg:justify-start text-sm">
                    <div className="flex items-center gap-1 text-amber-300">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="size-4 fill-current" />
                      ))}
                      <span className="text-white/60 mr-1">5.0</span>
                    </div>
                    <span className="text-white/30">·</span>
                    <div className="flex items-center gap-1.5 text-white/70">
                      <Download className="size-4 text-fuchsia-300" />
                      <b className="text-white">
                        {formatNumber(game.downloadCount)}
                      </b>
                      <span>تحميل</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-white/70">
                      <Eye className="size-4 text-violet-300" />
                      <b className="text-white">
                        {formatNumber(game.viewCount)}
                      </b>
                      <span>مشاهدة</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-white/70">
                      <Calendar className="size-4 text-sky-300" />
                      <span>
                        {new Date(game.createdAt).toLocaleDateString("ar-EG")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <main className="relative max-w-7xl mx-auto px-4 sm:px-6 pb-20">
            <div className="grid lg:grid-cols-[340px_1fr] gap-6 lg:gap-8">
              <aside className="space-y-5 lg:sticky lg:top-24 self-start">
                <div className="neon-border rounded-2xl p-5 relative overflow-hidden">
                  <div className="orb size-40 bg-emerald-500/20 -top-10 -left-10" />
                  <div className="relative">
                    <div className="text-xs text-white/60 mb-3 text-center">
                      انقر للبدء بتنزيل اللعبة فوراً
                    </div>
                    <button
                      type="button"
                      onClick={handleDownload}
                      disabled={downloading}
                      className="flex items-center justify-center gap-3 w-full py-4 rounded-xl text-white font-extrabold text-base shadow-lg shadow-emerald-900/40 hover:shadow-emerald-900/60 hover:brightness-110 transition relative overflow-hidden group"
                      style={{
                        background:
                          "linear-gradient(135deg, #84cc16 0%, #22c55e 50%, #10b981 100%)",
                      }}
                    >
                      <span className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition" />
                      <Download className="size-5 relative" />
                      <span className="relative">
                        {downloading ? "جارٍ التنزيل..." : "تنزيل برابط مباشر"}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!id) return;
                        const next = toggleFavoriteGame(id);
                        setFavorite(next);
                      }}
                      className="flex items-center justify-center gap-2 w-auto px-4 py-2.5 rounded-lg border border-white/10 text-white font-semibold text-sm hover:bg-white/10 transition"
                    >
                      <Heart className={`size-4 ${favorite ? "text-rose-400" : "text-white/80"}`} />
                      {favorite ? "أُزيل من المفضلة" : "أضف إلى المفضلة"}
                    </button>
                    {downloadError && (
                      <div className="mt-3 text-xs text-red-300 text-center">
                        {downloadError}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2 mt-4 text-[11px]">
                      <Badge>
                        <HardDrive className="size-3" />
                        {`بحجم ${formatBytes(game.fileSize)}`}
                      </Badge>
                      <Badge>
                        <CheckCircle2 className="size-3 text-emerald-300" />
                        مجانية
                      </Badge>
                      <Badge>
                        <CheckCircle2 className="size-3 text-emerald-300" />
                        كاملة
                      </Badge>
                      <Badge>
                        <ShieldCheck className="size-3 text-emerald-300" />
                        آمنة
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="neon-border rounded-2xl p-5">
                  <h3 className="text-sm font-bold mb-3 text-white/80">
                    شارك اللعبة
                  </h3>
                  <div className="space-y-2">
                    <a href={waShare} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg hover:brightness-110 transition text-sm font-bold text-white" style={{ background: "#25D366" }}>
                      <svg className="size-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                      شاركها على واتساب
                    </a>
                    <a href={fbShare} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg bg-[#1877f2] hover:brightness-110 transition text-sm font-bold text-white">
                      <Facebook className="size-4" />
                      شاركها على فيسبوك
                    </a>
                    <a href={twShare} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg bg-sky-500 hover:brightness-110 transition text-sm font-bold text-white">
                      <Twitter className="size-4" />
                      غردها على تويتر
                    </a>
                    <button onClick={handleCopy} className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 transition text-sm font-bold text-white border border-white/10">
                      {copied ? <Check className="size-4 text-emerald-300" /> : <Link2 className="size-4" />}
                      {copied ? "تم نسخ الرابط ✓" : "انسخ رابط اللعبة"}
                    </button>
                  </div>
                </div>

                {(game.systemMin || game.systemRec) && (
                  <div className="neon-border rounded-2xl p-5">
                    <h3 className="text-sm font-bold mb-4 text-white/90 flex items-center gap-2">
                      <Cpu className="size-4 text-violet-300" />
                      متطلبات تشغيل اللعبة
                    </h3>
                    {game.systemMin && <SysReqBlock title="الحد الأدنى لمتطلبات النظام" req={game.systemMin} color="violet" />}
                    {game.systemRec && <SysReqBlock title="متطلبات النظام الموصى بها" req={game.systemRec} color="fuchsia" />}
                  </div>
                )}
              </aside>

              <div className="space-y-6">
                {game.screenshots.length > 0 && (
                  <section className="neon-border rounded-2xl p-5 sm:p-6">
                    <h2 className="text-lg font-extrabold mb-4 flex items-center gap-2">
                      <ImageIcon className="size-5 text-fuchsia-300" />
                      معرض اللعبة
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {game.screenshots.map((_, idx) => (
                        <button key={idx} onClick={() => setLightbox(idx)} className="aspect-video rounded-xl overflow-hidden ring-1 ring-white/10 hover:ring-violet-400/50 transition group relative">
                          <img src={gameScreenshotUrl(game.id, idx)} alt="" className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition grid place-items-center">
                            <ImageIcon className="size-6 text-white opacity-0 group-hover:opacity-100 transition" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                {game.story && (
                  <section className="neon-border rounded-2xl p-5 sm:p-6">
                    <h2 className="text-lg font-extrabold mb-4 flex items-center gap-2">
                      <Sparkles className="size-5 text-amber-300" />
                      حكاية اللعبة
                    </h2>
                    <p className="text-white/75 leading-loose whitespace-pre-wrap">
                      {game.story}
                    </p>
                  </section>
                )}

                {!game.story && game.screenshots.length === 0 && (
                  <section className="neon-border rounded-2xl p-10 text-center text-white/50">
                    <Gamepad2 className="size-10 mx-auto mb-3 opacity-50" />
                    <p>اضغط على زر التنزيل من اليمين لبدء تحميل اللعبة</p>
                  </section>
                )}

                <section className="neon-border rounded-2xl p-5 sm:p-6">
                  <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
                    <div>
                      <h2 className="text-lg font-extrabold">آراء اللاعبين</h2>
                      <p className="text-sm text-white/60">شارك رأيك أو اقرأ تقييمات الزوار.</p>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 text-[11px] text-white/70">
                      <MessageCircle className="size-4 text-fuchsia-300" />
                      {game.comments?.length ?? 0} تعليق
                    </div>
                  </div>

                  <div className="space-y-4 mb-6">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      rows={4}
                      placeholder="اكتب رأيك هنا..."
                      className="w-full min-h-[120px] resize-none rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-fuchsia-400 focus:ring-2 focus:ring-fuchsia-500/20"
                    />
                    {commentError && (
                      <div className="text-sm text-red-300">{commentError}</div>
                    )}
                    <button
                      type="button"
                      onClick={submitComment}
                      disabled={submittingComment}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-3xl bg-fuchsia-500 hover:bg-fuchsia-400 transition text-sm font-bold text-white"
                    >
                      {submittingComment ? "جاري الإرسال..." : "أضف رأيك"}
                    </button>
                  </div>

                  <div className="space-y-4">
                    {(game.comments ?? []).length === 0 ? (
                      <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-center text-white/60">
                        لا يوجد تعليقات بعد. كن أول من يشارك رأيه.
                      </div>
                    ) : (
                      (game.comments ?? []).map((comment) => (
                        <div key={comment.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                          <div className="flex items-center justify-between gap-3 mb-2 text-sm text-white/70">
                            <span className="font-bold text-white">{comment.author}</span>
                            <span>{new Date(comment.createdAt).toLocaleDateString("ar-EG")}</span>
                          </div>
                          <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{comment.text}</p>
                        </div>
                      ))
                    )}
                  </div>
                </section>
              </div>
            </div>
          </main>

          <Footer />

          {lightbox !== null && (
            <div className="fixed inset-0 z-50 bg-black/90 grid place-items-center p-4" onClick={() => setLightbox(null)}>
              <button onClick={() => setLightbox(null)} className="absolute top-4 right-4 size-10 rounded-full glass-strong grid place-items-center hover:bg-white/15" aria-label="إغلاق">
                <X className="size-5" />
              </button>
              <img src={gameScreenshotUrl(game.id, lightbox)} alt="" className="max-w-full max-h-full rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-white/5 border border-white/10 text-white/80 justify-center">
      {children}
    </span>
  );
}

function SysReqBlock({
  title,
  req,
  color,
}: {
  title: string;
  req: { cpu?: string; gpu?: string; ram?: string };
  color: "violet" | "fuchsia";
}) {
  const dot = color === "violet" ? "bg-violet-400" : "bg-fuchsia-400";
  return (
    <div className="mb-4 last:mb-0">
      <div className="flex items-center gap-2 mb-2">
        <span className={`size-2 rounded-full ${dot}`} />
        <h4 className="text-xs font-bold text-white/80">{title}</h4>
      </div>
      <ul className="space-y-1.5 text-xs text-white/70 pr-4">
        {req.cpu && (
          <li className="flex items-start gap-2">
            <Cpu className="size-3.5 text-white/40 mt-0.5 shrink-0" />
            <div>
              <b className="text-white/90">المعالج:</b> {req.cpu}
            </div>
          </li>
        )}
        {req.gpu && (
          <li className="flex items-start gap-2">
            <MonitorPlay className="size-3.5 text-white/40 mt-0.5 shrink-0" />
            <div>
              <b className="text-white/90">كرت الفيديو:</b> {req.gpu}
            </div>
          </li>
        )}
        {req.ram && (
          <li className="flex items-start gap-2">
            <MemoryStick className="size-3.5 text-white/40 mt-0.5 shrink-0" />
            <div>
              <b className="text-white/90">الرام:</b> {req.ram}
            </div>
          </li>
        )}
      </ul>
    </div>
  );
}
