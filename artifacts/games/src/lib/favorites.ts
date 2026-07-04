const STORAGE_KEY = "game_favorites";

export function getFavoriteGameIds(): string[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const ids = raw ? JSON.parse(raw) : [];
        return Array.isArray(ids) ? ids.filter((id) => typeof id === "string") : [];
    } catch {
        return [];
    }
}

export function saveFavoriteGameIds(ids: string[]) {
    if (typeof window === "undefined") return;
    const unique = Array.from(new Set(ids.filter((id) => typeof id === "string" && id.trim().length > 0)));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(unique));
}

export function isFavoriteGame(id: string): boolean {
    return getFavoriteGameIds().includes(id);
}

export function addFavoriteGame(id: string) {
    const ids = getFavoriteGameIds();
    if (!ids.includes(id)) {
        ids.push(id);
        saveFavoriteGameIds(ids);
    }
}

export function removeFavoriteGame(id: string) {
    const ids = getFavoriteGameIds().filter((item) => item !== id);
    saveFavoriteGameIds(ids);
}

export function toggleFavoriteGame(id: string): boolean {
    if (isFavoriteGame(id)) {
        removeFavoriteGame(id);
        return false;
    }
    addFavoriteGame(id);
    return true;
}
