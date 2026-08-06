import { User } from '../models/User.model.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import { getRedisClient } from '../config/redis.js';
import { ApiError } from '../utils/ApiError.js';
import { signupSchema, loginSchema } from '../validators/auth.validator.js';

export const signup = async (req, res, next) => {
  try {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid input', parsed.error.flatten().fieldErrors);
    }

    const { fullName, email, phone, password, role } = parsed.data;

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      throw new ApiError(409, 'DUPLICATE_RESOURCE', 'Email or phone already registered');
    }

    const passwordHash = await hashPassword(password);
    
    const user = await User.create({
      fullName, email, phone, passwordHash, role, status: 'active' 
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token in Redis (7 days TTL)
    const redis = getRedisClient();
    await redis.set(`refresh_token:${user._id}`, refreshToken, { EX: 7 * 24 * 60 * 60 });

    res.status(201).json({
      data: {
        accessToken,
        refreshToken, // Returning in body for MVP/Postman. In prod, this goes in an httpOnly cookie.
        expiresIn: 900,
        user: { id: user._id, role: user.role, fullName: user.fullName }
      },
      meta: { requestId: req.requestId },
      error: null
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid input', parsed.error.flatten().fieldErrors);
    }

    const { identifier, password } = parsed.data;

    // Find by email or phone
    const user = await User.findOne({
      $or: [{ email: identifier }, { phone: identifier }]
    });

    if (!user) {
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email/phone or password');
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      throw new ApiError(401, 'INVALID_CREDENTIALS', 'Invalid email/phone or password');
    }

    if (user.status !== 'active') {
       throw new ApiError(403, 'FORBIDDEN', 'Account is pending verification or suspended');
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const redis = getRedisClient();
    await redis.set(`refresh_token:${user._id}`, refreshToken, { EX: 7 * 24 * 60 * 60 });

    res.status(200).json({
      data: {
        accessToken,
        refreshToken,
        expiresIn: 900,
        user: { id: user._id, role: user.role, fullName: user.fullName }
      },
      meta: { requestId: req.requestId },
      error: null
    });
  } catch (error) {
    next(error);
  }
};