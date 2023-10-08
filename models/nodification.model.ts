import mongoose, { Document, Schema, Model } from "mongoose";

interface INotification extends Document {
  title: string;
  status: string;
  message: string;
  userId: string;
}

const NotificationSchema = new Schema<INotification>(
  {
    title: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
      default: "unread",
    },
    message: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const NotificationModel: Model<INotification> = mongoose.model(
  "Notification",
  NotificationSchema
);

export default NotificationModel;
