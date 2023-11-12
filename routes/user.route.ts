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
userRouter.get("/iuser", UpdateAccessToken, isAuthenticated, getUserInfo);
userRouter.post("/social-login", socialAuth);
userRouter.put(
  "/update-user",
  UpdateAccessToken,
  isAuthenticated,
  UpdateUserInfo
);
userRouter.put(
  "/update-password",
  UpdateAccessToken,
  isAuthenticated,
  UpdatePassword
);
userRouter.put(
  "/update-profile-photo",
  UpdateAccessToken,
  isAuthenticated,
  UpdateProfilePhoto
);
userRouter.get(
  "/get-all-users",
  UpdateAccessToken,
  isAuthenticated,
  authorizeRoles("admin"),
  getAllUsers
);
userRouter.put(
  "/update-user-role",
  UpdateAccessToken,
  isAuthenticated,
  authorizeRoles("admin"),
  updateUserRole
);
userRouter.delete(
  "/delete-user/:id",
  UpdateAccessToken,
  isAuthenticated,
  authorizeRoles("admin"),
  deleteUser
);
