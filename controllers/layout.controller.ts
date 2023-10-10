import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middlewares/catchAsyncError";
import ErrorHandler from "../utils/errorHandler";
import cloudinary from "cloudinary";
import Layout from "../models/layout.model";

export const createLayout = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.body;
      const isTypeAlreadyExist = await Layout.findOne({ type });
      if (isTypeAlreadyExist) {
        return next(new ErrorHandler(`${type} already exists`, 400));
      }
      if (type === "FAQ") {
        const { faq } = req.body;
        const faqItems = await Promise.all(
          faq.map(async (item: any) => {
            return {
              question: item.question,
              answer: item.answer,
            };
          })
        );
        await Layout.create({ type: type, faq: faqItems });
      } else if (type === "Category") {
        const { categories } = req.body;
        const categoryItems = await Promise.all(
          categories.map(async (item: any) => {
            return {
              title: item.title,
            };
          })
        );
        await Layout.create({ type: type, category: categoryItems });
      } else if (type === "Banner") {
        const { image, title, subtitle } = req.body;
        const myCloud = await cloudinary.v2.uploader.upload(image, {
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
        await Layout.create({ type: type, banner: banner });
      }
      res
        .status(200)
        .json({ success: true, message: "Layout created successfully" });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

export const editLayout = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.body;
      const isTypeAlreadyExist = await Layout.findOne({ type });
      if (!isTypeAlreadyExist) {
        return next(new ErrorHandler(`${type} does not exist`, 400));
      }
      if (type === "FAQ") {
        const { faq } = req.body;
        const faqItem = await Layout.findOne({ type: "FAQ" });
        const faqItems = await Promise.all(
          faq.map(async (item: any) => {
            return {
              question: item.question,
              answer: item.answer,
            };
          })
        );
        await Layout.findByIdAndUpdate(faqItem?._id, {
          type: type,
          faq: faqItems,
        });
      } else if (type === "Category") {
        const { categories } = req.body;
        const categoryItem = await Layout.findOne({ type: "Category" });
        const categoryItems = await Promise.all(
          categories.map(async (item: any) => {
            return {
              title: item.title,
            };
          })
        );
        await Layout.findByIdAndUpdate(categoryItem?._id, {
          type: type,
          category: categoryItems,
        });
      } else if (type === "Banner") {
        const { image, title, subtitle } = req.body;
        const bannerItem = await Layout.findOne({ type: "Banner" });

        if (image && bannerItem) {
          //@ts-ignore
          await cloudinary.v2.uploader.destroy(
            bannerItem.banner.image.public_id
          );
        }
        const myCloud = await cloudinary.v2.uploader.upload(image, {
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
        await Layout.findByIdAndUpdate(bannerItem?._id, {
          type: type,
          banner: banner,
        });
      }
      res
        .status(201)
        .json({ success: true, message: "Layout updated successfully" });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

export const getLayoutByType = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type } = req.body;
      const layout = await Layout.findOne({ type });
      res.status(201).json({ success: true, layout });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);
