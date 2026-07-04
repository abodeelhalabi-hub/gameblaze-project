import { Router, type IRouter } from "express";
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { db as dbClient, gamesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { objectStorageClient, signObjectURL } from "../lib/objectStorage";

const router: IRouter = Router();
const db = dbClient!;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, "../data");
const UPLOADS_DIR = path.join(DATA_DIR, "uploads");
const CHUNKS_DIR = path.join(DATA_DIR, "chunks");
const TEMP_DIR = path.join(DATA_DIR, "temp");
const DB_FILE = path.join(DATA_DIR, "games.json");
const COMMENTS_FILE = path.join(DATA_DIR, "comments.json");

type Comment = {
  id: string;
  gameId: string;
  author: string;
  text: string;
  createdAt: number;
};

type CommentsStore = { comments: Comment[] };

[UPLOADS_DIR, CHUNKS_DIR, TEMP_DIR].forEach((d) => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

function readCommentsStore(): CommentsStore {
  if (!fs.existsSync(COMMENTS_FILE)) return { comments: [] };
  try {
    const parsed = JSON.parse(fs.readFileSync(COMMENTS_FILE, "utf8")) as CommentsStore;
    return { comments: Array.isArray(parsed.comments) ? parsed.comments : [] };
  } catch {
    return { comments: [] };
  }
}

function writeCommentsStore(store: CommentsStore) {
  fs.writeFileSync(COMMENTS_FILE, JSON.stringify(store, null, 2));
}

function commentsForGame(gameId: string): Comment[] {
  const store = readCommentsStore();
  return store.comments.filter((comment) => comment.gameId === gameId).sort((a, b) => b.createdAt - a.createdAt);
}

function addComment(gameId: string, author: string, text: string): Comment {
  const store = readCommentsStore();
  const comment: Comment = {
    id: randomUUID(),
    gameId,
    author: author || "زائر",
    text,
    createdAt: Date.now(),
  };
  store.comments.push(comment);
  writeCommentsStore(store);
  return comment;
}

const BUCKET_ID = process.env.DEFAULT_OBJECT_STORAGE_BUCKET_ID ?? "";

const DOWNLOAD_UI_VERSION = "v2";

type SysReq = { cpu?: string; gpu?: string; ram?: string };

async function uploadFileToGCS(localPath: string, gcsPath: string): Promise<void> {
  if (!BUCKET_ID) throw new Error("Object storage not configured");
  const bucket = objectStorageClient.bucket(BUCKET_ID);
  await bucket.upload(localPath, { destination: gcsPath });
}

function isGCSPath(p: string): boolean {
  return p.startsWith("gcs:");
}

function gcsKey(p: string): string {
  return p.replace(/^gcs:/, "");
}

async function streamGCS(
  gcsPath: string,
  res: import("express").Response,
  opts: { download?: string; contentType?: string } = {},
): Promise<void> {
  const bucket = objectStorageClient.bucket(BUCKET_ID);
  const file = bucket.file(gcsKey(gcsPath));
  const [exists] = await file.exists();
  if (!exists) {
    res.status(404).json({ error: "File not found in storage" });
    return;
  }
  if (opts.download) {
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${opts.download}"`,
    );
  }
  if (opts.contentType) res.setHeader("Content-Type", opts.contentType);
  const [meta] = await file.getMetadata();
  if (meta.size) res.setHeader("Content-Length", String(meta.size));
  file.createReadStream().pipe(res);
}

async function deleteGCS(gcsPath: string): Promise<void> {
  try {
    const bucket = objectStorageClient.bucket(BUCKET_ID);
    await bucket.file(gcsKey(gcsPath)).delete({ ignoreNotFound: true });
  } catch {
    /* ignore */
  }
}

function diskPath(filename: string): string {
  return path.join(UPLOADS_DIR, filename);
}

