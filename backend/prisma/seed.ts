import { PrismaClient, Role, UserStatus, DifficultyLevel, CourseStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const passwordHash = await bcrypt.hash('Password123', 10);

  // 1. Create or upsert Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@skillconnect.com' },
    update: {},
    create: {
      email: 'admin@skillconnect.com',
      passwordHash,
      name: 'System Admin',
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      profile: {
        create: {
          bio: 'Platform Administrator',
        },
      },
    },
  });
  console.log(`✅ Admin user ready: ${admin.email} (Role: ${admin.role})`);

  // 2. Create or upsert Skill Sharer (Instructor)
  const sharer = await prisma.user.upsert({
    where: { email: 'sharer@skillconnect.com' },
    update: {},
    create: {
      email: 'sharer@skillconnect.com',
      passwordHash,
      name: 'Alex Johnson',
      role: Role.SKILL_SHARER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      verifiedBadge: true,
      profile: {
        create: {
          bio: 'Senior Software Engineer & Full-Stack Mentor',
          skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
          experience: '8+ years in web development',
        },
      },
    },
  });
  console.log(`✅ Skill Sharer ready: ${sharer.email} (Role: ${sharer.role})`);

  // 3. Create or upsert Learner
  const learner = await prisma.user.upsert({
    where: { email: 'learner@skillconnect.com' },
    update: {},
    create: {
      email: 'learner@skillconnect.com',
      passwordHash,
      name: 'Jane Learner',
      role: Role.LEARNER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      profile: {
        create: {
          bio: 'Aspiring Web Developer',
          skills: ['HTML', 'CSS', 'JavaScript'],
        },
      },
    },
  });
  console.log(`✅ Learner ready: ${learner.email} (Role: ${learner.role})`);

  // 4. Create sample Category
  const category = await prisma.category.upsert({
    where: { name: 'Web Development' },
    update: {},
    create: {
      name: 'Web Development',
      description: 'Frontend, Backend, and Full-Stack Engineering',
      icon: 'code',
    },
  });

  // 5. Create sample Course owned by Skill Sharer
  let course = await prisma.course.findFirst({
    where: { creatorId: sharer.id, title: 'Full-Stack Web Development Bootcamp' },
  });

  if (!course) {
    course = await prisma.course.create({
      data: {
        title: 'Full-Stack Web Development Bootcamp',
        description: 'Master React, Node.js, Express, and PostgreSQL from scratch with real-world projects.',
        categoryId: category.id,
        creatorId: sharer.id,
        difficulty: DifficultyLevel.INTERMEDIATE,
        language: 'English',
        status: CourseStatus.PUBLISHED,
        duration: '6 weeks',
        estimatedHours: 40,
        learningOutcomes: [
          'Build responsive React applications',
          'Design REST APIs with Node and Express',
          'Deploy database-backed apps to the cloud',
        ],
      },
    });
    console.log(`✅ Sample Course created: "${course.title}" (ID: ${course.id})`);
  } else {
    console.log(`✅ Sample Course already exists (ID: ${course.id})`);
  }

  // 6. Enroll Learner in the Course
  const enrollment = await prisma.enrollment.upsert({
    where: {
      courseId_learnerId: {
        courseId: course.id,
        learnerId: learner.id,
      },
    },
    update: {},
    create: {
      courseId: course.id,
      learnerId: learner.id,
      status: 'ACTIVE',
      courseProgress: {
        create: {
          courseId: course.id,
          learnerId: learner.id,
          totalLessons: 10,
          completedLessons: 2,
          progressPercentage: 20,
        },
      },
    },
  });
  console.log(`✅ Learner enrolled in course (Enrollment ID: ${enrollment.id})`);

  console.log('\n Seed completed successfully!');
  console.log('----------------------------------------------------');
  console.log('🔑 TEST CREDENTIALS:');
  console.log('   Admin:        admin@skillconnect.com   / Password123');
  console.log('   Skill Sharer: sharer@skillconnect.com  / Password123');
  console.log('   Learner:      learner@skillconnect.com / Password123');
  console.log('   Course ID:   ', course.id);
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error(' Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
