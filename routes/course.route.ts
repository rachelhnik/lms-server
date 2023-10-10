import express from "express";
import { authorizeRoles, isAuthenticated } from "../middlewares/auth";
import {
  addAnswer,
  addQuestion,
  addReview,
  deleteCourse,
  editCourse,
  getAllCourses,
  getAllCoursesByAdmin,
  getCourseByUser,
  getSingleCourse,
  replyToReview,
  uploadCourse,
} from "../controllers/course.controller";
export const courseRouter = express.Router();

courseRouter.post(
  "/create-course",
  isAuthenticated,
  authorizeRoles("Admin"),
  uploadCourse
);

courseRouter.put(
  "/update-course/:id",
  isAuthenticated,
  authorizeRoles("Admin"),
  editCourse
);

courseRouter.get("/get-course/:id", getSingleCourse);
courseRouter.get("/get-all-courses", getAllCourses);

courseRouter.get("/get-purchased-course/:id", isAuthenticated, getCourseByUser);

courseRouter.post("/add-question", isAuthenticated, addQuestion);
courseRouter.post(
  "/add-answer",
  isAuthenticated,
  authorizeRoles("Admin"),
  addAnswer
);
courseRouter.post("/add-review/:id", isAuthenticated, addReview);
courseRouter.post(
  "/add-reply-review",
  isAuthenticated,
  authorizeRoles("Admin"),
  replyToReview
);
courseRouter.get(
  "/get-all-courses-admin",
  isAuthenticated,
  authorizeRoles("Admin"),
  getAllCoursesByAdmin
);
courseRouter.delete(
  "/delete-course/:id",
  isAuthenticated,
  authorizeRoles("Admin"),
  deleteCourse
);
