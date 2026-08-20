import { PrismaClient, Role, UserStatus, DifficultyLevel, CourseStatus, QuizPlatform, DeliveryMethod, SubmissionMethod } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding SkillConnect database with comprehensive courses for Learner testing...');

  const passwordHash = await bcrypt.hash('Password123', 10);

  // ----------------------------------------------------
  // 1. CREATE OR UPSERT USERS (Admin, Skill Sharers, Learner)
  // ----------------------------------------------------

  // 1a. System Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@skillconnect.com' },
    update: { passwordHash, name: 'System Admin' },
    create: {
      email: 'admin@skillconnect.com',
      passwordHash,
      name: 'System Admin',
      role: Role.ADMIN,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      profile: {
        create: {
          bio: 'Platform Administrator & Governance Manager',
          location: 'Colombo, Sri Lanka',
        },
      },
    },
  });
  console.log(`✅ Admin user ready: ${admin.email}`);

  // 1b. Skill Sharer 1 - John Perera (Verified)
  const sharer1 = await prisma.user.upsert({
    where: { email: 'sharer@skillconnect.com' },
    update: { 
      passwordHash, 
      name: 'John Perera',
      verifiedBadge: true,
    },
    create: {
      email: 'sharer@skillconnect.com',
      passwordHash,
      name: 'John Perera',
      role: Role.SKILL_SHARER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      verifiedBadge: true,
      profile: {
        create: {
          bio: 'Senior Software Engineer & Lead Mobile Architect with 10+ years in React Native and Cross-Platform Apps.',
          skills: ['React Native', 'TypeScript', 'Node.js', 'Redux', 'GraphQL', 'Mobile Security'],
          experience: '10+ years software engineering, Ex-Tech Lead at Fortune 500',
          portfolio: ['https://github.com/johnperera', 'https://johnperera.dev'],
          location: 'Colombo, Sri Lanka',
          website: 'https://johnperera.dev',
        },
      },
    },
  });
  console.log(`✅ Skill Sharer 1 ready: ${sharer1.name} (${sharer1.email})`);

  // 1c. Skill Sharer 2 - Dr. Sarah Jenkins (Verified)
  const sharer2 = await prisma.user.upsert({
    where: { email: 'sarah.jenkins@skillconnect.com' },
    update: { 
      passwordHash, 
      name: 'Dr. Sarah Jenkins',
      verifiedBadge: true,
    },
    create: {
      email: 'sarah.jenkins@skillconnect.com',
      passwordHash,
      name: 'Dr. Sarah Jenkins',
      role: Role.SKILL_SHARER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      verifiedBadge: true,
      profile: {
        create: {
          bio: 'Principal UI/UX Designer & Human-Computer Interaction Researcher.',
          skills: ['Figma', 'UI/UX Design', 'User Research', 'Prototyping', 'Design Systems'],
          experience: '12 years in UX research and digital product design',
          portfolio: ['https://dribbble.com/sarahjenkins'],
          location: 'Kandy, Sri Lanka',
        },
      },
    },
  });
  console.log(`✅ Skill Sharer 2 ready: ${sharer2.name} (${sharer2.email})`);

  // 1d. Learner User
  const learner = await prisma.user.upsert({
    where: { email: 'learner@skillconnect.com' },
    update: { passwordHash, name: 'Asheni Learner' },
    create: {
      email: 'learner@skillconnect.com',
      passwordHash,
      name: 'Asheni Learner',
      role: Role.LEARNER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      profile: {
        create: {
          bio: 'Enthusiastic mobile developer & learner building cross-platform apps.',
          skills: ['JavaScript', 'React', 'HTML/CSS'],
          location: 'Colombo, Sri Lanka',
        },
      },
    },
  });
  console.log(`✅ Learner user ready: ${learner.name} (${learner.email})`);

  // ----------------------------------------------------
  // 2. CREATE CATEGORIES & SKILLS
  // ----------------------------------------------------

  const techCategory = await prisma.category.upsert({
    where: { name: 'Technology' },
    update: {},
    create: {
      name: 'Technology',
      description: 'Software Development, Mobile Apps, Cloud and AI',
      icon: 'laptop',
    },
  });

  const mobileCategory = await prisma.category.upsert({
    where: { name: 'Mobile Development' },
    update: {},
    create: {
      name: 'Mobile Development',
      description: 'React Native, Flutter, Swift, and Android Development',
      icon: 'cellphone',
      parentId: techCategory.id,
    },
  });

  const webCategory = await prisma.category.upsert({
    where: { name: 'Web Development' },
    update: {},
    create: {
      name: 'Web Development',
      description: 'Full-Stack Web Development, Frontend Frameworks and REST APIs',
      icon: 'web',
      parentId: techCategory.id,
    },
  });

  const designCategory = await prisma.category.upsert({
    where: { name: 'Arts & Design' },
    update: {},
    create: {
      name: 'Arts & Design',
      description: 'UI/UX Design, Graphic Design, Figma & Digital Illustration',
      icon: 'palette',
    },
  });

  console.log('✅ Categories created/verified');

  // ----------------------------------------------------
  // 3. CREATE COURSES & CONTENT
  // ----------------------------------------------------

  // Clean up existing test courses and dependencies for clean re-seed
  const existingCourses = await prisma.course.findMany({
    where: {
      title: {
        in: [
          'React Native Mobile App Development',
          'Full-Stack Web Development with React & Node.js',
          'UI/UX Design Masterclass: Figma to Mobile UI',
        ],
      },
    },
  });

  if (existingCourses.length > 0) {
    const courseIds = existingCourses.map((c) => c.id);
    await prisma.learningHistory.deleteMany({ where: { courseId: { in: courseIds } } });
    await prisma.courseReview.deleteMany({ where: { courseId: { in: courseIds } } });
    await prisma.learnerRecommendation.deleteMany({ where: { courseId: { in: courseIds } } });
    await prisma.quizLink.deleteMany({ where: { courseId: { in: courseIds } } });
    await prisma.assignment.deleteMany({ where: { courseId: { in: courseIds } } });
    await prisma.enrollment.deleteMany({ where: { courseId: { in: courseIds } } });
    await prisma.course.deleteMany({ where: { id: { in: courseIds } } });
  }

  const course1 = await prisma.course.create({
    data: {
      title: 'React Native Mobile App Development',
      description: 'Master cross-platform mobile development from scratch using React Native, Expo, TypeScript, Navigation, Native Hardware APIs, and State Management.',
      categoryId: mobileCategory.id,
      creatorId: sharer1.id,
      difficulty: DifficultyLevel.INTERMEDIATE,
      language: 'English',
      deliveryMethod: DeliveryMethod.SELF_PACED,
      duration: '5 weeks',
      estimatedHours: 35,
      prerequisites: 'Basic understanding of JavaScript ES6 and React Fundamentals',
      learningOutcomes: [
        'Build production-ready React Native apps for iOS and Android',
        'Implement Navigation, Modals, Dynamic Layouts and Flexbox',
        'Integrate Camera, GPS Location, Push Notifications and Native Hardware',
        'Manage Global State with Zustand & React Query',
        'Deploy applications to Expo Application Services & App Stores',
      ],
      thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80',
      status: CourseStatus.PUBLISHED,
      enrolledCount: 154,
      rating: 4.8,
      reviewCount: 42,
    },
  });

  console.log(`✅ Main Course Created: "${course1.title}" (ID: ${course1.id})`);

  // Course 1 Modules & Lessons Data Structure (20 lessons across 4 modules)
  const modulesData = [
    {
      title: 'Module 1: React Native Core Architecture & Setup',
      description: 'Environment setup, Expo CLI, JSX components, Styling with StyleSheet and Flexbox.',
      order: 1,
      lessons: [
        {
          title: '1. Introduction to React Native & Expo Ecosystem',
          description: 'Overview of React Native architecture, JavaScript bridge, and Expo vs Bare Workflow.',
          content: 'In this lesson, you will learn the foundational architecture of React Native and set up your Expo development environment.',
          estimatedMinutes: 15,
          materials: [
            { title: 'React Native Architecture Deep Dive', type: 'VIDEO', fileUrl: 'https://www.youtube.com/watch?v=gvkqT_Uo05Q', duration: 900 },
            { title: 'Expo QuickStart Setup Guide.pdf', type: 'PDF', fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', fileSize: 1024000 },
          ],
        },
        {
          title: '2. Core Components: View, Text, Image & ScrollView',
          description: 'Learn standard React Native primitives and how they map to native iOS and Android UI elements.',
          content: 'Deep dive into basic UI building blocks and standard props.',
          estimatedMinutes: 20,
          materials: [
            { title: 'Core Components Walkthrough', type: 'VIDEO', fileUrl: 'https://www.youtube.com/watch?v=0-S5a0eXPoc', duration: 1200 },
            { title: 'React Native Components Reference', type: 'SLIDE', fileUrl: 'https://slideshare.net/sample-react-native-components' },
          ],
        },
        {
          title: '3. Flexbox Layouts & Responsive Mobile Design',
          description: 'Mastering flex direction, align items, justify content, dynamic offsets, and screen dimensions.',
          content: 'Building flexible and responsive mobile user interfaces across screen sizes.',
          estimatedMinutes: 25,
          materials: [
            { title: 'Mastering Flexbox in Mobile UI', type: 'VIDEO', fileUrl: 'https://www.youtube.com/watch?v=Hf4MJH0jP4M', duration: 1500 },
            { title: 'Flexbox Cheat Sheet & Code Snippets', type: 'EXTERNAL', externalUrl: 'https://reactnative.dev/docs/flexbox' },
          ],
        },
        {
          title: '4. React Native State Management & Custom Hooks',
          description: 'Handling local state with useState, useEffect, and custom hooks for mobile apps.',
          content: 'Managing UI state, input fields, and asynchronous hooks cleanups.',
          estimatedMinutes: 20,
          materials: [
            { title: 'State & Custom Hooks Video Lesson', type: 'VIDEO', fileUrl: 'https://www.youtube.com/watch?v=35lXWvCuM8o', duration: 1200 },
          ],
        },
        {
          title: '5. Touchables, Pressable & User Interactions',
          description: 'Handling user input, buttons, Pressable feedback, and touch events smoothly.',
          content: 'Creating responsive interactive buttons with feedback animations.',
          estimatedMinutes: 15,
          materials: [
            { title: 'User Interactions & Pressable API', type: 'VIDEO', fileUrl: 'https://www.youtube.com/watch?v=V80G5kCvh0w', duration: 900 },
          ],
        },
      ],
    },
    {
      title: 'Module 2: Navigation & Multi-Screen App Architecture',
      description: 'React Navigation, Stack, Bottom Tabs, Drawer navigation, and screen param passing.',
      order: 2,
      lessons: [
        {
          title: '6. Installing & Setting Up React Navigation v6',
          description: 'Setting up NavigationContainer, Native Stack Navigator, and type-safe screen props.',
          content: 'Learn how navigation works in React Native apps.',
          estimatedMinutes: 20,
          materials: [
            { title: 'React Navigation Setup Video', type: 'VIDEO', fileUrl: 'https://www.youtube.com/watch?v=nQVCkqvU1uE', duration: 1200 },
            { title: 'Navigation Navigation Guide.pdf', type: 'PDF', fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
          ],
        },
        {
          title: '7. Bottom Tab Navigation & Custom Icons',
          description: 'Creating smooth tab bars using Ionicons / Vector Icons and custom tab styling.',
          content: 'Building tab bar navigation for mobile dashboards.',
          estimatedMinutes: 25,
          materials: [
            { title: 'Tab Navigation Tutorial', type: 'VIDEO', fileUrl: 'https://www.youtube.com/watch?v=AnjzyrAJw0w', duration: 1500 },
          ],
        },
        {
          title: '8. Stack Navigation & Route Parameters',
          description: 'Passing parameters between screens, header options, and back button customization.',
          content: 'Passing parameters safely with TypeScript types.',
          estimatedMinutes: 20,
          materials: [
            { title: 'Route Parameters & Screen Stack', type: 'VIDEO', fileUrl: 'https://www.youtube.com/watch?v=C4l1sQ9H5a0', duration: 1200 },
          ],
        },
        {
          title: '9. Drawer Navigation & Custom Drawers',
          description: 'Building side drawer menus, header triggers, and custom drawer item renderers.',
          content: 'Drawer menu setup and overlay animations.',
          estimatedMinutes: 20,
          materials: [
            { title: 'Drawer Navigation Masterclass', type: 'VIDEO', fileUrl: 'https://www.youtube.com/watch?v=DrawerNavSample', duration: 1200 },
          ],
        },
        {
          title: '10. Modals, Alerts & Confirmation Dialogs',
          description: 'Presenting native modal screens, overlay popups, and alert prompts.',
          content: 'Creating modal workflows for user forms and prompts.',
          estimatedMinutes: 15,
          materials: [
            { title: 'Modals & Dialogs in React Native', type: 'VIDEO', fileUrl: 'https://www.youtube.com/watch?v=ModalNavSample', duration: 900 },
          ],
        },
      ],
    },
    {
      title: 'Module 3: Data Fetching, REST APIs & Global State',
      description: 'Zustand store management, Axios, AsyncStorage, REST API integration, and JWT auth.',
      order: 3,
      lessons: [
        {
          title: '11. Global State Management with Zustand',
          description: 'Lightweight, scalable global state management for React Native applications.',
          content: 'Setting up stores for user authentication and user preferences.',
          estimatedMinutes: 25,
          materials: [
            { title: 'Zustand State Management Video', type: 'VIDEO', fileUrl: 'https://www.youtube.com/watch?v=ZustandSample', duration: 1500 },
            { title: 'Zustand Docs & Best Practices', type: 'EXTERNAL', externalUrl: 'https://github.com/pmndrs/zustand' },
          ],
        },
        {
          title: '12. Integrating REST APIs with Axios',
          description: 'Configuring API client, request interceptors, headers, and error boundaries.',
          content: 'Connecting your mobile frontend to Node.js backend endpoints.',
          estimatedMinutes: 25,
          materials: [
            { title: 'Axios REST API Integration', type: 'VIDEO', fileUrl: 'https://www.youtube.com/watch?v=AxiosSample', duration: 1500 },
          ],
        },
        {
          title: '13. Local Storage with AsyncStorage & Encrypted Storage',
          description: 'Persisting offline data, user tokens, and user settings on device storage.',
          content: 'Handling offline persistence and secure storage keys.',
          estimatedMinutes: 20,
          materials: [
            { title: 'AsyncStorage Persistence Guide', type: 'VIDEO', fileUrl: 'https://www.youtube.com/watch?v=AsyncStorageSample', duration: 1200 },
          ],
        },
        {
          title: '14. JWT Authentication Flow & Protected Routes',
          description: 'Building login, signup, token auto-refresh, and route guarding.',
          content: 'Complete mobile authentication lifecycle.',
          estimatedMinutes: 30,
          materials: [
            { title: 'Mobile Authentication Flow Video', type: 'VIDEO', fileUrl: 'https://www.youtube.com/watch?v=AuthFlowSample', duration: 1800 },
            { title: 'Mobile Security Architecture.pdf', type: 'PDF', fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
          ],
        },
        {
          title: '15. Handling Form Inputs & Validation with Yup & Formik',
          description: 'Form submission, field validation, error feedback, and smooth keyboard avoidance.',
          content: 'Building robust, accessible forms in React Native.',
          estimatedMinutes: 20,
          materials: [
            { title: 'React Native Form Validation', type: 'VIDEO', fileUrl: 'https://www.youtube.com/watch?v=FormValidationSample', duration: 1200 },
          ],
        },
      ],
    },
    {
      title: 'Module 4: Native Capabilities & Deployment',
      description: 'Camera, Location Services, Push Notifications, Performance Optimization, Expo EAS Build.',
      order: 4,
      lessons: [
        {
          title: '16. Camera & Media Library Integration',
          description: 'Taking photos, choosing images from gallery, and uploading media to Cloudinary.',
          content: 'Integrating device camera and media permissions.',
          estimatedMinutes: 25,
          materials: [
            { title: 'Expo Camera Integration', type: 'VIDEO', fileUrl: 'https://www.youtube.com/watch?v=CameraSample', duration: 1500 },
          ],
        },
        {
          title: '17. Device Location Services & Interactive Maps',
          description: 'Requesting location permissions, tracking GPS coordinates, displaying Google Maps.',
          content: 'Working with expo-location and react-native-maps.',
          estimatedMinutes: 30,
          materials: [
            { title: 'React Native Maps & Location API', type: 'VIDEO', fileUrl: 'https://www.youtube.com/watch?v=LocationSample', duration: 1800 },
          ],
        },
        {
          title: '18. Push Notifications with Firebase Cloud Messaging',
          description: 'Configuring push tokens, notification handlers, and background message listeners.',
          content: 'Implementing engagement notifications on iOS and Android.',
          estimatedMinutes: 25,
          materials: [
            { title: 'Push Notifications Deep Dive', type: 'VIDEO', fileUrl: 'https://www.youtube.com/watch?v=PushNotifSample', duration: 1500 },
          ],
        },
        {
          title: '19. Performance Profiling & Optimization',
          description: 'Optimizing FlatList rendering, Memoization, image caching, and reducing JS bundle size.',
          content: 'Building 60FPS smooth React Native applications.',
          estimatedMinutes: 25,
          materials: [
            { title: 'React Native Performance Tuning', type: 'VIDEO', fileUrl: 'https://www.youtube.com/watch?v=PerfSample', duration: 1500 },
            { title: '60FPS Performance Checklist.pdf', type: 'PDF', fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
          ],
        },
        {
          title: '20. Building & Deploying with Expo EAS Build',
          description: 'Building APK, AAB, and iOS IPA binaries using Expo Application Services.',
          content: 'Publishing your application to Google Play Store and Apple App Store.',
          estimatedMinutes: 35,
          materials: [
            { title: 'EAS Build & Store Deployment', type: 'VIDEO', fileUrl: 'https://www.youtube.com/watch?v=EASBuildSample', duration: 2100 },
            { title: 'App Store Submission Guidelines', type: 'EXTERNAL', externalUrl: 'https://docs.expo.dev/build/introduction/' },
          ],
        },
      ],
    },
  ];

  const createdLessons: string[] = [];

  for (const mData of modulesData) {
    const moduleObj = await prisma.courseModule.create({
      data: {
        courseId: course1.id,
        title: mData.title,
        description: mData.description,
        order: mData.order,
      },
    });

    for (let i = 0; i < mData.lessons.length; i++) {
      const lData = mData.lessons[i];
      const lessonObj = await prisma.courseLesson.create({
        data: {
          moduleId: moduleObj.id,
          title: lData.title,
          description: lData.description,
          content: lData.content,
          order: i + 1,
          isRequired: true,
          estimatedMinutes: lData.estimatedMinutes,
        },
      });

      createdLessons.push(lessonObj.id);

      for (let j = 0; j < lData.materials.length; j++) {
        const mat = lData.materials[j];
        await prisma.learningMaterial.create({
          data: {
            lessonId: lessonObj.id,
            title: mat.title,
            type: mat.type,
            fileUrl: mat.fileUrl || null,
            externalUrl: mat.externalUrl || null,
            duration: mat.duration || null,
            fileSize: mat.fileSize || null,
            order: j + 1,
          },
        });
      }
    }
  }

  console.log(`✅ Created 4 Modules & ${createdLessons.length} Lessons with Learning Materials for Course 1`);

  // --- COURSE 1 ASSESSMENTS & ASSIGNMENTS (Member 3 Integration) ---
  const quizLink = await prisma.quizLink.create({
    data: {
      courseId: course1.id,
      instructorId: sharer1.id,
      title: 'React Native Development Final Assessment',
      instructions: 'Please complete this official Google Form final assessment to verify your React Native knowledge. Scoring 80% or above is required for graduation.',
      platform: QuizPlatform.GOOGLE_FORMS,
      url: 'https://docs.google.com/forms/d/e/1FAIpQLSfPXVxL-j2R8H0O6oW6yG6Qk4iJ4J_a_H7uX6w2oZ5zO_9BHg/viewform',
      passingScore: 80,
      requireForCompletion: true,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days ahead
    },
  });

  const assignment = await prisma.assignment.create({
    data: {
      courseId: course1.id,
      instructorId: sharer1.id,
      title: 'Capstone Project: Build a React Native E-Learning Mobile App',
      instructions: 'Develop a 3-screen React Native Expo application featuring stack & tab navigation, Zustand state, REST API integration, and custom touchable components. Submit your GitHub repository URL and a demo video.',
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      maxMarks: 100,
      submissionMethods: [SubmissionMethod.GITHUB_LINK, SubmissionMethod.FILE],
      requireForCompletion: true,
    },
  });

  console.log('✅ Created Google Forms Assessment & Capstone Assignment');

  // --- ENROLL LEARNER IN COURSE 1 (In-Progress: 16 out of 20 lessons completed = 80%) ---
  const enrollment = await prisma.enrollment.create({
    data: {
      courseId: course1.id,
      learnerId: learner.id,
      status: 'ACTIVE',
      progressPercentage: 80.0,
    },
  });

  const courseProgress = await prisma.courseProgress.create({
    data: {
      enrollmentId: enrollment.id,
      courseId: course1.id,
      learnerId: learner.id,
      totalLessons: 20,
      completedLessons: 16,
      totalRequiredItems: 20,
      completedRequiredItems: 16,
      progressPercentage: 80.0,
      lastAccessedAt: new Date(),
    },
  });

  // Mark the first 16 lessons as completed for the learner
  for (let idx = 0; idx < createdLessons.length; idx++) {
    const isCompleted = idx < 16;
    await prisma.lessonProgress.create({
      data: {
        enrollmentId: enrollment.id,
        lessonId: createdLessons[idx],
        completed: isCompleted,
        completedAt: isCompleted ? new Date(Date.now() - (16 - idx) * 3600 * 1000) : null,
      },
    });
  }

  // Create Learning History records
  await prisma.learningHistory.create({
    data: {
      learnerId: learner.id,
      courseId: course1.id,
      enrollmentId: enrollment.id,
      activityType: 'LESSON_COMPLETED',
      description: 'Completed Lesson 16: Camera & Media Library Integration',
      metadata: { lessonOrder: 16, progressPercentage: 80 },
    },
  });

  // Add course review by another student
  await prisma.courseReview.create({
    data: {
      courseId: course1.id,
      learnerId: learner.id,
      rating: 5,
      review: 'The course structure is superb! 16 out of 20 lessons completed so far and I have already built my first app. Highly recommended!',
      isVerified: true,
      helpfulCount: 12,
    },
  });

  // Add recommendation from instructor John Perera for Learner
  await prisma.learnerRecommendation.create({
    data: {
      instructorId: sharer1.id,
      learnerId: learner.id,
      courseId: course1.id,
      message: 'Asheni has shown exceptional progress in React Native architecture, flexbox layouts, and Zustand state management. Highly recommended!',
      skillDemonstrated: 'React Native Mobile Architecture',
      strengths: 'Clean code, excellent problem solving',
      qualityOfAssignments: 'Outstanding',
      participation: 'Active learner',
      isPublic: true,
    },
  });

  console.log(`✅ Enrolled Learner (${learner.email}) in Course 1 with 80% progress (16/20 lessons completed)`);

  // --- COURSE 2: Full-Stack Web Development (Unenrolled for discovery testing) ---
  const course2 = await prisma.course.create({
    data: {
      title: 'Full-Stack Web Development with React & Node.js',
      description: 'Build enterprise full-stack web applications using React 18, Express, PostgreSQL, Prisma, and TailwindCSS.',
      categoryId: webCategory.id,
      creatorId: sharer1.id,
      difficulty: DifficultyLevel.BEGINNER,
      language: 'English',
      deliveryMethod: DeliveryMethod.SELF_PACED,
      duration: '8 weeks',
      estimatedHours: 48,
      prerequisites: 'HTML, CSS and JavaScript basics',
      learningOutcomes: [
        'Design database schemas with PostgreSQL and Prisma ORM',
        'Create secure RESTful APIs with Node.js and Express',
        'Build reactive frontend web UIs with React 18 & TypeScript',
        'Deploy web applications to cloud hosting platforms',
      ],
      thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
      status: CourseStatus.PUBLISHED,
      enrolledCount: 98,
      rating: 4.9,
      reviewCount: 31,
    },
  });

  const m2 = await prisma.courseModule.create({
    data: {
      courseId: course2.id,
      title: 'Module 1: Backend Architecture with Node & Express',
      order: 1,
    },
  });

  const l2 = await prisma.courseLesson.create({
    data: {
      moduleId: m2.id,
      title: '1. Building REST APIs with Express & TypeScript',
      description: 'Routing, middleware, error handling, and JSON responses.',
      content: 'Learn to build Express server APIs from scratch.',
      order: 1,
      estimatedMinutes: 20,
    },
  });

  await prisma.learningMaterial.create({
    data: {
      lessonId: l2.id,
      title: 'Express REST API Masterclass',
      type: 'VIDEO',
      fileUrl: 'https://www.youtube.com/watch?v=L72fhGm1tfE',
      duration: 1200,
      order: 1,
    },
  });

  console.log(`✅ Secondary Course Created for Discovery Testing: "${course2.title}"`);

  // --- COURSE 3: UI/UX Design Masterclass (Unenrolled for discovery testing) ---
  const course3 = await prisma.course.create({
    data: {
      title: 'UI/UX Design Masterclass: Figma to Mobile UI',
      description: 'Learn modern user interface design, visual hierarchy, wireframing, color theory, and interactive prototyping in Figma.',
      categoryId: designCategory.id,
      creatorId: sharer2.id,
      difficulty: DifficultyLevel.BEGINNER,
      language: 'English',
      deliveryMethod: DeliveryMethod.SELF_PACED,
      duration: '4 weeks',
      estimatedHours: 24,
      prerequisites: 'No prior design experience required',
      learningOutcomes: [
        'Master Figma components, auto-layout, and design tokens',
        'Conduct user research and build personas & wireframes',
        'Create interactive high-fidelity mobile prototypes',
      ],
      thumbnail: 'https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?auto=format&fit=crop&w=800&q=80',
      status: CourseStatus.PUBLISHED,
      enrolledCount: 210,
      rating: 4.7,
      reviewCount: 58,
    },
  });

  console.log(`✅ Tertiary Course Created for Discovery Testing: "${course3.title}"`);

  console.log('\n🎉 DATABASE SEEDING COMPLETED SUCCESSFULLY!');
  console.log('====================================================');
  console.log('🔑 TEST CREDENTIALS:');
  console.log('   Learner Email:    learner@skillconnect.com');
  console.log('   Learner Password: Password123');
  console.log('----------------------------------------------------');
  console.log('📚 CREATED COURSES:');
  console.log(` 1. "${course1.title}" (Enrolled - 80% / 16 of 20 lessons completed)`);
  console.log(` 2. "${course2.title}" (Available for Discovery & Enrollment)`);
  console.log(` 3. "${course3.title}" (Available for Discovery & Enrollment)`);
  console.log('====================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
