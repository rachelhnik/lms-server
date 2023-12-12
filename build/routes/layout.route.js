"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.layoutRouter = void 0;
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middlewares/auth");
const layout_controller_1 = require("../controllers/layout.controller");
const user_controller_1 = require("../controllers/user.controller");
exports.layoutRouter = express_1.default.Router();
exports.layoutRouter.post("/create", user_controller_1.UpdateAccessToken, auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), layout_controller_1.createLayout);
exports.layoutRouter.put("/edit", user_controller_1.UpdateAccessToken, auth_1.isAuthenticated, (0, auth_1.authorizeRoles)("admin"), layout_controller_1.editLayout);
exports.layoutRouter.get("/get-layout/:type", user_controller_1.UpdateAccessToken, layout_controller_1.getLayoutByType);
