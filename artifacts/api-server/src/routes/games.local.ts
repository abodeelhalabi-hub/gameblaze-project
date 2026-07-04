import { Router, type IRouter } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

type SysReq = { cpu?: string; gpu?: string; ram?: string };

type Game = {
  id: string;
  name: string;
  description: string;
  story?: string | null;
  filename: string;
  originalFilename: string;
  fileSize: number;
  cover?: string | null;
  screenshots: string[];
  systemMin?: SysReq | null;
  systemRec?: SysReq | null;
  downloadCount: number;
  viewCount: number;
  createdAt: number;
};

type Store = { games: Game[] };

const router: IRouter = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, "../data");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
const CHUNKS_DIR = path.join(DATA_DIR, "chunks");
const TEMP_DIR = path.join(DATA_DIR, "temp");
const DB_FILE = path.join(DATA_DIR, "games.json");

[DATA_DIR, UPLOADS_DIR, CHUNKS_DIR, TEMP_DIR].forEach((d) => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

function readStore(): Store {
  if (!fs.existsSync(DB_FILE)) return { games: [] };
  try {
    const parsed = JSON.parse(fs.readFileSync(DB_FILE, "utf8")) as Store;
    return { games: Array.isArray(parsed.games) ? parsed.games : [] };
  } catch {
    return { games: [] };
  }
}

function writeStore(store: Store) {
  fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2));
}

function diskPath(filename: string): string {
  return path.join(UPLOADS_DIR, path.basename(filename));
}

function safeExt(name: string, fallback = "") {
  const ext = path.extname(name);
  return ext && /^[.\w-]+$/.test(ext) ? ext : fallback;
}

function anyKey(o: SysReq) {
  return o.cpu || o.gpu || o.ram;
}

function cleanup(...files: (string | undefined)[]) {
  for (const f of files) if (f) fs.unlink(f, () => { });
}

function serialize(game: Game) {
  return { ...game, createdAt: Number(game.createdAt), fileSize: Number(game.fileSize) };
}

const tempStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, TEMP_DIR),
  filename: (_req, _file, cb) => cb(null, randomUUID()),
});

const upload = multer({
  storage: tempStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
});

const uploadFields = upload.fields([
  { name: "cover", maxCount: 1 },
  { name: "screenshots", maxCount: 8 },
]);

const chunkStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, CHUNKS_DIR),
  filename: (req, _file, cb) => {
    const sid = String(req.body.sessionId || "").replace(/[^a-z0-9-]/gi, "");
    const idx = String(parseInt(req.body.chunkIndex || "0", 10)).padStart(8, "0");
    cb(null, `${sid}_${idx}`);
  },
});

const chunkUpload = multer({
  storage: chunkStorage,
  limits: { fileSize: 100 * 1024 * 1024 },
});

router.post("/admin/auth", (req, res) => {
  const { password } = req.body ?? {};
  const adminPassword = process.env["ADMIN_PASSWORD"]?.trim();
  const supplied = typeof password === "string" ? password : "";

  if (adminPassword ? supplied === adminPassword : supplied.trim().length > 0) {
    res.json({ ok: true });
    return;
  }

  res.status(401).json({ ok: false, error: "كلمة السر غير صحيحة" });
});

router.get("/games", (_req, res) => {
  const games = readStore().games
    .slice()
    .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
    .map(serialize);
  res.json({ games });
});

router.get("/games/:id", (req, res) => {
  const game = readStore().games.find((g) => g.id === req.params.id);
  if (!game) {
    res.status(404).json({ error: "Game not found" });
    return;
  }
  res.json(serialize(game));
});

router.post("/games/:id/view", (req, res) => {
  const store = readStore();
  const game = store.games.find((g) => g.id === req.params.id);
  if (!game) {
    res.status(404).json({ error: "Game not found" });
    return;
  }
  game.viewCount = (game.viewCount ?? 0) + 1;
  writeStore(store);
  res.json({ viewCount: game.viewCount });
});

router.post("/games/chunk", chunkUpload.single("chunk"), (req, res) => {
  const sid = String(req.body.sessionId || "").replace(/[^a-z0-9-]/gi, "");
  const totalChunks = parseInt(req.body.totalChunks || "1", 10);
  const originalName = String(req.body.originalName || "game");

  if (!sid) {
    res.status(400).json({ error: "sessionId missing" });
    return;
  }

  for (let i = 0; i < totalChunks; i++) {
    const p = path.join(CHUNKS_DIR, `${sid}_${String(i).padStart(8, "0")}`);
    if (!fs.existsSync(p)) {
      res.json({ assembled: false });
      return;
    }
  }

  const ext = safeExt(originalName);
  const fileId = randomUUID();
  const filename = `${fileId}${ext}`;
  const filePath = diskPath(filename);

  try {
    fs.writeFileSync(filePath, Buffer.alloc(0));
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(CHUNKS_DIR, `${sid}_${String(i).padStart(8, "0")}`);
      fs.appendFileSync(filePath, fs.readFileSync(chunkPath));
      fs.unlinkSync(chunkPath);
    }

    const fileSize = fs.statSync(filePath).size;
    res.json({
      assembled: true,
      fileId,
      ext,
      fileSize,
      originalName,
      gcsPath: filename,
    });
  } catch (err) {
    req.log.error({ err }, "Local chunk assembly failed");
    cleanup(filePath);
    res.status(500).json({ error: "تعذر تجميع الملف" });
  }
});

