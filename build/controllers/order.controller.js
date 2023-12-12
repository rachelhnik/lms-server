"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.newPayment = exports.sendStripePublishableKey = exports.getAllOrders = exports.createOrder = void 0;
const catchAsyncError_1 = require("../middlewares/catchAsyncError");
const errorHandler_1 = __importDefault(require("../utils/errorHandler"));
const user_model_1 = __importDefault(require("../models/user.model"));
const course_model_1 = __importDefault(require("../models/course.model"));
const order_service_1 = require("../services/order.service");
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
const sendEmail_1 = __importDefault(require("../utils/sendEmail"));
const nodification_model_1 = __importDefault(require("../models/nodification.model"));
const redis_1 = require("../utils/redis");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
exports.createOrder = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { courseId, paymentInfo } = req.body;
        if (paymentInfo) {
            if ("id" in paymentInfo) {
                const paymentIntentId = paymentInfo.id;
                const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
                if (paymentIntent.status !== "succeeded") {
                    return next(new errorHandler_1.default("Payment not authorized", 400));
                }
            }
        }
        //@ts-ignore
        const user = (await user_model_1.default.findById(req.user._id));
        const course = (await course_model_1.default.findById(courseId));
        const isCourseAlreadyExist = user?.courses.find(
        //@ts-ignore
        (course) => course._id.toString() === courseId);
        if (isCourseAlreadyExist) {
            return next(new errorHandler_1.default("You have already purchased this course", 400));
        }
        const orderData = {
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
        await ejs_1.default.render(path_1.default.join(__dirname, "../mails/order-confirmation.ejs"), { order: mailData });
        try {
            if (user) {
                await (0, sendEmail_1.default)({
                    email: user.email,
                    subject: "Order confirmation",
                    template: "../mails/order-confirmation.ejs",
                    data: mailData,
                });
            }
        }
        catch (err) {
            return next(new errorHandler_1.default(err.message, 500));
        }
        user?.courses.push(course?._id);
        await redis_1.redis.set(req.user?._id, JSON.stringify(user));
        await user?.save();
        course.purchased += course.purchased + 1;
        course.purchasedUsers?.push(user?._id);
        await course?.save();
        await redis_1.redis.set(courseId, JSON.stringify(course));
        await nodification_model_1.default.create({
            userId: user?._id,
            courseId: course?._id,
            title: "new order",
            message: `You have a new order in ${course?.name}`,
        });
        //@ts-ignore
        (0, order_service_1.confirmNewOrder)(orderData, user, res);
    }
    catch (err) {
        return next(new errorHandler_1.default(err.message, 404));
    }
});
exports.getAllOrders = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        (0, order_service_1.getAllOrdersService)(req, res);
    }
    catch (err) {
        return next(new errorHandler_1.default(err.message, 400));
    }
});
exports.sendStripePublishableKey = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    res.status(200).json({
        stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
});
exports.newPayment = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
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
    }
    catch (err) {
        return next(new errorHandler_1.default(err.message, 400));
    }
});
