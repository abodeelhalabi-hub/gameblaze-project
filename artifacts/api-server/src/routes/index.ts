import { Router, type IRouter } from "express";
import healthRouter from "./health";

const router: IRouter = Router();

router.use(healthRouter);

const useLocalStorage =
  process.env["LOCAL_API_STORAGE"] === "1" || !process.env["DATABASE_URL"];
const gamesRouter = useLocalStorage
  ? (await import("./games.local")).default
  : (await import("./games")).default;

router.use(gamesRouter);

export default router;
