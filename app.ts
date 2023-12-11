require("dotenv").config();
import express, { NextFunction, Request, Response } from "express";

export const app = express();
import cors from "cors";
import cookieParser from "cookie-parser";
import { userRouter } from "./routes/user.route";
import { courseRouter } from "./routes/course.route";
import { orderRouter } from "./routes/order.route";
import { notificationRouter } from "./routes/notification.route";
import { analyticRouter } from "./routes/analytics.route";
import { layoutRouter } from "./routes/layout.route";
import { rateLimit } from "express-rate-limit";

app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});
app.use("/api/v1/user", userRouter);
app.use("/api/v1/courses", courseRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/analytics", analyticRouter);
app.use("/api/v1/layouts", layoutRouter);

app.get("/test", (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    success: true,
    message: "API is working",
  });
});

app.use(limiter);

app.use("*", (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Route ${req.originalUrl} not found`) as any;
  error.statusCode = 404;
  next(error);
});
