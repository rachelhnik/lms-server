import { Response } from "express";
import { CatchAsyncError } from "../middlewares/catchAsyncError";
import Course from "../models/course.model";
import { redis } from "../utils/redis";

export const createCourse = CatchAsyncError(
  async (data: any, res: Response) => {
    const newCourse = await Course.create(data);
    redis.set(newCourse._id, JSON.stringify(newCourse), "EX", 604776);
    res.status(201).json({
      success: true,
      newCourse,
    });
  }
);

export const getAllCoursesService = async (res: Response) => {
  const courses = await Course.find().sort({ createdAt: -1 });
  res.status(200).json({
    success: true,
    courses,
  });
};
