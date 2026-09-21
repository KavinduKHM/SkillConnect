import prisma from '../config/database.js';

const updateCourseAggregateRating = async (courseId: string) => {
  const reviews = await prisma.courseReview.findMany({
    where: { courseId },
    select: { rating: true },
  });

  if (reviews.length === 0) {
    await prisma.course.update({
      where: { id: courseId },
      data: { rating: 0, reviewCount: 0 },
    });
    return;
  }

  const sum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
  const averageRating = sum / reviews.length;

  await prisma.course.update({
    where: { id: courseId },
    data: {
      rating: averageRating,
      reviewCount: reviews.length,
    },
  });
};

export const createReview = async (learnerId: string, data: { courseId: string; rating: number; review?: string }) => {
  // Verify completion
  const completion = await prisma.enrollment.findUnique({
    where: { courseId_learnerId: { courseId: data.courseId, learnerId } },
  });

  if (!completion || completion.status !== 'COMPLETED') {
    throw new Error('You must complete the course before leaving a review.');
  }

  // Check if already reviewed
  const existingReview = await prisma.courseReview.findUnique({
    where: { courseId_learnerId: { courseId: data.courseId, learnerId } },
  });

  if (existingReview) {
    throw new Error('You have already reviewed this course. You can edit your existing review.');
  }

  const review = await prisma.courseReview.create({
    data: {
      courseId: data.courseId,
      learnerId,
      rating: data.rating,
      review: data.review ?? null,
      isVerified: true,
    },
  });

  await updateCourseAggregateRating(data.courseId);
  return review;
};

export const updateReview = async (learnerId: string, reviewId: string, data: { rating?: number; review?: string }) => {
  const existingReview = await prisma.courseReview.findUnique({ where: { id: reviewId } });
  if (!existingReview) throw new Error('Review not found');
  if (existingReview.learnerId !== learnerId) throw new Error('Unauthorized');

  const updatedReview = await prisma.courseReview.update({
    where: { id: reviewId },
    data: {
      ...(data.rating !== undefined && { rating: data.rating }),
      ...(data.review !== undefined && { review: data.review ?? null }),
      isEdited: true,
      editedAt: new Date(),
    },
  });

  await updateCourseAggregateRating(updatedReview.courseId);
  return updatedReview;
};

export const deleteReview = async (learnerId: string, reviewId: string) => {
  const existingReview = await prisma.courseReview.findUnique({ where: { id: reviewId } });
  if (!existingReview) throw new Error('Review not found');
  if (existingReview.learnerId !== learnerId) throw new Error('Unauthorized');

  await prisma.courseReview.delete({ where: { id: reviewId } });
  await updateCourseAggregateRating(existingReview.courseId);
  return true;
};

export const getCourseReviews = async (courseId: string) => {
  return prisma.courseReview.findMany({
    where: { courseId },
    include: {
      learner: { select: { name: true, profilePicture: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};
