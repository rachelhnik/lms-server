import express from "express";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth";
import {
  addAnswer,
  addQuestion,
  addReview,
  deleteCourse,
  editCourse,
  generateVideoUrl,
  getAllCourses,
  getAllCoursesByAdmin,
  getCourseByUser,
  getSingleCourse,
  replyToReview,
  uploadCourse,
} from "../controllers/course.controller";
import { UpdateAccessToken } from "../controllers/user.controller";
export const courseRouter = express.Router();

courseRouter.post(
  "/create-course",
  UpdateAccessToken,
  isAuthenticated,
  authorizeRoles("admin"),
  uploadCourse
);
courseRouter.put(
  "/update-course/:id",
  UpdateAccessToken,
  isAuthenticated,
  authorizeRoles("admin"),
  editCourse
);
courseRouter.get("/get-course/:id", UpdateAccessToken, getSingleCourse);
courseRouter.get("/get-all-courses", UpdateAccessToken, getAllCourses);
courseRouter.get(
  "/get-purchased-course/:id",
  UpdateAccessToken,
  isAuthenticated,
  getCourseByUser
);
courseRouter.post(
  "/add-question",
  UpdateAccessToken,
  isAuthenticated,
  addQuestion
);
courseRouter.post("/add-answer", UpdateAccessToken, isAuthenticated, addAnswer);
courseRouter.post(
  "/add-review/:id",
  UpdateAccessToken,
  isAuthenticated,
  addReview
);
courseRouter.post(
  "/add-reply-review",
  UpdateAccessToken,
  isAuthenticated,
  authorizeRoles("admin"),
  replyToReview
);
courseRouter.get(
  "/get-all-courses-admin",
  UpdateAccessToken,
  isAuthenticated,
  authorizeRoles("admin"),
  getAllCoursesByAdmin
);
courseRouter.delete(
  "/delete-course/:id",
  UpdateAccessToken,
  isAuthenticated,
  authorizeRoles("admin"),
  deleteCourse
);

courseRouter.post("/getVideoCipherOtp", generateVideoUrl);
