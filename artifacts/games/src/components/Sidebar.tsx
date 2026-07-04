import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Home,
  Flame,
  LayoutGrid,
  Heart,
  Trophy,
  Newspaper,
  MessageCircle,
  Moon,
  Sun,
  X,
  Sparkles,
} from "lucide-react";
import config from "@/config";
import { useTheme } from "@/App";

const logoUrl = "/logo.png";

const NAV = [
  { label: "الرئيسية", href: "/", icon: <Home className="size-5" /> },
  {
    label: "الألعاب الجديدة",
    href: "/",
    icon: <Sparkles className="size-5" />,
    badge: "NEW",
    badgeColor: "bg-fuchsia-500",
  },
  {
    label: "الأكثر لعباً",
    href: "/",
    icon: <Flame className="size-5 text-orange-400" />,
  },
  {
    label: "التصنيفات",
    href: "/",
    icon: <LayoutGrid className="size-5" />,
  },
  {
    label: "المفضلة",
    href: "/favorites",
    icon: <Heart className="size-5" />,
  },
  {
    label: "البطولات",
    href: "/",
    icon: <Trophy className="size-5 text-amber-400" />,
  },
  {
    label: "أخبار الألعاب",
    href: "/",
    icon: <Newspaper className="size-5" />,
  },
  {
    label: "تواصل معنا",
    href: "/",
    icon: <MessageCircle className="size-5" />,
  },
];

const SOCIALS = [
  {
    label: "Discord",
    href: "https://discord.com",
    icon: (
      <svg className="size-5 fill-current" viewBox="0 0 24 24">
        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.031.053a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
      </svg>
    ),
    color: "#5865F2",
  },
  {
    label: "Facebook",
    href: "https://facebook.com",
    icon: (
      <svg className="size-5 fill-current" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    color: "#1877f2",
  },
  {
    label: "Twitter",
    href: "https://twitter.com",
    icon: (
      <svg className="size-5 fill-current" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.832L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    color: "#1DA1F2",
  },
  {
    label: "YouTube",
    href: "https://youtube.com",
    icon: (
      <svg className="size-5 fill-current" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
    color: "#FF0000",
  },
  {
    label: "Instagram",
    href: "https://instagram.com",
    icon: (
      <svg className="size-5 fill-current" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
    color: "#E1306C",
  },
];

function useOnlineCount() {
  const [count, setCount] = useState(1248);
  useEffect(() => {
    const id = setInterval(() => {
      setCount((c) => c + Math.floor(Math.random() * 7) - 3);
    }, 2000);
    return () => clearInterval(id);
  }, []);
  return count;
}

function MiniChart() {
  const points = [30, 45, 35, 60, 50, 70, 55, 80, 65, 90, 75, 85];
  const h = 48;
  const w = 180;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const scaleY = (v: number) => h - ((v - min) / (max - min)) * h;
  const coords = points
    .map((v, i) => `${(i / (points.length - 1)) * w},${scaleY(v)}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-12 overflow-visible">
      <defs>
        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a855f7" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={`${coords} ${w},${h} 0,${h}`}
        fill="url(#chartGrad)"
        stroke="none"
      />
      <polyline
        points={coords}
        fill="none"
        stroke="#a855f7"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [location] = useLocation();
  const online = useOnlineCount();
  const { dark: darkMode, toggle: toggleDark } = useTheme();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        aria-hidden="true"
      />

      {/* Sidebar panel */}
      <aside
        ref={ref}
        className={`fixed top-0 right-0 z-50 h-full w-72 flex flex-col transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "translate-x-full"}`}
        style={{ background: "linear-gradient(180deg, var(--sidebar-bg-from) 0%, var(--sidebar-bg-to) 100%)", borderLeft: "1px solid var(--sidebar-border)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <button
            onClick={onClose}
            className="size-8 rounded-lg bg-white/5 hover:bg-white/10 transition grid place-items-center text-white/70"
            aria-label="إغلاق القائمة"
          >
            <X className="size-4" />
          </button>
          <Link href="/" onClick={onClose} className="flex items-center gap-2">
            <img src={logoUrl} alt={config.siteName} className="size-10 rounded-full object-cover ring-1 ring-violet-500/50" />
            <span className="font-extrabold text-sm text-shimmer">{config.siteName}</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
          {NAV.map((item) => {
            const active = location === item.href && item.href !== "/" || (item.href === "/" && location === "/");
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition text-sm font-bold ${active ? "bg-violet-600/30 text-white" : "text-white/60 hover:text-white hover:bg-white/5"}`}
              >
                <span className="text-white/80">{item.icon}</span>
                <span className="flex-1 text-right">{item.label}</span>
                {item.badge && (
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md text-white ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Online counter */}
          <div className="mx-1 mt-4 rounded-xl p-4 bg-white/5 border border-white/10">
            <p className="text-xs text-white/50 text-right mb-2">اللاعبون المتصلون الآن</p>
            <p className="text-3xl font-black text-violet-300 text-right tabular-nums">
              {online.toLocaleString("ar")}
            </p>
            <p className="text-xs text-emerald-400 text-right flex items-center justify-end gap-1 mt-1">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              لاعب متصل
            </p>
            <div className="mt-3">
              <MiniChart />
            </div>
          </div>

          {/* Dark/Light mode toggle */}
          <div className="mx-1 flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10 mt-2">
            <button
              onClick={toggleDark}
              className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${darkMode ? "bg-violet-600" : "bg-amber-400"}`}
            >
              <span className={`absolute top-1/2 -translate-y-1/2 size-5 rounded-full bg-white shadow transition-all duration-300 ${darkMode ? "left-[18px]" : "left-1"}`} />
            </button>
            <div className="flex items-center gap-2 text-sm font-bold">
              {darkMode
                ? <><span className="text-white/70">الوضع الليلي</span><Moon className="size-4 text-violet-300" /></>
                : <><span>الوضع النهاري</span><Sun className="size-4 text-amber-400" /></>
              }
            </div>
          </div>
        </nav>

        {/* Social links */}
        <div className="border-t border-white/10 px-4 py-4">
          <div className="flex items-center justify-center gap-3">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="size-9 rounded-lg grid place-items-center hover:scale-110 transition-transform"
                style={{ background: s.color + "22", color: s.color }}
                title={s.label}
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
