"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticRouter = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const analytics_controller_1 = require("../controllers/analytics.controller");
exports.analyticRouter = express_1.default.Router();
exports.analyticRouter.get("/get-users-analytics", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), analytics_controller_1.getUsersAnalytics);
exports.analyticRouter.get("/get-courses-analytics", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), analytics_controller_1.getCourseAnalytics);
exports.analyticRouter.get("/get-orders-analytics", auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), analytics_controller_1.getOrdersAnalytics);
