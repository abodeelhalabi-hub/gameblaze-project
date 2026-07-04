import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  Gamepad2,
  Plus,
  Sparkles,
  Download,
  Flame,
  Zap,
  Trophy,
  Search,
  Eye,
  Star,
  MessageCircle,
} from "lucide-react";
import {
  formatBytes,
  formatNumber,
  gameCoverUrl,
  listGames,
  type Game,
} from "@/lib/api";
import config from "@/config";
import Footer from "@/components/Footer";
import { useSidebar } from "@/App";
const logoUrl = "/logo.png";

export default function Home() {
  const { setOpen: setSidebarOpen } = useSidebar();
  const [games, setGames] = useState<Game[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let active = true;
    listGames()
      .then((g) => {
        if (active) setGames(g);
      })
      .catch((e: Error) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = games
    ? games.filter((g) =>
      g.name.toLowerCase().includes(query.toLowerCase().trim()),
    )
    : null;

  const totalDownloads = games?.reduce((s, g) => s + (g.downloadCount || 0), 0) ?? 0;

  return (
    <div className="min-h-screen relative">
      <div className="bg-cosmos" />
      <div className="bg-grid" />

      <header className="glass-strong sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 group min-w-0">
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 blur-md opacity-60 group-hover:opacity-100 transition" />
              <img
                src={logoUrl}
                alt={config.siteName}
                className="relative size-14 rounded-full object-cover ring-2 ring-white/20"
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-extrabold text-shimmer">
                {config.siteName}
              </h1>
              <p className="text-[11px] text-white/50 truncate">
                {config.siteTagline}
              </p>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl glass w-44 sm:w-72">
              <Search className="size-4 text-white/40 shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث عن لعبة..."
                className="bg-transparent outline-none text-sm w-full placeholder:text-white/30"
              />
            </div>
            <button
              onClick={() => setSidebarOpen(true)}
              className="size-10 rounded-full glass hover:bg-white/10 transition grid place-items-center shrink-0"
              aria-label="فتح القائمة"
            >
              <span className="flex flex-col gap-1.5 items-center justify-center h-full">
                <span className="w-4 h-0.5 bg-white/70 rounded-full" />
                <span className="w-4 h-0.5 bg-white/70 rounded-full" />
                <span className="w-4 h-0.5 bg-white/70 rounded-full" />
              </span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 relative">
        {/* Hero */}
        <section className="relative mb-16 text-center">
          <div className="orb size-72 bg-violet-500/40 -top-10 -right-20" style={{ animationDelay: "0s" }} />
          <div className="orb size-80 bg-fuchsia-500/30 top-20 -left-20" style={{ animationDelay: "3s" }} />
          <div className="orb size-64 bg-sky-500/20 -top-20 left-1/2 -translate-x-1/2" style={{ animationDelay: "6s" }} />

          <div className="relative">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full neon-border text-xs text-white/80 mb-6">
              <Sparkles className="size-3.5 text-amber-300" />
              <span>أهلاً بك في GameBlaze.com</span>
            </div>
            <h2 className="text-5xl md:text-7xl font-black mb-5 leading-tight">
              <span className="text-shimmer">حمّل ألعابك المفضّلة</span>
            </h2>
            <p className="text-white/60 max-w-xl mx-auto text-lg leading-relaxed mb-8">
              {config.siteDescription}
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <a
                href="#games"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl btn-primary text-sm font-bold text-white"
              >
                <Download className="size-4" />
                تصفّح الألعاب وحمّل
              </a>
            </div>

          </div>
        </section>

        <section
          id="games"
          className="mb-6 flex items-end justify-between gap-4"
        >
          <div>
            <div className="inline-flex items-center gap-2 text-xs text-fuchsia-300/90 font-bold mb-2">
              <Flame className="size-3.5" />
              المكتبة
            </div>
            <h3 className="text-2xl md:text-3xl font-extrabold">
              جميع الألعاب
            </h3>
          </div>
          {games && games.length > 0 && (
            <span className="text-sm text-white/40">
              {filtered?.length ?? 0} من {games.length}
            </span>
          )}
        </section>

        {error && (
          <div className="glass rounded-2xl p-4 text-red-300 text-center mb-6">
            {error}
          </div>
        )}

        {games === null && !error && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="glass rounded-2xl aspect-[3/4] animate-pulse" />
            ))}
          </div>
        )}

        {games && games.length === 0 && (
          <div className="neon-border rounded-3xl p-14 text-center relative overflow-hidden">
            <div className="orb size-60 bg-violet-500/30 -top-20 left-1/2 -translate-x-1/2" />
            <div className="relative">
              <div className="size-20 rounded-2xl bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 grid place-items-center mx-auto mb-5 ring-1 ring-white/10">
                <Gamepad2 className="size-10 text-white/70" />
              </div>
              <h3 className="text-2xl font-bold mb-2">قريباً...</h3>
              <p className="text-white/60 max-w-sm mx-auto">
                يتم تجهيز مكتبة الألعاب، عد لاحقاً لتجد أفضل الألعاب جاهزة للتحميل.
              </p>
            </div>
          </div>
        )}

        {games && games.length > 0 && filtered && filtered.length === 0 && (
          <div className="glass rounded-2xl p-10 text-center text-white/60">
            <Search className="size-8 mx-auto mb-3 text-white/30" />
            لا توجد نتائج مطابقة لبحثك
          </div>
        )}

        {filtered && filtered.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 justify-items-center">
            {filtered.map((game, idx) => (
              <GameCard key={game.id} game={game} index={idx} />
            ))}
          </div>
        )}
      </main>

      <Footer />
      <div className="pb-4 text-center">
        <Link href="/admin" className="text-[11px] text-white/20 hover:text-fuchsia-300/60 transition-opacity">
          ⚙ إدارة
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  value,
  label,
  tint,
}: {
  icon: React.ReactNode;
  value: React.ReactNode;
  label: string;
  tint: "violet" | "fuchsia" | "amber";
}) {
  const tints = {
    violet: "from-violet-500/25 to-violet-500/5 text-violet-200",
    fuchsia: "from-fuchsia-500/25 to-fuchsia-500/5 text-fuchsia-200",
    amber: "from-amber-500/25 to-amber-500/5 text-amber-200",
  };
  return (
    <div className={`glass rounded-2xl p-4 text-right bg-gradient-to-br ${tints[tint]}`}>
      <div className="flex items-center gap-2 justify-end mb-1">
        <span className="text-[11px] text-white/60">{label}</span>
        {icon}
      </div>
      <div className="text-2xl font-extrabold">{value}</div>
    </div>
  );
}

