"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUserRole = exports.getAllUsers = exports.UpdateProfilePhoto = exports.UpdatePassword = exports.UpdateUserInfo = exports.socialAuth = exports.getUserInfo = exports.UpdateAccessToken = exports.LogoutUser = exports.LoginUser = exports.activateUser = exports.createActivationData = exports.registerUser = void 0;
require("dotenv").config();
const catchAsyncError_1 = require("../middlewares/catchAsyncError");
const errorHandler_1 = __importDefault(require("../utils/errorHandler"));
const user_model_1 = __importDefault(require("../models/user.model"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const sendEmail_1 = __importDefault(require("../utils/sendEmail"));
const jwt_1 = __importStar(require("../utils/jwt"));
const user_service_1 = require("../services/user.service");
const redis_1 = require("../utils/redis");
const cloudinary_1 = __importDefault(require("cloudinary"));
exports.registerUser = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;
        const isEmailAlreadyExist = await user_model_1.default.findOne({ email });
        if (isEmailAlreadyExist) {
            return next(new errorHandler_1.default("Email already exist", 400));
        }
        const user = { name, email, password, role };
        const activationData = (0, exports.createActivationData)(user);
        const activationCode = activationData.activation_code;
        const data = { user: { name: user.name }, activationCode };
        try {
            await (0, sendEmail_1.default)({
                email: user.email,
                subject: "Activate your account",
                template: "activation.mail.ejs",
                data,
            });
            res.status(200).json({
                success: true,
                message: `Please check your email: ${user.email} to activate your account .`,
                activationToken: activationData.activation_token,
            });
        }
        catch (err) {
            return next(new errorHandler_1.default(err.message, 400));
        }
    }
    catch (error) {
        return next(new errorHandler_1.default(error.message, 400));
    }
});
const createActivationData = (user) => {
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const activationToken = jsonwebtoken_1.default.sign({ user, activationCode }, process.env.ACTIVATION_SECRET, { expiresIn: "5m" });
    return { activation_token: activationToken, activation_code: activationCode };
};
exports.createActivationData = createActivationData;
exports.activateUser = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { activationToken, activationCode } = req.body;
        const newUser = jsonwebtoken_1.default.verify(activationToken, process.env.ACTIVATION_SECRET);
        if (newUser.activationCode !== activationCode) {
            return next(new errorHandler_1.default("Invalid activation code", 400));
        }
        const { name, email, password, role } = newUser.user;
        const isEmailAlreadyExist = await user_model_1.default.findOne({ email });
        if (isEmailAlreadyExist) {
            return next(new errorHandler_1.default("User with this email already exists.", 400));
        }
        const user = await user_model_1.default.create({ name, email, password, role });
        res.status(200).json({
            success: true,
            message: "User successfully created",
            user: user,
        });
    }
    catch (err) {
        return next(new errorHandler_1.default(err.message, 400));
    }
});
exports.LoginUser = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const user = await user_model_1.default.findOne({ email }).select("+password");
        if (!user) {
            return next(new errorHandler_1.default("User does not exist", 400));
        }
        const isPasswordMatch = await user.comparePassword(password);
        if (!isPasswordMatch) {
            return next(new errorHandler_1.default("Wrong password", 400));
        }
        (0, jwt_1.default)(user, 200, res);
    }
    catch (err) {
        return next(new errorHandler_1.default(err.message, 400));
    }
});
exports.LogoutUser = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        res.cookie("access_token", "", { maxAge: 1 });
        res.cookie("refresh_token", "", { maxAge: 1 });
        const userId = req.user?._id;
        redis_1.redis.del(userId);
        res.status(200).send({
            success: true,
            message: "Logout successfully",
        });
    }
    catch (err) {
        return next(new errorHandler_1.default(err.message, 400));
    }
});
exports.UpdateAccessToken = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    const refresh_token = req.cookies.refresh_token;
    const decoded = (await jsonwebtoken_1.default.verify(refresh_token, process.env.REFRESH_TOKEN));
    if (!decoded) {
        return next(new errorHandler_1.default("No refresh token", 400));
    }
    const session = await redis_1.redis.get(decoded.id);
    if (!session) {
        return next(new errorHandler_1.default("User not found", 400));
    }
    const user = JSON.parse(session);
    const accessToken = jsonwebtoken_1.default.sign({ id: user._id }, process.env.ACCESS_TOKEN || "", { expiresIn: "5m" });
    const refreshToken = jsonwebtoken_1.default.sign({ id: user._id }, process.env.REFRESH_TOKEN || "", { expiresIn: "3d" });
    req.user = user;
    res.cookie("access_token", accessToken, jwt_1.accessTokenOptions);
    res.cookie("refresh_token", refreshToken, jwt_1.refreshTokenOptions);
    await redis_1.redis.set(user._id, JSON.stringify(user), "EX", 604800);
    next();
});
exports.getUserInfo = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const userId = req.user?._id;
        (0, user_service_1.getUserById)(userId, res);
    }
    catch (err) {
        return next(new errorHandler_1.default(err.message, 400));
    }
});
exports.socialAuth = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { email, name, avatar } = req.body;
        const user = await user_model_1.default.findOne({ email });
        if (!user) {
            const newuser = await user_model_1.default.create({ email, name, avatar });
            (0, jwt_1.default)(newuser, 200, res);
        }
        else {
            (0, jwt_1.default)(user, 200, res);
        }
    }
    catch (err) {
        return next(new errorHandler_1.default(err.message, 400));
    }
});
exports.UpdateUserInfo = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { name, email } = req.body;
        const userId = req.user?._id;
        const user = await user_model_1.default.findById(userId);
        if (!user) {
            return next(new errorHandler_1.default("User doesn't exist", 400));
        }
        if (user && email) {
            const emailToChange = user.email;
            const isEmailExist = await user_model_1.default.find({ emailToChange });
            if (!isEmailExist) {
                return next(new errorHandler_1.default("Email doesn't exist", 400));
            }
            user.email = email;
        }
        if (user && name) {
            user.name = name;
        }
        await user.save();
        await redis_1.redis.set(userId, JSON.stringify(user));
        res.status(200).json({
            success: true,
            user,
        });
    }
    catch (err) {
        return next(new errorHandler_1.default(err.message, 400));
    }
});
exports.UpdatePassword = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { oldPassword, newPassword } = req.body;
        if (oldPassword === newPassword) {
            return next(new errorHandler_1.default("Please enter a different password", 400));
        }
        const userId = req.user?._id;
        const user = await user_model_1.default.findById(userId).select("+password");
        if (!user) {
            return next(new errorHandler_1.default("User not found", 400));
        }
        const isPasswordMatched = await user.comparePassword(oldPassword);
        if (!isPasswordMatched) {
            return next(new errorHandler_1.default("Password is incorrect", 400));
        }
        user.password = newPassword;
        await user.save();
        await redis_1.redis.set(req.user?._id, JSON.stringify(user));
        res.status(200).json({
            success: true,
            user,
        });
    }
    catch (err) {
        return next(new errorHandler_1.default(err.message, 400));
    }
});
exports.UpdateProfilePhoto = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { avatar } = req.body;
        const userId = req.user?._id;
        const user = await user_model_1.default.findById(userId);
        if (!user) {
            return next(new errorHandler_1.default("User not found", 400));
        }
        if (user && avatar) {
            if (user.avatar.publicId) {
                await cloudinary_1.default.v2.uploader.destroy(user.avatar.publicId);
                const myCloud = await cloudinary_1.default.v2.uploader.upload(avatar, {
                    folder: "avatars",
                    width: 150,
                });
                user.avatar = {
                    publicId: myCloud.public_id,
                    url: myCloud.secure_url,
                };
            }
            else {
                const myCloud = await cloudinary_1.default.v2.uploader.upload(avatar, {
                    folder: "avatars",
                    width: 150,
                });
                user.avatar = {
                    publicId: myCloud.public_id,
                    url: myCloud.secure_url,
                };
            }
            await user.save();
            await redis_1.redis.set(req.user?._id, JSON.stringify(user));
            res.status(200).json({
                success: true,
                user,
            });
        }
    }
    catch (err) {
        return next(new errorHandler_1.default(err.message, 400));
    }
});
exports.getAllUsers = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        (0, user_service_1.getAllUsersService)(req, res);
    }
    catch (err) {
        return next(new errorHandler_1.default(err.message, 400));
    }
});
exports.updateUserRole = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { id, role } = req.body;
        (0, user_service_1.updateUserRoleService)(res, id, role);
    }
    catch (err) {
        return next(new errorHandler_1.default(err.message, 400));
    }
});
exports.deleteUser = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await user_model_1.default.findById(id);
        if (!user) {
            return next(new errorHandler_1.default("User doesn't exist", 400));
        }
        await user.deleteOne({ id });
        await redis_1.redis.del(id);
        res.status(200).json({
            success: true,
            message: "User deleted successfully",
        });
    }
    catch (err) {
        return next(new errorHandler_1.default(err.message, 400));
    }
});
