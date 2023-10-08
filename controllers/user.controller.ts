require("dotenv").config();
import { NextFunction, Request, Response } from "express";
import { CatchAsyncError } from "../middlewares/catchAsyncError";
import ErrorHandler from "../utils/errorHandler";
import User, { IUser } from "../models/user.model";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import sendEmail from "../utils/sendEmail";
import sendToken, {
  accessTokenOptions,
  refreshTokenOptions,
} from "../utils/jwt";
import getUserById from "../services/user.service";
import { redis } from "../utils/redis";
import cloudinary from "cloudinary";
interface IRegistrationBody {
  name: string;
  email: string;
  password: string;
  avatar?: string;
}

export const registerUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password } = req.body;

      const isEmailAlreadyExist = await User.findOne({ email });
      if (isEmailAlreadyExist) {
        return next(new ErrorHandler("Email already exist", 400));
      }

      const user: IRegistrationBody = { name, email, password };
      const activationData = createActivationData(user);

      const activationCode = activationData.activation_code;

      const data = { user: { name: user.name }, activationCode };

      try {
        await sendEmail({
          email: user.email,
          subject: "Activate your account",
          template: "activation.mail.ejs",
          data,
        });
        res.status(200).json({
          success: true,
          message: `Please check your email: ${user.email} to activate your account .`,
          activationToken: activationData.activation_token,
        });
      } catch (err: any) {
        return next(new ErrorHandler(err.message, 400));
      }
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

interface IActivationData {
  activation_token: string;
  activation_code: string;
}

export const createActivationData = (
  user: IRegistrationBody
): IActivationData => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
  const activationToken = jwt.sign(
    { user, activationCode },
    process.env.ACTIVATION_SECRET as Secret,
    { expiresIn: "5m" }
  );
  return { activation_token: activationToken, activation_code: activationCode };
};

interface IActivationRequest {
  activationToken: string;
  activationCode: string;
}

export const activateUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { activationToken, activationCode } = req.body;
      const newUser: { user: IUser; activationCode: string } = jwt.verify(
        activationToken,
        process.env.ACTIVATION_SECRET as Secret
      ) as { user: IUser; activationCode: string };

      if (newUser.activationCode !== activationCode) {
        return next(new ErrorHandler("Invalid activation code", 400));
      }
      const { name, email, password } = newUser.user;
      const isEmailAlreadyExist = await User.findOne({ email });
      if (isEmailAlreadyExist) {
        return next(
          new ErrorHandler("User with this email already exists.", 400)
        );
      }

      const user = await User.create({ name, email, password });
      res.status(200).json({
        success: true,
        message: "User successfully created",
        user: user,
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

interface ILoginRequest {
  email: string;
  password: string;
}

export const LoginUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as ILoginRequest;

      const user = await User.findOne({ email }).select("+password");

      if (!user) {
        return next(new ErrorHandler("User does not exist", 400));
      }

      const isPasswordMatch = await user.comparePassword(password);
      if (!isPasswordMatch) {
        return next(new ErrorHandler("Wrong password", 400));
      }
      sendToken(user, 200, res);
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

export const LogoutUser = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.cookie("access_token", "", { maxAge: 1 });
      res.cookie("refresh_token", "", { maxAge: 1 });
      const userId = req.user?._id;
      redis.del(userId);
      res.status(200).send({
        success: true,
        message: "Logout successfully",
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

export const UpdateAccessToken = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    const refresh_token = req.cookies.refresh_token as string;
    const decoded = (await jwt.verify(
      refresh_token,
      process.env.REFRESH_TOKEN as string
    )) as JwtPayload;
    if (!decoded) {
      return next(new ErrorHandler("No refresh token", 400));
    }
    const session = await redis.get(decoded.id);
    if (!session) {
      return next(new ErrorHandler("User not found", 400));
    }
    const user: IUser = JSON.parse(session);

    const accessToken = jwt.sign(
      { id: user._id },
      process.env.ACCESS_TOKEN || "",
      { expiresIn: "5m" }
    );
    const refreshToken = jwt.sign(
      { id: user._id },
      process.env.REFRESH_TOKEN || "",
      { expiresIn: "3d" }
    );
    req.user = user;
    res.cookie("access_token", accessToken, accessTokenOptions);
    res.cookie("refresh_token", refreshToken, refreshTokenOptions);
    res.status(200).send({
      success: true,
      user,
      accessToken,
    });
  }
);

export const getUserInfo = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      getUserById(userId, res);
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

interface ISocialAuthBody {
  email: string;
  name: string;
  avatar: string;
}

export const socialAuth = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, name, avatar } = req.body as ISocialAuthBody;
      const user = await User.findOne({ email });
      if (!user) {
        const newuser = await User.create({ email, name, avatar });
        sendToken(newuser, 200, res);
      } else {
        sendToken(user, 200, res);
      }
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

interface IUpdateUserInfo {
  name?: string;
  email?: string;
}

export const UpdateUserInfo = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email } = req.body;
      const userId = req.user?._id;
      const user = await User.findById(userId);
      if (!user) {
        return next(new ErrorHandler("User doesn't exist", 400));
      }
      if (user && email) {
        const emailToChange = user.email;
        const isEmailExist = await User.find({ emailToChange });
        console.log(isEmailExist);
        if (!isEmailExist) {
          return next(new ErrorHandler("Email doesn't exist", 400));
        }
        user.email = email;
      }
      if (user && name) {
        user.name = name;
      }

      await user.save();
      await redis.set(userId, JSON.stringify(user));
      res.status(200).json({
        success: true,
        user,
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

interface IUpdatePassword {
  oldPassword: string;
  newPassword: string;
}

export const UpdatePassword = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { oldPassword, newPassword } = req.body;
      const userId = req.user?._id;
      const user = await User.findById(userId).select("+password");

      if (!user) {
        return next(new ErrorHandler("User not found", 400));
      }
      const isPasswordMatched = await user.comparePassword(oldPassword);

      if (!isPasswordMatched) {
        return next(new ErrorHandler("Password is incorrect", 400));
      }

      user.password = newPassword;
      await user.save();
      await redis.set(req.user?._id, JSON.stringify(user));
      console.log(user);
      res.status(200).json({
        success: true,
        user,
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

interface IUpdateProfilePhoto {
  avatar: string;
}

export const UpdateProfilePhoto = CatchAsyncError(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { avatar } = req.body;
      const userId = req.user?._id;
      const user = await User.findById(userId);
      if (!user) {
        return next(new ErrorHandler("User not found", 400));
      }
      if (user && avatar) {
        if (user.avatar.publicId) {
          await cloudinary.v2.uploader.destroy(user.avatar.publicId);
          const myCloud = await cloudinary.v2.uploader.upload(avatar, {
            folder: "avatars",
            width: 150,
          });
          user.avatar = {
            publicId: myCloud.public_id,
            url: myCloud.secure_url,
          };
        } else {
          const myCloud = await cloudinary.v2.uploader.upload(avatar, {
            folder: "avatars",
            width: 150,
          });
          user.avatar = {
            publicId: myCloud.public_id,
            url: myCloud.secure_url,
          };
        }
        await user.save();
        await redis.set(req.user?._id, JSON.stringify(user));
        res.status(200).json({
          success: true,
          user,
        });
      }
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);
