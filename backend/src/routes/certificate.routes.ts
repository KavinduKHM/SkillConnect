import express from 'express';
import { isAuthenticated } from '../middleware/auth.middleware.js';
import { isSkillSharer } from '../middleware/roles.middleware.js';

import {
  requestCompletion,
  getLearnerRequests,
  getCourseRequests,
  approveCompletionRequest,
  getMyCertificates,
  getCertificateDetails,
  verifyCertificate,
} from '../controllers/certificate.controller.js';

const router = express.Router();

// ============================================================
// PUBLIC ROUTES
// ============================================================

// POST /api/certificates/verify (Public - employers can verify)
router.post('/verify', verifyCertificate);

// GET /api/certificates/public/:certId
router.get('/public/:certId', getCertificateDetails);

// ============================================================
// LEARNER ROUTES
// ============================================================
router.use(isAuthenticated);

// POST /api/certificates/request/:courseId
router.post('/request/:courseId', requestCompletion);

// GET /api/certificates/my-requests
router.get('/my-requests', getLearnerRequests);

// GET /api/certificates/my-certificates
router.get('/my-certificates', getMyCertificates);

// ============================================================
// INSTRUCTOR ROUTES
// ============================================================

// GET /api/certificates/course/:courseId/requests
router.get('/course/:courseId/requests', isSkillSharer, getCourseRequests);

// POST /api/certificates/requests/:requestId/approve
router.post('/requests/:requestId/approve', isSkillSharer, approveCompletionRequest);

export default router;
