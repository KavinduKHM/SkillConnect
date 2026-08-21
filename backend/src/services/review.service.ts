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

export const createReview = async (learnerId: string, data: { courseId: string; rating: number; review?: string; comment?: string }) => {
  // Verify completion (via enrollment status, 100% progress, or certificate)
  const completion = await prisma.enrollment.findUnique({
    where: { courseId_learnerId: { courseId: data.courseId, learnerId } },
  });

  const certificate = await prisma.certificate.findFirst({
    where: { courseId: data.courseId, learnerId, status: 'ACTIVE' },
  });

  const isCompleted =
    (completion && (completion.status === 'COMPLETED' || (completion.progressPercentage != null && completion.progressPercentage >= 100))) ||
    !!certificate;

  if (!isCompleted) {
    throw new Error('You must complete the course before leaving a review.');
  }

  // Check if already reviewed
  const existingReview = await prisma.courseReview.findUnique({
    where: { courseId_learnerId: { courseId: data.courseId, learnerId } },
  });

  const reviewText = data.review !== undefined ? data.review : (data.comment !== undefined ? data.comment : null);

  if (existingReview) {
    // Update existing review seamlessly if user submits again
    const updatedReview = await prisma.courseReview.update({
      where: { id: existingReview.id },
      data: {
        rating: data.rating,
        review: reviewText,
        isEdited: true,
        editedAt: new Date(),
      },
      include: {
        learner: { select: { id: true, name: true, profilePicture: true } },
      },
    });
    await updateCourseAggregateRating(data.courseId);
    return { ...updatedReview, comment: updatedReview.review };
  }

  const review = await prisma.courseReview.create({
    data: {
      courseId: data.courseId,
      learnerId,
      rating: data.rating,
      review: reviewText,
      isVerified: true,
    },
    include: {
      learner: { select: { id: true, name: true, profilePicture: true } },
    },
  });

  await updateCourseAggregateRating(data.courseId);
  return { ...review, comment: review.review };
};

export const updateReview = async (learnerId: string, reviewId: string, data: { rating?: number; review?: string; comment?: string }) => {
  const existingReview = await prisma.courseReview.findUnique({ where: { id: reviewId } });
  if (!existingReview) throw new Error('Review not found');
  if (existingReview.learnerId !== learnerId) throw new Error('Unauthorized');

  const reviewText = data.review !== undefined ? data.review : (data.comment !== undefined ? data.comment : undefined);

  const updatedReview = await prisma.courseReview.update({
    where: { id: reviewId },
    data: {
      ...(data.rating !== undefined && { rating: data.rating }),
      ...(reviewText !== undefined && { review: reviewText }),
      isEdited: true,
      editedAt: new Date(),
    },
    include: {
      learner: { select: { id: true, name: true, profilePicture: true } },
    },
  });

  await updateCourseAggregateRating(updatedReview.courseId);
  return { ...updatedReview, comment: updatedReview.review };
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
  const reviews = await prisma.courseReview.findMany({
    where: { courseId },
    include: {
      learner: { select: { id: true, name: true, profilePicture: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return reviews.map((r) => ({
    ...r,
    comment: r.review,
  }));
};
