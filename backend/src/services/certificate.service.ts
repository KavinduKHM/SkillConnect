import prisma from '../config/database.js';
import { randomBytes } from 'crypto';
import { CompletionRequestStatus } from '@prisma/client';

// Generate a random 12 character uppercase alphanumeric string
const generateCertificateId = () => {
  return 'CERT-' + randomBytes(6).toString('hex').toUpperCase();
};

const generateVerificationCode = () => {
  return randomBytes(16).toString('hex');
};

export const approveCompletionAndIssueCertificate = async (instructorId: string, requestId: string) => {
  const request = await prisma.completionRequest.findUnique({
    where: { id: requestId },
    include: { course: true },
  });

  if (!request) throw new Error('Completion request not found');
  if (request.course.creatorId !== instructorId) {
    throw new Error('Unauthorized. You are not the instructor of this course.');
  }

  if (request.status === CompletionRequestStatus.APPROVED) {
    throw new Error('This request has already been approved.');
  }

  // Transaction to update request and generate certificate safely
  return prisma.$transaction(async (tx) => {
    // 1. Approve Request
    await tx.completionRequest.update({
      where: { id: requestId },
      data: {
        status: CompletionRequestStatus.APPROVED,
        instructorId,
        reviewedAt: new Date(),
      },
    });

    // 2. Mark Enrollment as completed
    await tx.enrollment.update({
      where: {
        courseId_learnerId: {
          courseId: request.courseId,
          learnerId: request.learnerId,
        },
      },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        progressPercentage: 100,
      },
    });

    // 3. Issue Certificate
    const cert = await tx.certificate.create({
      data: {
        certificateId: generateCertificateId(),
        courseId: request.courseId,
        learnerId: request.learnerId,
        instructorId,
        completionRequestId: request.id,
        verificationCode: generateVerificationCode(),
      },
    });

    return cert;
  });
};

export const getLearnerCertificates = async (learnerId: string) => {
  return prisma.certificate.findMany({
    where: { learnerId, status: 'ACTIVE' },
    include: {
      course: { select: { title: true, difficulty: true } },
      instructor: { select: { name: true } },
    },
    orderBy: { issueDate: 'desc' },
  });
};

export const getCertificateByCode = async (certificateId: string) => {
  const cert = await prisma.certificate.findUnique({
    where: { certificateId },
    include: {
      course: { select: { title: true, duration: true } },
      learner: { select: { name: true } },
      instructor: { select: { name: true } },
    },
  });

  if (!cert) throw new Error('Certificate not found');
  return cert;
};

export const verifyCertificate = async (verificationCode: string, ipAddress?: string, userAgent?: string) => {
  const cert = await prisma.certificate.findUnique({
    where: { verificationCode },
    include: {
      course: { select: { title: true } },
      learner: { select: { name: true } },
    },
  });

  if (!cert) {
    return { valid: false, message: 'Invalid verification code' };
  }

  if (cert.status !== 'ACTIVE') {
    return { valid: false, message: 'Certificate has been revoked', certificate: cert };
  }

  // Log verification event
  await prisma.$transaction([
    prisma.certificateVerification.create({
      data: {
        certificateId: cert.id,
        ipAddress: ipAddress ?? null,
        userAgent: userAgent ?? null,
        status: 'VALID',
      },
    }),
    prisma.certificate.update({
      where: { id: cert.id },
      data: { verificationCount: { increment: 1 } },
    }),
  ]);

  return { valid: true, certificate: cert };
};
