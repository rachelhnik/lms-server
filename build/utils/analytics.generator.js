"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateLast12MonthsData = void 0;
const course_model_1 = __importDefault(require("../models/course.model"));
async function generateLast12MonthsData(model, type, req) {
    const coursesCreatedByUser = await course_model_1.default.find({ userId: req?.user?._id });
    const courseIds = coursesCreatedByUser.map((course) => course._id);
    const purchasedUsers = coursesCreatedByUser.flatMap((course) => course.purchasedUsers);
    const filteredPurchaseUsers = [...new Set(purchasedUsers)];
    const last12Months = [];
    const currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + 1);
    for (let i = 11; i >= 0; i--) {
        const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - i * 28);
        const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 28);
        const monthYear = endDate.toLocaleString("default", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
        const query = type === "course"
            ? {
                createdAt: {
                    $gte: startDate,
                    $lt: endDate,
                },
                userId: req?.user?._id,
            }
            : type === "order"
                ? {
                    createdAt: {
                        $gte: startDate,
                        $lt: endDate,
                    },
                    courseId: { $in: courseIds },
                }
                : {
                    createdAt: {
                        $gte: startDate,
                        $lt: endDate,
                    },
                    _id: { $in: filteredPurchaseUsers },
                };
        const count = await model.countDocuments(query);
        last12Months.push({ month: monthYear, count });
    }
    return { last12Months };
}
exports.generateLast12MonthsData = generateLast12MonthsData;