function GameCard({ game, index }: { game: Game; index: number }) {
  const palettes = [
    "from-violet-600/40 via-purple-600/30 to-fuchsia-600/40",
    "from-fuchsia-600/40 via-pink-600/30 to-rose-600/40",
    "from-sky-600/40 via-indigo-600/30 to-violet-600/40",
    "from-emerald-600/40 via-teal-600/30 to-cyan-600/40",
    "from-amber-600/40 via-orange-600/30 to-rose-600/40",
  ];
  const palette = palettes[index % palettes.length];

  return (
    <Link
      href={`/game/${game.id}`}
      className="group neon-border rounded-2xl overflow-hidden card-glow flex flex-col w-[240px] sm:w-[250px] md:w-[260px]"
    >
      <div
        className={`aspect-[3/4] relative overflow-hidden bg-gradient-to-br ${palette}`}
      >
        {game.cover ? (
          <img
            src={gameCoverUrl(game.id)}
            alt={game.name}
            className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full grid place-items-center">
            <Gamepad2 className="size-20 text-white/40 group-hover:text-white/70 group-hover:scale-110 transition duration-500" />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        {/* Hover overlay */}
        <div className="absolute inset-0 grid place-items-center opacity-0 group-hover:opacity-100 transition duration-300">
          <div className="size-16 rounded-full bg-emerald-500/90 backdrop-blur-md grid place-items-center ring-2 ring-emerald-300/50 pulse-ring relative shadow-2xl shadow-emerald-900/50">
            <Download className="size-6 text-white" />
          </div>
        </div>

        {/* Top badges */}
        <div className="absolute top-2.5 right-2.5 left-2.5 flex items-start justify-between">
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/90 backdrop-blur text-[10px] font-bold text-white shadow-lg flex items-center gap-1">
            <Download className="size-2.5" />
            مجانية
          </span>
          {game.fileSize > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur text-[10px] font-bold text-white/90">
              {formatBytes(game.fileSize)}
            </span>
          )}
        </div>

        {/* Bottom: title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="font-extrabold text-base sm:text-lg text-white line-clamp-2 leading-tight mb-1.5 drop-shadow-lg">
            {game.name}
          </h3>
          <div className="flex items-center justify-between text-[10px] text-white/80">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                <Star className="size-3 text-amber-300 fill-amber-300" />
                5.0
              </span>
              <span className="text-white/40">·</span>
              <span className="flex items-center gap-1">
                <Eye className="size-3" />
                {formatNumber(game.viewCount)}
              </span>
              <span className="text-white/40">·</span>
              <span className="flex items-center gap-1">
                <Download className="size-3" />
                {formatNumber(game.downloadCount)}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="size-3" />
                تعليقات
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
