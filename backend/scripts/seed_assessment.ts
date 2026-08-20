import { PrismaClient, QuizPlatform } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Assessment feature sample data...');

  // 1. Get the Learner and Skill Sharer
  const learner = await prisma.user.findFirst({
    where: { role: 'LEARNER' }
  });
  const skillSharer = await prisma.user.findFirst({
    where: { role: 'SKILL_SHARER' }
  });

  if (!learner || !skillSharer) {
    console.log('Learner or Skill Sharer not found in the DB. Please run the main seed script first.');
    return;
  }

  // 2. Find a course created by the Skill Sharer
  let course = await prisma.course.findFirst({
    where: { creatorId: skillSharer.id }
  });

  if (!course) {
    // If they don't have one, just pick any published course, or create one?
    // Let's just pick any course
    course = await prisma.course.findFirst({});
    if (!course) {
        console.log('No courses found in the DB. Please create a course first.');
        return;
    }
    // ensure the skill sharer is the creator for test purposes
    await prisma.course.update({
        where: { id: course.id },
        data: { creatorId: skillSharer.id }
    });
  }

  // 3. Enroll the Learner in the course (if not already enrolled)
  await prisma.enrollment.upsert({
    where: {
      courseId_learnerId: {
        courseId: course.id,
        learnerId: learner.id,
      }
    },
    update: {},
    create: {
      courseId: course.id,
      learnerId: learner.id,
      status: 'ACTIVE',
      progressPercentage: 50,
    }
  });

  // 4. Create an Assessment (QuizLink) for the course
  // First clear any existing to avoid duplicates
  await prisma.quizLink.deleteMany({
    where: { courseId: course.id }
  });

  const quiz = await prisma.quizLink.create({
    data: {
      courseId: course.id,
      instructorId: skillSharer.id,
      title: `${course.title} - Final Assessment`,
      instructions: 'Please complete this Google Form to test your knowledge and receive your certificate. Ensure you score at least 80%.',
      platform: QuizPlatform.GOOGLE_FORMS,
      url: 'https://docs.google.com/forms/d/e/1FAIpQLSfPXVxL-j2R8H0O6oW6yG6Qk4iJ4J_a_H7uX6w2oZ5zO_9BHg/viewform',
      passingScore: 80,
      requireForCompletion: true,
      dueDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    }
  });

  console.log(`✅ Sample Assessment created successfully for course: ${course.title}`);
  console.log(`- Assessment ID: ${quiz.id}`);
  console.log(`- Learner Enrolled: ${learner.name} (${learner.email})`);
  console.log(`- Instructor: ${skillSharer.name} (${skillSharer.email})`);
  console.log('\nYou can now log in as the learner or skill sharer to test the feature.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
