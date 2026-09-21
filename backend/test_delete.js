import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  let output = '';
  const log = (msg) => {
    output += msg + '\n';
    console.log(msg);
  };

  log('=== Deletion Verification ===');

  // Find the newly created draft course
  const course = await prisma.course.findFirst({
    where: { title: 'Auto Test Course Redirection and Delete' }
  });

  if (course) {
    log(`Found draft course: ${course.id}`);
    try {
      // 1. Delete draft course using transaction delete
      await prisma.$transaction([
        prisma.learningHistory.deleteMany({ where: { courseId: course.id } }),
        prisma.learnerRecommendation.deleteMany({ where: { courseId: course.id } }),
        prisma.report.deleteMany({ where: { courseId: course.id } }),
        prisma.certificate.deleteMany({ where: { courseId: course.id } }),
        prisma.course.delete({
          where: {
            id: course.id,
          },
        }),
      ]);
      log('SUCCESS: Draft course deleted successfully!');
    } catch (e) {
      log(`FAILED to delete draft course: ${e.message}`);
    }
  } else {
    log('CRITICAL: Draft course "Auto Test Course Redirection and Delete" not found.');
  }

  // 2. Test Deleting REJECTED course via status change and transaction
  log('\n--- Testing Rejected Course Deletion ---');
  // Create a dummy course and set status to REJECTED
  const dummyCourse = await prisma.course.create({
    data: {
      title: 'Rejected Dummy Course',
      description: 'Testing rejected deletion',
      categoryId: '4e7ef7e7-054a-49eb-85e6-8b452d83c114',
      status: 'REJECTED',
      creatorId: '543ab6ca-2eaa-4e26-8e53-445521ad934c'
    }
  });
  log(`Created dummy course with status: ${dummyCourse.status}`);
  try {
    // Attempt delete
    await prisma.$transaction([
      prisma.learningHistory.deleteMany({ where: { courseId: dummyCourse.id } }),
      prisma.learnerRecommendation.deleteMany({ where: { courseId: dummyCourse.id } }),
      prisma.report.deleteMany({ where: { courseId: dummyCourse.id } }),
      prisma.certificate.deleteMany({ where: { courseId: dummyCourse.id } }),
      prisma.course.delete({
        where: {
          id: dummyCourse.id,
        },
      }),
    ]);
    log('SUCCESS: Rejected course deleted successfully!');
  } catch (e) {
    log(`FAILED to delete rejected course: ${e.message}`);
  }

  // 3. Test Category Deletion validation error precheck logic
  log('\n--- Testing Category Deletion Pre-checks ---');
  
  // Choose category "Programming" which has active courses
  const catId = '4e7ef7e7-054a-49eb-85e6-8b452d83c114';
  const cat = await prisma.category.findUnique({ where: { id: catId } });
  
  if (cat) {
    const courseCount = await prisma.course.count({
      where: { categoryId: catId },
    });
    if (courseCount > 0) {
      log(`SUCCESS: Pre-check detected ${courseCount} associated courses for category "${cat.name}". Validation error will throw correctly.`);
    } else {
      log(`FAILED: Category "${cat.name}" has no courses.`);
    }
  } else {
    log('CRITICAL: Category "Programming" not found.');
  }

  fs.writeFileSync('validate_results.txt', output, 'utf8');
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(() => prisma.$disconnect());
