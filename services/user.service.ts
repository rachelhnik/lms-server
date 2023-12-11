import { Response, Request } from "express";
import User from "../models/user.model";
import { redis } from "../utils/redis";
import Course from "../models/course.model";

export const getUserById = async (id: string, res: Response) => {
  const userJson = await redis.get(id);
  if (userJson) {
    const user = JSON.parse(userJson);
    res.status(201).json({
      success: true,
      user,
    });
  }
};

export const getAllUsersService = async (req: Request, res: Response) => {
  const coursesByAdmin = await Course.find({ userId: req.user?._id });
  const purchasedUsersIds = coursesByAdmin.flatMap(
    (course) => course.purchasedUsers
  );

  const duplicatesFilteredUserIds = [...new Set(purchasedUsersIds)];
  const users = await User.find({
    _id: { $in: duplicatesFilteredUserIds },
  }).sort({ createdAt: -1 });
  res
    .status(200)
    .json({
      success: true,
      users,
      coursesIds: coursesByAdmin.map((course) => course.id),
    });
};

export const updateUserRoleService = async (
  res: Response,
  id: string,
  role: string
) => {
  const user = await User.findByIdAndUpdate(id, { role }, { new: true });
  res.status(201).json({
    success: true,
    user,
  });
};
