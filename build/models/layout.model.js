"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const faqSchema = new mongoose_1.Schema({
    question: { type: String },
    answer: { type: String },
    active: { type: Boolean },
    userId: { type: String },
    amount: { type: Number, default: 0 },
});
const categorySchema = new mongoose_1.Schema({
    title: { type: String },
    original: { type: Boolean, default: false },
    userId: { type: String },
});
const bannerImageSchema = new mongoose_1.Schema({
    public_id: { type: String },
    url: { type: String },
});
const layoutSchema = new mongoose_1.Schema({
    type: { type: String },
    faq: [faqSchema],
    category: [categorySchema],
    banner: {
        image: bannerImageSchema,
        title: { type: String },
        subtitle: { type: String },
    },
}, { timestamps: true });
const layoutModel = (0, mongoose_1.model)("Layout", layoutSchema);
exports.default = layoutModel;
