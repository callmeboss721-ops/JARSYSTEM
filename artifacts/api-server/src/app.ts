import express, { type Express } from "express";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(cookieParser());
app.use(
  "/api/loyalty/owner/products/import",
  express.json({ limit: "640kb", inflate: false }),
);
app.use("/api/ai-notes", express.json({ limit: "128kb", inflate: false }));
app.use(express.json({ limit: "8kb", inflate: false }));

app.use("/api", router);
app.use(
  (
    err: unknown,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    const status =
      typeof err === "object" && err !== null && "status" in err
        ? Number(err.status)
        : 500;
    const safeStatus = [400, 413, 415].includes(status) ? status : 500;
    if (safeStatus === 500) {
      req.log.error(
        { errorName: err instanceof Error ? err.name : "unknown" },
        "Request failed",
      );
    } else {
      req.log.warn({ status: safeStatus }, "Request rejected");
    }
    res.status(safeStatus).json({
      error:
        safeStatus === 413
          ? "ข้อมูลมีขนาดใหญ่เกินไป"
          : "ไม่สามารถดำเนินการได้ กรุณาตรวจสอบข้อมูล",
    });
  },
);

export default app;
