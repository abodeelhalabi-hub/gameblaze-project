import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Heart, Star, Eye, Download, Gamepad2, MessageCircle } from "lucide-react";
import { formatBytes, formatNumber, gameCoverUrl, listGames, type Game } from "@/lib/api";
import { getFavoriteGameIds } from "@/lib/favorites";
import Footer from "@/components/Footer";

export default function Favorites() {
    const [games, setGames] = useState<Game[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        listGames()
            .then((allGames) => {
                if (!active) return;
                const favoriteIds = getFavoriteGameIds();
                setGames(allGames.filter((game) => favoriteIds.includes(game.id)));
            })
            .catch((err: Error) => {
                if (!active) return;
                setError(err.message);
            });
        return () => {
            active = false;
        };
    }, []);

    return (
        <div className="min-h-screen relative">
            <div className="bg-cosmos" />
            <div className="bg-grid" />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 relative">
                <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-rose-500/15 px-3 py-1 text-sm font-bold text-rose-200">
                            <Heart className="size-4" />
                            المفضلة
                        </div>
                        <h1 className="mt-4 text-4xl font-black text-white">ألعابي المفضلة</h1>
                        <p className="text-white/60 mt-2 max-w-2xl">هنا تجد الألعاب التي أضفتها إلى المفضلة لمراجعتها لاحقاً وتنزيلها بسرعة.</p>
                    </div>
                </div>

                {error && (
                    <div className="glass rounded-2xl p-6 text-red-300 text-center mb-6">{error}</div>
                )}

                {games && games.length === 0 && (
                    <div className="neon-border rounded-3xl p-14 text-center text-white/60">
                        <Gamepad2 className="size-12 mx-auto mb-4 text-white/30" />
                        <h2 className="text-2xl font-bold mb-2">لا توجد ألعاب في المفضلة بعد</h2>
                        <p>اضغط زر المفضلة في صفحة تفاصيل أي لعبة لإضافتها هنا.</p>
                    </div>
                )}

                {games && games.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                        {games.map((game) => (
                            <Link key={game.id} href={`/game/${game.id}`} className="group neon-border rounded-2xl overflow-hidden card-glow flex flex-col">
                                <div className="aspect-[3/4] relative overflow-hidden bg-gradient-to-br from-violet-600/40 via-purple-600/30 to-fuchsia-600/40">
                                    {game.cover ? (
                                        <img src={gameCoverUrl(game.id)} alt={game.name} className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-700" />
                                    ) : (
                                        <div className="w-full h-full grid place-items-center">
                                            <Gamepad2 className="size-20 text-white/40" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                                </div>
                                <div className="p-4 text-white">
                                    <h2 className="text-lg font-bold mb-2 line-clamp-2">{game.name}</h2>
                                    <div className="flex items-center justify-between text-sm text-white/70 gap-2">
                                        <span>{formatBytes(game.fileSize)}</span>
                                        <span className="inline-flex items-center gap-1"><Star className="size-4 text-amber-300" />5.0</span>
                                        <span className="inline-flex items-center gap-1"><MessageCircle className="size-4" />تعليقات</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}
