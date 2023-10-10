import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middlewares/catchAsyncError";
import ErrorHandler from "../utils/errorHandler";
import Notification from "../models/nodification.model";
import cron from "node-cron";

export const getNotifications = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const notifications = await Notification.find().sort({ createdAt: -1 });
      res.status(201).json({ success: true, notifications });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

export const updateNotification = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const notification = await Notification.findById(req.params.id);
      if (!notification) {
        return next(new ErrorHandler("Notification not found", 404));
      } else {
        notification.status = "read";
      }
      await notification.save();

      const notifications = await Notification.find().sort({ createdAt: -1 });
      res.status(201).json({ success: true, notifications });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500));
    }
  }
);

cron.schedule("0 0 0 * * *", async () => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  await Notification.deleteMany({
    status: "read",
    createdAt: { $lt: thirtyDaysAgo },
  });
  console.log("deleted read notifications");
});
