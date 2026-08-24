import { Prisma, PrismaClient, QualificationStatus } from '@prisma/client';
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
    const profile = await prisma.profile.update({
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

    // Automatically create a Qualification request if skills are updated and no active qualification/verification is already in progress/verified
    if (data.skills && data.skills.length > 0) {
      // Find if there is any pending or verified qualification for this profile/user
      const existingQual = await prisma.qualification.findFirst({
        where: {
          userId,
          title: 'Profile Skills Verification',
        },
      });

      if (!existingQual) {
        await prisma.qualification.create({
          data: {
            userId,
            profileId: profile.id,
            title: 'Profile Skills Verification',
            institution: 'SkillConnect Platform',
            year: new Date().getFullYear(),
            description: `Auto-submitted for skills verification. Skills: ${profile.skills.join(', ')}`,
            status: QualificationStatus.PENDING_VERIFICATION,
          },
        });
      } else if (existingQual.status === 'REJECTED' || existingQual.status === 'NOT_SUBMITTED') {
        // If it was rejected or not submitted, reset it to pending
        await prisma.qualification.update({
          where: { id: existingQual.id },
          data: {
            status: QualificationStatus.PENDING_VERIFICATION,
            description: `Auto-submitted for skills verification. Skills: ${profile.skills.join(', ')}`,
          },
        });
      }
    }

    return profile;
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