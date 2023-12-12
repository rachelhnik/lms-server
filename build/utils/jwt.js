"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshTokenOptions = exports.accessTokenOptions = void 0;
const redis_1 = require("./redis");
const accessTokenExpires = parseInt(process.env.ACCESS_TOKEN_EXPIRES || "300", 10);
const refreshTokenExpires = parseInt(process.env.REFRESH_TOKEN_EXPIRES || "1200", 10);
exports.accessTokenOptions = {
    expires: new Date(Date.now() + accessTokenExpires * 60 * 60 * 1000),
    maxAge: accessTokenExpires * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "lax",
};
exports.refreshTokenOptions = {
    expires: new Date(Date.now() + refreshTokenExpires * 1000),
    maxAge: refreshTokenExpires * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "lax",
};
const sendToken = async (user, statusCode, res) => {
    const accessToken = await user.SignAccessToken();
    const refreshToken = await user.SignRefreshToken();
    redis_1.redis.set(user._id, JSON.stringify(user));
    if (process.env.NODE_ENV === "production") {
        exports.accessTokenOptions.secure = true;
    }
    res.cookie("access_token", accessToken, exports.accessTokenOptions);
    res.cookie("refresh_token", refreshToken, exports.refreshTokenOptions);
    res.status(200).json({
        success: true,
        user,
        accessToken,
    });
};
exports.default = sendToken;
