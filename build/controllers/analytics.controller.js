"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrdersAnalytics = exports.getCourseAnalytics = exports.getUsersAnalytics = void 0;
const catchAsyncError_1 = require("../middlewares/catchAsyncError");
const errorHandler_1 = __importDefault(require("../utils/errorHandler"));
const analytics_generator_1 = require("../utils/analytics.generator");
const user_model_1 = __importDefault(require("../models/user.model"));
const course_model_1 = __importDefault(require("../models/course.model"));
const order_model_1 = __importDefault(require("../models/order.model"));
exports.getUsersAnalytics = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const type = "user";
        const users = await (0, analytics_generator_1.generateLast12MonthsData)(user_model_1.default, type, req);
        res.status(200).json({ success: true, users });
    }
    catch (err) {
        return next(new errorHandler_1.default(err.message, 400));
    }
});
exports.getCourseAnalytics = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const type = "course";
        const courses = await (0, analytics_generator_1.generateLast12MonthsData)(course_model_1.default, type, req);
        res.status(200).json({ success: true, courses });
    }
    catch (err) {
        return next(new errorHandler_1.default(err.message, 400));
    }
});
exports.getOrdersAnalytics = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const type = "order";
        const orders = await (0, analytics_generator_1.generateLast12MonthsData)(order_model_1.default, type, req);
        res.status(200).send({ success: true, orders });
    }
    catch (err) {
        return next(new errorHandler_1.default(err.message, 400));
    }
});
