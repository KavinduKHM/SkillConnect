import { Prisma, PrismaClient } from '@prisma/client';
import type { Profile } from '@prisma/client';
import type { CreateProfileInput, UpdateProfileInput } from '../types/index.js';

const prisma = new PrismaClient();

export class ProfileService {
  // Create a profile for a user
  async createProfile(userId: string, data: CreateProfileInput): Promise<Profile> {
    return prisma.profile.create({
       data: {
        userId,
        skills: data.skills ?? [],
        portfolio: data.portfolio ?? [],

        // nullable text fields
        bio: data.bio ?? null,
        experience: data.experience ?? null,
        location: data.location ?? null,
        website: data.website ?? null,

        // JSON field: undefined => omit, null => DB null
        ...(data.socialLinks !== undefined
          ? {
              socialLinks:
                data.socialLinks === null ? Prisma.DbNull : data.socialLinks,
            }
          : {}),
      },
    });
  }

  // Get profile by user ID
  async getProfileByUserId(userId: string): Promise<Profile | null> {
    return prisma.profile.findUnique({
      where: { userId },
      include: {
        qualifications: {
          include: {
            documents: true,
          },
        },
      },
    });
  }

  // Get public profile (for viewing by others)
  async getPublicProfile(userId: string): Promise<Partial<Profile> | null> {
    return prisma.profile.findUnique({
      where: { userId },
      select: {
        id: true,
        userId: true,
        bio: true,
        skills: true,
        experience: true,
        portfolio: true,
        location: true,
        website: true,
        socialLinks: true,
        qualifications: {
          where: { status: 'VERIFIED' },
          select: {
            id: true,
            title: true,
            institution: true,
            year: true,
          },
        },
      },
    });
  }

  // Update profile
  async updateProfile(userId: string, data: UpdateProfileInput): Promise<Profile> {
    return prisma.profile.update({
      where: { userId },
      data: {
        bio: data.bio ?? null,
        skills: data.skills ?? [],
        experience: data.experience ?? null,
        portfolio: data.portfolio ?? [],
        location: data.location ?? null,
        website: data.website ?? null,
        ...(data.socialLinks !== undefined
          ? {
              socialLinks:
                data.socialLinks === null ? Prisma.DbNull : data.socialLinks,
            }
          : {}),
      },
    });
  }

  // Check if profile exists
  async profileExists(userId: string): Promise<boolean> {
    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { id: true },
    });
    return !!profile;
  }
}