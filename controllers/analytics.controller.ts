import { CatchAsyncError } from "../middlewares/catchAsyncError";
import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/errorHandler";
import { generateLast12MonthsData } from "../utils/analytics.generator";
import User from "../models/user.model";
import Course from "../models/course.model";
import Order from "../models/order.model";

export const getUsersAnalytics = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const type = "user";
      const users = await generateLast12MonthsData(User, type, req);
      res.status(200).json({ success: true, users });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

export const getCourseAnalytics = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const type = "course";
      const courses = await generateLast12MonthsData(Course, type, req);
      res.status(200).json({ success: true, courses });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

export const getOrdersAnalytics = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const type = "order";
      const orders = await generateLast12MonthsData(Order, type, req);
      res.status(200).send({ success: true, orders });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);
