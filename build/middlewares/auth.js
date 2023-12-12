"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizeRoles = exports.isAuthenticated = void 0;
const catchAsyncError_1 = require("./catchAsyncError");
const errorHandler_1 = __importDefault(require("../utils/errorHandler"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const redis_1 = require("../utils/redis");
exports.isAuthenticated = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    const access_token = req.cookies.access_token;
    if (!access_token) {
        return next(new errorHandler_1.default("Please login to access this account", 400));
    }
    const decoded = jsonwebtoken_1.default.verify(access_token, process.env.ACCESS_TOKEN);
    if (!decoded) {
        return next(new errorHandler_1.default("Access token is not valid", 400));
    }
    const user = await redis_1.redis.get(decoded.id);
    if (!user) {
        return next(new errorHandler_1.default("User is not found", 400));
    }
    req.user = JSON.parse(user);
    next();
});
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user?.role || "")) {
            return next(new errorHandler_1.default(`Role: ${req.user?.role} is not allowed to access the resource`, 403));
        }
        next();
    };
};
exports.authorizeRoles = authorizeRoles;
