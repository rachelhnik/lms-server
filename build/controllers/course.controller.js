"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateVideoUrl = exports.deleteCourse = exports.getAllCoursesByAdmin = exports.replyToReview = exports.addReview = exports.addAnswer = exports.addQuestion = exports.getCourseByUser = exports.getAllCourses = exports.getSingleCourse = exports.editCourse = exports.uploadCourse = void 0;
const catchAsyncError_1 = require("../middlewares/catchAsyncError");
const errorHandler_1 = __importDefault(require("../utils/errorHandler"));
const course_service_1 = require("../services/course.service");
const course_model_1 = __importDefault(require("../models/course.model"));
const cloudinary_1 = __importDefault(require("cloudinary"));
const redis_1 = require("../utils/redis");
const mongoose_1 = __importDefault(require("mongoose"));
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
const sendEmail_1 = __importDefault(require("../utils/sendEmail"));
const nodification_model_1 = __importDefault(require("../models/nodification.model"));
const axios_1 = __importDefault(require("axios"));
exports.uploadCourse = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const data = req.body;
        const thumbnail = data.thumbnail;
        if (thumbnail) {
            const myCloud = await cloudinary_1.default.v2.uploader.upload(thumbnail, {
                folder: "thumbnails",
                length: 150,
            });
            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        }
        (0, course_service_1.createCourse)(data, res, next);
    }
    catch (err) {
        console.log("error", err);
        return next(new errorHandler_1.default(err.message, 400));
    }
});
exports.editCourse = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const data = req.body;
        const courseId = req.params.id;
        const courseToUpdate = await course_model_1.default.findById(courseId).select("+thumbnail");
        const thumbnail = req.body.thumbnail;
        if (thumbnail && !thumbnail.url.startsWith("https")) {
            await cloudinary_1.default.v2.uploader.destroy(
            //@ts-ignore
            courseToUpdate?.thumbnail.public_id);
            const myCloud = await cloudinary_1.default.v2.uploader.upload(thumbnail, {
                folder: "courses",
            });
            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        }
        const updatedCourse = await course_model_1.default.findByIdAndUpdate(courseId, {
            $set: data,
        }, { new: true });
        redis_1.redis.set(courseId, JSON.stringify(updatedCourse), "EX", 604776);
        res.status(201).json({ success: true, updatedCourse });
    }
    catch (err) {
        console.log("error", err);
        return next(new errorHandler_1.default(err.message, 400));
    }
});
exports.getSingleCourse = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const courseId = req.params.id;
        const isCacheExist = await redis_1.redis.get(courseId);
        if (isCacheExist) {
            const course = JSON.parse(isCacheExist);
            res.status(200).json({
                success: true,
                course,
            });
        }
        else {
            const course = await course_model_1.default.findById(courseId).select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.link");
            redis_1.redis.set(courseId, JSON.stringify(course), "EX", 604776);
            res.status(200).json({
                success: true,
                course,
            });
        }
    }
    catch (err) {
        return next(new errorHandler_1.default(err.message, 400));
    }
});
exports.getAllCourses = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const courses = await course_model_1.default.find().select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.link");
        redis_1.redis.set("allCourses", JSON.stringify(courses));
        res.status(200).json({
            success: true,
            courses,
        });
    }
    catch (err) {
        return next(new errorHandler_1.default(err.message, 400));
    }
});
exports.getCourseByUser = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const courseId = req.params.id;
        const userCoursesList = req.user?.courses;
        const isCourseExist = userCoursesList?.find((course) => course._id.toString() === courseId) || req.user?.role === "admin";
        if (!isCourseExist) {
            return next(new errorHandler_1.default("Course doesn't exist in purchased list", 400));
        }
        const course = await course_model_1.default.findById(courseId);
        const content = course?.courseData;
        res.status(200).json({ success: true, content });
    }
    catch (err) {
        return next(new errorHandler_1.default(err.message, 400));
    }
});
exports.addQuestion = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { question, courseId, contentId } = req.body;
        const course = await course_model_1.default.findById(courseId);
        const courseContent = course?.courseData.find((coursedata) => coursedata._id.toString() === contentId);
        if (!courseContent) {
            return next(new errorHandler_1.default("Invalid content Id", 400));
        }
        const newQuestion = {
            user: req.user,
            question,
            questionReplies: [],
        };
        courseContent.questions.push(newQuestion);
        await nodification_model_1.default.create({
            userId: req.user?._id,
            courseId: course?._id,
            title: "New question received",
            message: `Your have a new question in ${course?.name}`,
        });
        await course?.save();
        res.status(200).json({
            success: true,
            course,
        });
    }
    catch (err) {
        return next(new errorHandler_1.default(err.message, 400));
    }
});
exports.addAnswer = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { answer, courseId, contentId, questionId } = req.body;
        const course = await course_model_1.default.findById(courseId);
        if (!mongoose_1.default.Types.ObjectId.isValid(contentId)) {
            return next(new errorHandler_1.default("Invalid content Id", 400));
        }
        const courseContent = course?.courseData.find((coursedata) => coursedata._id.equals(contentId));
        if (!courseContent) {
            return next(new errorHandler_1.default("Invalid content Id", 400));
        }
        const question = courseContent.questions.find((question) => question._id.equals(questionId));
        if (!question) {
            return next(new errorHandler_1.default("Invalid question id", 400));
        }
        const newAnswer = {
            user: req.user,
            answer,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        question.questionReplies.push(newAnswer);
        await course?.save();
        if (req.user?._id === question.user._id && req.user?.role !== "admin") {
            await nodification_model_1.default.create({
                userId: req.user?._id,
                courseId: course?._id,
                title: "The question was answered",
                message: `You have an answer to a question in course ${course?.name}`,
            });
            res.status(200).json({ success: true, course });
        }
        else {
            const data = {
                name: question.user.name,
                title: courseContent.title,
            };
            const html = await ejs_1.default.renderFile(path_1.default.join(__dirname, "../mails/question-reply.ejs"), data);
            try {
                await (0, sendEmail_1.default)({
                    email: question.user.email,
                    subject: "Question reply",
                    template: "question-reply.ejs",
                    data,
                });
            }
            catch (err) {
                return next(new errorHandler_1.default(err.message, 400));
            }
            res.status(200).json({ success: true, course });
        }
    }
    catch (err) {
        return next(new errorHandler_1.default(err.message, 400));
    }
});
exports.addReview = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { review, rating } = req.body;
        const courseId = req.params.id;
        const userCoursesList = req.user?.courses;
        const isCourseExist = userCoursesList?.find(
        //@ts-ignore
        (course) => course._id === courseId);
        if (!isCourseExist) {
            return next(new errorHandler_1.default("You are not eligible to access this course", 404));
        }
        const course = await course_model_1.default.findById(courseId);
        const reviewData = {
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
        await redis_1.redis.set(courseId, JSON.stringify(course), "EX", 604800);
        await nodification_model_1.default.create({
            userId: req.user?._id,
            courseId: course?._id,
            title: "New review received",
            message: `${req.user?.name} has given a review in ${course?.name}`,
        });
        res.status(200).json({
            message: true,
            course,
        });
    }
    catch (err) {
        return next(new errorHandler_1.default(err.message, 400));
    }
});
exports.replyToReview = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { comment, reviewId, courseId } = req.body;
        const course = await course_model_1.default.findById(courseId);
        if (!course) {
            return next(new errorHandler_1.default("Course not found", 404));
        }
        const review = course.reviews.find((review) => review._id.toString() === reviewId);
        if (!review) {
            return next(new errorHandler_1.default("Review not found", 404));
        }
        const replyData = {
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
        await redis_1.redis.set(courseId, JSON.stringify(course), "EX", 604800);
        await nodification_model_1.default.create({
            userId: req.user?._id,
            courseId: course?._id,
            title: "New reply to your review received",
            message: `${req.user?.name} has given a reply to review in ${course?.name}`,
        });
        res.status(200).send({
            success: true,
            course,
        });
    }
    catch (err) {
        return next(new errorHandler_1.default(err.message, 400));
    }
});
exports.getAllCoursesByAdmin = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        (0, course_service_1.getAllCoursesService)(res);
    }
    catch (err) {
        return next(new errorHandler_1.default(err.message, 400));
    }
});
exports.deleteCourse = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { id } = req.params;
        const course = await course_model_1.default.findById(id);
        if (!course) {
            return next(new errorHandler_1.default("Course not found", 404));
        }
        course.deleteOne({ id });
        redis_1.redis.del(id);
        res.status(200).json({
            success: true,
            message: "Course is deleted successfully",
        });
    }
    catch (err) {
        return next(new errorHandler_1.default(err.message, 400));
    }
});
exports.generateVideoUrl = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { videoId } = req.body;
        const response = await axios_1.default.post(`https://dev.vdocipher.com/api/videos/${videoId}/otp`, { ttl: 300 }, {
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                Authorization: `Apisecret ${process.env.VDOCIPHER_API_SECRET}`,
            },
        });
        res.json(response.data);
    }
    catch (err) {
        console.log("eror", err);
        return next(new errorHandler_1.default(err.message, 400));
    }
});
