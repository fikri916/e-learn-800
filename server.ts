import express from "express";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { createApiRouter } from "./src/server/api";

const PORT = 3000;
const isProduction = process.env.NODE_ENV === "production";

async function startServer() {
  const app = express();

  // Basic middleware
  app.use(cookieParser());
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Ensure public and public/uploads directories exist
  const publicDir = path.resolve(process.cwd(), "public");
  const uploadsDir = path.resolve(process.cwd(), "public/uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Static uploads directory
  app.use("/uploads", express.static(uploadsDir));
  app.use(express.static(publicDir));

  // Mount API router
  app.use("/api", createApiRouter());

  // Mount Vite or static dist
  if (!isProduction) {
    const vite = await createViteServer({
      root: process.cwd(),
      configFile: path.resolve(process.cwd(), "vite.config.ts"),
      server: { middlewareMode: true, hmr: false },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), "dist");
    app.use(express.static(distDir));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`✓ e-learning server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Fatal error starting server:", err);
  process.exit(1);
});
