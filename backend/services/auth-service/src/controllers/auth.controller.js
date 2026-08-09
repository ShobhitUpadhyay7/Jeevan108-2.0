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
    
    const refreshTTL = 7 * 24 * 60 * 60; // 7 days

    // Forward lookup: userId -> refreshToken
    await redis.set(`refresh_token:${credential._id}`, refreshToken, { EX: refreshTTL });

    // Reverse lookup: refreshToken -> { userId, role }
    // This allows the /refresh endpoint to find the user by token
    await redis.set(
      `refresh_session:${refreshToken}`,
      JSON.stringify({ userId: credential._id.toString(), role: credential.role }),
      { EX: refreshTTL }
    );

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
    // After generating tokens in the login function:
    const refreshTTL = 7 * 24 * 60 * 60; // 7 days

    // Forward lookup: userId -> refreshToken
    await redis.set(`refresh_token:${credential._id}`, refreshToken, { EX: refreshTTL });

    // Reverse lookup: refreshToken -> { userId, role }
    // This allows the /refresh endpoint to find the user by token
    await redis.set(
      `refresh_session:${refreshToken}`,
      JSON.stringify({ userId: credential._id.toString(), role: credential.role }),
      { EX: refreshTTL }
    );

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

// POST /api/v1/auth/refresh (ADD §4.4)
export const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'refreshToken is required');
    }

    const redis = getRedisClient();

    // Find which user this refresh token belongs to
    // We stored it as refresh_token:{userId} = refreshToken during login
    // But for refresh, we need to look up by the token value itself
    // So we need a reverse lookup. Let's store it both ways.

    // Check if this refresh token is valid
    const tokenData = await redis.get(`refresh_session:${refreshToken}`);

    if (!tokenData) {
      throw new ApiError(401, 'UNAUTHENTICATED', 'Invalid or expired refresh token');
    }

    const parsed = JSON.parse(tokenData);
    const userId = parsed.userId;

    // Fetch the user to generate new tokens
    const { Credential } = await import('../models/Credential.model.js');
    const credential = await Credential.findById(userId);

    if (!credential) {
      throw new ApiError(401, 'UNAUTHENTICATED', 'User not found');
    }

    if (credential.status !== 'active') {
      throw new ApiError(403, 'FORBIDDEN', 'Account is suspended or pending verification');
    }

    // ROTATE: Delete old refresh token, issue new pair
    await redis.del(`refresh_session:${refreshToken}`);
    await redis.del(`refresh_token:${userId}`);

    const newAccessToken = generateAccessToken(credential);
    const newRefreshToken = generateRefreshToken(credential);

    // Store new refresh token (both forward and reverse lookup)
    const refreshTTL = 7 * 24 * 60 * 60; // 7 days
    await redis.set(`refresh_token:${userId}`, newRefreshToken, { EX: refreshTTL });
    await redis.set(
      `refresh_session:${newRefreshToken}`,
      JSON.stringify({ userId: credential._id.toString(), role: credential.role }),
      { EX: refreshTTL }
    );

    res.status(200).json({
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 900,
        user: { id: credential._id, role: credential.role, email: credential.email }
      },
      meta: { requestId: req.requestId },
      error: null
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/auth/logout (ADD §4.5)
export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const userId = req.headers['x-user-id'];

    const redis = getRedisClient();

    if (refreshToken) {
      // Revoke specific session
      await redis.del(`refresh_session:${refreshToken}`);
    }

    // Also revoke the user's primary refresh token
    if (userId) {
      const storedToken = await redis.get(`refresh_token:${userId}`);
      if (storedToken) {
        await redis.del(`refresh_session:${storedToken}`);
      }
      await redis.del(`refresh_token:${userId}`);
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// POST /api/v1/auth/logout-all (ADD §4.5)
export const logoutAll = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];

    if (!userId) {
      throw new ApiError(401, 'UNAUTHENTICATED', 'User context missing');
    }

    const redis = getRedisClient();

    // Get all refresh sessions for this user
    // For MVP, we only store one session per user
    // In production, you'd track multiple device sessions
    const storedToken = await redis.get(`refresh_token:${userId}`);
    if (storedToken) {
      await redis.del(`refresh_session:${storedToken}`);
    }
    await redis.del(`refresh_token:${userId}`);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};