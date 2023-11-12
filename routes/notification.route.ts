import express from "express";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth";
import {
  getNotifications,
  updateNotification,
} from "../controllers/notification.controller";
import { UpdateAccessToken } from "../controllers/user.controller";

export const notificationRouter = express.Router();

notificationRouter.get("/get-notifications", isAuthenticated, getNotifications);
notificationRouter.put(
  "/update-notification/:id",
  UpdateAccessToken,
  isAuthenticated,
  updateNotification
);
