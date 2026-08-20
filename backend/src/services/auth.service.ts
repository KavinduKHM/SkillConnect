import prisma from '../config/database.js';
import { hashPassword, comparePassword } from '../utils/bcrypt.js';
import { generateToken } from '../utils/jwt.js';
import { logger } from '../utils/logger.js';

export const registerUser = async (data: {
  email: string;
  password: string;
  name: string;
  role?: string;
}) => {
  try {
    const emailLower = data.email.toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: { email: emailLower },
    });

    if (existingUser) {
      throw new Error('Email already registered');
    }

    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        email: emailLower,
        passwordHash: hashedPassword,
        name: data.name,
        role: data.role as any || 'LEARNER',
      },
    });

    // Create profile for user
    await prisma.profile.create({
      data: {
        userId: user.id,
      },
    });

    const token = generateToken(user.id);

    logger.info(`User registered: ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        verifiedBadge: user.verifiedBadge,
      },
      token,
    };
  } catch (error: any) {
    logger.error('Registration error:', error);
    throw new Error(error.message);
  }
};

export const loginUser = async (email: string, password: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (user.status === 'SUSPENDED') {
      throw new Error('Account suspended');
    }

    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const token = generateToken(user.id);

    logger.info(`User logged in: ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        verifiedBadge: user.verifiedBadge,
        profilePicture: user.profilePicture,
      },
      token,
    };
  } catch (error: any) {
    logger.error('Login error:', error);
    throw new Error(error.message);
  }
};

export const getCurrentUser = async (userId: string) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        verifiedBadge: true,
        profilePicture: true,
        createdAt: true,
        profile: {
          select: {
            bio: true,
            skills: true,
            experience: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  } catch (error: any) {
    logger.error('Get current user error:', error);
    throw new Error(error.message);
  }
};