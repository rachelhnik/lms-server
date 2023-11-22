import express from "express";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth";
import { createOrder, getAllOrders } from "../controllers/order.controller";
import { UpdateAccessToken } from "../controllers/user.controller";

export const orderRouter = express.Router();

orderRouter.post("/create-order", isAuthenticated, createOrder);

orderRouter.get(
  "/get-all-orders",
  UpdateAccessToken,
  isAuthenticated,
  authorizeRoles("admin"),
  getAllOrders
);