async function migrateFromJSON(): Promise<void> {
  if (!fs.existsSync(DB_FILE)) return;
  try {
    const raw = fs.readFileSync(DB_FILE, "utf8");
    const parsed = JSON.parse(raw) as { games?: Record<string, unknown>[] };
    if (!Array.isArray(parsed.games) || parsed.games.length === 0) return;
    const existing = await db.select({ id: gamesTable.id }).from(gamesTable);
    const existingIds = new Set(existing.map((r) => r.id));
    for (const g of parsed.games) {
      const id = String(g.id ?? "");
      if (!id || existingIds.has(id)) continue;
      await db.insert(gamesTable).values({
        id,
        name: String(g.name ?? ""),
        description: String(g.description ?? ""),
        story: g.story ? String(g.story) : null,
        filename: String(g.filename ?? ""),
        originalFilename: String(g.originalFilename ?? g.filename ?? ""),
        fileSize: Number(g.fileSize ?? 0),
        cover: g.cover ? String(g.cover) : null,
        screenshots: Array.isArray(g.screenshots) ? (g.screenshots as string[]) : [],
        systemMin: g.systemMin && typeof g.systemMin === "object" && !Array.isArray(g.systemMin) ? (g.systemMin as SysReq) : null,
        systemRec: g.systemRec && typeof g.systemRec === "object" && !Array.isArray(g.systemRec) ? (g.systemRec as SysReq) : null,
        downloadCount: Number(g.downloadCount ?? 0),
        viewCount: Number(g.viewCount ?? 0),
        createdAt: g.createdAt ? new Date(Number(g.createdAt)) : new Date(),
      }).onConflictDoNothing();
    }
  } catch (err) {
    console.error("Migration from JSON failed:", err);
  }
}

migrateFromJSON().catch(() => { });

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
const chunkUpload = multer({ storage: chunkStorage, limits: { fileSize: 100 * 1024 * 1024 } });

function anyKey(o: SysReq) {
  return o.cpu || o.gpu || o.ram;
}

function cleanup(...files: (string | undefined)[]) {
  for (const f of files) if (f) fs.unlink(f, () => { });
}

router.post("/admin/auth", (req, res) => {
  const { password } = req.body ?? {};
  const adminPassword = process.env["ADMIN_PASSWORD"] ?? "";
  if (!adminPassword) {
    res.status(500).json({ error: "Admin password not configured" });
    return;
  }
  if (password === adminPassword) res.json({ ok: true });
  else res.status(401).json({ ok: false, error: "كلمة السر غير صحيحة" });
});

router.get("/games", async (_req, res) => {
  try {
    const rows = await db.select().from(gamesTable).orderBy(desc(gamesTable.createdAt));
    res.json({ games: rows.map((g) => ({ ...g, createdAt: g.createdAt.getTime(), fileSize: Number(g.fileSize) })) });
  } catch {
    res.status(500).json({ error: "فشل تحميل الألعاب" });
  }
});

router.get("/games/:id", async (req, res) => {
  try {
    const [game] = await db.select().from(gamesTable).where(eq(gamesTable.id, req.params.id));
    if (!game) {
      res.status(404).json({ error: "Game not found" });
      return;
    }
    res.json({
      ...game,
      createdAt: game.createdAt.getTime(),
      fileSize: Number(game.fileSize),
      comments: commentsForGame(game.id),
    });
  } catch {
    res.status(500).json({ error: "فشل تحميل بيانات اللعبة" });
  }
});

router.post("/games/:id/comments", async (req, res) => {
  try {
    const [game] = await db.select().from(gamesTable).where(eq(gamesTable.id, req.params.id));
    if (!game) {
      res.status(404).json({ error: "Game not found" });
      return;
    }

    const author = (req.body?.author ?? "").toString().trim() || "زائر";
    const text = (req.body?.text ?? "").toString().trim();
    if (!text) {
      res.status(400).json({ error: "نص التعليق مطلوب" });
      return;
    }

    const comment = addComment(game.id, author, text);
    res.status(201).json(comment);
  } catch {
    res.status(500).json({ error: "فشل إضافة التعليق" });
  }
});

router.post("/games/:id/view", async (req, res) => {
  try {
    const [game] = await db.select().from(gamesTable).where(eq(gamesTable.id, req.params.id));
    if (!game) {
      res.status(404).json({ error: "Game not found" });
      return;
    }
    const newCount = (game.viewCount ?? 0) + 1;
    await db.update(gamesTable).set({ viewCount: newCount }).where(eq(gamesTable.id, req.params.id));
    res.json({ viewCount: newCount });
  } catch {
    res.status(500).json({ error: "فشل" });
  }
});

