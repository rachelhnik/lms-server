import { Response } from "express";
import { CatchAsyncError } from "../middlewares/catchAsyncError";
import Course from "../models/course.model";

export const createCourse = CatchAsyncError(
  async (data: any, res: Response) => {
    const newCourse = await Course.create(data);
    res.status(201).json({
      success: true,
      newCourse,
    });
  }
);
