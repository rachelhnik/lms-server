import express from "express";
import {
  LoginUser,
  activateUser,
  registerUser,
} from "../controllers/user.controller";

export const userRouter = express.Router();

userRouter.post("/registration", registerUser);
userRouter.post("/activation", activateUser);
userRouter.post("/login-user", LoginUser);
