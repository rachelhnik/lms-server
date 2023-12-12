"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCoursesService = exports.createCourse = void 0;
const catchAsyncError_1 = require("../middlewares/catchAsyncError");
const course_model_1 = __importDefault(require("../models/course.model"));
const redis_1 = require("../utils/redis");
exports.createCourse = (0, catchAsyncError_1.CatchAsyncError)(async (data, res) => {
    const newCourse = await course_model_1.default.create(data);
    redis_1.redis.set(newCourse._id, JSON.stringify(newCourse), "EX", 604776);
    res.status(201).json({
        success: true,
        newCourse,
    });
});
const getAllCoursesService = async (res) => {
    const courses = await course_model_1.default.find().sort({ createdAt: -1 });
    res.status(200).json({
        success: true,
        courses,
    });
};
exports.getAllCoursesService = getAllCoursesService;
