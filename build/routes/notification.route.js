"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRouter = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const notification_controller_1 = require("../controllers/notification.controller");
const user_controller_1 = require("../controllers/user.controller");
exports.notificationRouter = express_1.default.Router();
exports.notificationRouter.get("/get-notifications", auth_1.isAuthenticated, notification_controller_1.getNotifications);
exports.notificationRouter.put("/update-notification/:id", user_controller_1.UpdateAccessToken, auth_1.isAuthenticated, notification_controller_1.updateNotification);
