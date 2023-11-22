import { NextFunction, Response } from "express";
import { CatchAsyncError } from "../middlewares/catchAsyncError";
import Order from "../models/order.model";

export const confirmNewOrder = CatchAsyncError(
  async (orderData: any, res: Response, next: NextFunction) => {
    const newOrder = await Order.create(orderData);
    res.status(201).json({
      success: true,
      order: newOrder,
    });
  }
);

export const getAllOrdersService = async (res: Response) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  console.log("orders", orders);
  res.status(200).json({
    success: true,
    orders,
  });
};
