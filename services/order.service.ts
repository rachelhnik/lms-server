import { NextFunction, Response, Request } from "express";
import { CatchAsyncError } from "../middlewares/catchAsyncError";
import Order from "../models/order.model";
import Course from "../models/course.model";

export const confirmNewOrder = CatchAsyncError(
  async (orderData: any, user: any, res: Response) => {
    const newOrder = await Order.create(orderData);
    console.log("new", newOrder, user);
    res.status(201).json({
      success: true,
      order: newOrder,
      user: user,
    });
  }
);

export const getAllOrdersService = async (req: Request, res: Response) => {
  const coursesCreatedByUser = await Course.find({ userId: req?.user?._id });
  const courseIds = coursesCreatedByUser.map(
    (course) => course._id
  ) as string[];
  const orders = await Order.find({ courseId: { $in: courseIds } }).sort({
    createdAt: -1,
  });
  res.status(200).json({
    success: true,
    orders,
  });
};
