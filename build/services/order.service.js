"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllOrdersService = exports.confirmNewOrder = void 0;
const catchAsyncError_1 = require("../middlewares/catchAsyncError");
const order_model_1 = __importDefault(require("../models/order.model"));
const course_model_1 = __importDefault(require("../models/course.model"));
exports.confirmNewOrder = (0, catchAsyncError_1.CatchAsyncError)(async (orderData, user, res) => {
    const newOrder = await order_model_1.default.create(orderData);
    console.log("new", newOrder, user);
    res.status(201).json({
        success: true,
        order: newOrder,
        user: user,
    });
});
const getAllOrdersService = async (req, res) => {
    const coursesCreatedByUser = await course_model_1.default.find({ userId: req?.user?._id });
    const courseIds = coursesCreatedByUser.map((course) => course._id);
    const orders = await order_model_1.default.find({ courseId: { $in: courseIds } }).sort({
        createdAt: -1,
    });
    res.status(200).json({
        success: true,
        orders,
    });
};
exports.getAllOrdersService = getAllOrdersService;
