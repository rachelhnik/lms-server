import express from "express";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth";
import { createOrder } from "../controllers/order.controller";

export const orderRouter = express.Router();

orderRouter.post("/create-order", isAuthenticated, createOrder);
