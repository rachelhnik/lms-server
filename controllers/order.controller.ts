import { Request, Response } from "express";
import { NextFunction } from "express";
import { CatchAsyncError } from "../middlewares/catchAsyncError";
import ErrorHandler from "../utils/errorHandler";
import User, { IUser } from "../models/user.model";
import Course from "../models/course.model";
import confirmNewOrder from "../services/order.service";
import ejs from "ejs";
import path from "path";
import sendEmail from "../utils/sendEmail";
import Notification from "../models/nodification.model";

export const createOrder = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, paymentInfo } = req.body;
      //@ts-ignore
      const user = await User.findById(req.user._id);
      const course = await Course.findById(courseId);

      const isCourseAlreadyExist = user?.courses.find(
        //@ts-ignore
        (course) => course._id.toString() === courseId
      );
      if (isCourseAlreadyExist) {
        return next(
          new ErrorHandler("You have already purchased this course", 400)
        );
      }
      const orderData: any = {
        courseId: courseId,
        userId: user?._id,
        paymentInfo,
      };

      const mailData = {
        order: {
          _id: course?._id.toString().slice(0, 6),
          name: course?.name,
          price: course?.price,
          date: new Date().toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
        },
      };
      await ejs.render(
        path.join(__dirname, "../mails/order-confirmation.ejs"),
        { order: mailData }
      );
      try {
        if (user) {
          await sendEmail({
            email: user.email,
            subject: "Order confirmation",
            template: "../mails/order-confirmation.ejs",
            data: mailData,
          });
        }
      } catch (err: any) {
        return next(new ErrorHandler(err.message, 500));
      }
      user?.courses.push(course?._id);
      await user?.save();
      if (course?.purchased) {
        course.purchased += 1;
      }
      await course?.save();

      await Notification.create({
        user: user?._id,
        title: "new order",
        message: `You have a new order in ${course?.name}`,
      });
      confirmNewOrder(orderData, res, next);
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 404));
    }
  }
);
