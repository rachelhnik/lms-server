import { NextFunction, Response } from "express";
import { CatchAsyncError } from "../middlewares/catchAsyncError";
import Order from "../models/order.model";

const confirmNewOrder = CatchAsyncError(
  async (orderData: any, res: Response, next: NextFunction) => {
    const newOrder = await Order.create(orderData);
    res.status(201).json({
      success: true,
      order: newOrder,
    });
  }
);

export default confirmNewOrder;
