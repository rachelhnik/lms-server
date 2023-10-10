import express from "express";
import {
  LoginUser,
  LogoutUser,
  UpdateAccessToken,
  UpdatePassword,
  UpdateProfilePhoto,
  UpdateUserInfo,
  activateUser,
  deleteUser,
  getAllUsers,
  getUserInfo,
  registerUser,
  socialAuth,
  updateUserRole,
} from "../controllers/user.controller";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth";

export const userRouter = express.Router();

userRouter.post("/registration", registerUser);
userRouter.post("/activation", activateUser);
userRouter.post("/login-user", LoginUser);
userRouter.get("/logout-user", isAuthenticated, LogoutUser);
userRouter.get("/update-accessToken", isAuthenticated, UpdateAccessToken);
userRouter.get("/iuser", isAuthenticated, getUserInfo);
userRouter.post("/social-login", socialAuth);
userRouter.put("/update-user", isAuthenticated, UpdateUserInfo);
userRouter.put("/update-password", isAuthenticated, UpdatePassword);
userRouter.post("/update-profile-photo", isAuthenticated, UpdateProfilePhoto);
userRouter.get(
  "/get-all-users",
  isAuthenticated,
  authorizeRoles("Admin"),
  getAllUsers
);
userRouter.put(
  "/update-user-role",
  isAuthenticated,
  authorizeRoles("Admin"),
  updateUserRole
);
userRouter.delete(
  "/delete-user/:id",
  isAuthenticated,
  authorizeRoles("Admin"),
  deleteUser
);
