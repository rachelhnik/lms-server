require("dotenv").config();
import express, { NextFunction, Request, Response } from "express";

export const app = express();
import cors from "cors";
import cookieParser from "cookie-parser";
import { userRouter } from "./routes/user.route";

app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(cors({ origin: process.env.ORIGIN }));
app.use("/api/v1/user", userRouter);

app.get("/test", (req: Request, res: Response, next: NextFunction) => {
  res.status(200).json({
    success: true,
    message: "API is working",
  });
});

app.use("*", (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Route ${req.originalUrl} not found`) as any;
  error.statusCode = 404;
  next(error);
});
