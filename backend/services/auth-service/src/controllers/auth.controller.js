import { Credential } from "../models/Credential.model.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { generateAccessToken, generateRefreshToken } from "../utils/jwt.js";
import { getRedisClient } from "../config/redis.js";
import { ApiError } from "../utils/ApiError.js";
import { signupSchema, loginSchema } from "../validators/auth.validator.js";
import { publishEvent } from "../config/rabbitmq.js";

export const signup = async (req, res, next) => {
  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        "Invalid input",
        parsed.error.flatten().fieldErrors,
      );
    }

    const { fullName, email, phone, password, role } = parsed.data;

    const existingCred = await Credential.findOne({
      $or: [{ email }, { phone }],
    });
    if (existingCred) {
      throw new ApiError(
        409,
        "DUPLICATE_RESOURCE",
        "Email or phone already registered",
      );
    }

    const passwordHash = await hashPassword(password);

    const credential = await Credential.create({
      fullName,
      email,
      phone,
      passwordHash,
      role,
      status: "active",
    });

    await publishEvent("user.registered", {
      userId: credential._id.toString(),
      role: credential.role,
      email: credential.email,
      phone: credential.phone,
      fullName: fullName, // Pass profile data via event
    });

    const accessToken = generateAccessToken(credential);
    const refreshToken = generateRefreshToken(credential);

    // Store refresh token in Redis (7 days TTL)
    const redis = getRedisClient();
    await redis.set(`refresh_token:${credential._id}`, refreshToken, {
      EX: 7 * 24 * 60 * 60,
    });

    res.status(201).json({
      data: {
        accessToken,
        refreshToken, // Returning in body for MVP/Postman. In prod, this goes in an httpOnly cookie.
        expiresIn: 900,
        user: {
          id: credential._id,
          role: credential.role,
          fullName: credential.fullName,
        },
      },
      meta: { requestId: req.requestId },
      error: null,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(
        400,
        "VALIDATION_ERROR",
        "Invalid input",
        parsed.error.flatten().fieldErrors,
      );
    }

    const { identifier, password } = parsed.data;

    // Find by email or phone
    const credential = await Credential.findOne({
      $or: [{ email: identifier }, { phone: identifier }],
    });

    if (!credential) {
      throw new ApiError(
        401,
        "INVALID_CREDENTIALS",
        "Invalid email/phone or password",
      );
    }

    const isMatch = await comparePassword(password, credential.passwordHash);
    if (!isMatch) {
      throw new ApiError(
        401,
        "INVALID_CREDENTIALS",
        "Invalid email/phone or password",
      );
    }

    if (credential.status !== "active") {
      throw new ApiError(
        403,
        "FORBIDDEN",
        "Account is pending verification or suspended",
      );
    }

    const accessToken = generateAccessToken(credential);
    const refreshToken = generateRefreshToken(credential);

    const redis = getRedisClient();
    await redis.set(`refresh_token:${credential._id}`, refreshToken, {
      EX: 7 * 24 * 60 * 60,
    });

    res.status(200).json({
      data: {
        accessToken,
        refreshToken,
        expiresIn: 900,
        user: {
          id: credential._id,
          role: credential.role,
          fullName: credential.fullName,
        },
      },
      meta: { requestId: req.requestId },
      error: null,
    });
  } catch (error) {
    next(error);
  }
};
