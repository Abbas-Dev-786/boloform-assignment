import express, { type Application } from "express";
import morgan from "morgan";
import cors from "cors";
import path from "path";
import { globalErrorHandler } from "./controllers/error.controller.js";
import AppError from "./utils/AppError.js";
import documentRoutes from "./routes/document.routes.js";
import auditRoutes from "./routes/audit.routes.js";
import shareRoutes from "./routes/share.routes.js";

const app: Application = express();

// Middleware
app.use(cors({ origin: "*", credentials: true }));
app.use(morgan("dev"));
app.use(express.json({ limit: "50mb" })); // Increased for base64 signatures
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// API Routes
const BASE_API = "/api/v1";
app.use(`${BASE_API}/documents`, documentRoutes);
app.use(`${BASE_API}/audit`, auditRoutes);
app.use(`${BASE_API}/share`, shareRoutes);

// Handle unknown routes
app.use("/{*splat}", (req, res, next) => {
  next(new AppError(404, `Can't find ${req.originalUrl} on this server`));
});

// Global error handler
app.use(globalErrorHandler);

export default app;
