import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import morgan from "morgan";
import cors from "cors";
import { globalErrorHandler } from "./controllers/error.controller.js";
import AppError from "./utils/AppError.js";

const app: Application = express();

// Middleware
app.use(cors({ origin: "*", credentials: true }));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", (req: Request, res: Response) => {
  res.send("Hello, TypeScript + Express!");
});

// handle unknown routes
app.use("/{*splat}", (req, res, next) => {
  next(new AppError(404, `Can't find ${req.originalUrl} on this server`));
});

// global error handler
app.use(globalErrorHandler);

export default app;
