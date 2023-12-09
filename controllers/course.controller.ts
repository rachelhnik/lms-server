import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middlewares/catchAsyncError";
import ErrorHandler from "../utils/errorHandler";
import { createCourse, getAllCoursesService } from "../services/course.service";
import Course from "../models/course.model";
import cloudinary from "cloudinary";
import { redis } from "../utils/redis";
import mongoose from "mongoose";
import ejs from "ejs";
import path from "path";
import sendEmail from "../utils/sendEmail";
import { IUser } from "../models/user.model";
import Notification from "../models/nodification.model";
import axios from "axios";
import NotificationModel from "../models/nodification.model";

export const uploadCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;

      const thumbnail = data.thumbnail;
      if (thumbnail) {
        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "thumbnails",
          length: 150,
        });
        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }
      createCourse(data, res, next);
    } catch (err: any) {
      console.log("error", err);
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

export const editCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = req.body;
      const courseId = req.params.id;
      const courseToUpdate = await Course.findById(courseId).select(
        "+thumbnail"
      );
      const thumbnail = req.body.thumbnail;
      if (thumbnail && !thumbnail.url.startsWith("https")) {
        await cloudinary.v2.uploader.destroy(
          //@ts-ignore
          courseToUpdate?.thumbnail.public_id
        );

        const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
          folder: "courses",
        });
        data.thumbnail = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }

      const updatedCourse = await Course.findByIdAndUpdate(
        courseId,
        {
          $set: data,
        },
        { new: true }
      );
      res.status(201).json({ success: true, updatedCourse });
    } catch (err: any) {
      console.log("error", err);
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

export const getSingleCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;
      const isCacheExist = await redis.get(courseId);
      if (isCacheExist) {
        const course = JSON.parse(isCacheExist);
        res.status(200).json({
          success: true,
          course,
        });
      } else {
        const course = await Course.findById(courseId).select(
          "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.link"
        );
        redis.set(courseId, JSON.stringify(course), "EX", 604776);
        res.status(200).json({
          success: true,
          course,
        });
      }
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

export const getAllCourses = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courses = await Course.find().select(
        "-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.link"
      );
      redis.set("allCourses", JSON.stringify(courses));
      res.status(200).json({
        success: true,
        courses,
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

export const getCourseByUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const courseId = req.params.id;
      const userCoursesList = req.user?.courses;
      const isCourseExist = userCoursesList?.find(
        (course: any) => course._id.toString() === courseId
      );
      if (!isCourseExist) {
        return next(
          new ErrorHandler("Course doesn't exist in purchased list", 400)
        );
      }
      const course = await Course.findById(courseId);
      const content = course?.courseData;
      res.status(200).json({ success: true, content });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

interface IAddQuestionData {
  question: string;
  courseId: string;
  contentId: string;
}

export const addQuestion = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { question, courseId, contentId }: IAddQuestionData = req.body;

      const course = await Course.findById(courseId);

      const courseContent = course?.courseData.find(
        (coursedata) => coursedata._id.toString() === contentId
      );

      if (!courseContent) {
        return next(new ErrorHandler("Invalid content Id", 400));
      }
      const newQuestion: any = {
        user: req.user,
        question,
        questionReplies: [],
      };
      courseContent.questions.push(newQuestion);

      await Notification.create({
        user: req.user?._id,
        title: "New question received",
        message: `Your have a new question in ${course?.name}`,
      });

      await course?.save();

      res.status(200).json({
        success: true,
        course,
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

interface IAddAnswer {
  answer: string;
  courseId: string;
  contentId: string;
  questionId: string;
}

export const addAnswer = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { answer, courseId, contentId, questionId }: IAddAnswer = req.body;

      const course = await Course.findById(courseId);

      if (!mongoose.Types.ObjectId.isValid(contentId)) {
        return next(new ErrorHandler("Invalid content Id", 400));
      }

      const courseContent = course?.courseData.find((coursedata) =>
        coursedata._id.equals(contentId)
      );

      if (!courseContent) {
        return next(new ErrorHandler("Invalid content Id", 400));
      }

      const question = courseContent.questions.find((question) =>
        question._id.equals(questionId)
      );

      if (!question) {
        return next(new ErrorHandler("Invalid question id", 400));
      }

      const newAnswer: any = {
        user: req.user,
        answer,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      question.questionReplies.push(newAnswer);
      await course?.save();

      if (req.user?._id === question.user._id) {
        await Notification.create({
          user: req.user?._id,
          title: "Your question was answered",
          message: `You have an answer to you question in course ${course?.name}`,
        });
        res.status(200).json({ success: true, course });
      } else {
        const data = {
          name: question.user.name,
          title: courseContent.title,
        };
        const html = await ejs.renderFile(
          path.join(__dirname, "../mails/question-reply.ejs"),
          data
        );
        try {
          await sendEmail({
            email: question.user.email,
            subject: "Question reply",
            template: "question-reply.ejs",
            data,
          });
        } catch (err: any) {
          return next(new ErrorHandler(err.message, 400));
        }
        res.status(200).json({ success: true, course });
      }
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

interface IAddReview {
  review: string;
  rating: number;
  courseId: string;
  userId: string;
}

export const addReview = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { review, rating } = req.body;
      const courseId = req.params.id;
      const userCoursesList = req.user?.courses;
      const isCourseExist = userCoursesList?.find(
        //@ts-ignore
        (course) => course._id === courseId
      );
      if (!isCourseExist) {
        return next(
          new ErrorHandler("You are not eligible to access this course", 404)
        );
      }
      const course = await Course.findById(courseId);

      const reviewData: any = {
        user: req.user,
        rating,
        comment: review,
      };

      course?.reviews.push(reviewData);

      let avg = 0;

      course?.reviews.forEach((review) => {
        avg += review.rating;
      });
      if (course) {
        course.ratings = avg / course?.reviews.length;
      }
      await course?.save();

      await redis.set(courseId, JSON.stringify(course), "EX", 604800);

      await Notification.create({
        user: req.user?._id,
        title: "New review received",
        message: `${req.user?.name} has given a review in ${course?.name}`,
      });
      res.status(200).json({
        message: true,
        course,
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

interface IReplyReview {
  comment: string;
  reviewId: string;
  courseId: string;
}

export const replyToReview = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { comment, reviewId, courseId } = req.body as IReplyReview;
      const course = await Course.findById(courseId);
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }
      const review = course.reviews.find(
        (review) => review._id.toString() === reviewId
      );
      if (!review) {
        return next(new ErrorHandler("Review not found", 404));
      }
      const replyData: any = {
        user: req.user,
        comment,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (!review.commentReplies) {
        review.commentReplies = [];
      }
      review.commentReplies?.push(replyData);
      await course.save();

      await redis.set(courseId, JSON.stringify(course), "EX", 604800);
      res.status(200).send({
        success: true,
        course,
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

export const getAllCoursesByAdmin = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAllCoursesService(res);
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

export const deleteCourse = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const course = await Course.findById(id);
      if (!course) {
        return next(new ErrorHandler("Course not found", 404));
      }
      course.deleteOne({ id });
      redis.del(id);
      res.status(200).json({
        success: true,
        message: "Course is deleted successfully",
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

export const generateVideoUrl = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { videoId } = req.body;
      const response = await axios.post(
        `https://dev.vdocipher.com/api/videos/${videoId}/otp`,
        { ttl: 300 },
        {
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Apisecret ${process.env.VDOCIPHER_API_SECRET}`,
          },
        }
      );
      res.json(response.data);
    } catch (err: any) {
      console.log("eror", err);
      return next(new ErrorHandler(err.message, 400));
    }
  }
);
