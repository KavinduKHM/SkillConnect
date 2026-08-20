import prisma from '../config/database.js';
import { AssignmentStatus, SubmissionMethod } from '@prisma/client';

// -------------------------------------------------------------
// HELPER METHODS
// -------------------------------------------------------------

const verifyCourseOwnership = async (instructorId: string, courseId: string) => {
  const user = await prisma.user.findUnique({ where: { id: instructorId } });
  if (!user) throw new Error('User not found');
  if (user.role === 'ADMIN') return true;

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new Error('Course not found');
  if (course.creatorId !== instructorId) {
    throw new Error('You do not have permission to modify this course');
  }

  return true;
};

// -------------------------------------------------------------
// INSTRUCTOR OPERATIONS (ASSIGNMENTS)
// -------------------------------------------------------------

export const createAssignment = async (instructorId: string, data: any) => {
  await verifyCourseOwnership(instructorId, data.courseId);

  return prisma.assignment.create({
    data: {
      instructorId,
      courseId: data.courseId,
      title: data.title,
      instructions: data.instructions,
      deadline: data.deadline,
      maxMarks: data.maxMarks ?? 100,
      maxSubmissions: data.maxSubmissions ?? 3,
      allowedFileTypes: data.allowedFileTypes ?? ['pdf', 'doc', 'docx', 'zip', 'jpg', 'png'],
      maxFileSize: data.maxFileSize ?? 10485760,
      submissionMethods: data.submissionMethods ?? [SubmissionMethod.FILE],
      requireForCompletion: data.requireForCompletion ?? true,
      acceptLate: data.acceptLate ?? false,
      latePenalty: data.latePenalty ?? 10,
      lateWindow: data.lateWindow ?? 3,
    },
  });
};

export const updateAssignment = async (instructorId: string, assignmentId: string, data: any) => {
  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
  if (!assignment) throw new Error('Assignment not found');

  await verifyCourseOwnership(instructorId, assignment.courseId);

  return prisma.assignment.update({
    where: { id: assignmentId },
    data,
  });
};

export const deleteAssignment = async (instructorId: string, assignmentId: string) => {
  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
  if (!assignment) throw new Error('Assignment not found');

  await verifyCourseOwnership(instructorId, assignment.courseId);

  return prisma.assignment.delete({
    where: { id: assignmentId },
  });
};

export const getAssignmentSubmissions = async (instructorId: string, assignmentId: string) => {
  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
  if (!assignment) throw new Error('Assignment not found');

  await verifyCourseOwnership(instructorId, assignment.courseId);

  return prisma.assignmentSubmission.findMany({
    where: { assignmentId },
    include: {
      learner: {
        select: { id: true, name: true, email: true, profilePicture: true },
      },
    },
    orderBy: { submissionDate: 'desc' },
  });
};

export const gradeSubmission = async (instructorId: string, submissionId: string, data: { grade: number; feedback?: string; feedbackAttachments?: string[] }) => {
  const submission = await prisma.assignmentSubmission.findUnique({
    where: { id: submissionId },
    include: { assignment: true },
  });
  
  if (!submission) throw new Error('Submission not found');
  await verifyCourseOwnership(instructorId, submission.assignment.courseId);

  if (data.grade > submission.assignment.maxMarks) {
    throw new Error(`Grade cannot exceed max marks (${submission.assignment.maxMarks})`);
  }

  // Calculate potential late penalty
  let finalGrade = data.grade;
  let latePenaltyApplied: number | null = null;

  if (submission.isLate && submission.assignment.acceptLate && submission.assignment.latePenalty) {
    const penalty = (submission.assignment.latePenalty / 100) * submission.assignment.maxMarks;
    finalGrade = Math.max(0, finalGrade - penalty);
    latePenaltyApplied = penalty;
  }

  const updatedSubmission = await prisma.assignmentSubmission.update({
    where: { id: submissionId },
    data: {
      grade: finalGrade,
      feedback: data.feedback ?? null,
      feedbackAttachments: data.feedbackAttachments ?? [],
      status: AssignmentStatus.COMPLETED,
      gradedAt: new Date(),
      gradedBy: instructorId,
      latePenaltyApplied,
    },
  });

  // Update assignment average score
  const allGraded = await prisma.assignmentSubmission.findMany({
    where: { assignmentId: submission.assignmentId, grade: { not: null } },
    select: { grade: true },
  });

  if (allGraded.length > 0) {
    const sum = allGraded.reduce((acc, curr) => acc + (curr.grade || 0), 0);
    const averageScore = sum / allGraded.length;
    await prisma.assignment.update({
      where: { id: submission.assignmentId },
      data: { averageScore },
    });
  }

  return updatedSubmission;
};

