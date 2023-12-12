"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserRoleService = exports.getAllUsersService = exports.getUserById = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const redis_1 = require("../utils/redis");
const course_model_1 = __importDefault(require("../models/course.model"));
const getUserById = async (id, res) => {
    const userJson = await redis_1.redis.get(id);
    if (userJson) {
        const user = JSON.parse(userJson);
        res.status(201).json({
            success: true,
            user,
        });
    }
};
exports.getUserById = getUserById;
const getAllUsersService = async (req, res) => {
    const coursesByAdmin = await course_model_1.default.find({ userId: req.user?._id });
    const purchasedUsersIds = coursesByAdmin.flatMap((course) => course.purchasedUsers);
    const duplicatesFilteredUserIds = [...new Set(purchasedUsersIds)];
    const users = await user_model_1.default.find({
        _id: { $in: duplicatesFilteredUserIds },
    }).sort({ createdAt: -1 });
    res
        .status(200)
        .json({
        success: true,
        users,
        coursesIds: coursesByAdmin.map((course) => course.id),
    });
};
exports.getAllUsersService = getAllUsersService;
const updateUserRoleService = async (res, id, role) => {
    const user = await user_model_1.default.findByIdAndUpdate(id, { role }, { new: true });
    res.status(201).json({
        success: true,
        user,
    });
};
exports.updateUserRoleService = updateUserRoleService;