router.post("/games/chunk", chunkUpload.single("chunk"), async (req, res) => {
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
  const ext = path.extname(originalName) || "";
  const fileId = randomUUID();
  const tempPath = path.join(TEMP_DIR, `${fileId}${ext}`);
  try {
    fs.writeFileSync(tempPath, Buffer.alloc(0));
    for (let i = 0; i < totalChunks; i++) {
      const chunkPath = path.join(CHUNKS_DIR, `${sid}_${String(i).padStart(8, "0")}`);
      fs.appendFileSync(tempPath, fs.readFileSync(chunkPath));
      fs.unlinkSync(chunkPath);
    }
    const fileSize = fs.statSync(tempPath).size;
    const gcsGamePath = `games/files/${fileId}${ext}`;
    await uploadFileToGCS(tempPath, gcsGamePath);
    fs.unlink(tempPath, () => { });
    res.json({ assembled: true, fileId, ext, fileSize, originalName, gcsPath: `gcs:${gcsGamePath}` });
  } catch (err) {
    req.log.error({ err }, "Chunk assembly/upload failed");
    try { fs.unlinkSync(tempPath); } catch { /* ignore */ }
    res.status(500).json({ error: "تعذّر تجميع أو رفع الملف" });
  }
});

router.post("/games", (req, res) => {
  uploadFields(req, res, async (err) => {
    if (err) {
      req.log.error({ err }, "Upload failed");
      res.status(400).json({ error: err.message ?? "Upload failed" });
      return;
    }
    const files = req.files as | { [fieldname: string]: Express.Multer.File[] } | undefined;
    const coverFile = files?.cover?.[0];
    const screenshotFiles = files?.screenshots ?? [];
    const name = (req.body?.name ?? "").toString().trim();
    const description = (req.body?.description ?? "").toString().trim();
    const story = (req.body?.story ?? "").toString().trim();
    const fileId = (req.body?.fileId ?? "").toString().trim().replace(/[^a-z0-9-]/gi, "");
    const fileOriginalName = (req.body?.fileOriginalName ?? "game").toString().trim();
    const gcsPathRaw = (req.body?.gcsPath ?? "").toString().trim();
    const fileSize = Number(req.body?.fileSize ?? 0);
    const sysMin: SysReq = { cpu: (req.body?.minCpu ?? "").toString().trim() || undefined, gpu: (req.body?.minGpu ?? "").toString().trim() || undefined, ram: (req.body?.minRam ?? "").toString().trim() || undefined };
    const sysRec: SysReq = { cpu: (req.body?.recCpu ?? "").toString().trim() || undefined, gpu: (req.body?.recGpu ?? "").toString().trim() || undefined, ram: (req.body?.recRec ?? "").toString().trim() || undefined };
    if (!name) {
      coverFile && cleanup(coverFile.path);
      screenshotFiles.forEach((f) => cleanup(f.path));
      res.status(400).json({ error: "اسم اللعبة مطلوب" });
      return;
    }
    if (!fileId || !gcsPathRaw) {
      coverFile && cleanup(coverFile.path);
      screenshotFiles.forEach((f) => cleanup(f.path));
      res.status(400).json({ error: "ملف اللعبة مطلوب" });
      return;
    }
    try {
      let coverGCS: string | null = null;
      if (coverFile) {
        const coverExt = path.extname(coverFile.originalname) || ".jpg";
        const coverKey = `games/covers/${fileId}${coverExt}`;
        await uploadFileToGCS(coverFile.path, coverKey);
        cleanup(coverFile.path);
        coverGCS = `gcs:${coverKey}`;
      }
      const screenshotsGCS: string[] = [];
      for (let i = 0; i < screenshotFiles.length; i++) {
        const sf = screenshotFiles[i];
        const ssExt = path.extname(sf.originalname) || ".jpg";
        const ssKey = `games/screenshots/${fileId}/${i}${ssExt}`;
        await uploadFileToGCS(sf.path, ssKey);
        cleanup(sf.path);
        screenshotsGCS.push(`gcs:${ssKey}`);
      }
      const [inserted] = await db.insert(gamesTable).values({ id: fileId, name, description, story: story || null, filename: gcsPathRaw, originalFilename: fileOriginalName, fileSize, cover: coverGCS, screenshots: screenshotsGCS, systemMin: anyKey(sysMin) ? sysMin : null, systemRec: anyKey(sysRec) ? sysRec : null, downloadCount: 0, viewCount: 0, createdAt: new Date() }).returning();
      res.status(201).json({ ...inserted, createdAt: inserted.createdAt.getTime(), fileSize: Number(inserted.fileSize) });
    } catch (e) {
      req.log.error({ e }, "Failed to create game");
      res.status(500).json({ error: "فشل حفظ اللعبة" });
    }
  });
});