router.post("/games", (req, res) => {
  uploadFields(req, res, (err) => {
    if (err) {
      req.log.error({ err }, "Upload failed");
      res.status(400).json({ error: err.message ?? "Upload failed" });
      return;
    }

    const files = req.files as
      | { [fieldname: string]: Express.Multer.File[] }
      | undefined;
    const coverFile = files?.cover?.[0];
    const screenshotFiles = files?.screenshots ?? [];
    const name = (req.body?.name ?? "").toString().trim();
    const description = (req.body?.description ?? "").toString().trim();
    const story = (req.body?.story ?? "").toString().trim();
    const fileId = (req.body?.fileId ?? "").toString().trim().replace(/[^a-z0-9-]/gi, "");
    const fileOriginalName = (req.body?.fileOriginalName ?? "game").toString().trim();
    const filename = path.basename((req.body?.gcsPath ?? "").toString().trim());
    const fileSize = Number(req.body?.fileSize ?? 0);
    const sysMin: SysReq = {
      cpu: (req.body?.minCpu ?? "").toString().trim() || undefined,
      gpu: (req.body?.minGpu ?? "").toString().trim() || undefined,
      ram: (req.body?.minRam ?? "").toString().trim() || undefined,
    };
    const sysRec: SysReq = {
      cpu: (req.body?.recCpu ?? "").toString().trim() || undefined,
      gpu: (req.body?.recGpu ?? "").toString().trim() || undefined,
      ram: (req.body?.recRam ?? "").toString().trim() || undefined,
    };

    if (!name) {
      coverFile && cleanup(coverFile.path);
      screenshotFiles.forEach((f) => cleanup(f.path));
      res.status(400).json({ error: "اسم اللعبة مطلوب" });
      return;
    }

    if (!fileId || !filename || !fs.existsSync(diskPath(filename))) {
      coverFile && cleanup(coverFile.path);
      screenshotFiles.forEach((f) => cleanup(f.path));
      res.status(400).json({ error: "ملف اللعبة مطلوب" });
      return;
    }

    let cover: string | null = null;
    const screenshots: string[] = [];

    try {
      if (coverFile) {
        cover = `cover-${fileId}${safeExt(coverFile.originalname, ".jpg")}`;
        fs.renameSync(coverFile.path, diskPath(cover));
      }

      for (let i = 0; i < screenshotFiles.length; i++) {
        const sf = screenshotFiles[i];
        const screenshot = `screenshot-${fileId}-${i}${safeExt(sf.originalname, ".jpg")}`;
        fs.renameSync(sf.path, diskPath(screenshot));
        screenshots.push(screenshot);
      }

      const game: Game = {
        id: fileId,
        name,
        description,
        story: story || null,
        filename,
        originalFilename: fileOriginalName,
        fileSize,
        cover,
        screenshots,
        systemMin: anyKey(sysMin) ? sysMin : null,
        systemRec: anyKey(sysRec) ? sysRec : null,
        downloadCount: 0,
        viewCount: 0,
        createdAt: Date.now(),
      };

      const store = readStore();
      store.games.unshift(game);
      writeStore(store);
      res.status(201).json(serialize(game));
    } catch (e) {
      req.log.error({ e }, "Failed to create local game");
      coverFile && cleanup(coverFile.path);
      screenshotFiles.forEach((f) => cleanup(f.path));
      res.status(500).json({ error: "فشل حفظ اللعبة" });
    }
  });
});

router.delete("/games/:id", (req, res) => {
  const store = readStore();
  const game = store.games.find((g) => g.id === req.params.id);
  if (!game) {
    res.status(404).json({ error: "Game not found" });
    return;
  }

  store.games = store.games.filter((g) => g.id !== req.params.id);
  writeStore(store);
  [game.filename, game.cover, ...(game.screenshots ?? [])]
    .filter(Boolean)
    .forEach((f) => cleanup(diskPath(String(f))));
  res.json({ success: true });
});

router.get("/games/:id/download", (req, res) => {
  const store = readStore();
  const game = store.games.find((g) => g.id === req.params.id);
  if (!game) {
    res.status(404).json({ error: "Game not found" });
    return;
  }

  const filePath = diskPath(game.filename);
  if (!fs.existsSync(filePath)) {
    res.status(404).json({ error: "Game file missing" });
    return;
  }

  game.downloadCount = (game.downloadCount ?? 0) + 1;
  writeStore(store);
  res.download(filePath, game.originalFilename || game.filename);
});

router.patch("/games/:id", (req, res) => {
  const store = readStore();
  const game = store.games.find((g) => g.id === req.params.id);
  if (!game) {
    res.status(404).json({ error: "Game not found" });
    return;
  }

  const { filename, originalFilename, fileSize } = req.body ?? {};
  if (typeof filename === "string" && filename.trim()) {
    game.filename = path.basename(filename.trim());
  }
  if (typeof originalFilename === "string" && originalFilename.trim()) {
    game.originalFilename = originalFilename.trim();
  }
  if (typeof fileSize === "number" && Number.isFinite(fileSize)) {
    game.fileSize = fileSize;
  }

  writeStore(store);
  res.json(serialize(game));
});

router.get("/games/:id/cover", (req, res) => {
  const game = readStore().games.find((g) => g.id === req.params.id);
  if (!game?.cover) {
    res.status(404).send("No cover");
    return;
  }

  const filePath = diskPath(game.cover);
  if (!fs.existsSync(filePath)) {
    res.status(404).send("Cover missing");
    return;
  }

  res.sendFile(filePath);
});

router.get("/games/:id/screenshots/:idx", (req, res) => {
  const game = readStore().games.find((g) => g.id === req.params.id);
  const idx = parseInt(req.params.idx, 10);
  const screenshot = game?.screenshots?.[idx];
  if (!screenshot) {
    res.status(404).send("Not found");
    return;
  }

  const filePath = diskPath(screenshot);
  if (!fs.existsSync(filePath)) {
    res.status(404).send("Missing");
    return;
  }

  res.sendFile(filePath);
});

export default router;
