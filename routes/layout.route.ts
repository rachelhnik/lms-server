import express from "express";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth";
import {
  createLayout,
  editLayout,
  getLayoutByType,
} from "../controllers/layout.controller";

export const layoutRouter = express.Router();

layoutRouter.post(
  "/create",
  isAuthenticated,
  authorizeRoles("Admin"),
  createLayout
);
layoutRouter.put("/edit", isAuthenticated, authorizeRoles("Admin"), editLayout);
layoutRouter.get("/get-layout", getLayoutByType);
