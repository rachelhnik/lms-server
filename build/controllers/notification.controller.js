"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateNotification = exports.getNotifications = void 0;
const catchAsyncError_1 = require("../middlewares/catchAsyncError");
const errorHandler_1 = __importDefault(require("../utils/errorHandler"));
const nodification_model_1 = __importDefault(require("../models/nodification.model"));
const node_cron_1 = __importDefault(require("node-cron"));
const course_model_1 = __importDefault(require("../models/course.model"));
exports.getNotifications = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const coursesByAdmin = await course_model_1.default.find({ userId: req.user?._id });
        const coursesIds = coursesByAdmin.map((data) => data?._id);
        const notifications = await nodification_model_1.default.find({
            courseId: { $in: coursesIds },
        }).sort({ createdAt: -1 });
        res.status(201).json({ success: true, notifications });
    }
    catch (err) {
        return next(new errorHandler_1.default(err.message, 400));
    }
});
exports.updateNotification = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const notification = await nodification_model_1.default.findById(req.params.id);
        if (!notification) {
            return next(new errorHandler_1.default("Notification not found", 404));
        }
        else {
            notification.status = "read";
        }
        await notification.save();
        const notifications = await nodification_model_1.default.find().sort({ createdAt: -1 });
        res.status(201).json({ success: true, notifications });
    }
    catch (err) {
        return next(new errorHandler_1.default(err.message, 500));
    }
});
node_cron_1.default.schedule("0 0 0 * * *", async () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    await nodification_model_1.default.deleteMany({
        status: "read",
        createdAt: { $lt: thirtyDaysAgo },
    });
    console.log("deleted read notifications");
});
