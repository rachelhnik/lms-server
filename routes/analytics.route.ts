import express from "express";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth";
import {
  getCourseAnalytics,
  getOrdersAnalytics,
  getUsersAnalytics,
} from "../controllers/analytics.controller";

export const analyticRouter = express.Router();

analyticRouter.get(
  "/get-users-analytics",
  isAuthenticated,
  authorizeRoles("Admin"),
  getUsersAnalytics
);

analyticRouter.get(
  "/get-courses-analytics",
  isAuthenticated,
  authorizeRoles("Admin"),
  getCourseAnalytics
);

analyticRouter.get(
  "/get-orders-analytics",
  isAuthenticated,
  authorizeRoles("Admin"),
  getOrdersAnalytics
);
