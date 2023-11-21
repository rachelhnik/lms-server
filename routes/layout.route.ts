import express from "express";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth";
import {
  createLayout,
  editLayout,
  getLayoutByType,
} from "../controllers/layout.controller";
import { UpdateAccessToken } from "../controllers/user.controller";

export const layoutRouter = express.Router();

layoutRouter.post(
  "/create",
  UpdateAccessToken,
  isAuthenticated,
  authorizeRoles("admin"),
  createLayout
);
layoutRouter.put(
  "/edit",
  UpdateAccessToken,
  isAuthenticated,
  authorizeRoles("admin"),
  editLayout
);
layoutRouter.get("/get-layout/:type", UpdateAccessToken, getLayoutByType);
