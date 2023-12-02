import { Request, Response } from "express";
import { NextFunction } from "express";
import { CatchAsyncError } from "../middlewares/catchAsyncError";
import ErrorHandler from "../utils/errorHandler";
import User, { IUser } from "../models/user.model";
import Course from "../models/course.model";
import {
  confirmNewOrder,
  getAllOrdersService,
} from "../services/order.service";
import ejs from "ejs";
import path from "path";
import sendEmail from "../utils/sendEmail";
import Notification from "../models/nodification.model";
import { redis } from "../utils/redis";
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export const createOrder = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { courseId, paymentInfo } = req.body;

      if (paymentInfo) {
        if ("id" in paymentInfo) {
          const paymentIntentId = paymentInfo.id;
          const paymentIntent = await stripe.paymentIntents.retrieve(
            paymentIntentId
          );
          if (paymentIntent.status !== "succeeded") {
            return next(new ErrorHandler("Payment not authorized", 400));
          }
        }
      }

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
      await redis.set(req.user?._id, JSON.stringify(user));
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

export const getAllOrders = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      getAllOrdersService(res);
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

export const sendStripePublishableKey = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({
      stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
  }
);

export const newPayment = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const myPayment = await stripe.paymentIntents.create({
        amount: req.body.amount,
        currency: "USD",
        metadata: {
          company: "Nerdemy Elearning",
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });
      res.status(201).json({
        success: true,
        client_secret: myPayment.client_secret,
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);
