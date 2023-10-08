import mongoose, { Document, Schema, Model } from "mongoose";

export interface IOrder extends Document {
  courseId: string;
  userId: string;
  paymentInfo: Object;
}

const orderSchema = new Schema<IOrder>(
  {
    courseId: {
      type: String,
      required: true,
    },
    userId: {
      type: String,
      required: true,
    },
    paymentInfo: {
      type: Object,
    },
  },
  { timestamps: true }
);

const OrderModel: Model<IOrder> = mongoose.model("Order", orderSchema);

export default OrderModel;
