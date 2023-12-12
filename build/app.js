"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
require("dotenv").config();
const express_1 = __importDefault(require("express"));
exports.app = (0, express_1.default)();
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const user_route_1 = require("./routes/user.route");
const course_route_1 = require("./routes/course.route");
const order_route_1 = require("./routes/order.route");
const notification_route_1 = require("./routes/notification.route");
const analytics_route_1 = require("./routes/analytics.route");
const layout_route_1 = require("./routes/layout.route");
const express_rate_limit_1 = require("express-rate-limit");
exports.app.use(express_1.default.json({ limit: "50mb" }));
exports.app.use((0, cookie_parser_1.default)());
exports.app.use((0, cors_1.default)({ origin: "http://localhost:3000", credentials: true }));
const limiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-7",
    legacyHeaders: false,
});
exports.app.use("/api/v1/user", user_route_1.userRouter);
exports.app.use("/api/v1/courses", course_route_1.courseRouter);
exports.app.use("/api/v1/orders", order_route_1.orderRouter);
exports.app.use("/api/v1/notifications", notification_route_1.notificationRouter);
exports.app.use("/api/v1/analytics", analytics_route_1.analyticRouter);
exports.app.use("/api/v1/layouts", layout_route_1.layoutRouter);
exports.app.get("/test", (req, res, next) => {
    res.status(200).json({
        success: true,
        message: "API is working",
    });
});
exports.app.use(limiter);
exports.app.use("*", (req, res, next) => {
    const error = new Error(`Route ${req.originalUrl} not found`);
    error.statusCode = 404;
    next(error);
});