// Migrate legacy disk files to GCS (one game at a time, call repeatedly until done)
router.post("/admin/migrate-to-gcs", async (req, res) => {
  const { password } = req.body ?? {};
  if (!password || password !== process.env["ADMIN_PASSWORD"]) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const rows = await db.select().from(gamesTable);
    const legacy = rows.filter((g) => !isGCSPath(g.filename));
    if (legacy.length === 0) {
      res.json({ done: true, message: "كل الألعاب في GCS بالفعل ✓" });
      return;
    }
    // Process one file per call to avoid timeout
    const game = legacy[0];
    const localFile = diskPath(game.filename);
    if (!fs.existsSync(localFile)) {
      // File missing on disk — just update the record to mark as missing
      req.log.warn({ id: game.id, filename: game.filename }, "Legacy file missing on disk, skipping");
      res.json({ done: false, skipped: game.name, remaining: legacy.length - 1, reason: "file not on disk" });
      return;
    }
    const ext = path.extname(game.filename) || ".rar";
    const gcsGamePath = `games/files/${game.id}${ext}`;
    req.log.info({ id: game.id, filename: game.filename, gcsGamePath }, "Migrating to GCS...");
    await uploadFileToGCS(localFile, gcsGamePath);
    const newGCSRef = `gcs:${gcsGamePath}`;
    await db.update(gamesTable).set({ filename: newGCSRef }).where(eq(gamesTable.id, game.id));
    // Clean up local file after successful upload
    fs.unlink(localFile, () => { });
    res.json({ done: false, migrated: game.name, gcsPath: newGCSRef, remaining: legacy.length - 1 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    req.log.error({ err }, "Migration failed");
    res.status(500).json({ error: msg });
  }
});

router.delete("/games/:id", async (req, res) => {
  try {
    const [game] = await db.select().from(gamesTable).where(eq(gamesTable.id, req.params.id));
    if (!game) {
      res.status(404).json({ error: "Game not found" });
      return;
    }
    await db.delete(gamesTable).where(eq(gamesTable.id, req.params.id));
    const filesToDelete = [game.filename, game.cover, ...(game.screenshots ?? [])].filter(Boolean) as string[];
    for (const f of filesToDelete) {
      if (isGCSPath(f)) await deleteGCS(f);
      else fs.unlink(diskPath(f), () => { });
    }
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "فشل حذف اللعبة" });
  }
});