// -------------------------------------------------------------
// LEARNER / SHARED OPERATIONS
// -------------------------------------------------------------

export const getCourseAssignments = async (courseId: string) => {
  return prisma.assignment.findMany({
    where: { courseId },
    orderBy: { deadline: 'asc' },
  });
};

export const getSingleAssignment = async (assignmentId: string) => {
  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    include: {
      submissions: {
        select: { id: true, learnerId: true, status: true, grade: true, submissionDate: true },
      },
    },
  });
  if (!assignment) throw new Error('Assignment not found');
  return assignment;
};

export const getLearnerSubmissions = async (learnerId: string, assignmentId: string) => {
  return prisma.assignmentSubmission.findMany({
    where: { learnerId, assignmentId },
    orderBy: { versionNumber: 'desc' },
  });
};

export const submitAssignment = async (
  learnerId: string,
  assignmentId: string,
  data: { fileUrls?: string[]; githubLink?: string; textSubmission?: string }
) => {
  const assignment = await prisma.assignment.findUnique({ where: { id: assignmentId } });
  if (!assignment) throw new Error('Assignment not found');

  const enrollment = await prisma.enrollment.findUnique({
    where: { courseId_learnerId: { courseId: assignment.courseId, learnerId } },
  });
  if (!enrollment) {
    throw new Error('You must be enrolled to submit assignments');
  }

  // Check if past deadline
  const now = new Date();
  const deadline = new Date(assignment.deadline);
  let isLate = false;

  if (now > deadline) {
    if (!assignment.acceptLate) {
      throw new Error('This assignment no longer accepts submissions (past deadline).');
    }
    
    // Check if past late window
    if (assignment.lateWindow) {
      const lateCutoff = new Date(deadline);
      lateCutoff.setDate(lateCutoff.getDate() + assignment.lateWindow);
      if (now > lateCutoff) {
        throw new Error(`The late submission window (${assignment.lateWindow} days) has expired.`);
      }
    }
    isLate = true;
  }

  // Check max submissions
  const previousSubmissions = await prisma.assignmentSubmission.findMany({
    where: { assignmentId, learnerId },
    orderBy: { versionNumber: 'desc' },
  });

  if (previousSubmissions.length >= assignment.maxSubmissions) {
    throw new Error(`You have reached the maximum number of submissions (${assignment.maxSubmissions}).`);
  }

  const nextVersion = previousSubmissions.length > 0 ? previousSubmissions[0]!.versionNumber + 1 : 1;

  const submission = await prisma.assignmentSubmission.create({
    data: {
      assignmentId,
      learnerId,
      fileUrls: data.fileUrls ?? [],
      githubLink: data.githubLink ?? null,
      textSubmission: data.textSubmission ?? null,
      status: AssignmentStatus.SUBMITTED,
      versionNumber: nextVersion,
      isLate,
      submissionDate: new Date(),
    },
  });

  // Update submission count if this is their first submission
  if (previousSubmissions.length === 0) {
    await prisma.assignment.update({
      where: { id: assignmentId },
      data: { submissionCount: { increment: 1 } },
    });
  }

  return submission;
};
