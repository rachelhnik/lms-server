import mongoose, { Document, model, Schema } from "mongoose";

interface IFaqItem extends Document {
  question: string;
  answer: string;
  active: boolean;
  userId?: string;
  amount: number;
}

interface ICategory extends Document {
  title: string;
  original: boolean;
  userId?: string;
}

interface IBannerImage extends Document {
  public_id: string;
  url: string;
}

interface ILayout extends Document {
  type: string;
  faq: IFaqItem[];
  category: ICategory[];
  banner: {
    image: IBannerImage;
    title: string;
    subtitle: string;
  };
}

const faqSchema = new Schema<IFaqItem>({
  question: { type: String },
  answer: { type: String },
  active: { type: Boolean },
  userId: { type: String },
  amount: { type: Number, default: 0 },
});

const categorySchema = new Schema<ICategory>({
  title: { type: String },
  original: { type: Boolean, default: false },
  userId: { type: String },
});

const bannerImageSchema = new Schema<IBannerImage>({
  public_id: { type: String },
  url: { type: String },
});

const layoutSchema = new Schema<ILayout>(
  {
    type: { type: String },
    faq: [faqSchema],
    category: [categorySchema],
    banner: {
      image: bannerImageSchema,
      title: { type: String },
      subtitle: { type: String },
    },
  },
  { timestamps: true }
);

const layoutModel = model<ILayout>("Layout", layoutSchema);

export default layoutModel;
