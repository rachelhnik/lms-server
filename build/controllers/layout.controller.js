"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLayoutByType = exports.editLayout = exports.createLayout = void 0;
const catchAsyncError_1 = require("../middlewares/catchAsyncError");
const errorHandler_1 = __importDefault(require("../utils/errorHandler"));
const cloudinary_1 = __importDefault(require("cloudinary"));
const layout_model_1 = __importDefault(require("../models/layout.model"));
exports.createLayout = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { type } = req.body;
        const isTypeAlreadyExist = await layout_model_1.default.findOne({ type });
        if (isTypeAlreadyExist) {
            return next(new errorHandler_1.default(`${type} already exists`, 400));
        }
        if (type === "FAQ") {
            const { faq } = req.body;
            const faqItems = await Promise.all(faq.map(async (item) => {
                return {
                    question: item.question,
                    answer: item.answer,
                    active: item.active,
                };
            }));
            await layout_model_1.default.create({ type: type, faq: [] });
        }
        else if (type === "Category") {
            const { categories } = req.body;
            const categoryItems = await Promise.all(categories.map(async (item) => {
                return {
                    title: item.title,
                };
            }));
            await layout_model_1.default.create({ type: type, category: categoryItems });
        }
        else if (type === "Banner") {
            const { image, title, subtitle } = req.body;
            const myCloud = await cloudinary_1.default.v2.uploader.upload(image, {
                folder: "Banner",
            });
            const banner = {
                image: {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url,
                },
                title: title,
                subtitle: subtitle,
            };
            await layout_model_1.default.create({ type: type, banner: banner });
        }
        res
            .status(200)
            .json({ success: true, message: "Layout created successfully" });
    }
    catch (err) {
        return next(new errorHandler_1.default(err.message, 400));
    }
});
exports.editLayout = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { type } = req.body;
        const isTypeAlreadyExist = await layout_model_1.default.findOne({ type });
        if (!isTypeAlreadyExist) {
            return next(new errorHandler_1.default(`${type} does not exist`, 400));
        }
        if (type === "FAQ") {
            const { faq } = req.body;
            const faqItem = await layout_model_1.default.findOne({ type: "FAQ" });
            const faqItems = await Promise.all(faq.map(async (item) => {
                return {
                    question: item.question,
                    answer: item.answer,
                    active: false,
                    userId: item.userId,
                    amount: item.amount,
                };
            }));
            const data = await layout_model_1.default.findByIdAndUpdate(faqItem?._id, {
                type: type,
                faq: faqItems,
            });
        }
        else if (type === "Category") {
            const { categories } = req.body;
            const categoryItem = await layout_model_1.default.findOne({ type: "Category" });
            const categoryItems = await Promise.all(categories.map(async (item) => {
                return {
                    title: item.title,
                    userId: item.userId,
                };
            }));
            await layout_model_1.default.findByIdAndUpdate(categoryItem?._id, {
                type: type,
                category: categoryItems,
            });
        }
        else if (type === "Banner") {
            const { image, title, subtitle } = req.body;
            const bannerItem = await layout_model_1.default.findOne({ type: "Banner" });
            if (image && bannerItem) {
                //@ts-ignore
                await cloudinary_1.default.v2.uploader.destroy(bannerItem.banner.image.public_id);
            }
            const myCloud = image.includes("cloudinary")
                ? bannerItem
                : (await cloudinary_1.default.v2.uploader.upload(image, {
                    folder: "Banner",
                }));
            const banner = {
                image: {
                    public_id: image.startsWith("https")
                        ? bannerItem?.banner.image.public_id
                        : myCloud?.public_id,
                    url: image.startsWith("https")
                        ? bannerItem?.banner.image.url
                        : myCloud.secure_url,
                },
                title: title,
                subtitle: subtitle,
            };
            await layout_model_1.default.findByIdAndUpdate(bannerItem?._id, {
                type: type,
                banner: banner,
            });
        }
        res
            .status(201)
            .json({ success: true, message: "Layout updated successfully" });
    }
    catch (err) {
        console.log("error", err);
        return next(new errorHandler_1.default(err.message, 400));
    }
});
exports.getLayoutByType = (0, catchAsyncError_1.CatchAsyncError)(async (req, res, next) => {
    try {
        const { type } = req.params;
        const layout = await layout_model_1.default.findOne({ type });
        res.status(201).json({ success: true, layout });
    }
    catch (err) {
        return next(new errorHandler_1.default(err.message, 400));
    }
});
