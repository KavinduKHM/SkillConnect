/**
 * SKIL-64: Assignment Deadline Email Reminders Service
 * SKIL-54: Learner Assignment Dashboard Tracking
 */
import { PrismaClient } from '@prisma/client';
import { sendDeadlineReminderEmail } from './email.service.js';
import { logger } from '../utils/logger.js';

const prisma = new PrismaClient();

export const sendDeadlineRemindersForLearner = async (learnerId: string) => {
  // Find all active enrollments for this learner
  const enrollments = await prisma.enrollment.findMany({
    where: {
      learnerId,
      status: { in: ['ACTIVE', 'IN_PROGRESS'] },
    },
    include: {
      course: {
        include: {
          assignments: true,
        },
      },
      learner: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  const remindersSent: any[] = [];

  for (const enrollment of enrollments) {
    const learner = enrollment.learner;
    if (!learner || !learner.email) continue;

    for (const assignment of enrollment.course.assignments) {
      // Check if learner already submitted this assignment
      const existingSubmission = await prisma.assignmentSubmission.findFirst({
        where: {
          assignmentId: assignment.id,
          learnerId,
        },
      });

      // If learner has NOT submitted yet
      if (!existingSubmission) {
        const dueDateFormatted = assignment.deadline
          ? new Date(assignment.deadline).toLocaleDateString(undefined, {
              weekday: 'short',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : 'No specific deadline set (Submit soon)';

        // Send email notification to learner's registered email
        const emailResult = await sendDeadlineReminderEmail(
          learner.email,
          learner.name || 'Learner',
          assignment.title,
          enrollment.course.title,
          dueDateFormatted,
          assignment.id
        );

        // Record reminder log in LearningHistory
        await prisma.learningHistory.create({
          data: {
            learnerId,
            courseId: enrollment.courseId,
            enrollmentId: enrollment.id,
            activityType: 'DEADLINE_REMINDER_SENT',
            description: `Sent Email Reminder to ${learner.email} for assignment "${assignment.title}"`,
            metadata: { assignmentId: assignment.id, email: learner.email },
          },
        });

        remindersSent.push({
          assignmentId: assignment.id,
          assignmentTitle: assignment.title,
          courseTitle: enrollment.course.title,
          dueDate: dueDateFormatted,
          sentToEmail: learner.email,
          simulated: emailResult.simulated ?? false,
        });
      }
    }
  }

  return {
    count: remindersSent.length,
    remindersSent,
  };
};

export const getPendingDeadlinesForLearner = async (learnerId: string) => {
  const enrollments = await prisma.enrollment.findMany({
    where: {
      learnerId,
      status: { in: ['ACTIVE', 'IN_PROGRESS'] },
    },
    include: {
      course: {
        include: {
          assignments: true,
        },
      },
    },
  });

  const pendingAssignments: any[] = [];

  for (const enrollment of enrollments) {
    for (const assignment of enrollment.course.assignments) {
      const submission = await prisma.assignmentSubmission.findFirst({
        where: { assignmentId: assignment.id, learnerId },
      });

      if (!submission) {
        pendingAssignments.push({
          id: assignment.id,
          title: assignment.title,
          courseTitle: enrollment.course.title,
          courseId: enrollment.courseId,
          deadline: assignment.deadline,
          maxMarks: assignment.maxMarks,
          requireForCompletion: assignment.requireForCompletion,
        });
      }
    }
  }

  return pendingAssignments;
};

export const getAllNotificationsForLearner = async (learnerId: string) => {
  // Fetch email reminder logs
  const emailLogs = await prisma.learningHistory.findMany({
    where: {
      learnerId,
      activityType: 'DEADLINE_REMINDER_SENT',
    },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });

  // Fetch pending assignment deadlines
  const pendingDeadlines = await getPendingDeadlinesForLearner(learnerId);

  // Combine into formatted notifications list
  const notifications = [
    ...emailLogs.map((log) => ({
      id: log.id,
      type: 'EMAIL_SENT',
      title: '📧 Assignment Email Reminder Sent',
      message: log.description,
      createdAt: log.createdAt,
      read: false,
      metadata: log.metadata,
    })),
    ...pendingDeadlines.map((p) => ({
      id: `pending-${p.id}`,
      type: 'DEADLINE_ALERT',
      title: `⏰ Pending Deadline: ${p.title}`,
      message: `Course "${p.courseTitle}" - Max Marks: ${p.maxMarks}. Please submit before deadline.`,
      createdAt: p.deadline || new Date(),
      read: false,
      assignmentId: p.id,
    })),
  ];

  return {
    unreadCount: notifications.length,
    notifications,
    emailLogs,
    pendingDeadlines,
  };
};