router.get("/games/:id/download", async (req, res) => {
  try {
    const [game] = await db.select().from(gamesTable).where(eq(gamesTable.id, req.params.id));
    if (!game) {
      res.status(404).json({ error: "Game not found" });
      return;
    }

    const originalName = String(game.originalFilename || game.filename || "game");
    const ext = path.extname(originalName) || path.extname(String(game.filename || "")) || ".rar";
    const cleanName = String(game.name || "game")
      .replace(/[^\w\u0600-\u06FF\s\-_.]/g, "")
      .trim()
      .replace(/\s+/g, "_") || "game";
    const downloadName = `${cleanName}${ext}`;

    req.log.info({ id: game.id, filename: game.filename }, "Download requested (signed URL)");

    // Resolve GCS object key — handles both "gcs:..." and legacy bare filename
    async function resolveGCSKey(): Promise<string | null> {
      if (!BUCKET_ID) return null;
      if (isGCSPath(game.filename)) {
        const key = gcsKey(game.filename);
        const [exists] = await objectStorageClient.bucket(BUCKET_ID).file(key).exists();
        return exists ? key : null;
      }
      // Legacy: bare filename stored without gcs: prefix
      const legacyKey = `games/files/${game.filename}`;
      const [legacyExists] = await objectStorageClient.bucket(BUCKET_ID).file(legacyKey).exists();
      return legacyExists ? legacyKey : null;
    }

    const objectKey = await resolveGCSKey();

    if (objectKey && BUCKET_ID) {
      // Stream the file directly from GCS with a controlled download filename.
      // This ensures the browser sees the name we want instead of the original upload name.
      await streamGCS(`gcs:${objectKey}`, res, { download: downloadName });
      db.update(gamesTable)
        .set({ downloadCount: (game.downloadCount ?? 0) + 1 })
        .where(eq(gamesTable.id, req.params.id))
        .catch(() => { });
      return;
    }

    // Last resort: local disk (legacy pre-GCS uploads)
    const filePath = diskPath(game.filename);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: "Game file missing" });
      return;
    }
    await db.update(gamesTable)
      .set({ downloadCount: (game.downloadCount ?? 0) + 1 })
      .where(eq(gamesTable.id, req.params.id));
    res.download(filePath, downloadName, (err) => {
      if (!err) return;
      if (!res.headersSent) res.status(500).json({ error: "Download failed" });
      else res.destroy(err);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to download";
    req.log.error({ error, id: req.params.id }, "Download route failed");
    if (!res.headersSent) res.status(500).json({ error: message });
  }
});

router.patch("/games/:id", async (req, res) => {
  try {
    const [game] = await db.select().from(gamesTable).where(eq(gamesTable.id, req.params.id));
    if (!game) {
      res.status(404).json({ error: "Game not found" });
      return;
    }
    const { filename, originalFilename, fileSize } = req.body ?? {};
    const updates: Partial<typeof game> = {};
    if (typeof filename === "string" && filename.trim()) updates.filename = filename.trim() as typeof game.filename;
    if (typeof originalFilename === "string" && originalFilename.trim()) updates.originalFilename = originalFilename.trim() as typeof game.originalFilename;
    if (typeof fileSize === "number" && Number.isFinite(fileSize)) updates.fileSize = fileSize as typeof game.fileSize;
    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: "No updates provided" });
      return;
    }
    const [updated] = await db.update(gamesTable).set(updates).where(eq(gamesTable.id, req.params.id)).returning();
    res.json({ ...updated, createdAt: updated.createdAt.getTime(), fileSize: Number(updated.fileSize) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update game";
    res.status(500).json({ error: message });
  }
});

router.get("/games/:id/cover", async (req, res) => {
  try {
    const [game] = await db.select().from(gamesTable).where(eq(gamesTable.id, req.params.id));
    if (!game || !game.cover) {
      res.status(404).send("No cover");
      return;
    }
    if (isGCSPath(game.cover)) await streamGCS(game.cover, res);
    else {
      const filePath = diskPath(game.cover);
      if (!fs.existsSync(filePath)) {
        res.status(404).send("Cover missing");
        return;
      }
      res.sendFile(filePath);
    }
  } catch {
    res.status(500).send("Error");
  }
});

router.get("/games/:id/screenshots/:idx", async (req, res) => {
  try {
    const [game] = await db.select().from(gamesTable).where(eq(gamesTable.id, req.params.id));
    const idx = parseInt(req.params.idx, 10);
    if (!game || Number.isNaN(idx) || !game.screenshots?.[idx]) {
      res.status(404).send("Not found");
      return;
    }
    const ss = game.screenshots[idx];
    if (isGCSPath(ss)) await streamGCS(ss, res);
    else {
      const filePath = diskPath(ss);
      if (!fs.existsSync(filePath)) {
        res.status(404).send("Missing");
        return;
      }
      res.sendFile(filePath);
    }
  } catch {
    res.status(500).send("Error");
  }
});

export default router;
