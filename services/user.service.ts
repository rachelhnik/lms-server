import { Response } from "express";
import User from "../models/user.model";
import { redis } from "../utils/redis";

const getUserById = async (id: string, res: Response) => {
  const userJson = await redis.get(id);
  if (userJson) {
    const user = JSON.parse(userJson);
    res.status(201).json({
      success: true,
      user,
    });
  }
};

export default getUserById;
