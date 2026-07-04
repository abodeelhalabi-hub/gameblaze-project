import { Link } from "wouter";
import config from "@/config";

const logoUrl = "/logo.png";

const CATEGORIES = [
  {
    items: ["اكشن", "قتال", "استراتيجية", "رعب", "مغامرات"],
  },
  {
    items: ["السباق والسيارات", "محاكاة الواقع", "رياضة", "ذكاء", "تصويب"],
  },
  {
    items: ["العاب قديمة", "خفيفة و مسلية", "خيال علمي", "نجاة"],
  },
];

const SOCIALS = [
  {
    label: "فيسبوك",
    href: "https://facebook.com",
    bg: "#1877f2",
    icon: (
      <svg className="size-4 fill-current" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    label: "تيليجرام",
    href: "https://t.me",
    bg: "#229ED9",
    icon: (
      <svg className="size-4 fill-current" viewBox="0 0 24 24">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
      </svg>
    ),
  },
  {
    label: "واتساب",
    href: "https://wa.me",
    bg: "#25D366",
    icon: (
      <svg className="size-4 fill-current" viewBox="0 0 24 24">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
  },
];

export default function Footer() {
  return (
    <footer className="relative mt-16 border-t border-white/10">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-10 mb-10">
          <div className="flex flex-col items-center sm:items-start gap-3">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 blur-md opacity-50 group-hover:opacity-80 transition" />
                <img
                  src={logoUrl}
                  alt={config.siteName}
                  className="relative size-14 rounded-full object-cover ring-2 ring-white/20"
                />
              </div>
              <div>
                <div className="font-extrabold text-lg text-shimmer">{config.siteName}</div>
                <div className="text-xs text-white/50">{config.siteTagline}</div>
              </div>
            </Link>
            <p className="text-xs text-white/40 max-w-[220px] text-center sm:text-right leading-relaxed">
              {config.siteDescription}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 sm:gap-8 justify-items-end">
            {CATEGORIES.map((col, ci) => (
              <ul key={ci} className="space-y-2.5 text-right">
                {col.items.map((cat) => (
                  <li key={cat}>
                    <span className="text-sm text-white/55 hover:text-white/90 transition cursor-pointer">
                      {cat}
                    </span>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/35 order-2 sm:order-1">
            © {new Date().getFullYear()} {config.siteName} — {config.footerText}
          </p>
          <div className="flex items-center gap-2 order-1 sm:order-2 flex-wrap justify-center">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-white hover:brightness-110 transition"
                style={{ background: s.bg }}
              >
                {s.icon}
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
