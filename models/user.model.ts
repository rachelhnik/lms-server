import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
const emailRegexPattern = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: string;
  isVerified: Boolean;
  avatar: {
    publicId: string;
    url: string;
  };
  courses: Array<{ courseId: string }>;
  comparePassword: (password: string) => Promise<Boolean>;
  SignAccessToken: () => string;
  SignRefreshToken: () => string;
}

const userSchema: Schema<IUser> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
    },
    email: {
      type: String,
      required: [true, "Please enter your email"],
      unique: true,
      validate: {
        validator: function (value: string) {
          return emailRegexPattern.test(value);
        },
        message: "Please enter a valid email",
      },
    },
    password: {
      type: String,
      required: [true, "Please enter your password"],
      select: false,
    },
    avatar: {
      publicId: String,
      url: String,
    },
    role: {
      type: String,
      default: "User",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    courses: [{ courseId: String }],
  },
  { timestamps: true }
);

userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.SignAccessToken = async function () {
  return jwt.sign({ id: this._id }, process.env.ACCESS_TOKEN || "");
};

userSchema.methods.SignRefreshToken = async function () {
  return jwt.sign({ id: this._id }, process.env.REFRESH_TOKEN || "");
};
userSchema.methods.comparePassword = async function (
  enteredPassword: string
): Promise<Boolean> {
  return bcrypt.compare(enteredPassword, this.password);
};

const userModel: Model<IUser> = mongoose.model("User", userSchema);

export default userModel;
